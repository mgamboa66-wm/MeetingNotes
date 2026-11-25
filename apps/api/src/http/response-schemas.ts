import { z } from 'zod'

const isoTimestamp = z.string().datetime()
const actionItemSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  task: z.string().min(1).max(500),
  assignee: z.string().max(120).nullable(),
  dueDateText: z.string().max(80).nullable(),
}).strict()

export const meetingListItemSchema = z.object({
  id: z.string(),
  title: z.string().max(200).nullable(),
  outputLanguage: z.enum(['es', 'en']),
  summary: z.string().min(1).max(20_000),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
}).strict()

export const meetingDetailsSchema = meetingListItemSchema.extend({ actionItems: z.array(actionItemSchema) }).strict()

export const failedCaptureSchema = z.object({
  captureId: z.string(),
  status: z.literal('failed'),
  startedAt: isoTimestamp,
  failedAt: isoTimestamp,
  failureCode: z.enum([
    'CAPTURE_UNAVAILABLE', 'CAPTURE_FAILED', 'CAPTURE_INTERRUPTED', 'AUDIO_INVALID', 'AUDIO_MISSING',
    'OPENAI_UNAVAILABLE', 'OPENAI_REJECTED', 'TRANSCRIPTION_INVALID', 'SUMMARY_INVALID',
    'AUDIO_CLEANUP_FAILED', 'PROCESSING_FAILED',
  ]),
}).strict()

export const captureStateSchema = z.object({
  captureId: z.string(),
  status: z.enum(['starting', 'capturing', 'stopping', 'ready', 'transcribing', 'summarizing', 'completed', 'failed']),
  startedAt: isoTimestamp,
  updatedAt: isoTimestamp,
  level: z.number().min(0).max(1).optional(),
  meetingId: z.string().optional(),
  completedAt: isoTimestamp.optional(),
  failedAt: isoTimestamp.optional(),
  failureCode: failedCaptureSchema.shape.failureCode.optional(),
}).strict().superRefine((value, context) => {
  if (value.status === 'completed' && !value.meetingId) context.addIssue({ code: 'custom', message: 'completed capture requires meetingId' })
  if (value.status === 'failed' && (!value.failedAt || !value.failureCode)) context.addIssue({ code: 'custom', message: 'failed capture requires failure metadata' })
  if (value.status === 'ready' && !value.completedAt) context.addIssue({ code: 'custom', message: 'ready capture requires completedAt' })
})

export const acceptedProcessingSchema = z.object({
  captureId: z.string(),
  status: z.enum(['transcribing', 'summarizing']),
}).strict()

export const meetingListSchema = z.object({
  items: z.array(meetingListItemSchema),
  nextCursor: z.string().nullable(),
}).strict()

export const failedCapturesSchema = z.object({
  items: z.array(failedCaptureSchema),
  nextCursor: z.string().nullable(),
}).strict()
