import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'

type CaptureState = {
  state: 'idle' | 'starting' | 'capturing' | 'stopping' | 'error'
  level: number
  message: string | null
  recordingFile: string | null
  lastRecording: RecordingInfo | null
  updatedAt: number | null
  platform?: string
}

type RecordingInfo = {
  fileName: string
  bytes: number
  modifiedAt: string
}

const queryClient = new QueryClient()

async function getCaptureState(): Promise<CaptureState> {
  const response = await fetch('/api/capture/status')
  if (!response.ok) throw new Error('No se pudo consultar el backend local.')
  return response.json() as Promise<CaptureState>
}

async function getRecordings(): Promise<RecordingInfo[]> {
  const response = await fetch('/api/recordings')
  if (!response.ok) throw new Error('No se pudieron consultar las grabaciones locales.')
  return response.json() as Promise<RecordingInfo[]>
}

async function postAction(action: 'start' | 'stop'): Promise<CaptureState> {
  const response = await fetch(`/api/capture/${action}`, { method: 'POST' })
  const result = (await response.json()) as CaptureState & { error?: string }
  if (!response.ok) throw new Error(result.error ?? 'El backend no pudo completar la acción.')
  return result
}

function playTestTone() {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.value = 440
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.8)
  oscillator.onended = () => void audioContext.close()
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MeterPanel() {
  const queryClient = useQueryClient()
  const captureQuery = useQuery({
    queryKey: ['capture-state'],
    queryFn: getCaptureState,
    refetchInterval: (query) => query.state.data?.state === 'capturing' ? 200 : 1000,
  })
  const recordingsQuery = useQuery({
    queryKey: ['recordings'],
    queryFn: getRecordings,
  })
  const start = useMutation({
    mutationFn: () => postAction('start'),
    onSuccess: (state) => queryClient.setQueryData(['capture-state'], state),
  })
  const stop = useMutation({
    mutationFn: () => postAction('stop'),
    onSuccess: (nextState) => {
      queryClient.setQueryData(['capture-state'], nextState)
      if (nextState.lastRecording) void queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
  })

  const state = captureQuery.data
  const level = Math.min(1, Math.max(0, state?.level ?? 0))
  const percent = Math.round(level * 100)
  const isBusy = start.isPending || stop.isPending || state?.state === 'starting' || state?.state === 'stopping'
  const label = state?.state === 'capturing'
    ? 'Grabando micrófono + sistema'
    : state?.state === 'starting'
      ? 'Iniciando captura…'
      : state?.state === 'stopping'
        ? 'Deteniendo captura…'
        : state?.state === 'error'
          ? 'No se pudo iniciar'
          : 'Captura detenida'
  const actionError = start.error ?? stop.error ?? captureQuery.error

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="MeetingNotes POC inicio">
          <span className="wordmark-mark" aria-hidden="true">M</span>
          <span>MeetingNotes <span className="wordmark-muted">/ POC local</span></span>
        </a>
        <span className="local-badge"><span className="local-dot" /> Solo en este equipo</span>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">PRUEBA TÉCNICA · macOS + WINDOWS</p>
        <h1>Graba el audio de tu equipo</h1>
        <p className="intro">
          La POC combina el micrófono predeterminado y el audio de salida en un WAV local.
          Inicia la grabación solo cuando estés listo y deténla para cerrar el archivo.
        </p>
      </section>

      <section className="capture-card" aria-labelledby="capture-title">
        <div className="card-heading">
          <div>
            <p className="card-kicker">GRABACIÓN LOCAL</p>
            <h2 id="capture-title">Micrófono y salida del sistema</h2>
          </div>
          <span className={`status-pill status-${state?.state ?? 'idle'}`}>
            <span className="status-dot" />{label}
          </span>
        </div>

        <div
          className="meter-wrap"
          role="meter"
          aria-label="Nivel combinado del micrófono y el audio del sistema"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="meter-scale"><span>Silencio</span><span>{percent}%</span><span>Máximo</span></div>
        </div>

        <div className="action-row">
          <button
            className="button button-primary"
            type="button"
            onClick={() => start.mutate()}
            disabled={isBusy || state?.state === 'capturing'}
          >
            <span className="button-icon button-icon-start" aria-hidden="true" />
            Iniciar grabación
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => stop.mutate()}
            disabled={isBusy || state?.state === 'idle'}
          >
            Detener y guardar
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={playTestTone}
            disabled={state?.state !== 'capturing'}
          >
            Reproducir tono de prueba
          </button>
          <span className="device-hint">Micrófono predeterminado · mezcla mono WAV</span>
        </div>

        {actionError && <p className="error-message" role="alert">{actionError.message}</p>}
        {state?.message && <p className={state.state === 'error' ? 'error-message' : 'helper-message'} role="status">{state.message}</p>}
        {state?.recordingFile && <p className="helper-message">Guardando en <code>recordings/{state.recordingFile}</code></p>}
        {state?.lastRecording && (
          <p className="helper-message">
            Último archivo: <a href={`/api/recordings/${encodeURIComponent(state.lastRecording.fileName)}`}>
              {state.lastRecording.fileName}
            </a> ({formatBytes(state.lastRecording.bytes)})
          </p>
        )}
      </section>

      <section className="recordings-card" aria-labelledby="recordings-title">
        <div className="card-heading">
          <div>
            <p className="card-kicker">ARCHIVOS LOCALES</p>
            <h2 id="recordings-title">Grabaciones guardadas</h2>
          </div>
          <span className="device-hint">Carpeta <code>recordings/</code></span>
        </div>
        {recordingsQuery.isPending ? <p className="helper-message">Leyendo la carpeta local…</p> : null}
        {recordingsQuery.error && <p className="error-message">{recordingsQuery.error.message}</p>}
        {!recordingsQuery.isPending && recordingsQuery.data?.length === 0 && (
          <p className="helper-message">Todavía no hay grabaciones.</p>
        )}
        {recordingsQuery.data && recordingsQuery.data.length > 0 && (
          <ul className="recording-list">
            {recordingsQuery.data.map((recording) => (
              <li key={recording.fileName}>
                <a href={`/api/recordings/${encodeURIComponent(recording.fileName)}`}>
                  {recording.fileName}
                </a>
                <span>{formatBytes(recording.bytes)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="notes-grid" aria-label="Alcance de la prueba">
        <article className="note-card">
          <span className="note-number">01</span>
          <h3>Permisos separados</h3>
          <p>{state?.platform === 'win32'
            ? 'En Windows, habilita el acceso al micrófono para aplicaciones de escritorio en Privacidad y seguridad.'
            : state?.platform === 'darwin'
              ? 'En macOS, el sistema puede pedir permisos separados para el micrófono y el audio del sistema.'
              : 'La captura puede requerir permisos de micrófono según el sistema operativo.'}</p>
        </article>
        <article className="note-card">
          <span className="note-number">02</span>
          <h3>Salida predeterminada</h3>
          <p>{state?.platform === 'win32'
            ? 'WASAPI captura la salida predeterminada seleccionada en Windows; enruta allí el audio de prueba.'
            : state?.platform === 'darwin'
              ? 'Core Audio captura la salida del sistema. Habla por el micrófono y reproduce el tono integrado.'
              : 'La captura usa la salida de audio predeterminada del sistema.'}</p>
        </article>
        <article className="note-card note-card-private">
          <span className="note-number">03</span>
          <h3>Solo almacenamiento local</h3>
          <p>El WAV permanece en este equipo dentro de <code>recordings/</code>. El audio no se envía a la API ni a servicios externos.</p>
        </article>
      </section>

      <footer className="page-footer">
        <span>MeetingNotes · prueba local de grabación</span>
        <span>Sin transcripción · sin cloud · borra manualmente los WAV</span>
      </footer>
    </main>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MeterPanel />
    </QueryClientProvider>
  )
}
