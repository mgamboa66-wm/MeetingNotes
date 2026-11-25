import { and, desc, eq, isNotNull, lt, or } from 'drizzle-orm'
import { z } from 'zod'
import type { AppDatabase } from './connect'
import { actionItems, captures, meetings, processingStaging } from './schema'
import type { CaptureRow, CaptureStatus, OutputLanguage } from './schema'

export interface MeetingResult {
  id: string
  captureId: string
  title: string | null
  outputLanguage: OutputLanguage
  summary: string
  createdAt: number
  updatedAt: number
}

export interface ActionItemResult {
  id: string
  meetingId: string
  task: string
  assignee: string | null
  dueDateText: string | null
}

export interface StagedResult {
  summary: string
  actionItems: Array<{ task: string; assignee: string | null; dueDateText: string | null }>
}

export interface Cursor {
  timestamp: number
  id: string
}

const stagedResultSchema = z.object({
  summary: z.string().min(1).max(20_000),
  actionItems: z.array(z.object({
    task: z.string().min(1).max(500),
    assignee: z.string().min(1).max(120).nullable(),
    dueDateText: z.string().min(1).max(80).nullable(),
  }).strict()).max(200),
}).strict()

function rowToCapture(row: typeof captures.$inferSelect | undefined): CaptureRow | null {
  return row ? row as CaptureRow : null
}

export class Repository {
  constructor(private readonly db: AppDatabase) {}

  findCapture(id: string): CaptureRow | null {
    return rowToCapture(this.db.select().from(captures).where(eq(captures.id, id)).get())
  }

  listCapturesByStatuses(statuses: CaptureStatus[]): CaptureRow[] {
    if (statuses.length === 0) return []
    return this.db.select().from(captures).where(or(...statuses.map((status) => eq(captures.status, status)))).all() as CaptureRow[]
  }

  listAllCaptures(): CaptureRow[] {
    return this.db.select().from(captures).all() as CaptureRow[]
  }

  createCapture(id: string, startedAt: number) {
    this.db.insert(captures).values({ id, status: 'starting', startedAt, updatedAt: startedAt }).run()
  }

  updateCapture(id: string, patch: Partial<typeof captures.$inferInsert>) {
    this.db.update(captures).set(patch).where(eq(captures.id, id)).run()
  }

  compareAndSetCapture(id: string, allowed: CaptureStatus[], patch: Partial<typeof captures.$inferInsert>): boolean {
    if (allowed.length === 0) return false
    const changed = this.db.update(captures)
      .set(patch)
      .where(and(eq(captures.id, id), or(...allowed.map((status) => eq(captures.status, status))!)))
      .returning({ id: captures.id })
      .all()
    return changed.length === 1
  }

  listFailedCaptures(limit: number, cursor: Cursor | null) {
    const conditions = [eq(captures.status, 'failed'), isNotNull(captures.audioFilename)]
    if (cursor) {
      conditions.push(or(
        lt(captures.failedAt, cursor.timestamp),
        and(eq(captures.failedAt, cursor.timestamp), lt(captures.id, cursor.id)),
      )!)
    }
    return this.db.select().from(captures)
      .where(and(...conditions))
      .orderBy(desc(captures.failedAt), desc(captures.id))
      .limit(limit)
      .all() as CaptureRow[]
  }

  findMeeting(id: string): MeetingResult | null {
    const row = this.db.select().from(meetings).where(eq(meetings.id, id)).get()
    return row ? row as MeetingResult : null
  }

  findMeetingByCapture(captureId: string): MeetingResult | null {
    const row = this.db.select().from(meetings).where(eq(meetings.captureId, captureId)).get()
    return row ? row as MeetingResult : null
  }

  listMeetings(limit: number, cursor: Cursor | null) {
    const condition = cursor
      ? or(lt(meetings.createdAt, cursor.timestamp), and(eq(meetings.createdAt, cursor.timestamp), lt(meetings.id, cursor.id)))
      : undefined
    return this.db.select().from(meetings)
      .where(condition)
      .orderBy(desc(meetings.createdAt), desc(meetings.id))
      .limit(limit)
      .all() as MeetingResult[]
  }

