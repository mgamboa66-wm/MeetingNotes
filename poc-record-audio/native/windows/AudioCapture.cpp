#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <audioclient.h>
#include <mmdeviceapi.h>
#include <ksmedia.h>
#include <wrl/client.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <condition_variable>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <deque>
#include <exception>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <mutex>
#include <optional>
#include <random>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

using Microsoft::WRL::ComPtr;
namespace fs = std::filesystem;

namespace {
constexpr UINT32 kOutputRate = 48000;
constexpr double kHundredNsPerSecond = 10'000'000.0;
constexpr double kOutputFrameDuration = kHundredNsPerSecond / kOutputRate;
constexpr size_t kMaximumQueuedChunks = 100;

enum class Source { System, Microphone };

struct AudioChunk {
    double start100ns{};
    std::vector<float> samples;
    size_t offset{};
};

std::mutex outputMutex;

void emitJson(const std::string& value) {
    std::lock_guard<std::mutex> lock(outputMutex);
    std::cout << value << '\n' << std::flush;
}

std::string quoteJson(const std::string& value) {
    std::string result;
    result.reserve(value.size() + 2);
    result.push_back('"');
    for (const char ch : value) {
        if (ch == '"' || ch == '\\') result.push_back('\\');
        if (static_cast<unsigned char>(ch) >= 0x20) result.push_back(ch);
    }
    result.push_back('"');
    return result;
}

void emitError(const std::string& message) {
    emitJson("{\"type\":\"error\",\"message\":" + quoteJson(message) + "}");
}

std::string hresultMessage(const char* action, HRESULT result) {
    std::ostringstream message;
    message << action << " (HRESULT 0x" << std::hex << std::uppercase
            << static_cast<unsigned long>(result) << ").";
    return message.str();
}

double nowInHundredNanoseconds() {
    LARGE_INTEGER counter{};
    LARGE_INTEGER frequency{};
    QueryPerformanceCounter(&counter);
    QueryPerformanceFrequency(&frequency);
    if (frequency.QuadPart == 0) return 0;
    return static_cast<double>(counter.QuadPart) * kHundredNsPerSecond /
           static_cast<double>(frequency.QuadPart);
}

std::string makeRecordingName() {
    const auto now = std::chrono::system_clock::now();
    const std::time_t time = std::chrono::system_clock::to_time_t(now);
    std::tm local{};
    localtime_s(&local, &time);
    std::ostringstream name;
    name << "MeetingNotes-" << std::put_time(&local, "%Y-%m-%d_%H-%M-%S") << '-';
    std::random_device random;
    constexpr char digits[] = "0123456789abcdef";
    for (int i = 0; i < 8; ++i) name << digits[random() & 0x0f];
    name << ".wav";
    return name.str();
}

class WaveWriter {
public:
    bool open(const fs::path& path) {
        file_.open(path, std::ios::binary | std::ios::in | std::ios::out | std::ios::trunc);
        if (!file_) return false;
        writeHeader(0);
        return static_cast<bool>(file_);
    }

    bool append(const std::vector<int16_t>& samples) {
        if (samples.empty()) return true;
        const uint64_t bytes = static_cast<uint64_t>(samples.size()) * sizeof(int16_t);
        if (bytes > static_cast<uint64_t>(UINT32_MAX - 44U - dataBytes_)) return false;
        file_.write(reinterpret_cast<const char*>(samples.data()), static_cast<std::streamsize>(bytes));
        if (!file_) return false;
        dataBytes_ += static_cast<uint32_t>(bytes);
        return true;
    }

    bool finish(uint32_t& bytesOnDisk) {
        if (!file_) return false;
        file_.seekp(0, std::ios::beg);
        writeHeader(dataBytes_);
        file_.flush();
        if (!file_) return false;
        file_.close();
        bytesOnDisk = dataBytes_ + 44U;
        return true;
    }

    void discard() {
        if (file_.is_open()) file_.close();
    }

private:
    static void writeU16(std::ostream& stream, uint16_t value) {
        const char bytes[2] = {
            static_cast<char>(value & 0xff),
            static_cast<char>((value >> 8) & 0xff),
        };
        stream.write(bytes, sizeof(bytes));
    }

