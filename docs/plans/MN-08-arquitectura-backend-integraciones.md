# MN-08 | Revisar la arquitectura de backend e integraciones después de aprobar UX

**Estado:** Borrador para revisión humana; no aprobado.  
**Condición de inicio:** revisar recorrido UX, wireframes, alcance del producto y requisitos de privacidad antes de comenzar el análisis de arquitectura.  
**Responsable del informe:** Marco.  
**Revisión prevista:** Ronald aprueba la recomendación.

> Este plan organiza una revisión futura. No inicia la recomendación arquitectónica, no elige opciones por inferencia y no autoriza implementación, captura, transmisión, procesamiento externo o retención de audio.

## Objetivo

Preparar un informe de decisiones sobre límites potenciales de servicios e integraciones de backend para que Ronald lo revise y apruebe.

## Condición de inicio y estado actual

La condición de inicio **no está acreditada por los documentos encontrados**:

| Requisito previo | Evidencia disponible | Estado |
|---|---|---|
| Revisar el recorrido de UX | [MN-03](./MN-03-arquitectura-informacion.md) sigue como borrador y requiere revisión de Ronald. | Pendiente |
| Revisar wireframes | [MN-04](./MN-04-wireframes.md) aprueba preparar wireframes estáticos, pero indica que Ronald aún debe revisarlos. No se encontró un artefacto de wireframes independiente en el repositorio. | Pendiente |
| Revisar el alcance | [El scope de v1](../MEETINGNOTES_V1_SCOPE.md) se declara aprobado, mientras [AGENTS.md](../../AGENTS.md) y [README.md](../../README.md) aún mantienen decisiones de alcance y tratamiento como pendientes. | Resolver discrepancia |
| Revisar requisitos de privacidad | [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md) es un borrador y requiere revisión de Ronald y evidencia de aprobaciones de Producto y Privacidad. | Pendiente |

[MN-01](./MN-01-alcance-mvp.md) se registra como ejecutado según confirmación de la persona usuaria, pero no adjunta evidencia atribuible de las aprobaciones requeridas. La existencia de este plan no satisface las condiciones previas.

## Fuentes y autoridad

- [Instrucciones del repositorio](../../AGENTS.md): aprueban Bun + Hono, Drizzle + SQL, Vercel AI SDK + Zod; mantienen pendientes la base de datos concreta, el proveedor/modelo de IA, el modo de renderizado, SSO y despliegue; restringen el tratamiento de audio sin aprobación explícita.
- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): se declara aprobado e incluye una aplicación local, menciona SQLite y OpenAI y describe el flujo y la lógica de negocio. MN-08 pide mantener DB y proveedor/modelo pendientes; el informe deberá registrar y resolver esa diferencia sin escoger por inferencia.
- [Contrato API](../api/API_CONTRACT.md): propuesta técnica alineada al scope; sus rutas y detalles permanecen sujetos a revisión.
- [Guía frontend](../FRONTEND_API_GUIDE.md): guía basada en una API propuesta, no un contrato implementado.
- [README de prototipos](../../apps/prototypes/README.md): los POCs son experimentos aislados, no una arquitectura de producto aprobada.

## Hechos, supuestos y preguntas abiertas

### Hechos

- El stack base aprobado para el trabajo es Bun + Hono, Drizzle + SQL y Vercel AI SDK + Zod.
- El producto no tiene una API integrada, contratos compartidos implementados ni suite consolidada: `apps/api/`, `packages/contracts/` y `tests/` son espacios reservados.
- El scope de v1 menciona SQLite y OpenAI. El requerimiento de MN-08 mantiene pendientes la base de datos y el proveedor/modelo; esos puntos no se tratarán como decisiones finales.
- El contrato de API actual es una propuesta; no debe confundirse con un contrato aprobado para implementación.

### Supuestos de trabajo

- El informe será de análisis y recomendación, no una especificación lista para codificar. Si se espera detalle de implementación, habrá que ampliar el alcance después de la revisión.
- Los límites se expresarán como responsabilidades conceptuales y no como nombres de paquetes, servicios desplegables o archivos existentes.
- Las alternativas se compararán dentro del stack aprobado. Cualquier dependencia o tecnología adicional se identificará como propuesta sujeta a aprobación.

### Preguntas abiertas

1. ¿Qué evidencia registrará la revisión de Ronald del recorrido UX y de los wireframes?
2. ¿Cómo se resolverá la discrepancia entre el scope de v1 y las instrucciones/README sobre alcance y tratamiento?
3. ¿Qué aprobaciones de Producto y Privacidad se requieren antes de analizar una integración que envíe audio o transcripción a un proveedor?
4. ¿El informe debe limitarse a arquitectura conceptual o incluir contratos candidatos con ejemplos de payloads, errores e idempotencia?
5. ¿Qué alternativas aprobadas deben incluirse además de las que aparecen en las fuentes actuales?

## Alcance del informe futuro

El informe comparará límites y responsabilidades potenciales para:

