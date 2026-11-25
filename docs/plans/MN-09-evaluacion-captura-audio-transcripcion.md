# MN-09 | Evaluar opciones de captura de audio y transcripción

**Estado:** Borrador para revisión humana; no aprobado. Es una evaluación documental: no implementa cambios, no ejecuta capturas ni sustituye el alcance aprobado o el plan MN-08.

**Estado de aprobaciones y verificación:** El alcance de producto v1 está aprobado y MN-01 registra resuelta la discrepancia de autoridad. MN-05 está aprobado como plan documental por Marco; las aprobaciones de Producto y Privacidad constan en la sección 8 de las decisiones técnicas. La revisión de Ronald sobre el tratamiento ante objeción o retiro del consentimiento sigue pendiente. La verificación del helper de captura en macOS y Windows también sigue pendiente; esto es una limitación de validación técnica, no un bloqueo de autoridad del alcance. ([MN-01](./MN-01-alcance-mvp.md:31), [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:3), [decisiones técnicas](../decisions/TECH_DESITIONS_MVP.md:141), [README de la API](../../apps/api/README.md:27))

## Propósito y resultado

Comparar, con evidencia documental, el flujo aprobado de reunión a notas y alternativas exploratorias, y entregar a Ronald una matriz con exposición de datos, ventajas, límites, costos, incertidumbres y revisiones pendientes. El ticket asigna la preparación a Marco y Ericka; el repositorio no confirma esos roles.

El flujo OpenAI aprobado para v1 y el backend MN-08 existente son la línea base. Esta evaluación no reabre esa decisión ni recomienda habilitar otro proveedor para v1. Cualquier cambio de proveedor, destino de datos o tratamiento requiere una revisión de alcance y autorización separadas.

## Fuentes y autoridad

- [Instrucciones del repositorio](../../AGENTS.md): reconoce el alcance v1 aprobado, limita el tratamiento a ese alcance e identifica decisiones técnicas aún abiertas.
- [Alcance de v1](../decisions/MEETINGNOTES_V1_SCOPE.md): autoridad de producto para plataformas, captura, procesamiento con OpenAI, idioma, historial y tratamiento de audio y transcripciones.
- [MN-01](./MN-01-alcance-mvp.md): registra que la discrepancia inicial de autoridad quedó resuelta.
- [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md): plan documental aprobado por Marco. La revisión de Ronald sobre objeción o retiro del consentimiento permanece pendiente; las aprobaciones de Producto y Privacidad están registradas en [decisiones técnicas, sección 8](../decisions/TECH_DESITIONS_MVP.md:139).
- [MN-08](./MN-08-arquitectura-backend-integraciones.md): plan aprobado para implementar el backend local de v1. Su estado de implementación y verificación se describe en el [README de la API](../../apps/api/README.md).
- Los README de los POCs y el README de Additional Resources describen experimentos y referencias exploratorias; no sustituyen las decisiones aprobadas de MeetingNotes. ([POCs](../../apps/prototypes/README.md:3), [referencia](../additional%20resources/README.md:1))
- MN-05 indica que no encontró una plantilla aprobada. Este formato no se presenta como plantilla normativa. ([MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:18))

## Hechos comprobados

