import { join } from 'node:path'
import { prepareWindowsCapture, runInherited } from './platform'
import { startTestUi } from './test-ui'

const apiDirectory = join(import.meta.dir, '..')
const watch = process.argv.includes('--watch')

if (process.platform === 'darwin') {
  process.stdout.write('Compilando el helper de captura para macOS…\n')
  const buildCode = await runInherited('/bin/zsh', ['native/macos/build-helper.sh'], apiDirectory)
  if (buildCode !== 0) {
    process.stderr.write('No se compiló el helper macOS; la API arrancará, pero no podrá capturar audio.\n')
  }
} else if (process.platform === 'win32') {
  const setupCode = await prepareWindowsCapture(apiDirectory)
  if (setupCode !== 0) {
    process.stderr.write('La API arrancará sin captura Windows disponible.\n')
  }
} else {
  process.stderr.write('MeetingNotes API solo admite macOS y Windows.\n')
  process.exit(1)
}

let stopTestUi = () => {}
if (watch) {
  try {
    const testUi = startTestUi()
    stopTestUi = () => testUi.stop(true)
    process.stdout.write('Panel de prueba disponible en http://127.0.0.1:5173\n')
  } catch {
    process.stderr.write('No se pudo iniciar el panel de prueba en el puerto 5173; la API continuará.\n')
  }
}

const api = Bun.spawn([
  process.execPath,
  ...(watch ? ['--watch'] : []),
  'src/index.ts',
], {
  cwd: apiDirectory,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    stopTestUi()
    if (api.exitCode === null) api.kill(signal)
  })
}

process.exitCode = await api.exited
stopTestUi()
