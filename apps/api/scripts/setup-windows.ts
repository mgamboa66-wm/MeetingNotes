import { join } from 'node:path'
import { prepareWindowsCapture } from './platform'

if (process.platform !== 'win32') {
  process.stderr.write('Este comando solo prepara el helper de captura para Windows.\n')
  process.exitCode = 1
} else {
  process.exitCode = await prepareWindowsCapture(join(import.meta.dir, '..'))
}