    static void writeU32(std::ostream& stream, uint32_t value) {
        const char bytes[4] = {
            static_cast<char>(value & 0xff),
            static_cast<char>((value >> 8) & 0xff),
            static_cast<char>((value >> 16) & 0xff),
            static_cast<char>((value >> 24) & 0xff),
        };
        stream.write(bytes, sizeof(bytes));
    }

    void writeHeader(uint32_t audioBytes) {
        file_.write("RIFF", 4);
        writeU32(file_, 36U + audioBytes);
        file_.write("WAVEfmt ", 8);
        writeU32(file_, 16U);
        writeU16(file_, 1U); // PCM
        writeU16(file_, 1U); // mono
        writeU32(file_, kOutputRate);
        writeU32(file_, kOutputRate * 2U); // mono 16-bit PCM
        writeU16(file_, 2U);
        writeU16(file_, 16U);
        file_.write("data", 4);
        writeU32(file_, audioBytes);
    }

    std::fstream file_;
    uint32_t dataBytes_{};
};

bool sampleFormat(const WAVEFORMATEX* format, bool& floatingPoint, uint16_t& bits) {
    if (!format || format->nChannels == 0 || format->nSamplesPerSec == 0 || format->nBlockAlign == 0) {
        return false;
    }
    GUID subFormat{};
    if (format->wFormatTag == WAVE_FORMAT_EXTENSIBLE && format->cbSize >= sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX)) {
        const auto* extensible = reinterpret_cast<const WAVEFORMATEXTENSIBLE*>(format);
        subFormat = extensible->SubFormat;
        bits = format->wBitsPerSample;
    } else {
        bits = format->wBitsPerSample;
        if (format->wFormatTag == WAVE_FORMAT_IEEE_FLOAT) subFormat = KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;
        else if (format->wFormatTag == WAVE_FORMAT_PCM) subFormat = KSDATAFORMAT_SUBTYPE_PCM;
        else return false;
    }
    floatingPoint = IsEqualGUID(subFormat, KSDATAFORMAT_SUBTYPE_IEEE_FLOAT);
    const bool pcm = IsEqualGUID(subFormat, KSDATAFORMAT_SUBTYPE_PCM);
    return (floatingPoint && (bits == 32 || bits == 64)) ||
           (pcm && (bits == 8 || bits == 16 || bits == 24 || bits == 32));
}

float readSample(const BYTE* frame, uint16_t channel, const WAVEFORMATEX* format,
                 bool floatingPoint, uint16_t bits) {
    const size_t bytesPerSample = format->wBitsPerSample / 8;
    const BYTE* sample = frame + static_cast<size_t>(channel) * bytesPerSample;
    if (floatingPoint && bits == 32) {
        float value{};
        std::memcpy(&value, sample, sizeof(value));
        return std::isfinite(value) ? std::clamp(value, -1.0f, 1.0f) : 0.0f;
    }
    if (floatingPoint && bits == 64) {
        double value{};
        std::memcpy(&value, sample, sizeof(value));
        return std::isfinite(value) ? static_cast<float>(std::clamp(value, -1.0, 1.0)) : 0.0f;
    }
    if (bits == 8) return (static_cast<int>(sample[0]) - 128) / 128.0f;
    if (bits == 16) {
        int16_t value{};
        std::memcpy(&value, sample, sizeof(value));
        return static_cast<float>(value) / 32768.0f;
    }
    if (bits == 24) {
        int32_t value = static_cast<int32_t>(sample[0]) |
                        (static_cast<int32_t>(sample[1]) << 8) |
                        (static_cast<int32_t>(sample[2]) << 16);
        if (value & 0x00800000) value |= static_cast<int32_t>(0xff000000);
        return static_cast<float>(value) / 8388608.0f;
    }
    int32_t value{};
    std::memcpy(&value, sample, sizeof(value));
    return static_cast<float>(static_cast<double>(value) / 2147483648.0);
}

