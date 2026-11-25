import { z } from 'zod'

const filenameSchema = z.string().regex(/^MeetingNotes-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-[a-f0-9]{8}\.wav$/)

export const helperEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready'), fileName: filenameSchema }).strict(),
  z.object({ type: z.literal('meter'), rms: z.number().min(0).max(1) }).strict(),
  z.object({ type: z.literal('error'), message: z.string().max(500) }).strict(),
  z.object({ type: z.literal('stopped'), fileName: filenameSchema, bytes: z.number().int().positive() }).strict(),
])

export type HelperEvent = z.infer<typeof helperEventSchema>
