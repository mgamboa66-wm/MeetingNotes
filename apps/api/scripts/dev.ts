import { join } from 'node:path'
import { prepareWindowsCapture, runInherited } from './platform'

const apiDirectory = join(import.meta.dir, '..')

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

const watch = process.argv.includes('--watch')
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
    if (api.exitCode === null) api.kill(signal)
  })
}

process.exitCode = await api.exited
