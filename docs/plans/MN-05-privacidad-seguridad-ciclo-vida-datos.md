# MN-05 | Requisitos de consentimiento, privacidad, seguridad y ciclo de vida de los datos

**Estado:** Borrador para revisión humana; no aprobado.
**Objetivo:** registrar cómo el scope de v1 ya cubre la lógica de negocio de tratamiento de audio y notas, y dejar trazabilidad de las revisiones y aprobaciones que faltan antes de habilitar ese tratamiento.
**Resultado esperado:** matriz de flujo y tratamiento revisada por Ronald, decisiones pendientes visibles y aprobaciones de Producto y Privacidad identificadas con evidencia.

> Este plan registra requisitos y autoridad documental. No autoriza captura, transmisión, procesamiento externo, almacenamiento o retención de datos reales.

## Fuentes y autoridad

- [Ticket MN-05](#): requisito de documentar consentimiento, indicadores de grabación, denegación de permisos, procesamiento local/externo, acceso, almacenamiento, retención, eliminación y tratamiento de notas. Solicita revisión de Ronald y aprobaciones de Producto y Privacidad.
- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): se declara alcance de producto aprobado y ya define la lógica de negocio relevante para consentimiento, captura, OpenAI, acceso local, resultados y eliminación.
- [Instrucciones del repositorio](../../AGENTS.md) y [README](../../README.md): mantienen pendientes privacidad, consentimiento, seguridad y tratamiento, y condicionan captura, transferencia y retención a aprobación explícita.
- [MN-01](./MN-01-alcance-mvp.md): registra la discrepancia entre el scope y las instrucciones, y que no se adjuntó evidencia atribuible de aprobación de Ronald, Producto y Privacidad.
- [Contrato de API](../api/API_CONTRACT.md) y [guía frontend](../FRONTEND_API_GUIDE.md): propuestas sujetas a revisión; no sustituyen al scope ni aprueban tratamiento de datos.
- [Additional resources](../additional%20resources/README.md): referencia exploratoria de Whisper local y Claude; no constituye una decisión de MeetingNotes.

No se encontró una plantilla aprobada para planes. Este documento sigue el formato Markdown de planes existente sin presentarlo como plantilla normativa.

## Hechos y lógica de negocio existente

El scope de v1 ya cubre estos requisitos de producto:

- La aplicación local se dirige a macOS y Windows; captura audio del sistema y micrófono y los combina en una pista ([scope, secciones 2 y 5](../MEETINGNOTES_V1_SCOPE.md)).
- Se muestra un aviso visible y persistente antes del uso. El scope especifica que el aviso no bloquea la captura ni verifica por sí solo el consentimiento de las personas participantes ([scope, línea 14](../MEETINGNOTES_V1_SCOPE.md)).
- El backend local envía audio a OpenAI para transcribirlo y procesa allí la transcripción para generar resumen y pendientes. La copia local eliminada no elimina datos que el proveedor pudiera conservar ([scope, sección 4](../MEETINGNOTES_V1_SCOPE.md)).
- Cada computadora tiene historial local en SQLite. El acceso dependerá de la cuenta del sistema operativo; no habrá cuentas de MeetingNotes ni sincronización ([scope, secciones 2 y 5](../MEETINGNOTES_V1_SCOPE.md)).
- Tras procesamiento exitoso se guardan título, idioma, resumen y pendientes, y se borran audio y transcripción locales. La transcripción no se guarda en el historial ([scope, sección 3](../MEETINGNOTES_V1_SCOPE.md)).
- Si falla el procesamiento, se descarta la transcripción y el audio permanece local, sin vencimiento automático, hasta reintento o eliminación manual. El historial no tiene eliminación automática ([scope, secciones 2 y 3](../MEETINGNOTES_V1_SCOPE.md)).

