# MN-08 | Implementar el backend local de MeetingNotes v1

**Estado:** Aprobado por Marco el 25 de noviembre de 2026.

**Objetivo:** convertir las decisiones vigentes de producto y tecnología en un plan verificable para implementar el backend local de v1.

**Resultado esperado:** backend integrado Bun + Hono para macOS y Windows, con captura local, procesamiento con OpenAI, persistencia SQLite y API alineada con el alcance aprobado.

**Prioridad solicitada:** completar el trabajo con urgencia; este plan no estima ni garantiza una fecha de entrega.

> Este plan queda aprobado para implementar el backend descrito dentro del alcance vigente. La actualización de MN-08 no implementa ni publica código. La captura, el envío a OpenAI y la retención local de audio siguen estrictamente las reglas del [alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md).

## Objetivo y resultado

Implementar el backend que soporta el flujo aprobado de v1: iniciar y detener la captura local del sistema y el micrófono en una sola pista, procesar una captura completa con OpenAI, guardar localmente la reunión y sus pendientes, y permitir consultar, editar, eliminar o reintentar según corresponda.

El backend será un proceso local separado con Bun + Hono, accesible solo en `127.0.0.1:4174`. Usará SQLite mediante `bun:sqlite` y Drizzle, helpers nativos de captura para macOS y Windows, Zod y las integraciones OpenAI adoptadas en el registro técnico. No se añade shell de escritorio, nube, cuentas ni sincronización.

## Autoridad, fuentes y discrepancias

| Fuente | Estado | Uso en este plan |
|---|---|---|
| [AGENTS.md](../../AGENTS.md) | Instrucción vigente del repo | Límites, stack base, autorización MN-08 y verificaciones que siguen pendientes. |
| [Alcance de producto v1](../decisions/MEETINGNOTES_V1_SCOPE.md) | Aprobado | Autoridad para funciones, plataformas, datos, retención y límites de producto. |
| [Decisiones técnicas del MVP](../decisions/TECH_DESITIONS_MVP.md) | Registra decisiones adoptadas por la persona usuaria el 25 de noviembre de 2026 | Base técnica concreta para integración local, captura, SQLite, OpenAI, estados y recuperación. Indica que no sustituye la aprobación del plan de implementación. |
| [Contrato API](../api/API_CONTRACT.md) | Contrato técnico aplicado al backend MN-08 | Define rutas, payloads, estados, errores y recuperación implementados. |
| [Guía frontend](../api/FRONTEND_API_GUIDE.md) | Guía alineada con el contrato vigente | La SPA todavía debe integrarse. |
| [MN-03](./MN-03-arquitectura-informacion.md) | Aprobado por Marco | Requisitos de consulta, edición, eliminación y lista de capturas fallidas. |
| [MN-04](./MN-04-wireframes.md) | Plan de wireframes aprobado; revisión de wireframes pendiente | Los wireframes no son un contrato técnico. Confirmar que la revisión no cambia el comportamiento de backend. |
| [MN-10](./MN-10-modelo-datos-reuniones-transcripciones-notas.md) | Borrador no aprobado | Evidencia de cuestiones abiertas en esquema, campos, migraciones y límites entre datos transitorios y persistentes. |
| [POC de captura](../../apps/prototypes/poc-record-audio/README.md) y [POC OpenAI](../../apps/prototypes/poc-openai-macos/README.md) | Experimentos separados | Evidencia técnica y de comportamiento; ninguno es una arquitectura de producto aprobada. |

**Discrepancia documental resuelta antes de implementar:** `AGENTS.md` y `README.md` se alinearon con las decisiones adoptadas en `TECH_DESITIONS_MVP.md`. No se cambia el alcance aprobado.

**Estado de privacidad:** `TECH_DESITIONS_MVP.md`, sección 8, registra aprobación de Producto y Privacidad declarada por la persona usuaria, y mantiene pendiente la revisión de Ronald, incluido el tratamiento ante objeción o retiro del consentimiento. No atribuirle aprobación. No usar audio real para verificar el flujo hasta cumplir las aprobaciones y condiciones de privacidad aplicables.

No se encontró una plantilla de planes aprobada. Se conserva este archivo y el formato Markdown existente; eso no establece una plantilla normativa.

## Hechos comprobables

