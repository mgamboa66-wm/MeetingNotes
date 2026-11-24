# MN-09 | Evaluar opciones de captura de audio y transcripción

**Estado:** Borrador para revisión humana; no aprobado. Este plan es documental; no implementa captura ni autoriza procesar audio.

**Condición de inicio:** No está evidenciado que se haya revisado MN-05 ni resuelta la autoridad del alcance de producto. MN-05 sigue marcado como borrador no aprobado, y MN-01 registra una discrepancia entre el alcance de v1 y las instrucciones del repositorio. La comparación queda pendiente de esa revisión. ([MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:3), [MN-01](./MN-01-alcance-mvp.md:31), [AGENTS.md](../../AGENTS.md:42))

## Propósito y resultado

Comparar alternativas para el flujo de reunión a notas y entregar a Ronald una matriz con exposición de datos, requisitos de aprobación, ventajas, límites y evidencia. El ticket asigna la preparación a Marco y Ericka; el repositorio no confirma esos roles.

La recomendación será un insumo para revisión humana. La recomendación provisional de este borrador es **no elegir ni habilitar captura o procesamiento hasta resolver el inicio y las aprobaciones pendientes**. Después de la evaluación, el ticket pide una recomendación fundamentada; esta no sustituye la aprobación de privacidad ni la autorización para implementar.

## Fuentes y autoridad

- [Instrucciones del repositorio](../../AGENTS.md:5): instrucción vigente; prohíbe habilitar captura, transferencia o retención sin aprobación explícita del alcance y tratamiento.
- [Alcance de v1](../MEETINGNOTES_V1_SCOPE.md:1): se declara aprobado y describe macOS/Windows, captura del sistema y micrófono, OpenAI, español o inglés y retención ante fallos. Su autoridad está en discrepancia con `AGENTS.md` y con [MN-01](./MN-01-alcance-mvp.md:24).
- [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:3): borrador no aprobado; pide revisión de Ronald y aprobaciones de Producto y Privacidad.
- Los README de POCs y el README de Additional Resources describen experimentos y una referencia exploratoria, no decisiones aprobadas de MeetingNotes. [POCs](../../apps/prototypes/README.md:3), [referencia](../additional%20resources/README.md:1)
- MN-05 indica que no encontró una plantilla aprobada. No se presenta este formato como plantilla normativa. ([MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:18))

## Hechos comprobados

- El alcance de v1 describe aplicación local para macOS y Windows, mezcla de audio del sistema y micrófono, salida de notas en español o inglés y envío de audio y transcripción a OpenAI. También describe retención local indefinida del audio si falla el procesamiento. Esas reglas están sujetas a la discrepancia de autoridad. ([Scope, secciones 2–5](../MEETINGNOTES_V1_SCOPE.md:10), [MN-01](./MN-01-alcance-mvp.md:37))
- La POC de captura documenta Core Audio taps y permisos separados en macOS; en Windows, PyAudioWPatch/WASAPI y permiso de micrófono. La sincronización de Windows aún requiere verificación. Guarda WAV hasta borrado manual. ([README de captura](../../apps/prototypes/poc-record-audio/README.md:5))
- La POC OpenAI es solo para macOS: envía audio para transcripción y la transcripción para generar notas; dice que elimina copias locales al terminar, mientras la retención externa depende del proveedor. ([README OpenAI](../../apps/prototypes/poc-openai-macos/README.md:3), [implementación de transcripción](../../apps/prototypes/poc-openai-macos/src/server/index.ts:228))
- Additional Resources describe faster-whisper local combinado con Claude para notas, autodetección de español e inglés o mezcla, y archivos de audio, transcripción y notas guardados localmente. La misma referencia dice que modelos mayores requieren más recursos y que el primer uso descarga el modelo; esos datos no son una medición validada para MeetingNotes. ([README exploratorio](../additional%20resources/README.md:16), [salidas](../additional%20resources/README.md:80), [modelos](../additional%20resources/README.md:100))
- No hay aplicación de producto integrada ni suite de pruebas consolidada; los POCs están aislados y no constituyen arquitectura aprobada. ([AGENTS.md](../../AGENTS.md:7), [README](../../README.md:59))

## Supuestos y preguntas abiertas

### Supuestos de trabajo

