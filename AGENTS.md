# MeetingNotes — instrucciones para Codex

## Propósito y alcance aprobado

MeetingNotes es una aplicación local para convertir el audio de reuniones en resúmenes y pendientes. El alcance de producto de v1 está aprobado y documentado en **docs/decisions/MEETINGNOTES_V1_SCOPE.md**. Incluye macOS y Windows, captura local del audio del sistema y del micrófono en una sola pista, procesamiento con OpenAI, idioma español o inglés por reunión, historial local en SQLite y el tratamiento de audio y transcripciones definido en ese documento.

La aprobación del alcance autoriza únicamente ese comportamiento de producto. No amplíes los destinos de datos, la retención, las plataformas ni el alcance funcional por inferencia. Los detalles técnicos que el alcance no define y cualquier tratamiento distinto requieren aprobación humana.

## Mapa del repositorio

- **apps/web/**: espacio reservado para la interfaz del producto; todavía no contiene una aplicación integrada.
- **apps/api/**: implementación del backend MN-08; consulta su README para el estado de dependencias, configuración y validación pendiente.
- **apps/prototypes/**: dos POCs con código y configuración independientes. Ninguno forma una arquitectura de producto aprobada.
- **packages/contracts/**: espacio reservado; todavía no contiene contratos implementados.
- **tests/**: espacio reservado; todavía no hay una suite de pruebas del producto.
- **docs/decisions/MEETINGNOTES_V1_SCOPE.md**: alcance de producto aprobado para v1.
- **docs/decisions/TECH_DESITIONS_MVP.md**: decisiones técnicas adoptadas para el MVP; consultar su estado y las cuestiones abiertas registradas aquí.
- **docs/api/API_CONTRACT.md**: contrato técnico del backend v1; los detalles abiertos deben coincidir con MN-08.
- **docs/api/FRONTEND_API_GUIDE.md**: guía de integración basada en el contrato vigente.
- **docs/plans/**: planes y propuestas con estados diferentes; comprueba el estado de cada documento antes de tratarlo como aprobado.
- **README.md**: resumen del proyecto, su estructura y las decisiones técnicas aún abiertas.

## Stack técnico aprobado

- **Frontend:** React + TypeScript estricto; para el MVP se adoptó una SPA servida por Vite, con API y frontend como procesos separados.
- **Backend:** Bun + Hono; la API local escucha solo en **127.0.0.1:4174**.
- **Datos:** Drizzle + SQL con SQLite local por computadora; para el MVP se adoptaron `bun:sqlite`, `drizzle-orm/bun-sqlite`, rutas de datos por sistema operativo y migraciones SQL versionadas.
- **IA y validación:** Vercel AI SDK (ai) + Zod y OpenAI como único proveedor de este flujo. `TECH_DESITIONS_MVP.md` registra los modelos e integraciones concretos adoptados.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con fetch nativo. Usa Zustand solo si React Context no resulta suficiente.
- **Autenticación:** v1 no tendrá cuentas ni inicio de sesión; el acceso depende de la cuenta del sistema operativo. Si se aprueba un despliegue futuro en la nube, usa el gateway SSO compartido.

Las decisiones técnicas adoptadas se detallan en **docs/decisions/TECH_DESITIONS_MVP.md**. No agregues tecnologías o dependencias fuera de las aprobadas ni resuelvas las opciones que ese registro mantiene abiertas por inferencia.

Para el backend MN-08 también se adoptó: `POST /api/meetings` responde 202 y el estado se consulta por `captureId`; la unicidad local de reunión se basa en `captureId`; los orígenes permitidos son `http://127.0.0.1:5173` y `http://localhost:5173`; el resultado estructurado puede almacenarse temporalmente para recuperación, pero nunca se persiste la transcripción. Consulta la sección 9 de `TECH_DESITIONS_MVP.md`.

## Desarrollo y validación

El backend de **apps/api/** tiene manifiesto y lockfile propios; los POCs de **apps/prototypes/** mantienen los suyos. No hay un manifiesto raíz, workspace de producto ni configuración de pruebas consolidada. No inventes comandos de desarrollo o validación para la raíz. Consulta el README del componente y no ejecutes comandos de npm, bun u otras herramientas sin que la persona usuaria lo solicite.

## Convenciones

- Aplica los principios SOLID al diseñar el código, según corresponda al contexto del proyecto.
- El equipo usa Codex; sigue este archivo y cualquier instrucción vigente más específica que aparezca en el repositorio.
- Nombra las migraciones nuevas con `--name` representativo del cambio (por ejemplo, `initial_meetingnotes_schema`) y mantén el `tag` de `drizzle/meta/_journal.json` sincronizado con el nombre del archivo `.sql`. Para cambios posteriores, crea una migración nueva en vez de editar una ya aplicada.
- Mantén las instrucciones factuales y separa el alcance aprobado de las decisiones técnicas aún abiertas.
- Mantén separados los POCs hasta que un plan aprobado defina si alguno se convierte en base del producto.

## Plan de implementación

El alcance de producto de v1 está aprobado, pero no equivale a un plan técnico aprobado para integrar e implementar la aplicación completa. **MN-08 está aprobado para implementar el backend local de v1** dentro de sus límites y puertas previas. Antes de cambios en otras partes del producto, localiza o solicita aprobación del plan correspondiente. Los planes dentro de **docs/plans/** deben evaluarse según el estado declarado; la aprobación de un plan acotado no aprueba toda la implementación de v1.

## Decisiones técnicas que siguen abiertas

- Manejo de fallos de filesystem fuera del caso de borrado de audio tras generación, y permisos concretos de archivos por sistema operativo.
- Revisión de Ronald sobre el tratamiento ante objeción o retiro del consentimiento, según el registro de MN-05/decisiones técnicas. No atribuir aprobación pendiente.
- Verificación real del helper de captura Windows en un equipo Windows.
- El alcance de v1 excluye nube, SSO y sincronización. El despliegue y la integración con el gateway SSO solo se revisarán si se aprueba un alcance futuro que los incluya.

No envíes audio o notas a servicios distintos de OpenAI ni amplíes el tratamiento aprobado. La captura, el envío a OpenAI y la retención local de audio fallido se permiten solo según el flujo y las reglas de **docs/decisions/MEETINGNOTES_V1_SCOPE.md**. No agregues retención de transcripciones ni una política de vencimiento automático. No crees el remoto de GitHub ni publiques cambios: la persona usuaria indicó que creará el repositorio en su cuenta personal.
