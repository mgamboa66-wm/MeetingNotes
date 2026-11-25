# MN-05 | Requisitos de consentimiento, privacidad, seguridad y ciclo de vida de los datos

**Estado:** Plan documental aprobado por Marco (25 de noviembre de 2026).

**Registro de aprobación:** Marco aprobó este plan el 25 de noviembre de 2026.

**Objetivo:** documentar el tratamiento de datos aprobado para v1 y separar esos requisitos de los detalles técnicos que siguen pendientes.

**Resultado esperado:** matriz revisada por Ronald, Producto y Privacidad, con decisiones técnicas pendientes y evidencia de la revisión identificadas.

> El alcance de producto v1 ya está aprobado. Este plan lo documenta; no reabre sus decisiones ni autoriza implementar detalles técnicos pendientes, cambiar el flujo aprobado o ampliar el tratamiento de datos. La aprobación de este plan documental no aprueba una política adicional ni autoriza procesar datos reales fuera del flujo de v1.

## Fuente de verdad y autoridad

- [Alcance aprobado de v1](../decisions/MEETINGNOTES_V1_SCOPE.md): autoridad de producto para el flujo y el tratamiento de datos descritos aquí.
- [Instrucciones del repositorio](../../AGENTS.md): determina el stack aprobado, los detalles técnicos aún abiertos y la necesidad de un plan de implementación aprobado antes de integrar el producto.
- [Contrato de API](../api/API_CONTRACT.md) y [guía frontend](../FRONTEND_API_GUIDE.md): propuestas técnicas que deben mantenerse alineadas con el alcance; no sustituyen su autoridad ni se consideran contratos implementados.

## Reglas de producto aprobadas en v1

- MeetingNotes es una aplicación local para macOS y Windows. Captura el audio del sistema y el micrófono y los combina en una sola pista.
- Antes del uso muestra un aviso visible y persistente. El aviso no bloquea la captura ni verifica por sí mismo el consentimiento de las personas participantes.
- El backend local envía el audio a OpenAI para transcribirlo y procesar allí la transcripción para generar el resumen y los pendientes. OpenAI es el proveedor aprobado para este flujo.
- Cada computadora conserva su propio historial en SQLite. El acceso depende de la cuenta del sistema operativo; v1 no tiene cuentas de MeetingNotes ni sincronización.
- Si el procesamiento termina correctamente, se conserva localmente el título, el idioma elegido, el resumen y los pendientes. Se eliminan el audio y la transcripción locales; la transcripción no forma parte del historial.
- Si el procesamiento falla, se descarta la transcripción y el audio queda local, sin vencimiento automático, hasta que un reintento termine correctamente o la persona usuaria elimine la captura. Las capturas fallidas se pueden reintentar o eliminar manualmente.
- Las reuniones guardadas no tienen eliminación automática. La persona usuaria puede eliminar manualmente una reunión y todos sus pendientes.
- Las copias que el proveedor pudiera conservar se rigen por los controles de la cuenta de OpenAI; eliminar la copia local no las elimina.

## Tecnologías aprobadas relevantes

| Área | Decisión de v1 | Detalle que sigue abierto |
|---|---|---|
| Backend | Bun + Hono. | Integración con la aplicación de escritorio, host y puerto local. |
| IA y validación | Vercel AI SDK (`ai`) + Zod; OpenAI es el proveedor aprobado. | Modelos concretos y configuración de integración. |
| Datos | Drizzle + SQL con SQLite local por computadora. | Integración concreta de SQLite y rutas/protección local de archivos. |
| Acceso | Sin cuentas ni inicio de sesión de MeetingNotes; acceso según la cuenta del sistema operativo. | Protección concreta de archivos locales, credenciales y registros. |
| Interfaz | React + TypeScript estricto; Tailwind CSS; TanStack Query con fetch nativo. | La arquitectura completa y los detalles de captura nativa siguen sujetos al plan técnico aprobado. |

No se propone otro proveedor de IA, almacenamiento remoto, autenticación de cuentas ni una tecnología adicional. Las decisiones de esta tabla no amplían el tratamiento aprobado.

## Matriz de flujo y tratamiento