- El alcance exige aplicación local en macOS y Windows, historial SQLite, captura combinada, idioma es/en por reunión, consulta y edición de título/resumen/pendientes, eliminación manual y las reglas de retención de audio y transcripción del scope.
- Las decisiones técnicas adoptan API Bun + Hono en `127.0.0.1:4174`, helper Swift/Core Audio en macOS, helper Python/PyAudioWPatch/WASAPI en Windows, `bun:sqlite` + `drizzle-orm/bun-sqlite`, migraciones SQL versionadas, `gpt-transcribe` por REST con segmentos de 20 MiB y solapamiento breve, y AI SDK + OpenAI para notas estructuradas.
- El procesamiento corre en segundo plano con estado durable. El reintento es manual con el mismo `captureId`; no hay reintentos automáticos ni timeout propio por llamada. Al reiniciar, los estados `transcribing` o `summarizing` sin staging válido pasan a `failed`; con staging y WAV presente se descarta el staging y se conserva el audio; con staging y WAV ausente se finaliza la reunión.
- Marco confirmó para esta implementación HTTP 202 en `POST /api/meetings`, sondeo por `GET /api/captures/{captureId}`, `meetingId` al completar, unicidad local por `captureId`, respuesta idempotente para solicitudes repetidas, staging temporal de notas nunca expuesto ni transcript y los orígenes exactos de SPA `http://127.0.0.1:5173` y `http://localhost:5173`. Estas aclaraciones están registradas en la sección 9 de `TECH_DESITIONS_MVP.md`.
- Los estados adoptados son `starting → capturing → stopping → ready → transcribing → summarizing → completed`, con `failed` ante error. Las capturas fallidas se listan con `limit=20` por defecto, cursor opaco y `failureCode`; los errores usan `{ error: { code, message } }` sanitizado.
- `meetingDate` y el borrado individual de un pendiente están excluidos por las decisiones técnicas. La transcripción no se persiste ni se expone.
- `apps/api/` ya contiene el proceso Bun + Hono, persistencia Drizzle, migración SQL, helpers nativos, rutas y configuración propias. `packages/contracts/` y `tests/` siguen reservados y no tienen contenido de producto.
- Los dos POCs tienen manifiestos y lockfiles propios. El POC de captura persiste y expone WAVs de una manera incompatible con el ciclo de vida del producto; el POC OpenAI es solo macOS, usa estado en memoria y elimina audio ante fallo. Ambos requieren adaptación y no deben copiarse como producto sin aplicar las reglas de v1.
- `MN-03` está aprobado. `MN-04` aprueba preparar wireframes, pero la revisión de Ronald está pendiente. Esto no cambia los requisitos de datos del scope; cualquier cambio de comportamiento surgido de la revisión se debe evaluar antes de alterar el contrato.

## Supuestos de trabajo

| Supuesto | Motivo | Impacto si resulta falso / cómo confirmarlo |
|---|---|---|
| “Backend de v1” incluye los adaptadores de captura de ambas plataformas y todas las operaciones backend necesarias para guardar, editar, borrar y reintentar. | Es el alcance de v1 y las decisiones técnicas adoptadas describen ambos helpers. | Si “listo” significa un incremento menor, se debe recortar y aprobar el alcance del incremento antes de implementarlo. |
| La ubicación del proceso API es `apps/api/`. | El mapa del repositorio reserva ese directorio para la API. | Implementado en ese directorio; no se movieron ni integraron los POCs completos. |
| No se crea workspace ni manifiesto raíz; API y web conservan procesos y manifiestos separados. | Decisión técnica del MVP. | Si la operación local requiere otra distribución, necesita decisión y aprobación adicionales. |

## Verificación que sigue pendiente

Las aclaraciones de API, unicidad, reintentos, staging de resultado y origen local ya fueron confirmadas por Marco y están registradas en `TECH_DESITIONS_MVP.md` §9. No se reabren durante la implementación.

1. **Sistema de archivos y permisos:** verificar en macOS y Windows creación, lectura, retención, borrado y permisos bajo las rutas del sistema operativo. El backend trata los errores y no devuelve rutas.
2. **Recuperación durable:** verificar con datos sintéticos staging, interrupción entre etapas, reintentos y ausencia de duplicados. No usar reuniones reales.
3. **Privacidad operativa:** la revisión de Ronald sobre objeciones o retiro del consentimiento sigue pendiente; no se atribuye como aprobada ni se usan reuniones reales para validar.
4. **Validación en Windows:** identificar un equipo Windows para verificar el helper y el ciclo completo. La captura WASAPI no se puede declarar probada con una revisión solo en macOS.

## Alcance

### Incluido