- MN-09 es una evaluación documental; la prohibición de conservar grabaciones aplica a sus actividades y artefactos. No redefine la política de retención del producto, que sigue pendiente.
- La recomendación solicitada puede ser no vinculante y presentar riesgos, evidencia e incertidumbres sin seleccionar un proveedor por el equipo.

### Bloqueantes

1. ¿Dónde está la evidencia de la revisión de MN-05 y de la revisión del alcance que habilita comenzar MN-09?
2. ¿Se confirma `MEETINGNOTES_V1_SCOPE.md` como autoridad vigente frente a `AGENTS.md` y MN-01?
3. ¿Qué aprobaciones de Producto y Privacidad se requieren antes de evaluar tratamiento, permisos o datos? MN-05 deja esas aprobaciones pendientes. ([MN-05, preguntas y evidencia](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:51))

### Por resolver durante la evaluación, una vez levantado el bloqueo

- ¿Qué proveedores concretos se incluirán bajo “otros servicios de transcripción”?
- ¿Qué criterios o fuentes se aceptarán para comparar calidad y rendimiento sin enviar audio o transcripciones a servicios externos?
- ¿Qué fecha de referencia y supuestos se usarán para precios y costos operativos? Esos datos deberán verificarse durante la evaluación, no inferirse de los POCs.

## Alcance

**Incluye:** comparar opciones de captura para macOS y Windows; permisos del sistema y micrófono; transcripción local o externa; idiomas; calidad y rendimiento según evidencia disponible; costos; transferencias, retención y aprobaciones necesarias.

**Excluye:** implementar captura o transcripción, ejecutar POCs, generar o conservar grabaciones, enviar audio o transcripciones a proveedores, integrar dependencias o declarar aprobada una política. El repositorio prohíbe ejecutar comandos de POCs sin solicitud expresa. ([AGENTS.md](../../AGENTS.md:31))

## Alternativas que deberá cubrir la matriz

| Opción | Exposición y límites conocidos | Aprobaciones o verificación pendiente |
|---|---|---|
| No habilitar captura ni procesamiento por ahora | No se genera ni transfiere audio. No entrega la función. Es la recomendación provisional mientras el inicio siga bloqueado. | Resolver revisión MN-05 y alcance antes de reconsiderarla. |
| Flujo OpenAI descrito en v1 | Audio y transcripción salen del equipo. La eliminación local no determina la retención del proveedor; los costos varían. | Revisar transferencias, controles de cuenta, retención, costos y divulgación con Producto y Privacidad. |
| Whisper/faster-whisper local para transcribir | La referencia plantea transcripción local, pero la instalación descarga modelos y el README no verifica telemetría ni rendimiento en equipos objetivo. Por sí sola no especifica cómo generar notas. | Verificar requerimientos, idiomas, telemetría y rendimiento. Resolver permisos y tratamiento local antes de cualquier uso real. |
| Whisper local + Claude para notas | La transcripción se envía a Claude; no es un flujo enteramente local. La referencia guarda audio, transcripción y notas. | Revisar transferencia y retención externa, además de retención local, costos y seguridad del proveedor. |
| Otros servicios de transcripción | Aún no hay proveedores identificados en la evidencia consultada; exposición, idiomas, costos y retención son desconocidos. | Definir lista corta y verificar documentación vigente y aprobaciones por proveedor antes de seleccionarlo. |

La evaluación de captura comparará, como mínimo, captura del sistema y micrófono, combinación de fuentes, cobertura de salidas y permisos por sistema operativo. La comparación de transcripción distinguirá idioma detectado o seleccionado, calidad documentada, latencia y recursos requeridos. No se presentarán como resultados propios las afirmaciones de fabricantes o de la referencia exploratoria.

## Criterios de aceptación verificables

1. La matriz cubre las plataformas y dimensiones enumeradas en el ticket, e identifica qué afirmaciones son evidencia, desconocidos o estimaciones.
2. Cada alternativa identifica los datos que salen del dispositivo, destinatarios, almacenamiento y retención conocida o no confirmada, riesgos y aprobaciones necesarias.
3. La recomendación entregada a Ronald compara ventajas, costos, riesgos e incertidumbre, y no se presenta como autorización para implementar o transferir datos.
4. Se registra la revisión de MN-05 y del alcance como condición de inicio; si no hay evidencia, la evaluación queda señalada como pendiente.
5. La evaluación no implementa captura, no envía audio ni transcripciones a servicios externos y no conserva grabaciones.

## Estado y patrones actuales

