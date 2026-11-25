import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { helperEventSchema, type HelperEvent } from './events'

export interface NativeCaptureSession {
  fileName: string | null
  level: number
  confirmedFileName: string | null
  protocolError: boolean
}

type OnEvent = (event: HelperEvent) => Promise<void> | void
type OnExit = (session: NativeCaptureSession, exitCode: number) => Promise<void> | void

export class NativeCapture {
  private active: { session: NativeCaptureSession; child: ReturnType<typeof Bun.spawn>; reader: Promise<void>; finished: Promise<void> } | null = null

  async start(directory: string, onEvent: OnEvent, onExit: OnExit): Promise<NativeCaptureSession> {
    if (this.active) throw new Error('CAPTURE_ALREADY_ACTIVE')
    const command = this.command(directory)
    const child = Bun.spawn(command, { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore' })
    const session: NativeCaptureSession = {
      fileName: null,
      level: 0,
      confirmedFileName: null,
      protocolError: false,
    }

    const reader = this.readEvents(child, session, onEvent)
    const finished = child.exited.then(async (exitCode) => {
      try {
        await reader
      } catch {
        session.protocolError = true
      }
      try {
        await onExit(session, session.protocolError ? -1 : exitCode)
      } finally {
        if (this.active?.session === session) this.active = null
      }
    })
    void reader.catch(() => child.kill())
    this.active = { session, child, reader, finished }
    void finished.catch(() => undefined)
    return session
  }

  level(): number | null {
    return this.active?.session.level ?? null
  }

  async stop(): Promise<void> {
    const active = this.active
    if (!active) return
    const input = active.child.stdin
    if (input && typeof input !== 'number' && active.child.exitCode === null) {
      input.write('stop\n')
      input.flush()
      await active.child.exited
    }
    await active.finished
  }

  private command(directory: string): string[] {
    if (process.platform === 'darwin') {
      return [join(import.meta.dir, '../../native/macos/build/MeetingNotesAudioCapture.app/Contents/MacOS/MeetingNotesAudioCapture'), directory]
    }
    if (process.platform === 'win32') {
      const helperPath = join(import.meta.dir, '../../native/windows/AudioCapture.py')
      const localPython = join(import.meta.dir, '../../native/windows/.venv/Scripts/python.exe')
      const python = existsSync(localPython) ? localPython : 'py'
      return python === 'py'
        ? [python, '-3.11', '-u', helperPath, directory]
        : [python, '-u', helperPath, directory]
    }
    throw new Error('CAPTURE_PLATFORM_UNSUPPORTED')
  }

  private async readEvents(child: ReturnType<typeof Bun.spawn>, session: NativeCaptureSession, onEvent: OnEvent) {
    const stream = child.stdout
    if (!stream || typeof stream === 'number') throw new Error('CAPTURE_HELPER_OUTPUT_UNAVAILABLE')
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffered = ''
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        buffered += decoder.decode(part.value, { stream: true })
        while (true) {
          const newline = buffered.indexOf('\n')
          if (newline < 0) break
          const line = buffered.slice(0, newline).trim()
          buffered = buffered.slice(newline + 1)
          if (!line) continue
          let raw: unknown
          try { raw = JSON.parse(line) } catch { throw new Error('CAPTURE_HELPER_OUTPUT_INVALID') }
          const event = helperEventSchema.safeParse(raw)
          if (!event.success) throw new Error('CAPTURE_HELPER_OUTPUT_INVALID')
          if (event.data.type === 'ready') session.fileName = event.data.fileName
          if (event.data.type === 'meter') session.level = event.data.rms
          if (event.data.type === 'stopped') session.confirmedFileName = event.data.fileName
          await onEvent(event.data)
        }
      }
      if (buffered.trim()) throw new Error('CAPTURE_HELPER_OUTPUT_INVALID')
    } finally {
      reader.releaseLock()
    }
  }
}