- API local Hono en Bun en el host y puerto adoptados, con validación de entrada/salida Zod y errores sanitizados.
- Adaptación de la captura nativa aprobada para macOS y Windows. Se requieren ambas fuentes; si una falla, no se acepta audio parcial. Solo una captura confirmada completa se procesa.
- Persistencia local SQLite mediante Drizzle y migraciones SQL versionadas aplicadas antes de aceptar solicitudes.
- Integración de transcripción con `gpt-transcribe` por REST y generación estructurada de resumen/pendientes con AI SDK, Zod, idioma de reunión y configuración acordada.
- Estados durables de captura y procesamiento, reintento manual, recuperación al reiniciar, lista paginada de fallidas y eliminación manual del audio fallido.
- Operaciones de consulta, edición y eliminación de reuniones y pendientes dentro de los límites aprobados.
- Aplicar el ciclo de vida del scope: al éxito conservar reunión y pendientes y borrar audio/transcripción locales; ante fallo de procesamiento descartar transcripción y conservar el audio sin vencimiento automático hasta reintento o eliminación manual.
- Alinear `API_CONTRACT.md` y `FRONTEND_API_GUIDE.md` con las decisiones adoptadas antes de integrar clientes.

### Excluido

- Construir o rediseñar la interfaz web completa, un shell de escritorio, instalador o mecanismo empaquetado de arranque.
- Cuentas de MeetingNotes, inicio de sesión, nube, SSO, sincronización entre computadoras o proveedores distintos de OpenAI.
- Guardar/exponer transcripciones, eliminar automáticamente audio fallido o reuniones, guardar audio de éxito, añadir respaldos automáticos o cifrado propio.
- `meetingDate`, eliminación individual de `ActionItem`, marcar pendientes como completados o categorías adicionales de notas.
- Integrar los POCs como aplicaciones completas o copiar su tratamiento de WAVs, estado en memoria o limpieza de error.
- Publicar, crear remoto de GitHub o desplegar el backend.

## Contratos, datos y límites externos

| Elemento | Base adoptada | Trabajo previo a implementación |
|---|---|---|
| `Meeting` y `ActionItem` | Esquema SQLite, título/idioma/resumen/pendientes; borrado en cascada. | Implementado en `apps/api/drizzle/` y `src/db/schema.ts`; no añade campos excluidos. |
| `Capture` | `captureId` opaco, filename privado, estado durable y unicidad de reunión. | Implementado con transición condicional para reclamar proceso y unicidad SQL por `captureId`. |
| Capturas fallidas | `{ items, nextCursor }`, `limit=20` inicial y catálogo sanitizado. | Implementado; orden por `failedAt` descendente e id descendente. No incluye ruta, audio, transcripción ni error crudo de proveedor. |
| Procesamiento | Segundo plano, idioma es/en, mismo `captureId` en reintento manual, sin timeout ni reintentos automáticos. | Implementado con 202, estado consultable, staging y recuperación; validación de runtime pendiente. |
| OpenAI | Transcripción por endpoint de audio; notas estructuradas con `store: false`; credencial solo en servidor. | Adaptador implementado con Zod y sin logs sensibles; no se hicieron llamadas reales al proveedor. |
| Datos locales | Rutas macOS/Windows y directorio `failed-audio/`. | Rutas, permisos de directorio y tratamiento de fallos implementados; comprobación en cada SO pendiente. |

El contrato ya excluye `meetingDate`, usa los estados adoptados y describe el flujo asíncrono con 202, sondeo por `captureId`, reintento manual, staging y orígenes exactos.

## Componentes afectados

| Componente actual | Estado y evidencia | Cambio previsto |
|---|---|---|
| `apps/api/` | Backend Bun + Hono de MN-08. | Implementación inicial terminada; queda verificar el runtime y los helpers por plataforma. |
| `packages/contracts/` | Solo `.gitkeep`; no hay decisión de workspace o contrato compartido implementado. | Decidir en la etapa de contrato si se usa para tipos compartidos o se mantienen contratos por proceso; no asumir importaciones/estructura por inferencia. |
| `tests/` | Solo `.gitkeep`; no hay suite integrada. | Añadir la validación aprobada que necesite el backend, sin afirmar que existe infraestructura ni agregar dependencias nuevas sin aprobación. |
| POC de captura | Código Bun/Hono y helpers Swift/Python independientes. | Referencia para el protocolo helper/API; adaptación selectiva de captura al flujo durable y privado de v1. |
| POC OpenAI | Código Bun con flujo macOS, transcripción y notas en memoria. | Referencia para formato de audio/OpenAI; adaptación necesaria para persistencia, estados, retención y AI SDK adoptado. |
| `docs/api/API_CONTRACT.md` y `docs/api/FRONTEND_API_GUIDE.md` | Alineados con el procesamiento asíncrono adoptado. | Actualizados junto con la implementación; conectar la SPA cuando se implemente. |
| `AGENTS.md` y `README.md` | Alineados con las decisiones técnicas y el estado del backend. | Actualizados para distinguir implementación y verificación pendiente; no ampliar el scope. |

