# MeetingNotes

MeetingNotes convierte conversaciones de reuniones en un resumen y una lista de pendientes usando el audio de la computadora.

## Estado del proyecto

El alcance de producto de v1 está aprobado y se describe en [docs/MEETINGNOTES_V1_SCOPE.md](docs/MEETINGNOTES_V1_SCOPE.md). El producto será una aplicación local para macOS y Windows, con historial local en SQLite y procesamiento con OpenAI. El alcance no equivale a un plan técnico de implementación ni significa que la aplicación integrada ya exista.

El repositorio contiene dos POCs independientes. Todavía no contiene una aplicación de producto integrada ni un manifiesto raíz de dependencias o workspace. El contrato API y la guía para frontend son propuestas de trabajo alineadas al alcance aprobado.

## Alcance aprobado de v1

- Capturar localmente el audio del sistema y el micrófono y combinarlos en una sola pista.
- Mostrar un aviso de consentimiento visible y persistente; el aviso no verifica por sí mismo el consentimiento de participantes.
- Enviar el audio a OpenAI para transcribirlo y procesar la transcripción con OpenAI para generar el resumen y los pendientes. La persona usuaria elige español o inglés por reunión.
- Guardar localmente el título, idioma, resumen y pendientes. No guardar la transcripción en el historial.
- Si el procesamiento termina correctamente, borrar las copias locales del audio y la transcripción. Si falla, descartar la transcripción y conservar el audio sin vencimiento automático hasta que se reintente o se elimine manualmente.
- Permitir consultar y editar título, resumen y pendientes, y eliminar una reunión junto con todos sus pendientes.
- No ofrecer cuentas, login, nube ni sincronización entre computadoras.

El documento de alcance aprobado contiene las reglas de negocio completas, compatibilidad, costos y límites de v1.

## Estructura

    apps/
      api/                 # reservado para la API del producto, aún no integrada
      web/                 # reservado para la interfaz del producto, aún no integrada
      prototypes/          # dos POCs independientes con configuración propia
    packages/
      contracts/           # reservado para contratos compartidos
    tests/                 # reservado; sin suite del producto
    docs/
      api/
        API_CONTRACT.md    # propuesta técnica de contrato API
      FRONTEND_API_GUIDE.md
      MEETINGNOTES_V1_SCOPE.md
      plans/               # planes con estados individuales

Los directorios reservados no significan que la aplicación, el workspace o la arquitectura estén implementados o aprobados.

POCs con código:

- **apps/prototypes/poc-record-audio/**: experimento de captura local para macOS y Windows.
- **apps/prototypes/poc-openai-macos/**: experimento macOS de transcripción y generación de notas con OpenAI.

Cada POC conserva su propio manifiesto, lockfile e instrucciones en su README. No hay un manifiesto ni lockfile consolidado en la raíz.

## Stack técnico aprobado

- **Frontend:** React con TypeScript estricto. Vike (vike-react) se recomienda para rutas basadas en archivos y permite SSR, SPA o SSG según las necesidades. Vite es su motor integrado y normalmente no se configura por separado.
- **Backend:** Bun + Hono.
- **Datos:** Drizzle + SQL con SQLite local por computadora. La integración concreta de SQLite (better-sqlite3 o integración de Bun) sigue pendiente. MongoDB requiere aprobación adicional.
- **IA y validación:** Vercel AI SDK (ai) y Zod para validar datos y esquemas de herramientas. OpenAI es el proveedor aprobado para el flujo v1; los modelos y detalles concretos de integración siguen pendientes.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con fetch nativo. Zustand se usará solo si React Context no resulta suficiente.
- **Autenticación:** v1 no tendrá cuentas ni inicio de sesión. Si se aprueba un despliegue futuro en la nube, se usará el gateway SSO compartido.

La aprobación del stack y el alcance no determina versiones de dependencias, modo de renderizado, integración de los POCs, estructura de workspaces, arquitectura completa ni detalles de implementación.

## Decisiones técnicas pendientes

- Permisos y detalles de captura nativa, y recuperación ante interrupciones en cada plataforma.
- Modelos y configuración de OpenAI.
- Integración de SQLite, ruta y protección local de los archivos de audio fallidos.
- Reintentos, idempotencia, timeouts y recuperación ante cierre inesperado.
- Host y puerto local e integración de la API con la aplicación de escritorio.
- Detalles de la lista de capturas fallidas, paginación y eliminación individual de pendientes.
- Versiones de dependencias, modo de renderizado (SSR, SPA o SSG), CI y publicación.

El alcance completo de v1 y las decisiones de negocio no deben volver a marcarse como pendientes. Cualquier ampliación o cambio de ese alcance requiere aprobación.

## Desarrollo y validación

No hay comandos de desarrollo o validación en la raíz ni una suite consolidada de pruebas. Consulta el README del POC correspondiente para conocer sus instrucciones; esas instrucciones aplican únicamente a dicho experimento y no son comandos de producto.
