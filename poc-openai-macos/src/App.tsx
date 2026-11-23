import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'

type Status = 'idle' | 'starting' | 'capturing' | 'stopping' | 'transcribing' | 'summarizing' | 'completed' | 'error'
type Todo = { tarea: string; responsable: string | null; fecha: string | null }
type Notes = { resumen: string; todos: Todo[] }
type Session = { status: Status; level: number; message: string | null; result: Notes | null; configured: boolean; platform: string }

const queryClient = new QueryClient()

async function getSession(): Promise<Session> {
  const response = await fetch('/api/session')
  const body = (await response.json()) as Session & { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'No se pudo consultar la API local.')
  return body
}

async function postAction(action: 'start' | 'stop' | 'clear'): Promise<Session> {
  const path = action === 'clear' ? '/api/session/clear' : '/api/capture/' + action
  const response = await fetch(path, { method: 'POST' })
  const body = (await response.json()) as Session & { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'La API local no pudo completar la acción.')
  return body
}

const labels: Record<Status, string> = {
  idle: 'Listo',
  starting: 'Iniciando',
  capturing: 'Grabando',
  stopping: 'Deteniendo',
  transcribing: 'Transcribiendo',
  summarizing: 'Generando notas',
  completed: 'Completado',
  error: 'Error',
}

function SessionView() {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    refetchInterval: (value) => {
      const status = value.state.data?.status
      return ['starting', 'capturing', 'stopping', 'transcribing', 'summarizing'].includes(status ?? '') ? 1000 : false
    },
  })
  const start = useMutation({ mutationFn: () => postAction('start'), onSuccess: (value) => client.setQueryData(['session'], value), onError: () => void client.invalidateQueries({ queryKey: ['session'] }) })
  const stop = useMutation({ mutationFn: () => postAction('stop'), onSuccess: (value) => client.setQueryData(['session'], value), onError: () => void client.invalidateQueries({ queryKey: ['session'] }) })
  const clear = useMutation({ mutationFn: () => postAction('clear'), onSuccess: (value) => client.setQueryData(['session'], value) })

  const session = query.data
  const status = session?.status ?? 'idle'
  const busy = ['starting', 'capturing', 'stopping', 'transcribing', 'summarizing'].includes(status)
  const percent = Math.round(Math.max(0, Math.min(1, session?.level ?? 0)) * 100)
  const error = start.error ?? stop.error ?? clear.error ?? query.error
  const notConfigured = !session?.configured
  const unsupported = Boolean(session && session.platform !== 'darwin')

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">M</span><span>MeetingNotes / POC OpenAI</span></div>
        <span className="local-badge"><span className="local-dot" /> Solo macOS</span>
      </header>

      <section className="hero">
        <p className="eyebrow">PRUEBA TÉCNICA · CAPTURA LOCAL + OPENAI API</p>
        <h1>De audio a notas de reunión</h1>
        <p className="intro">Captura el audio del sistema y el micrófono. Al detener la grabación, OpenAI transcribe el audio y genera un resumen con TODOs.</p>
      </section>

      <aside className="privacy-note">El audio se envía a OpenAI después de detener la grabación. La aplicación elimina el audio temporal y la transcripción al finalizar; solo mantiene el resumen y los TODOs en memoria hasta cerrar la API.</aside>

      <section className="card capture-card" aria-labelledby="capture-title">
        <div className="section-heading">
          <div><p className="card-kicker">CAPTURA</p><h2 id="capture-title">Micrófono y audio del sistema</h2></div>
          <span className="status-pill" data-status={status}><span className="status-dot" />{labels[status]}</span>
        </div>

        <div className="meter-wrap" role="meter" aria-label="Nivel combinado del micrófono y el audio del sistema" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="meter-track"><div className="meter-fill" style={{ width: percent + '%' }} /></div>
          <div className="meter-scale"><span>Silencio</span><span>{percent}%</span><span>Máximo</span></div>
        </div>

        {notConfigured && <p className="config-message">Configura OPENAI_API_KEY y OPENAI_TEXT_MODEL en .env y reinicia la API local.</p>}
        {unsupported && <p className="config-message">Este POC funciona solo en macOS.</p>}

        <div className="action-row">
          <button className="button button-primary" type="button" onClick={() => start.mutate()} disabled={busy || notConfigured || unsupported}>Iniciar grabación</button>
          <button className="button button-secondary" type="button" onClick={() => stop.mutate()} disabled={status !== 'capturing' && status !== 'starting'}>Detener y procesar</button>
          <button className="button button-secondary" type="button" onClick={() => clear.mutate()} disabled={busy || (!session?.result && status !== 'error')}>Limpiar resultados</button>
        </div>

        {session?.message && <p className={status === 'error' ? 'error-message' : 'helper-message'} role={status === 'error' ? 'alert' : 'status'}>{session.message}</p>}
        {error && <p className="error-message" role="alert">{error.message}</p>}
      </section>

      {session?.result && (
        <section className="result-card" aria-labelledby="result-title">
          <p className="card-kicker">RESULTADO</p>
          <h2 id="result-title">Resumen</h2>
          <p className="summary-text">{session.result.resumen}</p>
          <div className="section-heading" style={{ marginTop: 26 }}><h2>TODOs</h2><span className="todo-tag">{session.result.todos.length} tareas</span></div>
          {session.result.todos.length === 0
            ? <p className="empty-state">No se identificaron tareas acordadas en esta reunión.</p>
            : <ul className="todo-list">{session.result.todos.map((todo, index) => (
              <li className="todo-item" key={index}>
                <p className="todo-title">{todo.tarea}</p>
                <div className="todo-meta">
                  <span className="todo-tag">Responsable: {todo.responsable ?? 'No especificado'}</span>
                  <span className="todo-tag">Fecha: {todo.fecha ?? 'No especificado'}</span>
                </div>
              </li>
            ))}</ul>}
        </section>
      )}

      <p className="footer-note">La captura se mezcla en una sola pista mono. La aplicación no conserva el audio ni la transcripción localmente y no persiste resultados después de cerrar la API.</p>
    </main>
  )
}

export default function App() {
  return <QueryClientProvider client={queryClient}><SessionView /></QueryClientProvider>
}
