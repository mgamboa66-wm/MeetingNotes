import { randomUUID } from 'node:crypto'
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppConfig } from './config'
import { NativeCapture } from './captures/native-capture'
import { inspectWav } from './captures/wav'
import type { CaptureRow, OutputLanguage } from './db/schema'
import { Repository, type ActionItemResult, type Cursor, type MeetingResult, type StagedResult } from './db/repository'
import { AppError } from './http/errors'
import { decodeCursor, encodeCursor } from './http/cursor'
import {
  acceptedProcessingSchema,
  captureStateSchema,
  failedCapturesSchema,
  meetingDetailsSchema,
  meetingListSchema,
  meetingListItemSchema,
} from './http/response-schemas'
import { OpenAiClient } from './openai/openai-client'

const failedAudioFilename = /^MeetingNotes-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-[a-f0-9]{8}\.wav$/

function isoTime(timestamp: number | null) {
  return timestamp === null ? null : new Date(timestamp).toISOString()
}

async function fileExists(path: string) {
  return Bun.file(path).exists()
}

function isMissingFile(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

function normalizedTitle(value: string | undefined) {
  const title = value?.trim() ?? ''
  return title || null
}

export class MeetingNotesService {
  private readonly repository: Repository
  private readonly nativeCapture = new NativeCapture()
  private readonly openAi: OpenAiClient
  private activeCaptureId: string | null = null
  private readonly processingCaptureIds = new Set<string>()

  constructor(repository: Repository, config: AppConfig) {
    this.repository = repository
    this.openAi = new OpenAiClient(config.openAiApiKey)
    this.config = config
  }

  private readonly config: AppConfig

  async recoverOnStartup() {
    const now = Date.now()
    const interrupted = this.repository.listCapturesByStatuses(['starting', 'capturing', 'stopping'])
    for (const capture of interrupted) {
      await this.removeCaptureAudio(capture.audioFilename)
      this.repository.updateCapture(capture.id, {
        status: 'failed', audioFilename: null, failedAt: now, updatedAt: now, failureCode: 'CAPTURE_INTERRUPTED',
      })
    }

    const ready = this.repository.listCapturesByStatuses(['ready'])
    for (const capture of ready) {
      if (!capture.audioFilename || !(await fileExists(this.audioPath(capture.audioFilename)))) {
        this.repository.updateCapture(capture.id, {
          status: 'failed', audioFilename: null, failedAt: now, updatedAt: now, failureCode: 'AUDIO_MISSING',
        })
      }
    }

    const processing = this.repository.listCapturesByStatuses(['transcribing', 'summarizing'])
    for (const capture of processing) {
      const staged = this.repository.getStaging(capture.id)
      const audioPresent = capture.audioFilename !== null && await fileExists(this.audioPath(capture.audioFilename))
      if (staged && !audioPresent) {
        try { this.repository.finishStaged(capture, Date.now()) } catch { /* GET can retry finalization while staging remains. */ }
      } else {
        this.repository.discardStaging(capture.id)
        this.repository.updateCapture(capture.id, {
          status: 'failed', failedAt: now, updatedAt: now,
          failureCode: audioPresent ? 'PROCESSING_FAILED' : 'AUDIO_MISSING',
          audioFilename: audioPresent ? capture.audioFilename : null,
        })
      }
    }

    for (const capture of this.repository.listCapturesByStatuses(['failed'])) {
      if (capture.audioFilename && !(await fileExists(this.audioPath(capture.audioFilename)))) {
        this.repository.updateCapture(capture.id, {
          audioFilename: null, failureCode: 'AUDIO_MISSING', updatedAt: now,
        })
      }
    }

    await this.removeOrphanAudio()
  }

  async startCapture() {
    const active = this.repository.listCapturesByStatuses(['starting', 'capturing', 'stopping'])
    if (active.length > 0 || this.activeCaptureId) {
      throw new AppError(409, 'CAPTURE_ACTIVE', 'Ya hay una captura activa en este equipo.')
    }
    const captureId = `cap_${randomUUID()}`
    const now = Date.now()
    this.repository.createCapture(captureId, now)
    this.activeCaptureId = captureId
    try {
      await this.nativeCapture.start(
        this.config.failedAudioDirectory,
        (event) => this.onHelperEvent(captureId, event),
        (session, exitCode) => this.onHelperExit(captureId, session, exitCode),
      )
    } catch {
      this.activeCaptureId = null
      this.repository.updateCapture(captureId, {
        status: 'failed', failedAt: Date.now(), updatedAt: Date.now(), failureCode: 'CAPTURE_UNAVAILABLE',
      })
    }
    const capture = this.requireCapture(captureId)
    return captureStateSchema.parse(this.captureDto(capture))
  }

  async stopCapture(captureId: string) {
    const capture = this.requireCapture(captureId)
    if (capture.status !== 'starting' && capture.status !== 'capturing') {
      throw new AppError(409, 'CAPTURE_NOT_READY', 'La captura no se puede detener en su estado actual.')
    }
    this.repository.updateCapture(captureId, { status: 'stopping', updatedAt: Date.now() })
    if (this.activeCaptureId !== captureId) {
      await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true)
    } else {
      try { await this.nativeCapture.stop() } catch { await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true) }
    }
    const afterStop = this.requireCapture(captureId)
    if (afterStop.status === 'stopping') await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true)
    return this.captureDto(this.requireCapture(captureId))
  }

  async shutdown() {
    const captureId = this.activeCaptureId
    if (!captureId) return
    const capture = this.repository.findCapture(captureId)
    if (!capture || (capture.status !== 'starting' && capture.status !== 'capturing')) return
    this.repository.updateCapture(captureId, { status: 'stopping', updatedAt: Date.now() })
    try { await this.nativeCapture.stop() } catch { await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true) }
    const afterStop = this.repository.findCapture(captureId)
    if (afterStop?.status === 'stopping') await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true)
  }

  async getCapture(captureId: string) {
    let capture = this.requireCapture(captureId)
    if (capture.status === 'summarizing') {
      const staged = this.repository.getStaging(captureId)
      const present = capture.audioFilename ? await fileExists(this.audioPath(capture.audioFilename)) : false
      if (staged && !present) {
        try {
          this.repository.finishStaged(capture, Date.now())
          capture = this.requireCapture(captureId)
        } catch {
          // Keep staging private; a later poll or process restart can retry the transaction.
          capture = this.requireCapture(captureId)
        }
      } else if (!staged && !this.processingCaptureIds.has(captureId)) {
        await this.markProcessingFailure(captureId, present ? 'PROCESSING_FAILED' : 'AUDIO_MISSING')
        capture = this.requireCapture(captureId)
      }
    }
    return this.captureDto(capture)
  }

  async listFailedCaptures(limit: number, cursorValue?: string) {
    const cursor = decodeCursor(cursorValue)
    const visible: CaptureRow[] = []
    let scanCursor: Cursor | null = cursor
    let exhausted = false
    const scanSize = 100

    while (visible.length <= limit && !exhausted) {
      const batch = this.repository.listFailedCaptures(scanSize, scanCursor)
      if (batch.length === 0) {
        exhausted = true
        break
      }
      for (const capture of batch) {
        const failedAt = capture.failedAt ?? capture.updatedAt
        scanCursor = { timestamp: failedAt, id: capture.id }
        if (capture.audioFilename && await fileExists(this.audioPath(capture.audioFilename))) visible.push(capture)
        else if (capture.audioFilename) this.repository.updateCapture(capture.id, { audioFilename: null, failureCode: 'AUDIO_MISSING' })
        if (visible.length > limit) break
      }
      if (batch.length < scanSize) exhausted = true
    }

    const items = visible.slice(0, limit).map((capture) => ({
      captureId: capture.id,
      status: 'failed' as const,
      startedAt: isoTime(capture.startedAt),
      failedAt: isoTime(capture.failedAt ?? capture.updatedAt),
      failureCode: capture.failureCode ?? 'PROCESSING_FAILED',
    }))
    const last = visible[limit - 1]
    const nextCursor = (!exhausted || visible.length > limit) && last
      ? encodeCursor({ timestamp: last.failedAt ?? last.updatedAt, id: last.id })
      : null
    return failedCapturesSchema.parse({ items, nextCursor })
  }

  async deleteFailedCapture(captureId: string) {
    const capture = this.requireCapture(captureId)
    if (capture.status !== 'failed') throw new AppError(409, 'CONFLICT', 'Solo se pueden eliminar capturas fallidas.')
    if (capture.audioFilename) {
      try { await rm(this.audioPath(capture.audioFilename)) } catch (error) {
        if (!isMissingFile(error)) throw new AppError(500, 'AUDIO_DELETE_FAILED', 'No se pudo eliminar el audio local.')
      }
    }
    this.repository.deleteCapture(captureId)
  }

  async startProcessing(input: { captureId: string; outputLanguage: OutputLanguage; title?: string }) {
    const capture = this.requireCapture(input.captureId)
    const requestedTitle = normalizedTitle(input.title)
    const sameRequest = capture.outputLanguage === input.outputLanguage && capture.requestedTitle === requestedTitle

    if (capture.status === 'completed') {
      if (!sameRequest) throw new AppError(409, 'CONFLICT', 'La captura ya se procesó con otros parámetros.')
      const meeting = this.repository.findMeetingByCapture(capture.id)
      if (!meeting) throw new AppError(500, 'INTERNAL_ERROR', 'No se encontró el resultado local de la captura.')
      return { status: 200 as const, body: await this.meetingDto(meeting) }
    }

    if (capture.status === 'transcribing' || capture.status === 'summarizing') {
      if (!sameRequest) throw new AppError(409, 'CONFLICT', 'La captura ya se está procesando con otros parámetros.')
      return { status: 202 as const, body: acceptedProcessingSchema.parse({ captureId: capture.id, status: capture.status }) }
    }

    if (capture.status === 'starting' || capture.status === 'capturing' || capture.status === 'stopping') {
      throw new AppError(409, 'CAPTURE_NOT_READY', 'La captura todavía no está lista para procesar.')
    }
    if (capture.status !== 'ready' && capture.status !== 'failed') {
      throw new AppError(409, 'CAPTURE_NOT_READY', 'La captura no está lista para procesar.')
    }
    if (!this.openAi.configured) throw new AppError(503, 'OPENAI_NOT_CONFIGURED', 'La API local no tiene configurada la clave de OpenAI.')
    if (!capture.audioFilename || !(await fileExists(this.audioPath(capture.audioFilename)))) {
      this.repository.updateCapture(capture.id, { status: 'failed', audioFilename: null, failedAt: Date.now(), failureCode: 'AUDIO_MISSING' })
      throw new AppError(409, 'AUDIO_MISSING', 'No se encontró el audio local para procesar.')
    }

    const now = Date.now()
    const claimed = this.repository.compareAndSetCapture(capture.id, ['ready', 'failed'], {
      status: 'transcribing', outputLanguage: input.outputLanguage, requestedTitle,
      failureCode: null, failedAt: null, updatedAt: now,
    })
    if (!claimed) {
      const latest = this.requireCapture(capture.id)
      if (latest.status === 'transcribing' || latest.status === 'summarizing') {
        return { status: 202 as const, body: acceptedProcessingSchema.parse({ captureId: latest.id, status: latest.status }) }
      }
      throw new AppError(409, 'CONFLICT', 'La captura cambió mientras se iniciaba el procesamiento.')
    }
    this.processingCaptureIds.add(capture.id)
    void (async () => {
      try { await this.processCapture(capture.id) } catch {
        await this.markProcessingFailure(capture.id, 'PROCESSING_FAILED').catch(() => undefined)
      } finally {
        this.processingCaptureIds.delete(capture.id)
      }
    })()
    return { status: 202 as const, body: acceptedProcessingSchema.parse({ captureId: capture.id, status: 'transcribing' }) }
  }

  async listMeetings(limit: number, cursorValue?: string) {
    const rows = this.repository.listMeetings(limit + 1, decodeCursor(cursorValue))
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    const nextCursor = rows.length > limit && last
      ? encodeCursor({ timestamp: last.createdAt, id: last.id })
      : null
    return meetingListSchema.parse({
      items: page.map((meeting) => this.meetingListDto(meeting)),
      nextCursor,
    })
  }

  async getMeeting(meetingId: string) {
    const meeting = this.repository.findMeeting(meetingId)
    if (!meeting) throw new AppError(404, 'NOT_FOUND', 'La reunión no existe.')
    return this.meetingDto(meeting)
  }

  async updateMeeting(meetingId: string, patch: { title?: string | null; summary?: string }) {
    if (!this.repository.findMeeting(meetingId)) throw new AppError(404, 'NOT_FOUND', 'La reunión no existe.')
    const update: { title?: string | null; summary?: string } = {}
    if ('title' in patch) update.title = patch.title?.trim() || null
    if (patch.summary !== undefined) update.summary = patch.summary.trim()
    this.repository.updateMeeting(meetingId, update, Date.now())
    return this.getMeeting(meetingId)
  }

  async addActionItem(meetingId: string, input: Omit<ActionItemResult, 'id' | 'meetingId'>) {
    if (!this.repository.findMeeting(meetingId)) throw new AppError(404, 'NOT_FOUND', 'La reunión no existe.')
    this.repository.addActionItem({ id: `action_${randomUUID()}`, meetingId, ...input })
    return this.getMeeting(meetingId)
  }

  async updateActionItem(meetingId: string, actionItemId: string, patch: Partial<Omit<ActionItemResult, 'id' | 'meetingId'>>) {
    const item = this.repository.findActionItem(actionItemId)
    if (!item || item.meetingId !== meetingId) throw new AppError(404, 'NOT_FOUND', 'El pendiente no existe.')
    this.repository.updateActionItem(actionItemId, patch)
    return this.getMeeting(meetingId)
  }

  async deleteMeeting(meetingId: string) {
    if (!this.repository.findMeeting(meetingId)) throw new AppError(404, 'NOT_FOUND', 'La reunión no existe.')
    this.repository.deleteMeeting(meetingId)
  }

  private async processCapture(captureId: string) {
    let capture = this.repository.findCapture(captureId)
    if (!capture || !capture.audioFilename || !capture.outputLanguage) return
    const outputLanguage = capture.outputLanguage
    const audioPath = this.audioPath(capture.audioFilename)
    try {
      await inspectWav(audioPath)
      const transcript = await this.openAi.transcribe(audioPath)
      this.repository.updateCapture(captureId, { status: 'summarizing', updatedAt: Date.now() })
      capture = this.requireCapture(captureId)
      const notes = await this.openAi.generateNotes(transcript, outputLanguage)
      const staged: StagedResult = {
        summary: notes.summary,
        actionItems: notes.actionItems.map((item) => ({
          task: item.task,
          assignee: item.assignee,
          dueDateText: item.dueDateText,
        })),
      }
      this.repository.putStaging(captureId, staged, Date.now())

      try { await rm(audioPath) } catch (error) {
        if (!isMissingFile(error)) {
          if (await fileExists(audioPath)) {
            this.repository.discardStaging(captureId)
            await this.markProcessingFailure(captureId, 'AUDIO_CLEANUP_FAILED')
            return
          }
        }
      }

      try {
        this.repository.finishStaged(this.requireCapture(captureId), Date.now())
      } catch {
        // Keep the private staging row so the next status poll or restart can finish atomically.
      }
    } catch (error) {
      const staged = this.repository.getStaging(captureId)
      if (staged) {
        const current = this.repository.findCapture(captureId)
        const audioPresent = current?.audioFilename ? await fileExists(this.audioPath(current.audioFilename)) : false
        if (!audioPresent && current) {
          try { this.repository.finishStaged(current, Date.now()); return } catch { return }
        }
        this.repository.discardStaging(captureId)
      }
      const current = this.repository.findCapture(captureId)
      if (current?.audioFilename && !(await fileExists(this.audioPath(current.audioFilename)))) {
        await this.markProcessingFailure(captureId, 'AUDIO_MISSING')
        return
      }
      const failureCode = error instanceof AppError ? error.code : 'PROCESSING_FAILED'
      await this.markProcessingFailure(captureId, failureCode)
    }
  }

  private async markProcessingFailure(captureId: string, code: string) {
    const current = this.repository.findCapture(captureId)
    if (!current || current.status === 'completed') return
    const now = Date.now()
    this.repository.updateCapture(captureId, { status: 'failed', failedAt: now, updatedAt: now, failureCode: code })
  }

  private async onHelperEvent(captureId: string, event: import('./captures/events').HelperEvent) {
    const capture = this.repository.findCapture(captureId)
    if (!capture || capture.status === 'failed') return
    const now = Date.now()
    if (event.type === 'ready') {
      this.repository.updateCapture(captureId, {
        status: capture.status === 'stopping' ? 'stopping' : 'capturing',
        audioFilename: event.fileName,
        updatedAt: now,
      })
    } else if (event.type === 'error') {
      await this.markCaptureFailure(captureId, 'CAPTURE_FAILED', true)
    }
  }

  private async onHelperExit(captureId: string, session: import('./captures/native-capture').NativeCaptureSession, exitCode: number) {
    const capture = this.repository.findCapture(captureId)
    if (!capture || capture.status === 'failed') {
      if (session.fileName) await this.removeCaptureAudio(session.fileName)
      if (this.activeCaptureId === captureId) this.activeCaptureId = null
      return
    }
    const fileName = session.confirmedFileName
    if (exitCode === 0 && !session.protocolError && fileName && fileName === session.fileName && capture.status === 'stopping') {
      try {
        await inspectWav(this.audioPath(fileName))
        this.repository.updateCapture(captureId, { status: 'ready', audioFilename: fileName, updatedAt: Date.now() })
      } catch {
        await this.markCaptureFailure(captureId, 'AUDIO_INVALID', true)
      }
    } else {
      await this.markCaptureFailure(captureId, 'CAPTURE_INTERRUPTED', true)
    }
    if (this.activeCaptureId === captureId) this.activeCaptureId = null
  }

  private async markCaptureFailure(captureId: string, code: string, removeAudio: boolean) {
    const capture = this.repository.findCapture(captureId)
    if (!capture || capture.status === 'completed') return
    if (removeAudio) await this.removeCaptureAudio(capture.audioFilename)
    const now = Date.now()
    this.repository.updateCapture(captureId, {
      status: 'failed', audioFilename: null, failedAt: now, updatedAt: now, failureCode: code,
    })
  }

  private async removeCaptureAudio(fileName: string | null) {
    if (!fileName || !failedAudioFilename.test(fileName)) return
    try { await rm(this.audioPath(fileName), { force: true }) } catch { /* Best-effort cleanup; startup removes orphan WAVs. */ }
  }

  private async removeOrphanAudio() {
    let names: string[]
    try { names = await readdir(this.config.failedAudioDirectory) } catch { return }
    const captures = this.repository.listAllCaptures()
    const retained = new Set(captures.map((capture) => capture.audioFilename).filter((name): name is string => Boolean(name)))
    for (const name of names) {
      if (!failedAudioFilename.test(name) || retained.has(name)) continue
      try { await rm(this.audioPath(name), { force: true }) } catch { /* Retry on the next process start. */ }
    }
  }

  private audioPath(fileName: string) {
    if (!failedAudioFilename.test(fileName)) throw new AppError(500, 'INTERNAL_ERROR', 'La referencia local de audio no es válida.')
    return join(this.config.failedAudioDirectory, fileName)
  }

  private requireCapture(captureId: string) {
    const capture = this.repository.findCapture(captureId)
    if (!capture) throw new AppError(404, 'NOT_FOUND', 'La captura no existe.')
    return capture
  }

  private captureDto(capture: CaptureRow) {
    const meeting = capture.status === 'completed' ? this.repository.findMeetingByCapture(capture.id) : null
    const response: Record<string, unknown> = {
      captureId: capture.id,
      status: capture.status,
      startedAt: isoTime(capture.startedAt),
      updatedAt: isoTime(capture.updatedAt),
    }
    if (capture.status === 'starting' || capture.status === 'capturing' || capture.status === 'stopping') {
      if (capture.status === 'capturing' && this.activeCaptureId === capture.id) response.level = this.nativeCapture.level() ?? 0
    }
    if (capture.status === 'ready') response.completedAt = isoTime(capture.updatedAt)
    if (capture.status === 'completed' && meeting) response.meetingId = meeting.id
    if (capture.status === 'failed') {
      response.failedAt = isoTime(capture.failedAt ?? capture.updatedAt)
      response.failureCode = capture.failureCode ?? 'PROCESSING_FAILED'
    }
    return captureStateSchema.parse(response)
  }

  private meetingListDto(meeting: MeetingResult) {
    return meetingListItemSchema.parse({
      id: meeting.id,
      title: meeting.title,
      outputLanguage: meeting.outputLanguage,
      summary: meeting.summary,
      createdAt: isoTime(meeting.createdAt),
      updatedAt: isoTime(meeting.updatedAt),
    })
  }

  private async meetingDto(meeting: MeetingResult) {
    return meetingDetailsSchema.parse({
      ...this.meetingListDto(meeting),
      actionItems: this.repository.listActionItems(meeting.id),
    })
  }
}
