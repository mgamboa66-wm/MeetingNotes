import { chmod, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema'
import type { AppConfig } from '../config'

export async function connectDatabase(config: AppConfig) {
  await mkdir(config.dataDirectory, { recursive: true, mode: 0o700 })
  await mkdir(config.failedAudioDirectory, { recursive: true, mode: 0o700 })
  if (process.platform !== 'win32') {
    await chmod(config.dataDirectory, 0o700).catch(() => undefined)
    await chmod(config.failedAudioDirectory, 0o700).catch(() => undefined)
  }
  const sqlite = new Database(config.databasePath)
  sqlite.exec('PRAGMA foreign_keys = ON')
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA synchronous = FULL')
  if (process.platform !== 'win32') {
    await chmod(config.databasePath, 0o600).catch(() => undefined)
  }

  const db = drizzle({ client: sqlite, schema })
  await migrate(db, { migrationsFolder: join(import.meta.dir, '../../drizzle') })
  return { sqlite, db }
}

export type AppDatabase = Awaited<ReturnType<typeof connectDatabase>>['db']
