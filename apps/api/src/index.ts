import { HOST, PORT, loadConfig } from './config'
import { connectDatabase } from './db/connect'
import { Repository } from './db/repository'
import { createApp } from './http/app'
import { MeetingNotesService } from './service'

const config = loadConfig()
const { sqlite, db } = await connectDatabase(config)
const service = new MeetingNotesService(new Repository(db), config)
await service.recoverOnStartup()

const app = createApp(service)
const server = Bun.serve({ hostname: HOST, port: PORT, fetch: app.fetch })
process.stdout.write(`MeetingNotes API disponible en http://${server.hostname}:${server.port}\n`)

let shuttingDown = false
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return
    shuttingDown = true
    void service.shutdown().finally(() => {
      server.stop(true)
      sqlite.close()
      process.exit(0)
    })
  })
}
