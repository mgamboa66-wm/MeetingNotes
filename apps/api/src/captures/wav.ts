import { errors } from '../http/errors'

const MAX_SEGMENT_BYTES = 20 * 1024 * 1024
const WAV_HEADER_BYTES = 44

export interface WavInfo {
  size: number
  dataSize: number
  sampleRate: number
  blockAlign: number
}

export async function inspectWav(path: string): Promise<WavInfo> {
  const file = Bun.file(path)
  const size = file.size
  if (size <= WAV_HEADER_BYTES) throw errors.conflict('AUDIO_INVALID', 'El audio capturado está vacío o incompleto.')
  const header = new Uint8Array(await file.slice(0, WAV_HEADER_BYTES).arrayBuffer())
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength)
  const validHeader =
    new TextDecoder().decode(header.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(header.slice(8, 12)) === 'WAVE' &&
    new TextDecoder().decode(header.slice(12, 16)) === 'fmt ' &&
    new TextDecoder().decode(header.slice(36, 40)) === 'data'
  const format = view.getUint16(20, true)
  const channels = view.getUint16(22, true)
  const sampleRate = view.getUint32(24, true)
  const byteRate = view.getUint32(28, true)
  const blockAlign = view.getUint16(32, true)
  const bits = view.getUint16(34, true)
  const dataSize = view.getUint32(40, true)
  const declaredRiffSize = view.getUint32(4, true)
  if (!validHeader || format !== 1 || channels !== 1 || bits !== 16 || blockAlign !== 2 || sampleRate < 8000 || sampleRate > 192000 || byteRate !== sampleRate * blockAlign) {
    throw errors.conflict('AUDIO_INVALID', 'El audio no tiene el formato WAV mono PCM de 16 bits esperado.')
  }
  if (dataSize === 0 || WAV_HEADER_BYTES + dataSize !== size || declaredRiffSize + 8 !== size || dataSize % blockAlign !== 0) {
    throw errors.conflict('AUDIO_INVALID', 'El archivo WAV está incompleto.')
  }
  return { size, dataSize, sampleRate, blockAlign }
}

export async function* createWavSegments(path: string): AsyncGenerator<Blob> {
  const file = Bun.file(path)
  const info = await inspectWav(path)
  if (info.size <= MAX_SEGMENT_BYTES) {
    yield file
    return
  }

  const header = new Uint8Array(await file.slice(0, WAV_HEADER_BYTES).arrayBuffer())
  const maxDataBytes = Math.floor((MAX_SEGMENT_BYTES - WAV_HEADER_BYTES) / info.blockAlign) * info.blockAlign
  const overlapBytes = Math.min(info.sampleRate * info.blockAlign, Math.floor(maxDataBytes / 10))
  let start = 0

  while (start < info.dataSize) {
    let end = Math.min(start + maxDataBytes, info.dataSize)
    if (end < info.dataSize) end -= (end - start) % info.blockAlign
    if (end <= start) throw errors.conflict('AUDIO_INVALID', 'No se pudo segmentar el archivo WAV.')
    const segmentHeader = header.slice()
    const view = new DataView(segmentHeader.buffer, segmentHeader.byteOffset, segmentHeader.byteLength)
    const chunkBytes = end - start
    view.setUint32(4, 36 + chunkBytes, true)
    view.setUint32(40, chunkBytes, true)
    yield new Blob([segmentHeader, file.slice(WAV_HEADER_BYTES + start, WAV_HEADER_BYTES + end)], { type: 'audio/wav' })
    if (end >= info.dataSize) return
    start = Math.max(0, end - overlapBytes)
  }
}
