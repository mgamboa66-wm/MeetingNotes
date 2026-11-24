import { Hono } from 'hono'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { readdir, stat } from 'node:fs/promises'
import { z } from 'zod'

const recordingFileSchema = z.string().regex(/^MeetingNotes-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-[a-f0-9]{8}\.wav$/)
const helperEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready'), fileName: recordingFileSchema }),
  z.object({ type: z.literal('meter'), rms: z.number().min(0).max(1) }),
  z.object({ type: z.literal('error'), message: z.string().max(500) }),
  z.object({ type: z.literal('stopped'), fileName: recordingFileSchema, bytes: z.number().int().positive() }),
])

type RecordingInfo = {
  fileName: string
  bytes: number
  modifiedAt: string
}

type CaptureState = {
  state: 'idle' | 'starting' | 'capturing' | 'stopping' | 'error'
  level: number
  message: string | null
  recordingFile: string | null
  lastRecording: RecordingInfo | null
  updatedAt: number | null
}

const recordingsDirectory = fileURLToPath(new URL('../../recordings/', import.meta.url))
let state: CaptureState = {
  state: 'idle',
  level: 0,
  message: null,
  recordingFile: null,
  lastRecording: null,
  updatedAt: null,
}
let helper: ReturnType<typeof Bun.spawn> | null = null
let readerTask: Promise<void> | null = null

function updateState(patch: Partial<CaptureState>) {
  state = { ...state, ...patch, updatedAt: Date.now() }
}

function consumeHelperOutput(process: ReturnType<typeof Bun.spawn>) {
  return (async () => {
    const stream = process.stdout
    if (!stream || typeof stream === 'number') return

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffered = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffered += decoder.decode(value, { stream: true })

        while (true) {
          const newline = buffered.indexOf('\n')
          if (newline < 0) break
          const line = buffered.slice(0, newline).trim()
          buffered = buffered.slice(newline + 1)
          if (!line) continue

          let raw: unknown
          try {
            raw = JSON.parse(line)
          } catch {
            updateState({ state: 'error', message: 'El helper de audio devolvió un mensaje inválido.' })
            continue
          }

          const parsed = helperEventSchema.safeParse(raw)
          if (!parsed.success) {
            updateState({ state: 'error', message: 'El helper de audio devolvió un evento no reconocido.' })
            continue
          }

          if (parsed.data.type === 'ready') {
            updateState({
              state: 'capturing',
              level: 0,
              message: 'Grabación activa: micrófono y audio del sistema.',
              recordingFile: parsed.data.fileName,
            })
          } else if (parsed.data.type === 'meter') {
            if (state.state === 'capturing') updateState({ level: parsed.data.rms, message: null })
          } else if (parsed.data.type === 'error') {
            updateState({ state: 'error', level: 0, message: parsed.data.message, recordingFile: null })
          } else {
            const lastRecording = {
              fileName: parsed.data.fileName,
              bytes: parsed.data.bytes,
              modifiedAt: new Date().toISOString(),
            }
            updateState({
              state: 'idle',
              level: 0,
              message: 'Grabación WAV guardada localmente.',
              recordingFile: null,
              lastRecording,
            })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  })()
}

async function startCapture() {
  if (helper && helper.exitCode === null) return state

  const helperCommand = process.platform === 'darwin'
    ? [fileURLToPath(new URL('../../native/build/MeetingNotesAudioCapture.app/Contents/MacOS/MeetingNotesAudioCapture', import.meta.url)), recordingsDirectory]
    : process.platform === 'win32'
      ? ['py', '-3.11', '-u', fileURLToPath(new URL('../../native/windows/AudioCapture.py', import.meta.url)), recordingsDirectory]
      : null
  if (!helperCommand) {
    updateState({ state: 'error', level: 0, message: 'La POC solo tiene capturadores para macOS y Windows.' })
    return state
  }

  try {
    helper = Bun.spawn(helperCommand, {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'inherit',
    })
  } catch (error) {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    updateState({
      state: 'error',
      level: 0,
      message: process.platform === 'win32' && errorCode === 'ENOENT'
        ? 'No se encontró Python 3.11. Instálalo y verifica que el lanzador py esté disponible.'
        : error instanceof Error ? error.message : 'No se pudo abrir el helper de captura.',
    })
    return state
  }

  updateState({ state: 'starting', level: 0, message: 'Iniciando el micrófono y el audio del sistema…' })
  const activeHelper = helper
  readerTask = consumeHelperOutput(activeHelper)
  void activeHelper.exited.then(async (exitCode) => {
    await readerTask
    if (helper === activeHelper) {
      helper = null
      if (state.state === 'starting' || state.state === 'capturing') {
        updateState({
          state: 'error',
          level: 0,
          message: `El helper de audio terminó inesperadamente (código ${exitCode}); el WAV podría estar incompleto.`,
          recordingFile: null,
        })
      }
    }
  })
  return state
}

async function stopCapture() {
  if (!helper || helper.exitCode !== null) {
    helper = null
    if (state.state === 'error') return state
    updateState({ state: 'idle', level: 0, message: 'Captura detenida.' })
    return state
  }

  const activeHelper = helper
  updateState({ state: 'stopping', level: 0, message: 'Deteniendo captura…' })
  const input = activeHelper.stdin
  if (input && typeof input !== 'number') {
    input.write('stop\n')
    input.flush()
  }
  await activeHelper.exited
  await readerTask
  if (helper === activeHelper) helper = null
  if (state.state === 'stopping') {
    updateState({ state: 'error', level: 0, message: 'El helper terminó sin confirmar que el WAV quedara completo.', recordingFile: null })
  }
  return state
}

const app = new Hono()

app.get('/api/health', (context) => context.json({ ok: true, service: 'meetingnotes-audio-poc', platform: process.platform }))
app.get('/api/capture/status', (context) => context.json({ ...state, platform: process.platform }))
app.post('/api/capture/start', async (context) => {
  await startCapture()
  return context.json({ ...state, platform: process.platform })
})
app.post('/api/capture/stop', async (context) => {
  await stopCapture()
  return context.json({ ...state, platform: process.platform })
})
app.get('/api/recordings', async (context) => {
  let entries
  try {
    entries = await readdir(recordingsDirectory, { withFileTypes: true })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return context.json([])
    throw error
  }

  const recordings: RecordingInfo[] = []
  for (const entry of entries) {
    if (!entry.isFile() || !recordingFileSchema.safeParse(entry.name).success) continue
    const fileInfo = await stat(join(recordingsDirectory, entry.name))
    recordings.push({
      fileName: entry.name,
      bytes: fileInfo.size,
      modifiedAt: fileInfo.mtime.toISOString(),
    })
  }
  recordings.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
  return context.json(recordings)
})
app.get('/api/recordings/:fileName', async (context) => {
  const fileName = context.req.param('fileName')
  if (basename(fileName) !== fileName || !recordingFileSchema.safeParse(fileName).success) {
    return context.json({ error: 'Nombre de grabación inválido.' }, 400)
  }

  const file = Bun.file(join(recordingsDirectory, fileName))
  if (!(await file.exists())) return context.notFound()
  return new Response(file, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
})

app.onError((error, context) => {
  console.error(error)
  return context.json({ error: 'Error en el backend local.' }, 500)
})

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 4174,
  fetch: app.fetch,
})

console.log(`POC API escuchando localmente en http://${server.hostname}:${server.port}`)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void stopCapture().finally(() => process.exit(0))
  })
}