bool convertToMono48k(const BYTE* data, UINT32 frames, DWORD flags,
                      const WAVEFORMATEX* format, std::vector<float>& output) {
    bool floatingPoint = false;
    uint16_t bits = 0;
    if (!sampleFormat(format, floatingPoint, bits)) return false;
    if (frames == 0) {
        output.clear();
        return true;
    }
    if ((flags & AUDCLNT_BUFFERFLAGS_SILENT) != 0 || !data) {
        const size_t outputFrames = static_cast<size_t>(std::llround(
            static_cast<double>(frames) * kOutputRate / format->nSamplesPerSec));
        output.assign(outputFrames, 0.0f);
        return true;
    }

    std::vector<float> inputMono(frames, 0.0f);
    for (UINT32 frameIndex = 0; frameIndex < frames; ++frameIndex) {
        const BYTE* frame = data + static_cast<size_t>(frameIndex) * format->nBlockAlign;
        double sum = 0;
        for (uint16_t channel = 0; channel < format->nChannels; ++channel) {
            sum += readSample(frame, channel, format, floatingPoint, bits);
        }
        inputMono[frameIndex] = static_cast<float>(sum / format->nChannels);
    }

    const size_t outputFrames = static_cast<size_t>(std::llround(
        static_cast<double>(frames) * kOutputRate / format->nSamplesPerSec));
    output.resize(outputFrames);
    for (size_t i = 0; i < outputFrames; ++i) {
        const double position = static_cast<double>(i) * format->nSamplesPerSec / kOutputRate;
        const size_t left = std::min(static_cast<size_t>(position), inputMono.size() - 1);
        const size_t right = std::min(left + 1, inputMono.size() - 1);
        const float fraction = static_cast<float>(position - left);
        output[i] = inputMono[left] + (inputMono[right] - inputMono[left]) * fraction;
    }
    return true;
}

class CaptureSession {
public:
    bool start(const fs::path& recordingsDirectory, std::string& fileName, std::string& error) {
        try {
            fs::create_directories(recordingsDirectory);
            fileName = makeRecordingName();
            recordingPath_ = recordingsDirectory / fs::path(std::wstring(fileName.begin(), fileName.end()));
            if (!writer_.open(recordingPath_)) {
                error = "No se pudo crear el WAV en recordings/.";
                writer_.discard();
                removePartialFile();
                return false;
            }
        } catch (...) {
            error = "No se pudo preparar la carpeta local de grabaciones.";
            writer_.discard();
            removePartialFile();
            return false;
        }

        try {
            mixerThread_ = std::thread([this] { mixLoop(); });
            systemThread_ = std::thread([this] { captureLoop(Source::System); });
            microphoneThread_ = std::thread([this] { captureLoop(Source::Microphone); });
        } catch (const std::exception&) {
            error = "No se pudieron iniciar los hilos de captura WASAPI.";
            abort();
            return false;
        }

        std::unique_lock<std::mutex> lock(stateMutex_);
        const bool signaled = stateChanged_.wait_for(lock, std::chrono::seconds(15), [this] {
            return readyStreams_ == 2 || !failure_.empty();
        });
        if (!signaled) failure_ = "Windows no inició ambos dispositivos de audio a tiempo.";
        if (!failure_.empty()) {
            error = failure_;
            lock.unlock();
            abort();
            return false;
        }
        return true;
    }

    bool stop(uint32_t& bytes, std::string& error) {
        stopRequested_.store(true);
        queueChanged_.notify_all();
        joinCaptureThreads();
        {
            std::lock_guard<std::mutex> lock(queueMutex_);
            mixerStopping_ = true;
        }
        queueChanged_.notify_all();
        if (mixerThread_.joinable()) mixerThread_.join();

        std::lock_guard<std::mutex> lock(stateMutex_);
        if (!failure_.empty()) {
            error = failure_;
            writer_.discard();
            removePartialFile();
            return false;
        }
        if (!writer_.finish(bytes)) {
            error = "No se pudo finalizar la grabación WAV; se descartó el archivo incompleto.";
            writer_.discard();
            removePartialFile();
            return false;
        }
        return true;
    }

    void abort() {
        stopRequested_.store(true);
        queueChanged_.notify_all();
        joinCaptureThreads();
        {
            std::lock_guard<std::mutex> lock(queueMutex_);
            mixerStopping_ = true;
        }
        queueChanged_.notify_all();
        if (mixerThread_.joinable()) mixerThread_.join();
        writer_.discard();
        removePartialFile();
    }

    bool stopping() const { return stopRequested_.load(); }
    double level() const { return latestRms_.load(); }