## Dependencias

- Tecnologías adoptadas: Bun + Hono; Drizzle + SQL con SQLite local por computadora; `bun:sqlite` y `drizzle-orm/bun-sqlite`; Vercel AI SDK + Zod; OpenAI como proveedor.
- Decisiones técnicas registran `gpt-transcribe` para transcripción, `ai` + `@ai-sdk/openai` y `gpt-6.2-sol` para notas. `apps/api/package.json` fija esas dependencias y `apps/api/bun.lock` conserva la resolución.
- No se propone tecnología ni dependencia nueva. Los POCs tienen lockfiles independientes y no autorizan crear un workspace raíz.
- La clave OpenAI se configura solo en el servidor por el mecanismo local documentado en las decisiones; no se copia al navegador ni se incluye en el repositorio.

## Alternativas relevantes

| Tema | Evidencia / alternativa | Estado para este plan |
|---|---|---|
| Procesamiento síncrono o asíncrono | Marco confirmó 202 y procesamiento en segundo plano. | Aplicado en `POST /api/meetings`; estado consultable por `GET /api/captures/{captureId}`. |
| Estado de trabajo | Captura durable frente a recurso Operation separado. | Se usa `captureId`; no se añade recurso Operation. |
| POCs | Mantenerlos aislados frente a adaptar su captura y flujo OpenAI al producto. | El plan permite adaptación selectiva bajo las decisiones adoptadas; no convierte ninguno en arquitectura completa ni cambia sus directorios. |
| Base de datos/proveedor | SQLite local y OpenAI frente a otros destinos. | SQLite y OpenAI están adoptados para v1; no se reabren ni se comparan alternativas fuera del alcance. |

## Secuencia de implementación y estado

1. **Aprobar MN-08 y autorizar la implementación — completado.** Marco aprobó el plan y posteriormente pidió implementarlo dentro del alcance vigente.
2. **Alinear autoridad y documentos — completado.** `AGENTS.md`, `README.md`, alcance, contrato API y guía frontend reflejan las decisiones actuales.
3. **Cerrar el contrato y el esquema — completado en código/documentación.** Se fijaron tipos SQL, unicidad, estados, orden/cursor y códigos estables sin añadir campos excluidos.
4. **Preparar la aplicación API — implementado.** `apps/api/` tiene manifiesto/lockfile, Hono, configuración local, carga de clave de OpenAI y validación de origen.
5. **Crear persistencia durable — implementado; migración no ejecutada en una base de usuario.** Drizzle, migración SQL versionada y recuperación de inicio están en el backend.
6. **Integrar la captura — código implementado; compilación/ejecución nativa pendiente.** El intento de compilar Swift falló porque el toolchain y el SDK de este entorno tienen versiones incompatibles; no se ejecutó el helper. Windows requiere un equipo Windows.
7. **Implementar procesamiento durable — implementado; llamadas reales a OpenAI no realizadas.** Segmentación, generación estructurada, staging, unicidad, limpieza y conservación de audio están conectados.
8. **Completar operaciones API — implementado.** Salud, captura, estado, stop, procesamiento, cola fallida, historial y edición/eliminación están alineados con el contrato.
9. **Validar recuperación y plataformas — pendiente.** Se debe verificar con datos sintéticos; Windows requiere un equipo Windows. No se deben usar reuniones reales.
10. **Entregar para revisión — pendiente de verificación multiplataforma.** No publicar ni desplegar.

## Criterios de aceptación verificables