Estos hechos describen la lógica de negocio aprobada en el scope; no demuestran por sí solos una aprobación de Producto y Privacidad para realizar el tratamiento. La autoridad documental continúa en discrepancia: AGENTS.md y README.md mantienen el tratamiento como pendiente. MN-01 también indica que no hay evidencia atribuible adjunta de las aprobaciones requeridas ([MN-01, líneas 31 y 42–51](./MN-01-alcance-mvp.md)).

## Matriz de flujo y tratamiento de datos

| Etapa y datos | Regla descrita en el scope | Estado de aprobación / revisión pendiente |
|---|---|---|
| Aviso y consentimiento; audio de participantes | Aviso visible y persistente antes del uso; no bloquea la captura ni verifica el consentimiento. | Ronald debe revisar la regla. Producto y Privacidad deben confirmar si el aviso y la responsabilidad de obtener consentimiento son suficientes y qué ocurre ante objeciones o retiro del consentimiento. No se presume aprobación de esta política por el aviso existente. |
| Permisos e indicadores | Captura del sistema y micrófono en macOS y Windows. El scope no define el flujo ante permiso denegado o revocado ni los estados visibles de error. | Definir comportamiento por plataforma, impedir que la interfaz sugiera captura activa cuando no lo está y decidir si una fuente parcial se acepta. La decisión requiere revisión de Producto y Privacidad antes de habilitar captura. |
| Captura y audio temporal | Se genera una pista combinada local. Tras éxito se elimina la copia local; ante fallo se conserva indefinidamente hasta reintento o borrado manual. | Confirmar con Producto y Privacidad la retención en fallos, reintentos y cierres inesperados, y cómo se gestionan temporales y archivos huérfanos. |
| Transcripción y proveedor | El scope envía audio a OpenAI para transcribirlo y procesa allí la transcripción para generar notas. | Documentar datos enviados y controles aplicables de la cuenta/proveedor. La eliminación local no elimina posibles copias externas. Privacidad debe revisar la transferencia y su tratamiento antes de autorizarla. |
| Alternativa de Additional resources | Propone transcribir localmente con Whisper y generar notas con Claude. | Mantener como exploratoria. Si se envía la transcripción a Claude, el contenido de la reunión sale del equipo; identificar payload, destinatario y tratamiento del proveedor antes de considerar esta opción. No equivale a un flujo completamente local. |
| Notas e historial | Se guardan localmente título, idioma, resumen y pendientes; no se conserva la transcripción en el historial. Acceso según cuenta del sistema operativo. | Revisar acceso local y medidas de seguridad, además de copias, registros, exportaciones y alcance de la eliminación de notas. El scope no especifica esos detalles operativos. |
| Eliminación y retención externa | Eliminación manual de reunión y pendientes; no hay vencimiento automático de reuniones. Las copias bajo control del proveedor siguen sus propios controles. | Confirmar con Producto y Privacidad qué significa eliminar copias locales y cómo se comunica que esto no elimina datos del proveedor. Definir si logs, respaldos y temporales forman parte del ciclo de vida. |

## Supuestos de trabajo

- Este ticket se registra como trabajo de trazabilidad y revisión de la lógica ya escrita en el scope; no como una segunda definición funcional ni como autorización para implementar. Motivo: el scope contiene las reglas de negocio anteriores. Si esta interpretación es incorrecta, cambiaría el alcance del plan.
- El scope se usa como referencia de intención de producto, pero no se considera evidencia suficiente para levantar la restricción de AGENTS.md sobre tratamiento de datos. La discrepancia debe resolverse explícitamente.
- La mención de Producto y Privacidad identifica áreas de aprobación requeridas por el ticket; no se infieren nombres ni responsables individuales.

## Preguntas abiertas

### Bloqueantes antes de habilitar captura, transferencia o retención