    std::string failure() const {
        std::lock_guard<std::mutex> lock(stateMutex_);
        return failure_;
    }

private:
    void joinCaptureThreads() {
        if (systemThread_.joinable()) systemThread_.join();
        if (microphoneThread_.joinable()) microphoneThread_.join();
    }

    void removePartialFile() {
        std::error_code ignored;
        if (!recordingPath_.empty()) fs::remove(recordingPath_, ignored);
    }

    void markReady() {
        {
            std::lock_guard<std::mutex> lock(stateMutex_);
            ++readyStreams_;
        }
        stateChanged_.notify_all();
    }

    void setFailure(const std::string& message) {
        {
            std::lock_guard<std::mutex> lock(stateMutex_);
            if (failure_.empty()) failure_ = message;
        }
        stopRequested_.store(true);
        stateChanged_.notify_all();
        queueChanged_.notify_all();
    }

    void push(Source source, double timestamp, std::vector<float> samples) {
        if (samples.empty()) return;
        {
            std::lock_guard<std::mutex> lock(queueMutex_);
            auto& queue = source == Source::System ? systemChunks_ : microphoneChunks_;
            if (queue.size() >= kMaximumQueuedChunks) {
                setFailure("Las fuentes de audio se desincronizaron; se descartó la grabación incompleta.");
                return;
            }
            queue.push_back(AudioChunk{ timestamp, std::move(samples), 0 });
        }
        queueChanged_.notify_all();
    }

    void captureLoop(Source source) {
        const HRESULT comStatus = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        if (FAILED(comStatus)) {
            setFailure(hresultMessage("No se pudo inicializar COM para WASAPI", comStatus));
            return;
        }

        ComPtr<IMMDeviceEnumerator> enumerator;
        ComPtr<IMMDevice> device;
        ComPtr<IAudioClient> audioClient;
        ComPtr<IAudioCaptureClient> captureClient;
        HANDLE eventHandle = nullptr;
        WAVEFORMATEX* mixFormat = nullptr;
        bool clientStarted = false;

        const auto cleanup = [&] {
            if (clientStarted && audioClient) audioClient->Stop();
            if (eventHandle) CloseHandle(eventHandle);
            if (mixFormat) CoTaskMemFree(mixFormat);
            captureClient.Reset();
            audioClient.Reset();
            device.Reset();
            enumerator.Reset();
            CoUninitialize();
        };

        HRESULT result = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                                          IID_PPV_ARGS(&enumerator));
        if (FAILED(result)) {
            setFailure(hresultMessage("No se pudo crear el enumerador de audio", result));
            cleanup();
            return;
        }

        const EDataFlow flow = source == Source::System ? eRender : eCapture;
        result = enumerator->GetDefaultAudioEndpoint(flow, eConsole, &device);
        if (FAILED(result)) {
            setFailure(source == Source::System
                ? hresultMessage("No se encontró la salida de audio predeterminada", result)
                : hresultMessage("No se encontró el micrófono predeterminado", result));
            cleanup();
            return;
        }

