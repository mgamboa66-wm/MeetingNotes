from __future__ import annotations

import array
import json
import math
import queue
import secrets
import sys
import threading
import time
import wave
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


OUTPUT_RATE = 48_000
FRAMES_PER_BUFFER = 960  # 20 ms at 48 kHz
LOOKAHEAD_SECONDS = 0.08
MAX_QUEUED_CHUNKS = 64
METER_FRAMES = OUTPUT_RATE // 10

_stdout_lock = threading.Lock()


def emit(event: dict[str, object]) -> None:
    with _stdout_lock:
        sys.stdout.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")
        sys.stdout.flush()


def emit_error(message: object) -> None:
    emit({"type": "error", "message": str(message)[:500]})


try:
    import pyaudiowpatch as pyaudio
except ImportError as error:
    print(f"PyAudioWPatch no está instalado: {error}", file=sys.stderr, flush=True)
    emit_error("Falta PyAudioWPatch. Ejecuta bun run native:install:windows en la carpeta del POC.")
    raise SystemExit(1)


class CaptureError(Exception):
    pass


@dataclass
class AudioChunk:
    start_time: float
    samples: array.array
    queued_at: float
    offset: int = 0


def downmix_to_mono(data: bytes, channels: int) -> array.array:
    samples = array.array("h")
    samples.frombytes(data)
    if sys.byteorder != "little":
        samples.byteswap()
    if channels < 1 or len(samples) % channels != 0:
        raise CaptureError("El dispositivo devolvió un bloque con formato de canales inválido.")
    if channels == 1:
        return samples

    mono = array.array("h")
    for frame_start in range(0, len(samples), channels):
        frame_sum = sum(samples[frame_start:frame_start + channels])
        mono.append(max(-32768, min(32767, int(frame_sum / channels))))
    return mono


def resample_linear(samples: array.array, source_rate: int) -> array.array:
    if not samples or source_rate == OUTPUT_RATE:
        return samples
    if source_rate < 1:
        raise CaptureError("El dispositivo devolvió una frecuencia de muestreo inválida.")

    output_frames = max(1, round(len(samples) * OUTPUT_RATE / source_rate))
    converted = array.array("h")
    last_index = len(samples) - 1
    for output_index in range(output_frames):
        position = output_index * source_rate / OUTPUT_RATE
        left = min(int(position), last_index)
        right = min(left + 1, last_index)
        fraction = position - left
        value = samples[left] + (samples[right] - samples[left]) * fraction
        converted.append(max(-32768, min(32767, int(value))))
    return converted