1. ¿Se confirma el scope como autoridad vigente para la lógica de negocio pese a la discrepancia registrada en AGENTS.md y README.md?
2. ¿Producto y Privacidad aprueban el aviso no bloqueante y el hecho de que no verifique el consentimiento de participantes? ¿Qué control adicional, si alguno, se requiere?
3. ¿Qué debe hacer la aplicación ante permisos denegados, revocados o disponibles para solo una fuente de audio?
4. ¿Producto y Privacidad aprueban enviar audio y transcripción a OpenAI? ¿Qué información y condiciones externas deben divulgarse antes de usarlo?
5. ¿La propuesta Whisper + Claude se mantiene solo como referencia exploratoria o se evaluará como alternativa? ¿Qué texto se transferiría a Claude y bajo qué controles?
6. ¿Se aprueba la retención indefinida del audio tras fallos hasta reintento o eliminación manual? ¿Qué tratamiento aplica a temporales, respaldos, logs y cierres inesperados?
7. ¿Qué controles de acceso y seguridad se requieren para audio, notas, base de datos local, credenciales y registros? ¿Cómo se define la eliminación efectiva de cada copia?

### Evidencia requerida

- Registrar que Ronald revisó la matriz y las decisiones pendientes, incluyendo comentarios y disposición.
- Identificar la aprobación de Producto y Privacidad para cada decisión de tratamiento que corresponda y enlazar evidencia verificable. El repositorio consultado no nombra a las personas responsables ni adjunta esa evidencia.

## Alcance

**Incluye:** registrar la matriz basada en el scope, separar reglas escritas de aprobaciones demostradas, identificar transferencias locales/externas y dejar pendientes de Producto y Privacidad visibles.

**Fuera de alcance:** cambiar la lógica de negocio del scope, implementar captura o controles, enviar datos reales, configurar proveedores, decidir retención distinta, realizar una evaluación jurídica por jurisdicción o declarar aprobada una política que aún no tiene evidencia.

## Criterios de aceptación verificables

1. La matriz cubre consentimiento, indicadores/permiso, procesamiento local y externo, acceso, almacenamiento, retención, eliminación y notas, y referencia las reglas de negocio existentes en el scope.
2. La propuesta Whisper + Claude se etiqueta como exploratoria y se identifica la transferencia de la transcripción a Claude si se usa para generar notas.
3. Se documenta la revisión de Ronald a la matriz y las decisiones pendientes; no se considera cumplido hasta registrar la revisión.
4. Se identifican las aprobaciones necesarias de Producto y Privacidad y se registra su evidencia cuando ocurra; no se afirma que ya existan.
5. El ticket y este plan indican que no autorizan por sí solos grabación, transmisión, almacenamiento o retención.

## Estado y patrones actuales

- apps/web, apps/api, packages/contracts y tests son espacios reservados; no hay aplicación de producto ni suite integrada ([AGENTS.md, líneas 7–16](../../AGENTS.md)).
- Los dos POCs tienen instrucciones y configuración independientes; ninguno es arquitectura aprobada ([README de prototipos](../../apps/prototypes/README.md)).
- El POC de captura conserva WAV local hasta borrado manual ([README del POC de audio](../../apps/prototypes/poc-record-audio/README.md:11)). El POC OpenAI usa temporales y elimina sus copias al terminar ([README del POC OpenAI](../../apps/prototypes/poc-openai-macos/README.md:8)). Esos comportamientos son evidencia de prototipos, no decisiones de producto.
- La guía frontend y el contrato contienen propuestas sujetas a revisión. Las rutas de documentación mencionadas en algunos archivos de instrucciones no coinciden exactamente con el árbol actual: el contrato está en docs/api/API_CONTRACT.md; no se observó el archivo temporal docs/MEETINGNOTES_V1_CONTEXT_TEMP.md.

## Impacto por componente