- El alcance v1 aprobado contempla una aplicación local para macOS y Windows, captura del sistema y micrófono en una sola pista, procesamiento con OpenAI, idioma español o inglés por reunión e historial local. Si el procesamiento termina correctamente se eliminan el audio y la transcripción locales; si falla, se descarta la transcripción y se conserva el audio hasta reintento o eliminación manual, sin vencimiento automático. ([alcance v1, secciones 2–5](../decisions/MEETINGNOTES_V1_SCOPE.md:10))
- `apps/api/` contiene el backend MN-08 implementado como proceso local Bun + Hono. Incluye captura mediante helpers nativos, procesamiento asíncrono con OpenAI, API en `127.0.0.1:4174` y persistencia SQLite. `POST /api/meetings` responde 202 y el estado se consulta por `captureId`. ([README de la API](../../apps/api/README.md:3), [contrato API](../api/API_CONTRACT.md:166))
- La implementación usa `gpt-transcribe` para transcripción y `ai` + `@ai-sdk/openai` con `gpt-6.2-sol` para generar las notas. La transcripción permanece en memoria y no se persiste. El resultado estructurado puede quedar temporalmente en SQLite durante la confirmación del borrado del WAV; tras un fallo de procesamiento, el audio se conserva para reintento manual. ([decisiones técnicas, secciones 4 y 9](../decisions/TECH_DESITIONS_MVP.md:52), [README de la API](../../apps/api/README.md:23))
- La implementación de captura requiere validación real por plataforma. El README registra que la compilación del helper macOS no terminó por una incompatibilidad entre el toolchain y el SDK, y que el helper no se ejecutó; la captura Windows aún no se ha verificado en un equipo Windows. ([README de la API](../../apps/api/README.md:27), [MN-08](./MN-08-arquitectura-backend-integraciones.md:138))
- La POC de captura documenta Core Audio taps y permisos separados en macOS; en Windows, PyAudioWPatch/WASAPI y permiso de micrófono. Su sincronización de Windows aún requiere verificación y conserva WAV hasta borrado manual. Es evidencia de una POC, no una validación del backend MN-08. ([README de captura](../../apps/prototypes/poc-record-audio/README.md:5))
- La POC OpenAI es solo para macOS: envía audio para transcripción y la transcripción para generar notas; elimina copias locales al terminar, mientras la retención externa depende del proveedor. ([README OpenAI](../../apps/prototypes/poc-openai-macos/README.md:3), [implementación de transcripción](../../apps/prototypes/poc-openai-macos/src/server/index.ts:228))
- Additional Resources describe faster-whisper local combinado con Claude para notas, autodetección de español e inglés o mezcla y archivos locales. No es una medición validada para MeetingNotes ni una opción aprobada para v1. ([README exploratorio](../additional%20resources/README.md:16), [salidas](../additional%20resources/README.md:80), [modelos](../additional%20resources/README.md:100))
- La interfaz de producto en `apps/web/` y los contratos compartidos en `packages/contracts/` siguen reservados; eso no significa que `apps/api/` esté vacío. No hay una suite de pruebas consolidada del producto. ([AGENTS.md](../../AGENTS.md:11))

## Supuestos y pendientes reales

### Supuestos de trabajo

- MN-09 es una evaluación documental. No genera ni conserva grabaciones, no envía audio o transcripciones a proveedores y no ejecuta POCs.
- La línea base de la comparación es el flujo OpenAI aprobado e implementado según MN-08. Las alternativas de otros proveedores o de procesamiento local se evalúan solo como posibilidades futuras fuera del alcance de v1.
- La matriz puede presentar riesgos, evidencia e incertidumbres sin seleccionar un proveedor ni autorizar cambios de producto.

### Pendientes

- **Revisión de Ronald:** registrar su disposición sobre el tratamiento ante objeción o retiro del consentimiento. No atribuirle una aprobación antes de registrar su disposición. ([decisiones técnicas, sección 8](../decisions/TECH_DESITIONS_MVP.md:157))
- **macOS:** completar la compilación y ejecución del helper con los permisos de captura en un equipo macOS compatible.
- **Windows:** verificar el helper WASAPI en un equipo Windows. No declarar validada la captura Windows desde macOS.
- **Evaluación documental:** acordar fuentes y criterios para comparar calidad, rendimiento, recursos y costos. Marcar como desconocido lo que no tenga evidencia vigente; no enviar audio ni transcripciones para medirlo.

La revisión de Ronald y la validación por plataforma no reabren la aprobación del alcance v1. Hasta completar las verificaciones, la implementación existe, pero la captura nativa no debe describirse como validada en ambas plataformas.

## Alcance

**Incluye:** comparar el flujo aprobado de captura y procesamiento con evidencia documental; describir permisos, combinación de fuentes, cobertura por sistema operativo, idiomas, transferencias, almacenamiento, retención, costos y verificaciones pendientes; distinguir hechos, estimaciones y datos no confirmados.

**Incluye como análisis exploratorio fuera de v1:** transcripción local u otros proveedores, únicamente para documentar exposición y requisitos de una posible revisión futura. No se seleccionarán ni presentarán como opciones aprobadas de MeetingNotes v1.

