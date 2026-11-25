# MeetingNotes

MeetingNotes convierte conversaciones de reuniones en un resumen y una lista de pendientes usando el audio de la computadora.

## Estado del proyecto

El alcance de producto de v1 está aprobado y se describe en [docs/decisions/MEETINGNOTES_V1_SCOPE.md](docs/decisions/MEETINGNOTES_V1_SCOPE.md). Las decisiones técnicas adoptadas están en [TECH_DESITIONS_MVP.md](docs/decisions/TECH_DESITIONS_MVP.md). El backend aún no está integrado; [MN-08](docs/plans/MN-08-arquitectura-backend-integraciones.md) es el plan aprobado para implementarlo y no significa que el código ya exista.

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
        API_CONTRACT.md
        FRONTEND_API_GUIDE.md
      decisions/
        MEETINGNOTES_V1_SCOPE.md
        TECH_DESITIONS_MVP.md
      plans/               # planes con estados individuales, incluido MN-08 aprobado

Los directorios reservados no significan que la aplicación, el workspace o la arquitectura estén implementados o aprobados.

POCs con código:

- **apps/prototypes/poc-record-audio/**: experimento de captura local para macOS y Windows.
- **apps/prototypes/poc-openai-macos/**: experimento macOS de transcripción y generación de notas con OpenAI.

Cada POC conserva su propio manifiesto, lockfile e instrucciones en su README. No hay un manifiesto ni lockfile consolidado en la raíz.

## Stack técnico aprobado

- **Frontend:** React + TypeScript estricto en una SPA Vite para el MVP.
- **Backend:** API Bun + Hono como proceso separado en `127.0.0.1:4174`; helpers nativos para macOS y Windows.
- **Datos:** Drizzle + SQL con SQLite local; el MVP adopta `bun:sqlite`, `drizzle-orm/bun-sqlite`, rutas de datos por sistema operativo y migraciones versionadas.
- **IA y validación:** Vercel AI SDK + Zod; OpenAI es el proveedor aprobado y los modelos/configuración adoptados se documentan en `TECH_DESITIONS_MVP.md`.
- **API backend:** proceso en `127.0.0.1:4174`, procesamiento asíncrono consultable por `captureId`, unicidad de reuniones por captura y orígenes SPA locales fijados en la sección 9 del registro técnico.
- **Interfaz y estado remoto:** Tailwind CSS y TanStack Query con fetch nativo. Zustand se usará solo si React Context no resulta suficiente.
- **Autenticación:** v1 no tendrá cuentas ni inicio de sesión. Si se aprueba un despliegue futuro en la nube, se usará el gateway SSO compartido.

El detalle técnico adoptado se registra en [TECH_DESITIONS_MVP.md](docs/decisions/TECH_DESITIONS_MVP.md). Los POCs siguen siendo experimentos separados; MN-08 autoriza la implementación del backend descrito, no la conversión íntegra de un POC en producto.

## Decisiones técnicas pendientes

- Tipos/nullabilidad finales de SQLite, orden/cursor de historial, catálogo de errores y casos de fallo del sistema de archivos.
- Verificación real de captura Windows en un equipo Windows.
- Revisión pendiente de Ronald sobre objeciones o retiro del consentimiento; no atribuirle aprobación.
- CI y publicación, fuera del plan backend vigente.

El alcance completo de v1 y las decisiones de negocio no deben volver a marcarse como pendientes. Cualquier ampliación o cambio de ese alcance requiere aprobación.

## Desarrollo y validación

No hay comandos de desarrollo o validación en la raíz ni una suite consolidada de pruebas. Consulta el README del POC correspondiente para conocer sus instrucciones; esas instrucciones aplican únicamente a dicho experimento y no son comandos de producto.