        result = device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr,
                                  reinterpret_cast<void**>(audioClient.GetAddressOf()));
        if (FAILED(result)) {
            setFailure(source == Source::Microphone &&
                       (result == AUDCLNT_E_DEVICE_INVALIDATED || result == E_ACCESSDENIED)
                ? "Windows no pudo abrir el micrófono predeterminado. Revisa la privacidad de micrófono."
                : hresultMessage("No se pudo abrir el endpoint de audio", result));
            cleanup();
            return;
        }

        result = audioClient->GetMixFormat(&mixFormat);
        if (FAILED(result)) {
            setFailure(hresultMessage("No se pudo consultar el formato del endpoint", result));
            cleanup();
            return;
        }
        bool floatingPoint = false;
        uint16_t bits = 0;
        if (!sampleFormat(mixFormat, floatingPoint, bits)) {
            setFailure("El endpoint de Windows devolvió un formato de audio no compatible con esta POC.");
            cleanup();
            return;
        }

        eventHandle = CreateEventW(nullptr, FALSE, FALSE, nullptr);
        if (!eventHandle) {
            setFailure("No se pudo crear el evento de captura de audio.");
            cleanup();
            return;
        }

        DWORD flags = AUDCLNT_STREAMFLAGS_EVENTCALLBACK;
        if (source == Source::System) flags |= AUDCLNT_STREAMFLAGS_LOOPBACK;
        result = audioClient->Initialize(AUDCLNT_SHAREMODE_SHARED, flags, 0, 0, mixFormat, nullptr);
        if (FAILED(result)) {
            setFailure(hresultMessage("No se pudo iniciar la captura WASAPI", result));
            cleanup();
            return;
        }
        result = audioClient->SetEventHandle(eventHandle);
        if (FAILED(result)) {
            setFailure(hresultMessage("No se pudo asociar el evento de captura", result));
            cleanup();
            return;
        }
        result = audioClient->GetService(IID_PPV_ARGS(&captureClient));
        if (FAILED(result)) {
            setFailure(hresultMessage("No se pudo abrir el cliente de captura WASAPI", result));
            cleanup();
            return;
        }
        result = audioClient->Start();
        if (FAILED(result)) {
            setFailure(source == Source::Microphone &&
                       (result == AUDCLNT_E_DEVICE_INVALIDATED || result == E_ACCESSDENIED)
                ? "Windows bloqueó o desconectó el micrófono. Revisa la privacidad y el dispositivo de entrada."
                : hresultMessage("No se pudo arrancar la captura WASAPI", result));
            cleanup();
            return;
        }
        clientStarted = true;
        markReady();

        while (!stopRequested_.load()) {
            const DWORD waitResult = WaitForSingleObject(eventHandle, 100);
            if (waitResult == WAIT_TIMEOUT) continue;
            if (waitResult != WAIT_OBJECT_0) {
                setFailure("Se perdió el evento de captura WASAPI.");
                break;
            }

            UINT32 packetFrames = 0;
            result = captureClient->GetNextPacketSize(&packetFrames);
            while (SUCCEEDED(result) && packetFrames > 0 && !stopRequested_.load()) {
                BYTE* data = nullptr;
                UINT32 frames = 0;
                DWORD bufferFlags = 0;
                UINT64 devicePosition = 0;
                UINT64 qpcPosition = 0;
                result = captureClient->GetBuffer(&data, &frames, &bufferFlags,
                                                  &devicePosition, &qpcPosition);
                if (FAILED(result)) break;

                std::vector<float> mono;
                const bool converted = convertToMono48k(data, frames, bufferFlags, mixFormat, mono);
                const HRESULT releaseResult = captureClient->ReleaseBuffer(frames);
                if (!converted) {
                    setFailure("No se pudo convertir el audio del dispositivo a WAV mono.");
                    break;
                }
                if (FAILED(releaseResult)) {
                    result = releaseResult;
                    break;
                }

                double timestamp = (bufferFlags & AUDCLNT_BUFFERFLAGS_TIMESTAMP_ERROR) == 0
                    ? static_cast<double>(qpcPosition)
                    : nowInHundredNanoseconds();
                if (timestamp <= 0) timestamp = nowInHundredNanoseconds();
                push(source, timestamp, std::move(mono));

                result = captureClient->GetNextPacketSize(&packetFrames);
            }
            if (FAILED(result)) {
                setFailure(hresultMessage("Se perdió el endpoint de audio durante la grabación", result));
                break;
            }
        }

        cleanup();
    }

    void mixLoop() {
        std::optional<double> nextOutputTime;
        std::unique_lock<std::mutex> lock(queueMutex_);
        while (true) {
            queueChanged_.wait(lock, [this] {
                return mixerStopping_ || !failure().empty() ||
                       (!systemChunks_.empty() && !microphoneChunks_.empty());
            });
            if (!failure().empty()) break;
            if (systemChunks_.empty() || microphoneChunks_.empty()) {
                if (mixerStopping_) break;
                continue;
            }

            AudioChunk& system = systemChunks_.front();
            AudioChunk& microphone = microphoneChunks_.front();
            const double systemStart = system.start100ns + system.offset * kOutputFrameDuration;
            const double microphoneStart = microphone.start100ns + microphone.offset * kOutputFrameDuration;
            const double commonStart = std::max({ systemStart, microphoneStart,
                                                  nextOutputTime.value_or(0.0) });
            const double systemEnd = system.start100ns + system.samples.size() * kOutputFrameDuration;
            const double microphoneEnd = microphone.start100ns + microphone.samples.size() * kOutputFrameDuration;
            const double commonEnd = std::min(systemEnd, microphoneEnd);

            if (commonEnd <= commonStart) {
                if (systemEnd <= microphoneStart) systemChunks_.pop_front();
                else if (microphoneEnd <= systemStart) microphoneChunks_.pop_front();
                else if (systemEnd <= microphoneEnd) systemChunks_.pop_front();
                else microphoneChunks_.pop_front();
                continue;
            }

            const size_t systemOffset = static_cast<size_t>(std::llround(
                (commonStart - system.start100ns) / kOutputFrameDuration));
            const size_t microphoneOffset = static_cast<size_t>(std::llround(
                (commonStart - microphone.start100ns) / kOutputFrameDuration));
            const size_t frames = static_cast<size_t>(std::floor(
                (commonEnd - commonStart) / kOutputFrameDuration));
            if (frames == 0 || systemOffset + frames > system.samples.size() ||
                microphoneOffset + frames > microphone.samples.size()) {
                if (systemEnd <= microphoneEnd) systemChunks_.pop_front();
                else microphoneChunks_.pop_front();
                continue;
            }

            std::vector<int16_t> output(frames);
            double sumSquares = 0;
            for (size_t i = 0; i < frames; ++i) {
                const float mixed = std::clamp(
                    (system.samples[systemOffset + i] + microphone.samples[microphoneOffset + i]) * 0.5f,
                    -1.0f, 1.0f);
                sumSquares += static_cast<double>(mixed) * mixed;
                output[i] = static_cast<int16_t>(mixed * 32767.0f);
            }

            lock.unlock();
            if (!writer_.append(output)) {
                setFailure("No se pudo escribir el WAV local. Se descartará el archivo incompleto.");
                lock.lock();
                break;
            }
            latestRms_.store(std::min(1.0, std::sqrt(sumSquares / frames)));
            lock.lock();

            const size_t systemConsumed = systemOffset + frames;
            const size_t microphoneConsumed = microphoneOffset + frames;
            system.offset = systemConsumed;
            microphone.offset = microphoneConsumed;
            nextOutputTime = commonStart + frames * kOutputFrameDuration;
            if (system.offset >= system.samples.size()) systemChunks_.pop_front();
            if (microphone.offset >= microphone.samples.size()) microphoneChunks_.pop_front();
        }
    }

    std::atomic<bool> stopRequested_{false};
    std::atomic<double> latestRms_{0};
    mutable std::mutex stateMutex_;
    std::condition_variable stateChanged_;
    unsigned readyStreams_{};
    std::string failure_;
    std::mutex queueMutex_;
    std::condition_variable queueChanged_;
    std::deque<AudioChunk> systemChunks_;
    std::deque<AudioChunk> microphoneChunks_;
    bool mixerStopping_{};
    fs::path recordingPath_;
    WaveWriter writer_;
    std::thread systemThread_;
    std::thread microphoneThread_;
    std::thread mixerThread_;
};
} // namespace

