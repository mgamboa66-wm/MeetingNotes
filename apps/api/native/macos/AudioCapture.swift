import CoreAudio
import Foundation
import Darwin

struct CaptureFailure: Error, CustomStringConvertible {
    let description: String
}

struct RecordingSummary {
    let fileName: String
    let bytes: UInt32
}

func checkStatus(_ status: OSStatus, action: String) throws {
    guard status == noErr else {
        throw CaptureFailure(description: "\(action) falló (OSStatus \(status)).")
    }
}

func emit(_ payload: [String: Any]) {
    guard
        let data = try? JSONSerialization.data(withJSONObject: payload),
        let line = String(data: data, encoding: .utf8)
    else { return }
    fputs(line + "\n", stdout)
    fflush(stdout)
}

private extension Data {
    mutating func appendLittleEndian<T: FixedWidthInteger>(_ value: T) {
        var littleEndianValue = value.littleEndian
        append(Swift.withUnsafeBytes(of: &littleEndianValue) { Data($0) })
    }
}

final class WaveFileWriter {
    private let url: URL
    private let sampleRate: UInt32
    private var handle: FileHandle
    private(set) var dataBytes: UInt32 = 0

    init(url: URL, sampleRate: UInt32) throws {
        self.url = url
        self.sampleRate = sampleRate
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        guard FileManager.default.createFile(atPath: url.path, contents: nil) else {
            throw CaptureFailure(description: "No se pudo crear el archivo de grabación.")
        }
        handle = try FileHandle(forWritingTo: url)
        try handle.write(contentsOf: Self.header(sampleRate: sampleRate, dataBytes: 0))
    }

    func append(_ samples: [Int16]) throws {
        guard !samples.isEmpty else { return }
        let byteCount = samples.count * MemoryLayout<Int16>.stride
        guard byteCount <= Int(UInt32.max - 44 - dataBytes) else {
            throw CaptureFailure(description: "La grabación excedió el tamaño máximo de WAV PCM.")
        }
        let data = samples.withUnsafeBytes { Data($0) }
        try handle.write(contentsOf: data)
        dataBytes += UInt32(byteCount)
    }

    func finish() throws -> UInt32 {
        try handle.seek(toOffset: 0)
        try handle.write(contentsOf: Self.header(sampleRate: sampleRate, dataBytes: dataBytes))
        try handle.close()
        return dataBytes + 44
    }

    func discard() {
        try? handle.close()
        try? FileManager.default.removeItem(at: url)
    }

    private static func header(sampleRate: UInt32, dataBytes: UInt32) -> Data {
        var header = Data()
        header.append(contentsOf: Array("RIFF".utf8))
        header.appendLittleEndian(36 + dataBytes)
        header.append(contentsOf: Array("WAVEfmt ".utf8))
        header.appendLittleEndian(UInt32(16))
        header.appendLittleEndian(UInt16(1)) // PCM
        header.appendLittleEndian(UInt16(1)) // Mono
        header.appendLittleEndian(sampleRate)
        header.appendLittleEndian(sampleRate * 2) // byte rate: mono, 16-bit
        header.appendLittleEndian(UInt16(2)) // block alignment
        header.appendLittleEndian(UInt16(16))
        header.append(contentsOf: Array("data".utf8))
        header.appendLittleEndian(dataBytes)
        return header
    }
}

final class BoundedRecordingWriter {
    private let queue = DispatchQueue(label: "local.meetingnotes.recording.writer", qos: .utility)
    private let availableSlots = DispatchSemaphore(value: 12)
    private let stateLock = NSLock()
    private var writer: WaveFileWriter?
    private var recording = false
    private var failureMessage: String?

    init(url: URL, sampleRate: UInt32) throws {
        let writer = try WaveFileWriter(url: url, sampleRate: sampleRate)
        self.writer = writer
        recording = true
    }

    func append(_ samples: [Int16]) {
        guard !samples.isEmpty else { return }

        stateLock.lock()
        let shouldWrite = recording && failureMessage == nil
        stateLock.unlock()
        guard shouldWrite else { return }

        guard availableSlots.wait(timeout: .now()) == .success else {
            setFailure("La escritura local no pudo seguir el ritmo del audio. Detén y descarta esta grabación.")
            return
        }

        queue.async { [weak self] in
            guard let self else { return }
            defer { self.availableSlots.signal() }
            do {
                try self.writer?.append(samples)
            } catch {
                self.setFailure(error.localizedDescription)
            }
        }
    }