| Etapa y datos | Requisito aprobado | Revisión pendiente, limitada a detalles no definidos |
|---|---|---|
| Aviso y captura | Aviso visible y persistente antes del uso; captura del sistema y micrófono en macOS y Windows, combinados en una pista. El aviso no bloquea la captura ni comprueba el consentimiento de participantes. | Definir permisos e indicadores específicos de cada plataforma, incluyendo permisos denegados o revocados. El comportamiento con una sola fuente disponible no está definido; no se debe asumir que una captura parcial satisface el requisito de combinar ambas fuentes. |
| Procesamiento exitoso | El audio se envía a OpenAI para transcribirlo y generar las notas. Se guardan localmente título, idioma, resumen y pendientes; se eliminan el audio y la transcripción locales. | Definir la configuración concreta del modelo e integración OpenAI y documentar los controles de la cuenta aplicables. La eliminación local no se describe como eliminación de copias externas. |
| Fallo y reintento | Se descarta la transcripción. El audio fallido permanece local, sin vencimiento automático, hasta un reintento exitoso o eliminación manual; la captura aparece para reintentar o eliminar. | Definir la recuperación ante cierres inesperados, temporales y archivos huérfanos para que la implementación cumpla el ciclo aprobado. No introducir vencimiento automático ni retención adicional. |
| Historial y eliminación | Historial local en SQLite, accesible según la cuenta del sistema operativo. No conserva transcripciones ni se elimina automáticamente. La persona usuaria puede editar y eliminar manualmente reuniones con sus pendientes. | Confirmar integración concreta de SQLite y protección local de base de datos, audio fallido y credenciales. Determinar cómo logs o respaldos afectan el cumplimiento, sin añadir copias o retención fuera del alcance. |

## Preguntas abiertas

Estas preguntas no reabren las decisiones de producto aprobadas; delimitan la implementación y requieren resolución en el plan técnico correspondiente:

1. ¿Cómo se presentan los permisos denegados o revocados y los estados de captura por plataforma sin indicar que se captura cuando no es así?
2. ¿Qué comportamiento aplica si solo está disponible una fuente de audio? La regla aprobada exige combinar audio del sistema y micrófono; aceptar una fuente parcial requeriría aprobación de un cambio de alcance.
3. ¿Cómo se recuperan temporales o archivos huérfanos tras un cierre inesperado sin descartar el audio fallido aprobado ni crear retención adicional?
4. ¿Qué integración de SQLite se usará y cómo se protegerán los archivos locales bajo la cuenta del sistema operativo?
5. ¿Qué modelo y configuración concreta de OpenAI se usarán, y cómo se administrarán sus credenciales y controles de cuenta?
6. ¿Qué datos, si alguno, aparecen en logs o respaldos locales? La respuesta debe respetar la ausencia de transcripciones en el historial y no ampliar la retención aprobada.

## Alcance de este plan

**Incluye:** documentar el flujo aprobado, distinguirlo de detalles técnicos abiertos y registrar la revisión de la matriz y de esas preguntas.

**Fuera de alcance:** cambiar el aviso, los proveedores, la captura requerida, la retención, el destino de datos o el almacenamiento aprobado; implementar captura o controles; enviar datos reales; definir detalles técnicos por inferencia; realizar una evaluación jurídica por jurisdicción.

El plan no sustituye al plan de implementación requerido antes de integrar el producto. Cualquier cambio al comportamiento aprobado requiere una nueva aprobación de alcance.

## Criterios de revisión

- La matriz refleja el aviso, captura combinada, procesamiento OpenAI, acceso local, historial, reintentos, retención y eliminación tal como están definidos en el alcance aprobado.
- Las tecnologías mencionadas coinciden con el stack de v1; OpenAI es el único proveedor de IA considerado en este plan y SQLite es el almacenamiento local aprobado.
- Cada pendiente se limita a un detalle no definido y no cambia el comportamiento, destino ni retención de datos autorizados.
- Se documenta la revisión solicitada a Ronald, Producto y Privacidad, junto con comentarios o decisiones sobre los detalles pendientes. Esa revisión no reabre el alcance aprobado.
- El documento no se presenta como autorización para implementar arquitectura pendiente ni para apartarse del alcance.

## Secuencia de trabajo

1. Revisar la matriz contra el alcance aprobado y registrar comentarios de Ronald, Producto y Privacidad.
2. Resolver los detalles técnicos abiertos como parte del plan de implementación aprobado, sin asumir opciones por inferencia.
3. Si alguna revisión propone cambiar una regla de producto aprobada, actualizar primero el alcance y registrar esa nueva aprobación.
4. Planificar e implementar el producto como trabajo separado, de acuerdo con las instrucciones del repositorio.

## Validación

La validación de este plan es documental: verificar los criterios de revisión, confirmar que los enlaces apuntan a la fuente vigente y comprobar que las preguntas pendientes no contradicen las reglas aprobadas. No se ejecutan comandos de producto ni de los POCs como parte de esta revisión.

## Reversión

No aplica reversión de software o datos porque MN-05 solo registra requisitos y decisiones. Cualquier reversión futura de implementación requiere un plan separado que considere los datos ya capturados y transferidos.