| Componente existente | Responsabilidad / estado | Impacto previsto después de las aprobaciones |
|---|---|---|
| docs/MEETINGNOTES_V1_SCOPE.md | Lógica de negocio de v1; declara el alcance aprobado. | Referencia principal de las reglas registradas; cualquier ajuste posterior requiere actualizar su estado y evidencia. Este plan no lo cambia. |
| docs/api/API_CONTRACT.md | Propuesta de API. | Alinear detalles de permisos, tratamiento, fallos y eliminación una vez aprobados. No cambiar en este ticket. |
| docs/FRONTEND_API_GUIDE.md | Guía de trabajo propuesta para frontend. | Alinear estados de UI y disclosure después de aprobar la política. No cambiar en este ticket. |
| apps/web, apps/api, packages/contracts, tests | Espacios reservados, sin producto integrado. | Posible trabajo futuro separado; no se proponen archivos ni implementación en MN-05. |
| POCs en apps/prototypes | Experimentos independientes. | No integrar ni modificar como resultado de este plan. |

## Contratos, datos y dependencias

El contrato propuesto ya refleja el historial local, audio fallido para reintento/borrado y la ausencia de transcripción en el historial ([API_CONTRACT.md, líneas 49–55](../api/API_CONTRACT.md)). Sus rutas y detalles son propuestas, no contratos aprobados. Este plan no agrega campos, endpoints, esquemas, persistencia o dependencias.

El stack aprobado no determina el proveedor de IA/transcripción, y la elección de base de datos y los detalles de seguridad/tratamiento continúan sujetos a revisión ([AGENTS.md, líneas 20–29 y 46–56](../../AGENTS.md)).

## Riesgos y alternativas

- El aviso no bloqueante podría interpretarse como prueba de consentimiento; la revisión debe aclarar expresamente qué garantiza y qué no.
- Eliminar una copia local podría confundirse con eliminar datos externos; la interfaz y documentación deberán distinguir ambos alcances si se aprueba procesamiento externo.
- “Whisper local” no significa que todo el flujo sea local cuando Claude recibe la transcripción.
- La conservación indefinida de audio de fallos amplía la exposición local; mantenerla, cambiarla o no habilitar la captura son decisiones para Producto y Privacidad, no para este plan.

Alternativas que las personas revisoras pueden valorar: conservar el flujo OpenAI descrito en el scope con divulgación y controles aprobados; evaluar la referencia Whisper + Claude con su transferencia externa claramente identificada; o no habilitar procesamiento hasta completar las aprobaciones. Este plan no selecciona ninguna.

## Secuencia de trabajo

1. Ronald revisa esta matriz y confirma si representa fielmente la lógica del scope y sus preguntas pendientes.
2. Producto y Privacidad resuelven y registran la autoridad documental y las decisiones de consentimiento, permisos, transferencias, acceso, seguridad, retención y eliminación.
3. Se actualiza el scope o los documentos técnicos pertinentes con referencias a esas decisiones aprobadas.
4. Cualquier implementación se planifica y autoriza como trabajo separado, después de resolver los bloqueos de tratamiento.

## Validación

La validación de este plan es documental: comprobar cobertura de cada criterio contra la matriz y sus referencias; verificar que las propuestas se distinguen de decisiones aprobadas; y registrar la revisión de Ronald y las aprobaciones de Producto y Privacidad. No se ejecutarán comandos de producto ni pruebas como parte del plan; las instrucciones indican que no hay suite integrada y que no se ejecuten comandos de POCs sin solicitud expresa.

## Reversión

No aplica reversión de software o datos porque este plan solo registra requisitos y decisiones. Los cambios futuros de política deberán actualizar los documentos que los contienen y conservar un registro de aprobación; cualquier reversión de implementación requerirá un plan separado que considere datos ya capturados y transferidos.

## Decisiones para revisión humana

- Confirmar la autoridad del scope frente a las instrucciones generales del repositorio.
- Confirmar si la regla de consentimiento del scope es suficiente y precisar permisos denegados/revocados e indicadores.
- Aprobar o rechazar explícitamente el flujo OpenAI y revisar la alternativa exploratoria Whisper + Claude.
- Aprobar almacenamiento, acceso, seguridad, retención, fallos y eliminación para copias locales y externas.
- Registrar la revisión de Ronald y las aprobaciones de Producto y Privacidad con evidencia.