    func finish() throws -> UInt32 {
        stateLock.lock()
        recording = false
        stateLock.unlock()

        return try queue.sync {
            guard let writer else {
                throw CaptureFailure(description: "No había un archivo de grabación abierto.")
            }
            stateLock.lock()
            let previousFailure = failureMessage
            stateLock.unlock()
            if let previousFailure {
                writer.discard()
                self.writer = nil
                throw CaptureFailure(description: previousFailure)
            }
            do {
                let bytes = try writer.finish()
                self.writer = nil
                return bytes
            } catch {
                writer.discard()
                self.writer = nil
                throw error
            }
        }
    }

    func discard() {
        stateLock.lock()
        recording = false
        stateLock.unlock()
        queue.sync {
            writer?.discard()
            writer = nil
        }
    }

    private func setFailure(_ message: String) {
        stateLock.lock()
        if failureMessage == nil { failureMessage = message }
        stateLock.unlock()
    }
}

final class SystemAudioCapture {
    private var tapID = AudioObjectID(kAudioObjectUnknown)
    private var aggregateDeviceID = AudioObjectID(kAudioObjectUnknown)
    private var ioProcID: AudioDeviceIOProcID?
    private let audioQueue = DispatchQueue(label: "local.meetingnotes.audio-poc.io", qos: .userInitiated)
    private let meterLock = NSLock()
    private var latestRMS: Double = 0
    private var streamFormat = AudioStreamBasicDescription()
    private var recordingWriter: BoundedRecordingWriter?
    private var recordingURL: URL?
    private var started = false

    func start(recordingsDirectory: URL) throws -> String {
        try FileManager.default.createDirectory(
            at: recordingsDirectory,
            withIntermediateDirectories: true
        )

        let microphoneID = try readDefaultInputDevice()
        let microphoneUID = try readDeviceUID(microphoneID)
        let microphoneChannels = try readInputChannelCount(microphoneID)
        guard microphoneChannels > 0 else {
            throw CaptureFailure(description: "macOS no reportó canales para el micrófono predeterminado.")
        }

        let tapDescription = CATapDescription(stereoGlobalTapButExcludeProcesses: [])
        tapDescription.name = "MeetingNotes local audio recording"
        tapDescription.isPrivate = true
        tapDescription.muteBehavior = CATapMuteBehavior(rawValue: 0) ?? tapDescription.muteBehavior

        try checkStatus(
            AudioHardwareCreateProcessTap(tapDescription, &tapID),
            action: "Crear el tap de audio del sistema"
        )

        let tapUID = try readTapUID()
        let aggregateDescription: [String: Any] = [
            "name": "MeetingNotes local audio recording",
            "uid": UUID().uuidString,
            "private": true,
            "stacked": false,
            "master": microphoneUID,
            "subdevices": [[
                "uid": microphoneUID,
                "drift": true,
                "channels-in": microphoneChannels,
            ]],
            "taps": [[
                "uid": tapUID,
                "drift": true,
            ]],
        ]

        try checkStatus(
            AudioHardwareCreateAggregateDevice(aggregateDescription as CFDictionary, &aggregateDeviceID),
            action: "Combinar el micrófono y el audio del sistema"
        )

        streamFormat = try readInputStreamFormat(aggregateDeviceID)
        guard
            streamFormat.mFormatID == kAudioFormatLinearPCM,
            streamFormat.mFormatFlags & kAudioFormatFlagIsFloat != 0,
            streamFormat.mBitsPerChannel == 32,
            streamFormat.mChannelsPerFrame > 0,
            streamFormat.mSampleRate >= 8_000,
            streamFormat.mSampleRate <= 192_000
        else {
            throw CaptureFailure(description: "El dispositivo agregado devolvió un formato de audio no compatible con esta POC.")
        }

        let fileName = Self.makeRecordingFileName()
        let url = recordingsDirectory.appendingPathComponent(fileName, isDirectory: false)
        recordingURL = url
        recordingWriter = try BoundedRecordingWriter(
            url: url,
            sampleRate: UInt32(streamFormat.mSampleRate.rounded())
        )

        try checkStatus(
            AudioDeviceCreateIOProcIDWithBlock(&ioProcID, aggregateDeviceID, audioQueue) { [weak self] _, inputData, _, _, _ in
                self?.process(inputData)
            },
            action: "Registrar el lector de micrófono y audio del sistema"
        )

        try checkStatus(
            AudioDeviceStart(aggregateDeviceID, ioProcID),
            action: "Iniciar la grabación local"
        )
        started = true
        return fileName
    }