- Interfaz y API local.
- Captura por plataforma y su frontera con el backend, sin seleccionar helper o mecanismo de captura.
- Transcripción y generación de notas, separando la interfaz del proveedor de su implementación concreta.
- Validación de entradas y salidas con Zod y el papel del Vercel AI SDK.
- Persistencia mediante Drizzle + SQL, dejando la base concreta pendiente.
- Contratos relacionados con metadatos de reuniones, ciclo de vida de transcripciones y notas.
- Errores, reintentos, idempotencia, procesamiento síncrono o en segundo plano, solo como alternativas a comparar.
- Implicaciones de privacidad y seguridad de cada flujo de datos.

Quedan fuera la elección final de base de datos, proveedor/modelo, modo de renderizado, SSO, despliegue, versiones, estructura de workspaces, creación de dependencias y toda implementación.

## Alternativas que debe evaluar el informe

- SQLite frente a PostgreSQL, sin seleccionar una opción.
- OpenAI, la referencia exploratoria Whisper + Claude y posponer el procesamiento externo hasta obtener las aprobaciones necesarias. La referencia Whisper + Claude no se describirá como completamente local si la transcripción se envía a Claude.
- Responsabilidades dentro de una API local frente a adaptadores o procesos separados, explicando costos operativos, límites y consecuencias sin fijar arquitectura.
- Procesamiento con respuesta completa frente a trabajo en segundo plano, teniendo en cuenta que los detalles del contrato vigente son propuestas.
- Mantener la orientación local del scope de v1 y describir por separado las preguntas de nube/SSO, sin decidir su integración.

Cada alternativa debe presentar ventajas, desventajas, supuestos, riesgos y aprobaciones requeridas. La recomendación de Marco debe identificar qué opción favorece y por qué, pero Ronald debe aprobarla antes de considerar cerrada cualquier decisión.

## Impacto actual y componentes

No hay componentes de backend de producto que modificar. El informe considerará responsabilidades conceptuales asociadas a `apps/api/`, `apps/web/`, `packages/contracts/` y los adaptadores necesarios, pero esos espacios están reservados y vacíos. Los POCs pueden aportar observaciones; no se asumirán como base del producto.

## Contratos, datos y dependencias

- El análisis cubrirá contratos candidatos para metadatos de reunión, transcripción y notas; no creará ni aprobará campos, endpoints, estados o esquemas.
- El informe distinguirá transcripción temporal de datos de notas persistidos y reflejará las reglas de retención aprobadas, si las hubiera, sin habilitar el tratamiento.
- Se utilizará como marco el stack aprobado. No se agregarán dependencias ni versiones.
- La elección de base de datos, proveedor/modelo, renderizado, SSO y despliegue permanece abierta conforme a MN-08.

## Riesgos y mitigaciones

- **Iniciar antes de las revisiones:** exigir evidencia de los cuatro requisitos previos antes de comenzar el informe técnico.
- **Confundir decisiones del scope con decisiones de arquitectura:** etiquetar el scope como fuente de producto y sus menciones a SQLite/OpenAI como puntos que MN-08 debe reconciliar con sus decisiones expresamente pendientes.
- **Aprobación implícita de procesamiento externo:** identificar qué datos cruzarían cada frontera y no enviar datos reales ni configurar proveedores durante esta actividad.
- **Usar los POCs como arquitectura aprobada:** presentar su código como evidencia experimental únicamente.
- **Cerrar contratos demasiado pronto:** etiquetar campos, rutas, estados y payloads como candidatos hasta que Ronald los apruebe.

## Secuencia de trabajo

1. Confirmar y enlazar la revisión de UX, wireframes, scope y privacidad; mantener MN-08 en espera mientras falte evidencia.
2. Resolver la discrepancia documental sobre el estado del scope y las aprobaciones de tratamiento.
3. Inventariar límites actuales y decisiones técnicas sin inferir componentes implementados.
4. Preparar el informe comparativo de servicios, datos, contratos e integraciones dentro del stack aprobado.
5. Marco entrega el informe a Ronald y registra comentarios, aprobación y decisiones aún abiertas.
6. Planificar cualquier implementación como trabajo separado, después de las aprobaciones correspondientes.

## Criterios de aceptación verificables

1. Hay evidencia registrada de revisión del recorrido UX y los wireframes por Ronald.
2. El scope y los requisitos de privacidad tienen revisión y autoridad documental aclaradas antes de iniciar el análisis.
3. Marco entrega un informe de decisiones con alternativas, ventajas, desventajas, supuestos, riesgos y aprobaciones pendientes.
4. El informe mantiene DB, proveedor/modelo, renderizado, SSO y despliegue como decisiones pendientes.
5. No se selecciona una opción por inferencia y no comienza la implementación.
6. Ronald revisa el informe y sus decisiones quedan registradas.

## Validación y reversión

La validación será documental: comprobar que se cumplieron las condiciones de inicio, que las alternativas cubren los criterios y que cada decisión conserva su estado y evidencia. No hay código de producto que validar y no se ejecutan comandos ni pruebas.

La reversión no aplica a este plan documental. Cualquier implementación posterior deberá definir su propio plan de cambios, migración y reversión antes de afectar datos o integraciones.
