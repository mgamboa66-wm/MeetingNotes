import { Hono, type Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import { ALLOWED_ORIGINS } from '../config'
import { AppError, errors } from './errors'
import type { MeetingNotesService } from '../service'

const captureIdSchema = z.string().regex(/^cap_[0-9a-f-]{36}$/i)
const meetingIdSchema = z.string().regex(/^meeting_[0-9a-f-]{36}$/i)
const actionItemIdSchema = z.string().regex(/^action_[0-9a-f-]{36}$/i)
const processSchema = z.object({
  captureId: captureIdSchema,
  outputLanguage: z.enum(['es', 'en']),
  title: z.string().trim().min(1).max(200).optional(),
}).strict()
const meetingPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).nullable().optional(),
  summary: z.string().trim().min(1).max(20_000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0)
const actionItemCreateSchema = z.object({
  task: z.string().trim().min(1).max(500),
  assignee: z.string().trim().max(120).nullable().optional(),
  dueDateText: z.string().trim().max(80).nullable().optional(),
}).strict()
const actionItemPatchSchema = z.object({
  task: z.string().trim().min(1).max(500).optional(),
  assignee: z.string().trim().max(120).nullable().optional(),
  dueDateText: z.string().trim().max(80).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0)

async function readJson<T>(context: Context, schema: z.ZodType<T>): Promise<T> {
  const contentType = context.req.header('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') throw errors.invalidRequest()
  let raw: unknown
  try { raw = await context.req.json() } catch { throw errors.invalidRequest() }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw errors.invalidRequest()
  return parsed.data
}

function parseLimit(value: string | undefined) {
  if (value === undefined) return 20
  if (!/^[0-9]+$/.test(value)) throw errors.invalidRequest()
  const limit = Number(value)
  if (limit < 1 || limit > 100) throw errors.invalidRequest()
  return limit
}

export function createApp(service: MeetingNotesService) {
  const app = new Hono()

  app.use('*', async (context, next) => {
    const origin = context.req.header('origin')
    if (!origin || !ALLOWED_ORIGINS.has(origin)) throw errors.origin()
    context.header('Access-Control-Allow-Origin', origin)
    context.header('Vary', 'Origin')
    if (context.req.method === 'OPTIONS') {
      context.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
      context.header('Access-Control-Allow-Headers', 'Content-Type')
      return context.body(null, 204)
    }
    await next()
  })

  app.get('/api/health', (context) => context.json({ ok: true, service: 'meetingnotes-api' }))

  app.post('/api/captures', async (context) => context.json(await service.startCapture(), 201))
  app.get('/api/captures/:captureId', async (context) => {
    const captureId = captureIdSchema.safeParse(context.req.param('captureId'))
    if (!captureId.success) throw errors.notFound('La captura')
    return context.json(await service.getCapture(captureId.data))
  })
  app.post('/api/captures/:captureId/stop', async (context) => {
    const captureId = captureIdSchema.safeParse(context.req.param('captureId'))
    if (!captureId.success) throw errors.notFound('La captura')
    return context.json(await service.stopCapture(captureId.data))
  })
  app.get('/api/captures', async (context) => {
    const status = context.req.query('status')
    if (status !== 'failed') throw errors.invalidRequest()
    return context.json(await service.listFailedCaptures(parseLimit(context.req.query('limit')), context.req.query('cursor')))
  })
  app.delete('/api/captures/:captureId', async (context) => {
    const captureId = captureIdSchema.safeParse(context.req.param('captureId'))
    if (!captureId.success) throw errors.notFound('La captura')
    await service.deleteFailedCapture(captureId.data)
    return context.body(null, 204)
  })

  app.post('/api/meetings', async (context) => {
    const input = await readJson(context, processSchema)
    const result = await service.startProcessing(input)
    return context.json(result.body, result.status)
  })
  app.get('/api/meetings', async (context) => context.json(await service.listMeetings(
    parseLimit(context.req.query('limit')),
    context.req.query('cursor'),
  )))
  app.get('/api/meetings/:meetingId', async (context) => {
    const meetingId = meetingIdSchema.safeParse(context.req.param('meetingId'))
    if (!meetingId.success) throw errors.notFound('La reunión')
    return context.json(await service.getMeeting(meetingId.data))
  })
  app.patch('/api/meetings/:meetingId', async (context) => {
    const meetingId = meetingIdSchema.safeParse(context.req.param('meetingId'))
    if (!meetingId.success) throw errors.notFound('La reunión')
    const patch = await readJson(context, meetingPatchSchema)
    return context.json(await service.updateMeeting(meetingId.data, patch))
  })
  app.post('/api/meetings/:meetingId/action-items', async (context) => {
    const meetingId = meetingIdSchema.safeParse(context.req.param('meetingId'))
    if (!meetingId.success) throw errors.notFound('La reunión')
    const input = await readJson(context, actionItemCreateSchema)
    return context.json(await service.addActionItem(meetingId.data, {
      task: input.task,
      assignee: input.assignee ?? null,
      dueDateText: input.dueDateText ?? null,
    }), 201)
  })
  app.patch('/api/meetings/:meetingId/action-items/:actionItemId', async (context) => {
    const meetingId = meetingIdSchema.safeParse(context.req.param('meetingId'))
    const actionItemId = actionItemIdSchema.safeParse(context.req.param('actionItemId'))
    if (!meetingId.success || !actionItemId.success) throw errors.notFound('El pendiente')
    return context.json(await service.updateActionItem(meetingId.data, actionItemId.data, await readJson(context, actionItemPatchSchema)))
  })
  app.delete('/api/meetings/:meetingId', async (context) => {
    const meetingId = meetingIdSchema.safeParse(context.req.param('meetingId'))
    if (!meetingId.success) throw errors.notFound('La reunión')
    await service.deleteMeeting(meetingId.data)
    return context.body(null, 204)
  })

  app.notFound((context) => context.json({ error: { code: 'NOT_FOUND', message: 'El recurso no existe.' } }, 404))
  app.onError((error, context) => {
    const failure = error instanceof AppError ? error : errors.internal()
    return context.json({ error: { code: failure.code, message: failure.message } }, failure.status as ContentfulStatusCode)
  })
  return app
}