    func stop() throws -> RecordingSummary {
        stopAudioDevice()
        guard let recordingWriter, let recordingURL else {
            throw CaptureFailure(description: "No se encontró la grabación que debía cerrarse.")
        }

        do {
            let bytes = try recordingWriter.finish()
            self.recordingWriter = nil
            self.recordingURL = nil
            return RecordingSummary(fileName: recordingURL.lastPathComponent, bytes: bytes)
        } catch {
            recordingWriter.discard()
            self.recordingWriter = nil
            self.recordingURL = nil
            throw error
        }
    }

    func abort() {
        stopAudioDevice()
        recordingWriter?.discard()
        recordingWriter = nil
        if let recordingURL { try? FileManager.default.removeItem(at: recordingURL) }
        recordingURL = nil
    }

    func level() -> Double {
        meterLock.lock()
        defer { meterLock.unlock() }
        return latestRMS
    }

    private func stopAudioDevice() {
        if aggregateDeviceID != AudioObjectID(kAudioObjectUnknown), let ioProcID {
            if started { AudioDeviceStop(aggregateDeviceID, ioProcID) }
            AudioDeviceDestroyIOProcID(aggregateDeviceID, ioProcID)
            self.ioProcID = nil
        }
        if aggregateDeviceID != AudioObjectID(kAudioObjectUnknown) {
            AudioHardwareDestroyAggregateDevice(aggregateDeviceID)
            aggregateDeviceID = AudioObjectID(kAudioObjectUnknown)
        }
        if tapID != AudioObjectID(kAudioObjectUnknown) {
            AudioHardwareDestroyProcessTap(tapID)
            tapID = AudioObjectID(kAudioObjectUnknown)
        }
        started = false
    }

    private func process(_ inputData: UnsafePointer<AudioBufferList>) {
        do {
            let (samples, rms) = try mixToMono(inputData)
            meterLock.lock()
            latestRMS = rms
            meterLock.unlock()
            recordingWriter?.append(samples)
        } catch {
            emit(["type": "error", "message": error.localizedDescription])
        }
    }

    private func mixToMono(_ inputData: UnsafePointer<AudioBufferList>) throws -> ([Int16], Double) {
        let buffers = UnsafeMutableAudioBufferListPointer(UnsafeMutablePointer(mutating: inputData))
        let floatStride = MemoryLayout<Float>.stride
        let channelBuffers = buffers.compactMap { buffer -> (UnsafePointer<Float>, Int, Int)? in
            guard let data = buffer.mData, buffer.mNumberChannels > 0 else { return nil }
            let channels = Int(buffer.mNumberChannels)
            let frames = Int(buffer.mDataByteSize) / (floatStride * channels)
            guard frames > 0 else { return nil }
            return (UnsafePointer(data.assumingMemoryBound(to: Float.self)), channels, frames)
        }
        guard !channelBuffers.isEmpty else { return ([], 0) }

        let frameCount = channelBuffers.map(\.2).min() ?? 0
        let totalChannels = channelBuffers.reduce(0) { $0 + $1.1 }
        guard frameCount > 0, totalChannels > 0 else { return ([], 0) }

        var output = [Int16](repeating: 0, count: frameCount)
        var sumSquares = 0.0
        for frame in 0..<frameCount {
            var sum = 0.0
            for (samples, channels, _) in channelBuffers {
                let frameOffset = frame * channels
                for channel in 0..<channels {
                    let sample = Double(samples[frameOffset + channel])
                    if sample.isFinite { sum += sample }
                }
            }
            let mono = max(-1.0, min(1.0, sum / Double(totalChannels)))
            sumSquares += mono * mono
            output[frame] = Int16(mono * Double(Int16.max))
        }

        return (output, min(1, sqrt(sumSquares / Double(frameCount))))
    }

