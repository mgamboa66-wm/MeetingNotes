# MeetingNotes — instrucciones para Codex

## Propósito

MeetingNotes será una herramienta para tomar notas de conversaciones de reuniones usando como fuente el audio de la computadora. El método de captura, las plataformas compatibles, la transcripción y el almacenamiento aún no están definidos. No implementes captura, transmisión ni persistencia de audio hasta que esas decisiones tengan aprobación humana.

## Mapa del repositorio

- `AGENTS.md`: contexto, límites y decisiones que requieren revisión humana.
- `README.md`: propósito, stack aprobado y decisiones pendientes.
- No hay todavía código fuente, aplicaciones, paquetes, manifiestos de dependencias ni configuración de pruebas.

La persona usuaria aprobó el stack técnico base descrito en la sección siguiente, de acuerdo con el estándar de WM AI Builders. La imagen que lo describe no aprueba una estructura de directorios: no asumas que deban existir `apps/`, `packages/` o `docs/`.

## Stack técnico aprobado

- **Frontend:** React + TypeScript estricto. Vike (`vike-react`) se recomienda para rutas basadas en archivos y los modos SSR, SPA o SSG; Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL. La base concreta sigue pendiente: SQLite (con `better-sqlite3` o integración de Bun) o PostgreSQL. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (`ai`) + Zod para validar datos y esquemas de herramientas. No se ha elegido el proveedor o modelo de IA/transcripción.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con `fetch` nativo. Usa Zustand solo si React Context no resulta suficiente.
- **Autenticación en la nube:** si la aplicación se despliega en la nube, usa el gateway SSO compartido. El despliegue y los detalles de integración están pendientes.

El stack aprobado no determina versiones de dependencias, estructura del repositorio, modo de renderizado, proveedor de IA ni todas las decisiones de arquitectura. No agregues tecnologías o dependencias fuera de lo indicado ni elijas opciones pendientes por inferencia; solicita aprobación cuando corresponda.

## Desarrollo y validación

El stack base está aprobado, pero aún no hay código, manifiestos de dependencias ni configuración de pruebas. No inventes ni ejecutes comandos de `npm`, `bun` u otras herramientas. Cuando existan manifiestos y configuración, verifica los comandos reales y documéntalos aquí.

## Convenciones

- El equipo usa Codex; sigue este archivo y cualquier instrucción vigente más específica que aparezca en el repositorio.
- Mantén las instrucciones factuales; marca lo no decidido como pendiente en vez de inferirlo.
- No agregues estructura de workspaces ni convenciones de código no definidas por el stack aprobado sin autorización.

## Plan aprobado

No hay un plan de implementación aprobado dentro del repositorio. La persona usuaria aprobó explícitamente el stack descrito arriba; esa aprobación no define por sí sola el alcance del producto ni las demás decisiones de arquitectura. Antes de decidir esos aspectos, pide la ubicación del plan aprobado o su aprobación explícita.

## Decisiones que requieren revisión humana

- Alcance del producto y plataformas compatibles.
- Fuente y método de captura del audio, permisos del sistema operativo y controles de grabación.
- Motor, modelo o servicio de transcripción, uso de servicios externos y costos.
- Elección de base de datos entre SQLite y PostgreSQL; MongoDB requiere aprobación adicional.
- Privacidad de reuniones, consentimiento, seguridad, almacenamiento, procesamiento, retención y eliminación de audio y notas.
- Modo de renderizado, versiones de dependencias, arquitectura no especificada, estructura del repositorio, CI, publicación, despliegue e integración del gateway SSO.
- Creación del remoto de GitHub, visibilidad del repositorio y publicación de contenido.

No envíes audio o notas a servicios externos, ni habilites grabación o retención, sin aprobación explícita del alcance y del tratamiento de datos. No crees el remoto ni publiques cambios: el usuario indicó que creará el repositorio en su cuenta personal.