class CaptureSession:
    def __init__(self, recordings_directory: Path) -> None:
        self.recordings_directory = recordings_directory
        self.file_name = ""
        self.recording_path: Path | None = None
        self.audio = None
        self.wave_file: wave.Wave_write | None = None
        self.streams: list[object] = []
        self.queues = {
            "system": queue.Queue(maxsize=MAX_QUEUED_CHUNKS),
            "microphone": queue.Queue(maxsize=MAX_QUEUED_CHUNKS),
        }
        self.first_chunk = {
            "system": threading.Event(),
            "microphone": threading.Event(),
        }
        self.stop_requested = threading.Event()
        self.capture_finished = threading.Event()
        self.mixer_wakeup = threading.Event()
        self.failure_event = threading.Event()
        self.failure_lock = threading.Lock()
        self.failure: str | None = None
        self.level_lock = threading.Lock()
        self.latest_rms = 0.0
        self.frames_written = 0
        self.mixer_thread: threading.Thread | None = None
        self._closed = False

    def _set_failure(self, message: str) -> None:
        with self.failure_lock:
            if self.failure is None:
                self.failure = message[:500]
        self.failure_event.set()
        self.stop_requested.set()
        self.mixer_wakeup.set()

    def _get_failure(self) -> str | None:
        with self.failure_lock:
            return self.failure

    def _update_level(self, value: float) -> None:
        with self.level_lock:
            self.latest_rms = min(1.0, max(0.0, value))

    def level(self) -> float:
        with self.level_lock:
            return self.latest_rms

    @staticmethod
    def _device_channels(device: dict[str, object], label: str) -> int:
        channels = min(2, int(device.get("maxInputChannels", 0)))
        if channels < 1:
            raise CaptureError(f"No se encontró un canal de captura disponible para {label}.")
        return channels

    @staticmethod
    def _device_rate(device: dict[str, object], label: str) -> int:
        rate = int(float(device.get("defaultSampleRate", OUTPUT_RATE)))
        if rate < 1:
            raise CaptureError(f"El dispositivo de {label} devolvió una frecuencia inválida.")
        return rate

    @staticmethod
    def _chunk_start_time(time_info: dict[str, float], frame_count: int, source_rate: int) -> float:
        now = time.perf_counter()
        try:
            current_time = float(time_info.get("current_time", 0.0))
            adc_time = float(time_info.get("input_buffer_adc_time", 0.0))
            if math.isfinite(current_time) and math.isfinite(adc_time) and current_time >= adc_time > 0:
                age = min(current_time - adc_time, 2.0)
                return now - age
        except (TypeError, ValueError):
            pass
        return now - (frame_count / max(source_rate, 1))

    def _callback(self, source: str, channels: int, source_rate: int):
        def callback(in_data, frame_count, time_info, status_flags):
            if self.stop_requested.is_set() or self.failure_event.is_set():
                return (None, pyaudio.paComplete)
            try:
                if in_data is None:
                    raise CaptureError("El dispositivo no entregó datos de audio.")
                mono = downmix_to_mono(in_data, channels)
                converted = resample_linear(mono, source_rate)
                if converted:
                    chunk = AudioChunk(
                        start_time=self._chunk_start_time(time_info or {}, frame_count, source_rate),
                        samples=converted,
                        queued_at=time.perf_counter(),
                    )
                    self.queues[source].put_nowait(chunk)
                    self.first_chunk[source].set()
                    self.mixer_wakeup.set()
            except queue.Full:
                self._set_failure(f"La cola de audio de {source} se llenó; se detuvo la grabación incompleta.")
                return (None, pyaudio.paAbort)
            except Exception as error:
                print(f"Error de captura ({source}): {error}", file=sys.stderr, flush=True)
                self._set_failure(f"No se pudo leer el audio de {source}: {error}")
                return (None, pyaudio.paAbort)
            return (None, pyaudio.paContinue)

        return callback

    def start(self) -> str:
        if sys.version_info < (3, 11):
            raise CaptureError("Esta POC requiere Python 3.11 o posterior.")

        self.recordings_directory.mkdir(parents=True, exist_ok=True)
        self.file_name = f"MeetingNotes-{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}-{secrets.token_hex(4)}.wav"
        self.recording_path = self.recordings_directory / self.file_name

        try:
            self.audio = pyaudio.PyAudio()
            try:
                system_device = self.audio.get_default_wasapi_loopback()
            except Exception as error:
                raise CaptureError(f"No se encontró la salida WASAPI predeterminada: {error}") from error
            try:
                microphone_device = self.audio.get_default_input_device_info()
            except Exception as error:
                raise CaptureError(f"No se encontró el micrófono predeterminado: {error}") from error

            system_channels = self._device_channels(system_device, "la salida del sistema")
            microphone_channels = self._device_channels(microphone_device, "el micrófono")
            system_rate = self._device_rate(system_device, "la salida del sistema")
            microphone_rate = self._device_rate(microphone_device, "el micrófono")

            try:
                system_stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=system_channels,
                    rate=system_rate,
                    input=True,
                    input_device_index=int(system_device["index"]),
                    frames_per_buffer=FRAMES_PER_BUFFER,
                    stream_callback=self._callback("system", system_channels, system_rate),
                    start=False,
                )
            except Exception as error:
                raise CaptureError(f"No se pudo abrir el loopback de la salida predeterminada: {error}") from error
            self.streams.append(system_stream)

            try:
                microphone_stream = self.audio.open(
                    format=pyaudio.paInt16,
                    channels=microphone_channels,
                    rate=microphone_rate,
                    input=True,
                    input_device_index=int(microphone_device["index"]),
                    frames_per_buffer=FRAMES_PER_BUFFER,
                    stream_callback=self._callback("microphone", microphone_channels, microphone_rate),
                    start=False,
                )
            except Exception as error:
                raise CaptureError(f"No se pudo abrir el micrófono predeterminado: {error}") from error
            self.streams.append(microphone_stream)

            self.wave_file = wave.open(str(self.recording_path), "wb")
            self.wave_file.setnchannels(1)
            self.wave_file.setsampwidth(2)
            self.wave_file.setframerate(OUTPUT_RATE)

            self.mixer_thread = threading.Thread(target=self._mix_loop, name="audio-mixer", daemon=True)
            self.mixer_thread.start()
            system_stream.start_stream()
            microphone_stream.start_stream()

            return self.file_name
        except Exception:
            self._shutdown(remove_partial=True)
            raise

    def _mix_loop(self) -> None:
        system_chunks: deque[AudioChunk] = deque()
        microphone_chunk: AudioChunk | None = None
        meter_frames = 0
        meter_squares = 0.0

        try:
            while not self.failure_event.is_set():
                while True:
                    try:
                        system_chunks.append(self.queues["system"].get_nowait())
                    except queue.Empty:
                        break

                if microphone_chunk is None:
                    try:
                        microphone_chunk = self.queues["microphone"].get_nowait()
                    except queue.Empty:
                        if self.capture_finished.is_set() and self.queues["microphone"].empty():
                            break
                        self.mixer_wakeup.wait(0.02)
                        self.mixer_wakeup.clear()
                        continue

                ready_at = microphone_chunk.queued_at + LOOKAHEAD_SECONDS
                if not self.capture_finished.is_set() and time.perf_counter() < ready_at:
                    self.mixer_wakeup.wait(min(0.01, max(0.0, ready_at - time.perf_counter())))
                    self.mixer_wakeup.clear()
                    continue

                while True:
                    try:
                        system_chunks.append(self.queues["system"].get_nowait())
                    except queue.Empty:
                        break

                mic_samples = microphone_chunk.samples
                mic_start = microphone_chunk.start_time
                mic_end = mic_start + len(mic_samples) / OUTPUT_RATE
                system_mix = array.array("h", [0]) * len(mic_samples)

                while system_chunks:
                    system_chunk = system_chunks[0]
                    system_start = system_chunk.start_time + system_chunk.offset / OUTPUT_RATE
                    system_end = system_chunk.start_time + len(system_chunk.samples) / OUTPUT_RATE

                    if system_end <= mic_start:
                        system_chunks.popleft()
                        continue
                    if system_start >= mic_end:
                        break

                    overlap_start = max(mic_start, system_start)
                    overlap_end = min(mic_end, system_end)
                    frames = int(math.floor((overlap_end - overlap_start) * OUTPUT_RATE))
                    mic_offset = int(round((overlap_start - mic_start) * OUTPUT_RATE))
                    system_offset = int(round((overlap_start - system_chunk.start_time) * OUTPUT_RATE))
                    if frames <= 0 or mic_offset < 0 or system_offset < system_chunk.offset:
                        system_chunks.popleft()
                        continue

                    frames = min(
                        frames,
                        len(mic_samples) - mic_offset,
                        len(system_chunk.samples) - system_offset,
                    )
                    if frames <= 0:
                        system_chunks.popleft()
                        continue
                    for index in range(frames):
                        system_mix[mic_offset + index] = system_chunk.samples[system_offset + index]

                    system_chunk.offset = system_offset + frames
                    if system_chunk.offset >= len(system_chunk.samples):
                        system_chunks.popleft()
                    else:
                        break

                mixed = array.array("h")
                sum_squares = 0.0
                for microphone_sample, system_sample in zip(mic_samples, system_mix):
                    value = max(-32768, min(32767, int((microphone_sample + system_sample) / 2)))
                    mixed.append(value)
                    sum_squares += float(value * value)

                if self.wave_file is None:
                    raise CaptureError("El WAV local dejó de estar disponible durante la captura.")
                self.wave_file.writeframesraw(mixed.tobytes())
                self.frames_written += len(mixed)
                meter_frames += len(mixed)
                meter_squares += sum_squares
                if meter_frames >= METER_FRAMES:
                    self._update_level(math.sqrt(meter_squares / meter_frames) / 32768.0)
                    meter_frames = 0
                    meter_squares = 0.0
                microphone_chunk = None

        except Exception as error:
            print(f"Error al mezclar audio: {error}", file=sys.stderr, flush=True)
            self._set_failure(f"No se pudo mezclar el audio: {error}")

    def _shutdown(self, remove_partial: bool) -> None:
        if self._closed:
            return
        self.stop_requested.set()
        for stream in self.streams:
            try:
                if stream.is_active():
                    stream.stop_stream()
            except Exception as error:
                print(f"Error al detener un flujo de audio: {error}", file=sys.stderr, flush=True)

        self.capture_finished.set()
        self.mixer_wakeup.set()
        if self.mixer_thread is not None and self.mixer_thread.is_alive():
            self.mixer_thread.join()

        for stream in self.streams:
            try:
                stream.close()
            except Exception as error:
                print(f"Error al cerrar un flujo de audio: {error}", file=sys.stderr, flush=True)
        self.streams.clear()

        if self.wave_file is not None:
            try:
                self.wave_file.close()
            except Exception as error:
                print(f"Error al cerrar el WAV: {error}", file=sys.stderr, flush=True)
                self._set_failure(f"No se pudo finalizar el WAV: {error}")
            self.wave_file = None

        if self.audio is not None:
            try:
                self.audio.terminate()
            except Exception as error:
                print(f"Error al cerrar PyAudioWPatch: {error}", file=sys.stderr, flush=True)
            self.audio = None

        if remove_partial and self.recording_path is not None:
            try:
                self.recording_path.unlink(missing_ok=True)
            except OSError as error:
                print(f"No se pudo eliminar el WAV incompleto: {error}", file=sys.stderr, flush=True)
        self._closed = True

    def finish(self) -> tuple[int | None, str | None]:
        self._shutdown(remove_partial=False)
        failure = self._get_failure()
        if failure:
            if self.recording_path is not None:
                try:
                    self.recording_path.unlink(missing_ok=True)
                except OSError:
                    pass
            return None, failure
        if self.frames_written <= 0 or self.recording_path is None:
            if self.recording_path is not None:
                try:
                    self.recording_path.unlink(missing_ok=True)
                except OSError:
                    pass
            return None, "No se recibieron bloques de audio; no se guardó un WAV vacío."
        try:
            return self.recording_path.stat().st_size, None
        except OSError as error:
            return None, f"No se pudo comprobar el WAV guardado: {error}"


def listen_for_stop(session: CaptureSession) -> None:
    try:
        for line in sys.stdin:
            if line.strip().lower() == "stop":
                session.stop_requested.set()
                return
    finally:
        session.stop_requested.set()


def main() -> int:
    if len(sys.argv) < 2:
        emit_error("Falta indicar la carpeta local de grabaciones.")
        return 2

    session = CaptureSession(Path(sys.argv[1]))
    try:
        file_name = session.start()
    except Exception as error:
        session._shutdown(remove_partial=True)
        emit_error(error)
        return 1

    emit({"type": "ready", "fileName": file_name})
    threading.Thread(target=listen_for_stop, args=(session,), name="stop-listener", daemon=True).start()

    while not session.stop_requested.wait(0.1):
        emit({"type": "meter", "rms": session.level()})

    file_bytes, error = session.finish()
    if error or file_bytes is None:
        emit_error(error or "No se pudo finalizar la grabación WAV.")
        return 1
    emit({"type": "stopped", "fileName": file_name, "bytes": file_bytes})
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    raise SystemExit(main())
