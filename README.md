# MeetingNotes

MeetingNotes busca ayudar a crear notas de conversaciones de reuniones a partir del audio de la computadora.

## Estado

El proyecto está en etapa inicial. El stack técnico base fue aprobado siguiendo el estándar de WM AI Builders, pero el alcance funcional y varias decisiones de implementación siguen pendientes. Todavía no hay código fuente, manifiestos de dependencias ni configuración de pruebas.

## Stack técnico aprobado

- **Frontend:** React con TypeScript estricto. Vike (`vike-react`) se recomienda para rutas basadas en archivos y permite SSR, SPA o SSG según las necesidades. Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL. La base de datos está pendiente de elección entre SQLite —con `better-sqlite3` o la integración de Bun— y PostgreSQL. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (`ai`) y Zod para validar datos y esquemas de herramientas. El SDK no define por sí mismo el proveedor o modelo de transcripción.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con `fetch` nativo. Zustand se usará solo si React Context no resulta suficiente.
- **Autenticación en la nube:** las aplicaciones que se desplieguen en la nube usarán el gateway SSO compartido. El despliegue en la nube y los detalles de integración aún no están definidos.

La aprobación del stack no define versiones de dependencias, estructura de carpetas ni todas las decisiones de arquitectura.

## Decisiones pendientes

- Sistemas operativos y plataformas compatibles.
- Método de captura del audio, permisos y controles de grabación.
- Motor, modelo o proveedor de transcripción, procesamiento externo y costos.
- Elección entre SQLite y PostgreSQL; MongoDB requiere aprobación adicional.
- Consentimiento, privacidad, seguridad, almacenamiento, retención y eliminación del audio y las notas.
- Modo de renderizado de la aplicación (SSR, SPA o SSG), estructura del repositorio, CI y despliegue.

No implementes captura, transmisión, transcripción ni persistencia de audio, ni envíes audio o notas a servicios externos, hasta que se aprueben explícitamente el alcance y el tratamiento de esos datos.

## Desarrollo y validación

Aún no hay manifiestos ni comandos de desarrollo o validación configurados. No inventes ni ejecutes comandos. Cuando existan los manifiestos y la configuración, verifica y documenta aquí los comandos reales.

## Plan

El plan de implementación se añadirá cuando esté aprobado.
