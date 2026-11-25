import { homedir } from 'node:os'
import { join } from 'node:path'

export const HOST = '127.0.0.1'
export const PORT = 4174
export const ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

export interface AppConfig {
  dataDirectory: string
  failedAudioDirectory: string
  databasePath: string
  openAiApiKey: string
}

export function loadConfig(platform = process.platform, env: Record<string, string | undefined> = Bun.env): AppConfig {
  const home = homedir()
  let dataDirectory: string

  if (platform === 'darwin') {
    dataDirectory = join(home, 'Library', 'Application Support', 'MeetingNotes')
  } else if (platform === 'win32') {
    dataDirectory = join(env.LOCALAPPDATA?.trim() || join(home, 'AppData', 'Local'), 'MeetingNotes')
  } else {
    throw new Error('MeetingNotes API solo está disponible en macOS y Windows.')
  }

  return {
    dataDirectory,
    failedAudioDirectory: join(dataDirectory, 'failed-audio'),
    databasePath: join(dataDirectory, 'meetingnotes.sqlite'),
    openAiApiKey: env.OPENAI_API_KEY?.trim() ?? '',
  }
}
