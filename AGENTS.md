# MeetingNotes — instrucciones para Codex

## Propósito

MeetingNotes será una herramienta para tomar notas de conversaciones de reuniones usando como fuente el audio de la computadora. El método de captura, las plataformas compatibles, la transcripción y el almacenamiento aún no están definidos. No implementes captura, transmisión ni persistencia de audio hasta que esas decisiones tengan aprobación humana.

## Mapa del repositorio

- `apps/web/`: espacio reservado para la interfaz del producto; aún no contiene una aplicación integrada.
- `apps/api/`: espacio reservado para la API del producto; aún no contiene una API integrada.
- `apps/prototypes/`: dos POCs con código y configuración independientes, además de una carpeta que solo conserva caché de Vite. Ninguno forma una arquitectura de producto aprobada.
- `packages/contracts/`: espacio reservado para contratos compartidos; aún no contiene código.
- `tests/`: espacio reservado para pruebas; todavía no hay suite configurada.
- `docs/API_CONTRACT.md` y `docs/FRONTEND_API_GUIDE.md`: propuestas de contrato y trabajo de frontend, sujetas a revisión.
- `docs/MEETINGNOTES_V1_CONTEXT_TEMP.md`: contexto temporal; no es un plan aprobado.
- `docs/decisions/` y `docs/plans/`: estructura reservada para decisiones y planes revisados; no hay decisiones ni planes aprobados aquí.
- `README.md`: resumen del proyecto, estructura y decisiones pendientes.


## Stack técnico aprobado

- **Frontend:** React + TypeScript estricto. Vike (`vike-react`) se recomienda para rutas basadas en archivos y los modos SSR, SPA o SSG; Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL. La base concreta sigue pendiente: SQLite (con `better-sqlite3` o integración de Bun) o PostgreSQL. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (`ai`) + Zod para validar datos y esquemas de herramientas. No se ha elegido el proveedor o modelo de IA/transcripción.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con `fetch` nativo. Usa Zustand solo si React Context no resulta suficiente.
- **Autenticación en la nube:** si la aplicación se despliega en la nube, usa el gateway SSO compartido. El despliegue y los detalles de integración están pendientes.

El stack aprobado no determina versiones de dependencias, estructura de workspaces, modo de renderizado, proveedor de IA ni todas las decisiones de arquitectura. No agregues tecnologías o dependencias fuera de lo indicado ni elijas opciones pendientes por inferencia; solicita aprobación cuando corresponda.

## Desarrollo y validación

Los POCs de `apps/prototypes/` tienen manifiestos y lockfiles independientes. No hay un manifiesto raíz, workspace de producto ni configuración de pruebas consolidada. No inventes comandos de desarrollo o validación para la raíz. Consulta el README del POC correspondiente para sus instrucciones; no ejecutes comandos de `npm`, `bun` u otras herramientas sin que la persona usuaria lo solicite.

## Convenciones

- Aplica los principios SOLID al diseñar el código, según corresponda al contexto del proyecto.
- El equipo usa Codex; sigue este archivo y cualquier instrucción vigente más específica que aparezca en el repositorio.
- Mantén las instrucciones factuales; marca lo no decidido como pendiente en vez de inferirlo.
- Mantén separados los POCs hasta que un plan aprobado defina si alguno se convierte en base del producto.

## Plan aprobado

No hay un plan de implementación aprobado dentro del repositorio. La persona usuaria aprobó explícitamente el stack descrito arriba y la organización de carpetas solicitada; esas aprobaciones no definen por sí solas el alcance del producto ni las demás decisiones de arquitectura. Antes de decidir esos aspectos, pide la ubicación del plan aprobado o su aprobación explícita.

## Decisiones que requieren revisión humana

- Alcance del producto y plataformas compatibles.
- Fuente y método de captura del audio, permisos del sistema operativo y controles de grabación.
- Motor, modelo o servicio de transcripción, uso de servicios externos y costos.
- Elección de base de datos entre SQLite y PostgreSQL; MongoDB requiere aprobación adicional.
- Privacidad de reuniones, consentimiento, seguridad, almacenamiento, procesamiento, retención y eliminación de audio y notas.
- Modo de renderizado, versiones de dependencias, integración de los POCs, workspaces de producto, arquitectura no especificada, CI, publicación, despliegue e integración del gateway SSO.
- Creación del remoto de GitHub, visibilidad del repositorio y publicación de contenido.

No envíes audio o notas a servicios externos, ni habilites grabación o retención, sin aprobación explícita del alcance y del tratamiento de datos. No crees el remoto ni publiques cambios: el usuario indicó que creará el repositorio en su cuenta personal.
