# MeetingNotes — instrucciones para Codex

## Propósito y alcance aprobado

MeetingNotes es una aplicación local para convertir el audio de reuniones en resúmenes y pendientes. El alcance de producto de v1 está aprobado y documentado en **docs/MEETINGNOTES_V1_SCOPE.md**. Incluye macOS y Windows, captura local del audio del sistema y del micrófono en una sola pista, procesamiento con OpenAI, idioma español o inglés por reunión, historial local en SQLite y el tratamiento de audio y transcripciones definido en ese documento.

La aprobación del alcance autoriza únicamente ese comportamiento de producto. No amplíes los destinos de datos, la retención, las plataformas ni el alcance funcional por inferencia. Los detalles técnicos que el alcance no define y cualquier tratamiento distinto requieren aprobación humana.

## Mapa del repositorio

- **apps/web/**: espacio reservado para la interfaz del producto; todavía no contiene una aplicación integrada.
- **apps/api/**: espacio reservado para la API del producto; todavía no contiene una API integrada.
- **apps/prototypes/**: dos POCs con código y configuración independientes. Ninguno forma una arquitectura de producto aprobada.
- **packages/contracts/**: espacio reservado; todavía no contiene contratos implementados.
- **tests/**: espacio reservado; todavía no hay una suite de pruebas del producto.
- **docs/MEETINGNOTES_V1_SCOPE.md**: alcance de producto aprobado para v1.
- **docs/api/API_CONTRACT.md**: propuesta técnica de contrato API alineada con el alcance.
- **docs/FRONTEND_API_GUIDE.md**: guía de trabajo basada en la propuesta API.
- **docs/plans/**: planes y propuestas con estados diferentes; comprueba el estado de cada documento antes de tratarlo como aprobado.
- **README.md**: resumen del proyecto, su estructura y las decisiones técnicas aún abiertas.

## Stack técnico aprobado

- **Frontend:** React + TypeScript estricto. Vike (vike-react) se recomienda para rutas basadas en archivos y los modos SSR, SPA o SSG; Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL con SQLite local por computadora, según el alcance v1. La integración concreta de SQLite (better-sqlite3 o integración de Bun) sigue pendiente. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (ai) + Zod para validar datos y esquemas de herramientas. OpenAI está aprobado como proveedor para el flujo de v1; los modelos y los detalles concretos de integración siguen pendientes.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con fetch nativo. Usa Zustand solo si React Context no resulta suficiente.
- **Autenticación:** v1 no tendrá cuentas ni inicio de sesión; el acceso depende de la cuenta del sistema operativo. Si se aprueba un despliegue futuro en la nube, usa el gateway SSO compartido.

El stack y el alcance no determinan versiones de dependencias, estructura de workspaces, modo de renderizado, arquitectura completa, integración de escritorio ni todos los detalles de implementación. No agregues tecnologías o dependencias fuera de las aprobadas ni resuelvas opciones técnicas pendientes por inferencia.

## Desarrollo y validación

Los POCs de **apps/prototypes/** tienen manifiestos y lockfiles independientes. No hay un manifiesto raíz, workspace de producto ni configuración de pruebas consolidada. No inventes comandos de desarrollo o validación para la raíz. Consulta el README del POC correspondiente para sus instrucciones y no ejecutes comandos de npm, bun u otras herramientas sin que la persona usuaria lo solicite.

## Convenciones

- Aplica los principios SOLID al diseñar el código, según corresponda al contexto del proyecto.
- El equipo usa Codex; sigue este archivo y cualquier instrucción vigente más específica que aparezca en el repositorio.
- Mantén las instrucciones factuales y separa el alcance aprobado de las decisiones técnicas aún abiertas.
- Mantén separados los POCs hasta que un plan aprobado defina si alguno se convierte en base del producto.

## Plan de implementación

El alcance de producto de v1 está aprobado, pero no equivale a un plan técnico aprobado para integrar e implementar la aplicación completa. Antes de elegir arquitectura no especificada, integrar los POCs o iniciar cambios de código para el producto, localiza o solicita aprobación del plan de implementación correspondiente. Los planes dentro de **docs/plans/** deben evaluarse según el estado declarado en cada archivo; la aprobación de un plan para una tarea acotada no aprueba la implementación integral de v1.

## Decisiones técnicas que siguen abiertas

- Permisos y detalles de captura nativa, recuperación ante interrupciones y comportamiento específico de macOS y Windows.
- Modelos concretos de OpenAI y su configuración.
- Integración de SQLite, ruta y protección local de los archivos de audio fallidos.
- Semántica de reintentos e idempotencia, manejo de timeouts y recuperación ante cierre inesperado.
- Host y puerto local, e integración para ejecutar la API junto a la aplicación de escritorio.
- Versiones de dependencias, modo de renderizado, workspaces de producto, CI y publicación.
- El alcance de v1 excluye nube, SSO y sincronización. El despliegue y la integración con el gateway SSO solo se revisarán si se aprueba un alcance futuro que los incluya.

No envíes audio o notas a servicios distintos de OpenAI ni amplíes el tratamiento aprobado. La captura, el envío a OpenAI y la retención local de audio fallido se permiten solo según el flujo y las reglas de **docs/MEETINGNOTES_V1_SCOPE.md**. No agregues retención de transcripciones ni una política de vencimiento automático. No crees el remoto de GitHub ni publiques cambios: la persona usuaria indicó que creará el repositorio en su cuenta personal.