Los POCs documentan comportamientos distintos: uno conserva WAV locales hasta borrado manual y no usa servicios externos; el otro transmite a OpenAI y elimina copias locales al finalizar, con retención externa independiente. Son evidencia de experimentos, no patrones de producto aprobados. ([README captura](../../apps/prototypes/poc-record-audio/README.md:11), [README OpenAI](../../apps/prototypes/poc-openai-macos/README.md:40))

## Impacto por componente

| Componente existente | Responsabilidad y cambio previsto |
|---|---|
| `docs/plans/MN-05-privacidad-seguridad-ciclo-vida-datos.md` | Fuente de requisitos y bloqueos; MN-09 espera su revisión. Este plan no lo modifica. |
| `docs/MEETINGNOTES_V1_SCOPE.md` y `docs/plans/MN-01-alcance-mvp.md` | Referencias para resolver alcance y autoridad; no se proponen cambios como parte de la evaluación. |
| `apps/prototypes/poc-record-audio/` y `apps/prototypes/poc-openai-macos/` | Evidencia técnica únicamente; no ejecutar ni modificar. |
| `docs/additional resources/README.md` | Referencia exploratoria Whisper + Claude; no convertirla en decisión de producto. |
| `apps/web/`, `apps/api/`, `packages/contracts/` | Espacios reservados sin producto integrado; sin cambios previstos en MN-09. |

## Contratos, datos y dependencias

No se anticipan cambios en API, eventos, esquemas, persistencia ni código. La entrega es la matriz y recomendación solicitadas. Para esta evaluación no se crearán artefactos de audio o transcripción ni se harán llamadas a proveedores.

No se consideran dependencias nuevas. Si más adelante se propusiera integrar Whisper u otro proveedor, habría que revisar dependencias, licencias, modelos, transferencias y aprobaciones conforme a las instrucciones del repositorio.

## Riesgos y mitigaciones

- **“Local” puede ocultar una transferencia posterior:** separar captura, transcripción y generación de notas en el mapa de datos; Claude recibe transcripción en la opción híbrida.
- **Borrado local puede confundirse con borrado externo:** registrar por separado las reglas del dispositivo y del proveedor.
- **Datos promocionales pueden tomarse como benchmarks propios:** citar fuente, fecha y nivel de certeza, y marcar lo no comprobado.
- **Permisos y cobertura varían por plataforma:** documentar los permisos y límites específicos de macOS y Windows sin generalizar la POC.
- **Precios y condiciones cambian:** verificarlos en fuentes vigentes al momento de la evaluación; no inferir costos a partir de la configuración de un POC.

## Secuencia de trabajo

1. Registrar evidencia de revisión de MN-05 y resolver la discrepancia de autoridad del alcance.
2. Acordar la lista de opciones y las fuentes válidas de comparación.
3. Recopilar documentación vigente de plataformas, permisos, idiomas, rendimiento, costos y tratamiento de datos; etiquetar los datos no verificados.
4. Completar la matriz y redactar la recomendación con riesgos y aprobaciones pendientes.
5. Marco y Ericka entregan la matriz y recomendación a Ronald, según el ticket; registrar su revisión y disposición.
6. Cualquier implementación requiere un plan y autorización separados.

## Validación

La validación será documental: comprobar la cobertura de la matriz, las fuentes y la exposición por alternativa; confirmar que la entrega no implica llamadas a proveedores ni manejo de grabaciones. No se ejecutan pruebas ni comandos como parte de este plan; el repositorio no tiene validación consolidada y prohíbe ejecutar comandos de POCs sin solicitud.

## Reversión

No aplica reversión de software o datos: este borrador no modifica código ni maneja audio. Las correcciones al documento deberán mantener la diferencia entre hechos, propuestas y decisiones aprobadas. Cualquier reversión de una implementación futura requerirá un plan separado que considere datos capturados o transferidos.

## Decisiones para revisión humana

- Confirmar la revisión de MN-05 y la autoridad vigente del alcance de v1.
- Definir la lista de servicios externos a comparar y las fuentes válidas para calidad, rendimiento y costos.
- Revisar la exposición y aprobaciones de cada alternativa, incluidos permisos y retención local y externa.
- Revisar la recomendación de Marco y Ericka y registrar la disposición de Ronald.
- Aprobar por separado cualquier captura, transferencia, persistencia o integración antes de implementarla.
