# MeetingNotes

MeetingNotes busca ayudar a crear notas de conversaciones de reuniones a partir del audio de la computadora.

## Estado

El proyecto está en etapa inicial. El stack técnico base está aprobado; el alcance funcional y varias decisiones de implementación siguen pendientes. El repositorio conserva dos POCs independientes y todavía no tiene una aplicación de producto integrada ni un workspace raíz.

## Estructura

```text
apps/
  api/                 # espacio reservado para la API del producto
  web/                 # espacio reservado para la interfaz del producto
  prototypes/          # POCs independientes con configuración propia
packages/
  contracts/           # espacio reservado para contratos compartidos
tests/                 # espacio reservado para pruebas
docs/
  decisions/           # espacio para decisiones aprobadas
  plans/               # espacio para planes revisados
  API_CONTRACT.md      # propuesta de contrato de API
  FRONTEND_API_GUIDE.md
  MEETINGNOTES_V1_CONTEXT_TEMP.md
```

Los espacios reservados están vacíos; su presencia organiza el repositorio y no significa que la aplicación, los workspaces o las decisiones descritas en propuestas estén implementados o aprobados.

Contenido de `apps/prototypes/`:

- `apps/prototypes/poc-record-audio/`: experimento de captura local para macOS y Windows.
- `apps/prototypes/poc-openai-macos/`: experimento macOS de transcripción y generación de notas con OpenAI.
- `apps/prototypes/poc-macos-audio/`: solo contiene caché de Vite; no tiene código fuente.

Los dos POCs con código conservan su propio manifiesto, lockfile e instrucciones en su `README.md`. No existe un manifiesto ni lockfile consolidado en la raíz.

## Stack técnico aprobado

- **Frontend:** React con TypeScript estricto. Vike (`vike-react`) se recomienda para rutas basadas en archivos y permite SSR, SPA o SSG según las necesidades. Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL. La base de datos está pendiente de elección entre SQLite —con `better-sqlite3` o la integración de Bun— y PostgreSQL. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (`ai`) y Zod para validar datos y esquemas de herramientas. El SDK no define por sí mismo el proveedor o modelo de transcripción.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con `fetch` nativo. Zustand se usará solo si React Context no resulta suficiente.
- **Autenticación en la nube:** las aplicaciones que se desplieguen en la nube usarán el gateway SSO compartido. El despliegue en la nube y los detalles de integración aún no están definidos.

La aprobación del stack y de la estructura de carpetas no determina versiones de dependencias, modo de renderizado, arquitectura integrada ni todas las decisiones de producto.

## Decisiones pendientes

- Sistemas operativos y plataformas compatibles.
- Método de captura del audio, permisos y controles de grabación.
- Motor, modelo o proveedor de transcripción, procesamiento externo y costos.
- Elección entre SQLite y PostgreSQL; MongoDB requiere aprobación adicional.
- Consentimiento, privacidad, seguridad, almacenamiento, retención y eliminación del audio y las notas.
- Modo de renderizado de la aplicación (SSR, SPA o SSG), integración de los POCs, workspaces de producto, CI y despliegue.

No implementes captura, transmisión, transcripción ni persistencia de audio, ni envíes audio o notas a servicios externos, hasta que se aprueben explícitamente el alcance y el tratamiento de esos datos.

## Desarrollo y validación

No hay comandos de desarrollo o validación en la raíz ni una suite consolidada de pruebas. Consulta el README del POC correspondiente para conocer sus instrucciones; esas instrucciones aplican únicamente a dicho experimento y no son comandos de producto.