int wmain(int argc, wchar_t** argv) {
    if (argc < 2) {
        emitError("Falta indicar la carpeta local de grabaciones.");
        return 2;
    }

    CaptureSession session;
    std::string fileName;
    std::string error;
    if (!session.start(fs::path(argv[1]), fileName, error)) {
        emitError(error);
        return 1;
    }
    emitJson("{\"type\":\"ready\",\"fileName\":" + quoteJson(fileName) + "}");

    std::atomic<bool> stopRequested{false};
    std::thread meter([&] {
        bool errorSent = false;
        while (!stopRequested.load()) {
            const std::string failure = session.failure();
            if (!failure.empty() && !errorSent) {
                emitError(failure);
                errorSent = true;
            }
            std::ostringstream event;
            event << "{\"type\":\"meter\",\"rms\":"
                  << std::fixed << std::setprecision(6) << session.level() << '}';
            emitJson(event.str());
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    });

    std::string command;
    while (std::getline(std::cin, command) && command != "stop") {}
    stopRequested.store(true);
    if (meter.joinable()) meter.join();

    uint32_t bytes = 0;
    if (!session.stop(bytes, error)) {
        emitError(error);
        return 1;
    }
    emitJson("{\"type\":\"stopped\",\"fileName\":" + quoteJson(fileName) +
             ",\"bytes\":" + std::to_string(bytes) + "}");
    return 0;
}
