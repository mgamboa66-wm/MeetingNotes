import { z } from 'zod'

export const generatedNotesSchema = z.object({
  summary: z.string().trim().min(1).max(20_000),
  actionItems: z.array(z.object({
    task: z.string().trim().min(1).max(500),
    assignee: z.string().trim().min(1).max(120).nullable(),
    dueDateText: z.string().trim().min(1).max(80).nullable(),
  }).strict()).max(200),
}).strict()

export type GeneratedNotes = z.infer<typeof generatedNotesSchema>