1. El backend escucha solo en `127.0.0.1:4174`; la protección por origen local acordada evita solicitudes de páginas no autorizadas según el diseño aprobado.
2. Una migración válida se aplica antes de aceptar solicitudes; un fallo de migración impide iniciar la API sin modificar datos de manera silenciosa.
3. El inicio, estado y detención de captura funcionan con ambos helpers; si falta una fuente, el helper falla o el archivo WAV no está completo, no se procesa una captura parcial.
4. El procesamiento usa el idioma de la reunión, valida la salida estructurada y crea como máximo una reunión local por `captureId`, incluso ante reenvíos concurrentes según la semántica acordada.
5. La consulta muestra estados durables hasta `completed` o `failed`; después de reiniciar, un trabajo interrumpido sigue la recuperación adoptada y permite reintento manual con el mismo audio.
6. En éxito se conservan reunión y pendientes y se borran las copias locales de audio y transcripción. En fallo se descarta la transcripción y se conserva el audio sin vencimiento automático hasta reintento o borrado manual.
7. La lista de capturas fallidas es paginada y solo entrega los campos adoptados; respuestas y logs no exponen claves, audio, transcripciones, prompts, rutas ni mensajes internos de OpenAI.
8. Consulta, edición y eliminación de reuniones cumplen el alcance; eliminar una reunión elimina sus pendientes; no existe borrado individual de pendiente ni `meetingDate` en el contrato.
9. El contrato API y la guía frontend describen el mismo flujo asíncrono, estados, respuestas y recuperación.
10. La validación documenta resultados por macOS y Windows. No se declara probado un sistema operativo que no se haya verificado en un equipo de esa plataforma.

## Validación

`bun run check` en `apps/api/` pasó. `bun run native:build:macos` se intentó, pero falló por incompatibilidad entre el toolchain Swift 6.4.0.34.1 y el SDK instalado Swift 6.4.0.31.4; también se bloqueó la caché de módulos fuera del workspace. No se ejecutaron pruebas, la migración en runtime ni llamadas a OpenAI. Windows requiere verificación en una máquina de ese sistema. No se usaron audios reales.

La matriz pendiente debe cubrir entradas inválidas, límites del estado de captura, WAV incompleto, estados durable/reinicio, salida de IA inválida, idempotencia local, caída entre etapas, limpieza/retención, eliminación, cursores y filtrado de errores/logs. Las pruebas futuras con OpenAI no usarán reuniones reales ni enviarán datos fuera del flujo aprobado.

## Riesgos y mitigaciones

- **Contrato contradictorio:** resuelto al alinear contrato y guía con el flujo asíncrono antes de completar handlers.
- **Pérdida o retención incorrecta de audio:** probar rutas de éxito, fallo, reinicio y borrado; no usar limpieza de los POCs como referencia normativa.
- **Duplicados o costos repetidos:** impedir reuniones duplicadas localmente por captura; informar que una caída tras una solicitud aceptada por OpenAI puede requerir otro procesamiento/costo.
- **Exposición desde localhost:** definir orígenes permitidos y validar peticiones; no exponer API en interfaces de red externas.
- **Fugas de datos:** evitar contenido sensible, claves, rutas y transcripciones en logs y respuestas; no persistir transcripciones ni crear vencimientos/backups no aprobados.
- **Migración destructiva:** revisar cambios de esquema antes de aplicarlos; no prometer rollback, backup o recuperación de datos que el producto no tiene definidos.
- **Diferencias de plataforma:** captura Windows requiere verificación real en Windows; revisión en macOS no acredita el comportamiento WASAPI.
- **Suposición de código reutilizable:** los POCs tienen tratamientos incompatibles con v1. Adaptar solo el comportamiento acordado y mantener separados sus manifiestos y lockfiles.

## Reversión

La reversión de este documento es restaurar una versión previa de MN-08. Para la implementación, el plan de migración de datos debe describir compatibilidad y riesgos antes de ejecutarse. No hay política aprobada de backup ni se promete rollback que restaure datos locales. Ante una migración o fallo de archivos, la implementación debe fallar de forma visible y conservar los datos que no estén autorizados a borrarse; el comportamiento exacto de recuperación se debe concretar en los pasos de esquema y sistema de archivos.

## Aprobación y autorización de implementación

Marco aprobó MN-08 el 25 de noviembre de 2026 cuando pidió dejar aprobado únicamente el plan. En una instrucción posterior pidió explícitamente implementar MN-08; esa autorización inicia el trabajo dentro del alcance vigente, sin ampliar v1 ni autorizar publicación o despliegue.

Durante la implementación se fijan y documentan los tipos y la nullabilidad del esquema, el orden y cursor de historial y el catálogo de errores. El staging temporal y la recuperación acordados se implementan sin exponer resultados antes de borrar el WAV. La revisión pendiente de Ronald no se atribuye como aprobada y no se usarán reuniones reales para verificar el flujo. La captura en Windows requiere verificación en un equipo Windows; la revisión desde macOS no acredita ese funcionamiento.
