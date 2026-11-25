import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { errors } from './errors'
import type { Cursor } from '../db/repository'

const cursorSchema = z.object({ timestamp: z.number().int().nonnegative(), id: z.string().min(1).max(100) }).strict()

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeCursor(value: string | undefined): Cursor | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    const result = cursorSchema.safeParse(parsed)
    if (result.success) return result.data
  } catch {
    // The cursor is opaque; malformed values receive the same sanitized validation error.
  }
  throw errors.invalidRequest()
}