**Excluye:** implementar captura o transcripción, modificar `apps/api/`, ejecutar POCs, generar o conservar grabaciones, enviar audio o transcripciones a proveedores, integrar dependencias o declarar aprobados otros tratamientos. ([AGENTS.md](../../AGENTS.md:59))

## Alternativas que deberá cubrir la matriz

| Opción | Estado frente a v1 y exposición | Ventajas, límites y verificaciones |
|---|---|---|
| Flujo OpenAI aprobado e implementado en el backend MN-08 | Línea base de v1. Audio y transcripción salen del equipo hacia OpenAI; la eliminación local no determina la retención del proveedor. | Describir el tratamiento aprobado, los controles de la cuenta, los costos vigentes y el estado real de validación por plataforma. La revisión de Ronald sobre objeción o retiro del consentimiento sigue pendiente. |
| Whisper/faster-whisper local para transcribir | Alternativa exploratoria fuera de v1; la referencia describe descarga de modelos y no verifica telemetría ni rendimiento en equipos objetivo. Por sí sola no especifica cómo generar notas. | Documentar requerimientos, idiomas, telemetría y rendimiento a partir de fuentes; cualquier adopción requeriría revisión y aprobación separadas. |
| Whisper local + Claude para notas | Alternativa exploratoria fuera de v1. La transcripción se enviaría a Claude, por lo que no sería un flujo enteramente local ni cumpliría el destino OpenAI único aprobado para v1. | Documentar transferencias, retención externa y local, costos y requisitos del proveedor. No enviar datos reales ni seleccionar o integrar esta opción como parte de v1. |
| Otros servicios de transcripción | Posibilidades futuras fuera de v1; aún no hay proveedores identificados en la evidencia consultada. | Si se abre una revisión futura, definir una lista y verificar documentación vigente, exposición, idiomas, costos y retención antes de proponer una selección. |

La evaluación de captura comparará, como mínimo, captura del sistema y micrófono, combinación de fuentes, cobertura de salidas y permisos por sistema operativo. La comparación de transcripción distinguirá idioma detectado o seleccionado, calidad documentada, latencia y recursos requeridos. No se presentarán afirmaciones de fabricantes o referencias exploratorias como resultados propios.

## Criterios de aceptación verificables

1. La matriz compara la línea base aprobada con alternativas explícitamente marcadas como exploratorias y fuera de v1.
2. Cada alternativa identifica datos que salen del dispositivo, destinatarios, almacenamiento y retención conocida o no confirmada, riesgos y verificaciones pendientes.
3. La recomendación para Ronald compara ventajas, costos, riesgos e incertidumbre, y no se presenta como autorización para cambiar el alcance o implementar.
4. El documento registra correctamente las aprobaciones existentes y mantiene pendientes la revisión de Ronald y la validación de los helpers macOS y Windows.
5. La evaluación no implementa cambios, no ejecuta POCs, no envía audio o transcripciones a proveedores y no conserva grabaciones.

## Estado del backend y patrones de referencia

El backend MN-08 ya está implementado en `apps/api/`; su estado no debe confundirse con el de la SPA, que aún no está integrada. El backend documenta la captura local, procesamiento OpenAI, consulta de estado, persistencia SQLite y reglas de retención aprobadas. La compilación/ejecución del helper macOS y la verificación del helper Windows siguen pendientes. ([AGENTS.md](../../AGENTS.md:11), [README de la API](../../apps/api/README.md:3), [README de la API, validación](../../apps/api/README.md:27))

Los POCs describen comportamientos distintos: uno conserva WAV locales hasta borrado manual y no usa servicios externos; otro transmite a OpenAI y elimina copias locales al terminar, con retención externa independiente. Son evidencia de experimentos, no patrones de producto aprobados. ([README captura](../../apps/prototypes/poc-record-audio/README.md:11), [README OpenAI](../../apps/prototypes/poc-openai-macos/README.md:40))

## Impacto por componente