    private func readTapUID() throws -> String {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioTapPropertyUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var size = UInt32(MemoryLayout<CFString>.stride)
        var uid: CFString = "" as CFString
        let status = withUnsafeMutablePointer(to: &uid) { pointer in
            AudioObjectGetPropertyData(tapID, &address, 0, nil, &size, pointer)
        }
        try checkStatus(status, action: "Leer el identificador del tap")
        return uid as String
    }

    private func readDefaultInputDevice() throws -> AudioObjectID {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultInputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var size = UInt32(MemoryLayout<AudioObjectID>.size)
        var deviceID = AudioObjectID(kAudioObjectUnknown)
        let status = AudioObjectGetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &address,
            0,
            nil,
            &size,
            &deviceID
        )
        try checkStatus(status, action: "Buscar el micrófono predeterminado")
        guard deviceID != AudioObjectID(kAudioObjectUnknown) else {
            throw CaptureFailure(description: "macOS no tiene un micrófono predeterminado disponible.")
        }
        return deviceID
    }

    private func readDeviceUID(_ deviceID: AudioObjectID) throws -> String {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var size = UInt32(MemoryLayout<CFString>.stride)
        var uid: CFString = "" as CFString
        let status = withUnsafeMutablePointer(to: &uid) { pointer in
            AudioObjectGetPropertyData(deviceID, &address, 0, nil, &size, pointer)
        }
        try checkStatus(status, action: "Leer el identificador del micrófono")
        return uid as String
    }

    private func readInputChannelCount(_ deviceID: AudioObjectID) throws -> Int {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreamConfiguration,
            mScope: kAudioDevicePropertyScopeInput,
            mElement: kAudioObjectPropertyElementMain
        )
        var size: UInt32 = 0
        try checkStatus(
            AudioObjectGetPropertyDataSize(deviceID, &address, 0, nil, &size),
            action: "Consultar los canales del micrófono"
        )
        let storage = UnsafeMutableRawPointer.allocate(
            byteCount: Int(size),
            alignment: MemoryLayout<AudioBufferList>.alignment
        )
        defer { storage.deallocate() }
        let audioBufferList = storage.bindMemory(to: AudioBufferList.self, capacity: 1)
        try checkStatus(
            AudioObjectGetPropertyData(deviceID, &address, 0, nil, &size, audioBufferList),
            action: "Leer los canales del micrófono"
        )
        return UnsafeMutableAudioBufferListPointer(audioBufferList)
            .reduce(0) { $0 + Int($1.mNumberChannels) }
    }

    private func readInputStreamFormat(_ deviceID: AudioObjectID) throws -> AudioStreamBasicDescription {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreamFormat,
            mScope: kAudioDevicePropertyScopeInput,
            mElement: kAudioObjectPropertyElementMain
        )
        var format = AudioStreamBasicDescription()
        var size = UInt32(MemoryLayout<AudioStreamBasicDescription>.size)
        try checkStatus(
            AudioObjectGetPropertyData(deviceID, &address, 0, nil, &size, &format),
            action: "Consultar el formato del dispositivo de grabación"
        )
        return format
    }

    private static func makeRecordingFileName() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let suffix = UUID().uuidString.prefix(8).lowercased()
        return "MeetingNotes-\(formatter.string(from: Date()))-\(suffix).wav"
    }
}

guard CommandLine.arguments.count >= 2 else {
    emit(["type": "error", "message": "Falta indicar la carpeta local de grabaciones."])
    exit(2)
}

let recordingsDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let capture = SystemAudioCapture()
let recordingFile: String
do {
    recordingFile = try capture.start(recordingsDirectory: recordingsDirectory)
} catch {
    capture.abort()
    emit(["type": "error", "message": error.localizedDescription])
    exit(1)
}

emit(["type": "ready", "fileName": recordingFile])
let meterTimer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
meterTimer.schedule(deadline: .now(), repeating: .milliseconds(100))
meterTimer.setEventHandler {
    emit(["type": "meter", "rms": capture.level()])
}
meterTimer.resume()

while let command = readLine(), command.trimmingCharacters(in: .whitespacesAndNewlines) != "stop" {}
meterTimer.cancel()

do {
    let summary = try capture.stop()
    emit(["type": "stopped", "fileName": summary.fileName, "bytes": summary.bytes])
    exit(0)
} catch {
    capture.abort()
    emit(["type": "error", "message": error.localizedDescription])
    exit(1)
}
