import { existsSync } from 'node:fs'
import { join } from 'node:path'

export async function runInherited(command: string, args: string[], cwd: string, quiet = false): Promise<number> {
  try {
    const child = Bun.spawn([command, ...args], {
      cwd,
      stdin: quiet ? 'ignore' : 'inherit',
      stdout: quiet ? 'ignore' : 'inherit',
      stderr: quiet ? 'ignore' : 'inherit',
    })
    return await child.exited
  } catch {
    return 127
  }
}

export async function prepareWindowsCapture(apiDirectory: string): Promise<number> {
  const nativeDirectory = join(apiDirectory, 'native', 'windows')
  const virtualEnv = join(nativeDirectory, '.venv')
  const python = join(virtualEnv, 'Scripts', 'python.exe')
  const requirements = join(nativeDirectory, 'requirements.txt')

  if (!existsSync(python)) {
    process.stdout.write('Preparando el entorno local de captura para Windows…\n')
    const createEnv = await runInherited('py', ['-3.11', '-m', 'venv', virtualEnv], apiDirectory)
    if (createEnv !== 0) {
      process.stderr.write('Se requiere Python 3.11 de 64 bits y el lanzador py para preparar la captura Windows.\n')
      return createEnv
    }
  }

  const versionCheck = await runInherited(python, [
    '-c',
    "import importlib.metadata as metadata; assert metadata.version('PyAudioWPatch') == '0.2.12.9'",
  ], apiDirectory, true)
  if (versionCheck === 0) return 0

  process.stdout.write('Instalando PyAudioWPatch en el entorno local de MeetingNotes…\n')
  const install = await runInherited(python, [
    '-m', 'pip', 'install', '--disable-pip-version-check', '--only-binary=:all:', '-r', requirements,
  ], apiDirectory)
  if (install !== 0) {
    process.stderr.write('No se pudo preparar PyAudioWPatch. Revisa la conexión y vuelve a ejecutar bun run dev.\n')
  }
  return install
}