| Componente existente | Responsabilidad y cambio previsto |
|---|---|
| `docs/plans/MN-05-privacidad-seguridad-ciclo-vida-datos.md` | Fuente de requisitos aprobados; MN-09 conserva como pendiente la revisión de Ronald. Este plan no modifica MN-05. |
| Alcance v1, MN-01 y decisiones técnicas | Autoridad y decisiones vigentes para la evaluación; no se reabre la aprobación del alcance. |
| `apps/api/` | Backend MN-08 implementado. Se usa como línea base documental; MN-09 no propone cambios de código, API, datos ni dependencias. |
| `apps/web/` y `packages/contracts/` | Espacios reservados sin integración prevista en MN-09. |
| `apps/prototypes/poc-record-audio/` y `apps/prototypes/poc-openai-macos/` | Evidencia técnica únicamente; no ejecutar ni modificar. |
| `docs/additional resources/README.md` | Referencia exploratoria Whisper + Claude; no convertirla en decisión de producto. |

## Contratos, datos y dependencias

No se anticipan cambios en API, eventos, esquemas, persistencia ni código. La entrega es la matriz y recomendación solicitadas. Para esta evaluación no se crearán artefactos de audio o transcripción ni se harán llamadas a proveedores.

No se consideran dependencias nuevas. Si en el futuro se propusiera integrar Whisper u otro proveedor, primero habría que revisar y aprobar el cambio de alcance, además de dependencias, licencias, modelos, transferencias y tratamiento de datos.

## Riesgos y mitigaciones

- **“Local” puede ocultar una transferencia posterior:** separar captura, transcripción y generación de notas en el mapa de datos; Claude recibe la transcripción en la alternativa híbrida.
- **Borrado local puede confundirse con borrado externo:** registrar por separado las reglas del dispositivo y del proveedor.
- **Datos promocionales pueden tomarse como benchmarks propios:** citar fuente, fecha y nivel de certeza, y marcar lo no comprobado.
- **Permisos y cobertura varían por plataforma:** documentar los permisos y límites específicos de macOS y Windows; mantener explícito que los helpers aún no están validados en ambos sistemas.
- **Precios y condiciones cambian:** verificarlos en fuentes vigentes al momento de la evaluación; no inferir costos a partir de la configuración de un POC.
- **Alternativas exploratorias pueden confundirse con decisiones de v1:** etiquetarlas fuera del alcance y no recomendar su integración sin revisión separada.

## Secuencia de trabajo

1. Confirmar en las fuentes vigentes la línea base aprobada y registrar el estado actual de implementación y validación de MN-08.
2. Mantener identificada la revisión pendiente de Ronald sobre objeción o retiro del consentimiento, sin reabrir las aprobaciones ya registradas.
3. Acordar las alternativas exploratorias y las fuentes documentales válidas; no usar datos reales.
4. Recopilar documentación sobre permisos, idiomas, rendimiento, costos y tratamiento; etiquetar los datos no verificados.
5. Completar la matriz y redactar la recomendación con riesgos, incertidumbres y límites de alcance.
6. Entregar la matriz a Ronald según el ticket y registrar su revisión y disposición, sin atribuirle aprobación antes de recibirla.
7. Cualquier cambio de proveedor o implementación requiere revisión de alcance y autorización separadas.

## Validación

La validación será documental: comprobar la cobertura de la matriz, sus fuentes, la exposición por alternativa y la distinción entre la línea base aprobada y las opciones exploratorias. Confirmar que se refleja el estado real de MN-08 y que permanecen pendientes la revisión de Ronald y la verificación por plataforma. No se ejecutan pruebas, POCs ni comandos de producto como parte de este plan.

## Reversión

No aplica reversión de software o datos: este borrador no modifica código ni maneja audio. Las correcciones al documento deberán mantener la diferencia entre hechos, propuestas y decisiones aprobadas. Cualquier reversión de una implementación futura requerirá un plan separado que considere datos capturados o transferidos.

## Decisiones para revisión humana

- Revisar la matriz y registrar la disposición de Ronald, en particular sobre objeción o retiro del consentimiento.
- Definir la lista de opciones exploratorias y las fuentes válidas para calidad, rendimiento y costos.
- Mantener visibles las verificaciones pendientes del helper de captura en macOS y Windows.
- Aprobar por separado cualquier cambio al alcance, proveedor, destino de datos, persistencia o integración antes de implementarlo.