  listActionItems(meetingId: string): ActionItemResult[] {
    return this.db.select().from(actionItems).where(eq(actionItems.meetingId, meetingId)).all() as ActionItemResult[]
  }

  addActionItem(item: ActionItemResult) {
    this.db.insert(actionItems).values(item).run()
  }

  findActionItem(id: string) {
    return this.db.select().from(actionItems).where(eq(actionItems.id, id)).get() as ActionItemResult | undefined
  }

  updateMeeting(id: string, patch: Partial<Pick<MeetingResult, 'title' | 'summary'>>, updatedAt: number) {
    this.db.update(meetings).set({ ...patch, updatedAt }).where(eq(meetings.id, id)).run()
  }

  updateActionItem(id: string, patch: Partial<Pick<ActionItemResult, 'task' | 'assignee' | 'dueDateText'>>) {
    this.db.update(actionItems).set(patch).where(eq(actionItems.id, id)).run()
  }

  deleteMeeting(id: string) {
    this.db.transaction((tx) => {
      const meeting = tx.select({ captureId: meetings.captureId }).from(meetings).where(eq(meetings.id, id)).get()
      if (meeting) tx.delete(captures).where(eq(captures.id, meeting.captureId)).run()
    })
  }

  deleteCapture(id: string) {
    this.db.delete(captures).where(eq(captures.id, id)).run()
  }

  getStaging(captureId: string): StagedResult | null {
    const row = this.db.select().from(processingStaging).where(eq(processingStaging.captureId, captureId)).get()
    if (!row) return null
    try {
      const parsed: unknown = JSON.parse(row.actionItemsJson)
      const result = stagedResultSchema.safeParse({ summary: row.summary, actionItems: parsed })
      return result.success ? result.data : null
    } catch {
      return null
    }
  }

  putStaging(captureId: string, result: StagedResult, stagedAt: number) {
    this.db.transaction((tx) => {
      tx.insert(processingStaging).values({
        captureId,
        summary: result.summary,
        actionItemsJson: JSON.stringify(result.actionItems),
        stagedAt,
      }).onConflictDoUpdate({
        target: processingStaging.captureId,
        set: { summary: result.summary, actionItemsJson: JSON.stringify(result.actionItems), stagedAt },
      }).run()
      tx.update(captures).set({ status: 'summarizing', updatedAt: stagedAt }).where(eq(captures.id, captureId)).run()
    })
  }

  finishStaged(capture: CaptureRow, now: number): string {
    const staged = this.getStaging(capture.id)
    if (!staged) throw new Error('STAGING_INVALID')
    if (!capture.outputLanguage) throw new Error('STAGING_LANGUAGE_MISSING')
    const outputLanguage = capture.outputLanguage
    const meetingId = `meeting_${crypto.randomUUID()}`
    this.db.transaction((tx) => {
      const meetingRow: typeof meetings.$inferInsert = {
        id: meetingId,
        captureId: capture.id,
        title: capture.requestedTitle,
        outputLanguage,
        summary: staged.summary,
        createdAt: now,
        updatedAt: now,
      }
      tx.insert(meetings).values(meetingRow).run()
      for (const item of staged.actionItems) {
        tx.insert(actionItems).values({
          id: `action_${crypto.randomUUID()}`,
          meetingId,
          task: item.task,
          assignee: item.assignee,
          dueDateText: item.dueDateText,
        }).run()
      }
      tx.update(captures).set({ status: 'completed', audioFilename: null, completedAt: now, updatedAt: now, failureCode: null, failedAt: null }).where(eq(captures.id, capture.id)).run()
      tx.delete(processingStaging).where(eq(processingStaging.captureId, capture.id)).run()
    })
    return meetingId
  }

  discardStaging(captureId: string) {
    this.db.delete(processingStaging).where(eq(processingStaging.captureId, captureId)).run()
  }
}
