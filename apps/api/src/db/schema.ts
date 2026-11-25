import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const captureStatuses = ['starting', 'capturing', 'stopping', 'ready', 'transcribing', 'summarizing', 'completed', 'failed'] as const
const outputLanguages = ['es', 'en'] as const

export const captures = sqliteTable('captures', {
  id: text('id').primaryKey(),
  status: text('status', { enum: captureStatuses }).notNull(),
  audioFilename: text('audio_filename').unique(),
  startedAt: integer('started_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  completedAt: integer('completed_at'),
  failedAt: integer('failed_at'),
  failureCode: text('failure_code'),
  outputLanguage: text('output_language'),
  requestedTitle: text('requested_title'),
}, (table) => [
  check('captures_status_check', sql`${table.status} IN ('starting', 'capturing', 'stopping', 'ready', 'transcribing', 'summarizing', 'completed', 'failed')`),
  check('captures_language_check', sql`${table.outputLanguage} IS NULL OR ${table.outputLanguage} IN ('es', 'en')`),
  index('captures_status_failed_at_idx').on(table.status, table.failedAt),
])

export const meetings = sqliteTable('meetings', {
  id: text('id').primaryKey(),
  captureId: text('capture_id').notNull().unique().references(() => captures.id, { onDelete: 'cascade' }),
  title: text('title'),
  outputLanguage: text('output_language', { enum: outputLanguages }).notNull(),
  summary: text('summary').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  check('meetings_language_check', sql`${table.outputLanguage} IN ('es', 'en')`),
  index('meetings_created_id_idx').on(table.createdAt, table.id),
])

export const actionItems = sqliteTable('action_items', {
  id: text('id').primaryKey(),
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  task: text('task').notNull(),
  assignee: text('assignee'),
  dueDateText: text('due_date_text'),
}, (table) => [index('action_items_meeting_id_idx').on(table.meetingId)])

export const processingStaging = sqliteTable('processing_staging', {
  captureId: text('capture_id').primaryKey().references(() => captures.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  actionItemsJson: text('action_items_json').notNull(),
  stagedAt: integer('staged_at').notNull(),
})

export type CaptureStatus = (typeof captureStatuses)[number]
export type OutputLanguage = (typeof outputLanguages)[number]

export interface CaptureRow {
  id: string
  status: CaptureStatus
  audioFilename: string | null
  startedAt: number
  updatedAt: number
  completedAt: number | null
  failedAt: number | null
  failureCode: string | null
  outputLanguage: OutputLanguage | null
  requestedTitle: string | null
}
