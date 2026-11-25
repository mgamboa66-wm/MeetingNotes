# MN-08 | Revisar la arquitectura de backend e integraciones después de aprobar UX

**Estado:** Borrador para revisión humana; no aprobado.  
**Condición de inicio:** revisar recorrido UX, wireframes, alcance del producto y requisitos de privacidad antes de comenzar el análisis de arquitectura.  
**Responsable del informe:** Marco.  
**Revisión prevista:** Ronald aprueba la recomendación.

> Este plan organiza una revisión de arquitectura dentro del alcance aprobado de v1. No autoriza implementación ni ampliaciones del alcance; la captura, el envío a OpenAI y la retención local de audio fallido siguen limitados a las reglas de [scope de v1](../MEETINGNOTES_V1_SCOPE.md).

## Objetivo

Preparar un informe de decisiones sobre límites potenciales de servicios e integraciones de backend para que Ronald lo revise y apruebe.

## Condición de inicio y estado actual

La condición de inicio **no está acreditada por los documentos encontrados**:

| Requisito previo | Evidencia disponible | Estado |
|---|---|---|
| Revisar el recorrido de UX | [MN-03](./MN-03-arquitectura-informacion.md) sigue como borrador y requiere revisión de Ronald. | Pendiente |
| Revisar wireframes | [MN-04](./MN-04-wireframes.md) aprueba preparar wireframes estáticos, pero indica que Ronald aún debe revisarlos. No se encontró un artefacto de wireframes independiente en el repositorio. | Pendiente |
| Revisar el alcance | El scope de v1 está aprobado y coincide con [AGENTS.md](../../AGENTS.md) y [README.md](../../README.md): aplicación local, SQLite y OpenAI. MN-08 mantiene esas decisiones como base. | Aclarado |
| Revisar requisitos de privacidad | [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md) sigue como borrador; falta revisar su matriz y registrar las preguntas operativas pendientes. Las aprobaciones adicionales aplican a decisiones no definidas por el scope o a cambios del tratamiento aprobado. | Pendiente |

[MN-01](./MN-01-alcance-mvp.md) se registra como ejecutado según confirmación de Marco y documenta que la discrepancia de autoridad sobre el scope quedó resuelta. Esto no sustituye la evidencia de las revisiones de UX, wireframes y privacidad que MN-08 requiere.

## Fuentes y autoridad

- [Instrucciones del repositorio](../../AGENTS.md): aprueban Bun + Hono, Drizzle + SQL con SQLite local, Vercel AI SDK + Zod y OpenAI como proveedor de v1. Siguen pendientes el mecanismo concreto de integración de SQLite, los modelos y detalles de OpenAI, el modo de renderizado y la operación local. Nube, SSO y sincronización quedan fuera de v1.
- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): aprobado; define una aplicación local con SQLite, procesamiento con OpenAI y sus reglas de negocio y tratamiento. MN-08 no reabre la base de datos ni el proveedor: documenta como pendientes sus detalles concretos de integración y los modelos/configuración de OpenAI.
- [Contrato API](../api/API_CONTRACT.md): propuesta técnica alineada al scope; sus rutas y detalles permanecen sujetos a revisión.
- [Guía frontend](../FRONTEND_API_GUIDE.md): guía basada en una API propuesta, no un contrato implementado.
- [README de prototipos](../../apps/prototypes/README.md): los POCs son experimentos aislados, no una arquitectura de producto aprobada.

## Hechos, supuestos y preguntas abiertas

### Hechos

- El stack base aprobado para el trabajo es Bun + Hono, Drizzle + SQL y Vercel AI SDK + Zod.
- El producto no tiene una API integrada, contratos compartidos implementados ni suite consolidada: `apps/api/`, `packages/contracts/` y `tests/` son espacios reservados.
- El scope de v1 y las instrucciones vigentes establecen SQLite local y OpenAI para v1. No están pendientes esas elecciones; sí lo están la integración concreta de SQLite y los modelos/configuración de OpenAI.
- El contrato de API actual es una propuesta; no debe confundirse con un contrato aprobado para implementación.

### Supuestos de trabajo

- El informe será de análisis y recomendación, no una especificación lista para codificar. Si se espera detalle de implementación, habrá que ampliar el alcance después de la revisión.
- Los límites se expresarán como responsabilidades conceptuales y no como nombres de paquetes, servicios desplegables o archivos existentes.
- Las alternativas se compararán dentro del stack aprobado. Cualquier dependencia o tecnología adicional se identificará como propuesta sujeta a aprobación.

### Preguntas abiertas

1. ¿Qué evidencia registrará la revisión de Ronald del recorrido UX y de los wireframes?
2. ¿Qué detalles de integración siguen abiertos para SQLite y OpenAI, y cómo se documentarán sin reabrir sus elecciones de v1?
3. ¿Qué requisitos de privacidad y seguridad siguen abiertos para integrar el flujo aprobado con OpenAI, y qué detalles adicionales requerirían aprobación antes de implementarse?
4. ¿El informe debe limitarse a arquitectura conceptual o incluir contratos candidatos con ejemplos de payloads, errores e idempotencia?
5. ¿Qué alternativas técnicas dentro del stack y del alcance aprobados deben compararse?

## Alcance del informe futuro

El informe comparará límites y responsabilidades potenciales para:

- Interfaz y API local.
- Captura por plataforma y su frontera con el backend, sin seleccionar helper o mecanismo de captura.
- Integración con OpenAI para transcribir y generar notas, manteniendo pendientes los modelos y la configuración concreta.
- Validación de entradas y salidas con Zod y el papel del Vercel AI SDK.
- Persistencia local mediante Drizzle + SQL con SQLite, manteniendo pendiente el mecanismo concreto de integración de SQLite.
- Contratos relacionados con metadatos de reuniones, ciclo de vida de transcripciones y notas.
- Errores, reintentos, idempotencia, procesamiento síncrono o en segundo plano, solo como alternativas a comparar.
- Implicaciones de privacidad y seguridad de cada flujo de datos.

Quedan fuera cambiar SQLite u OpenAI por otra base de datos o proveedor, el despliegue en nube, SSO, sincronización, versiones, estructura de workspaces, agregar dependencias e implementar. El modo de renderizado también queda fuera de este informe. La integración concreta de SQLite, los modelos/configuración de OpenAI y la operación de la API local siguen como decisiones técnicas pendientes.

## Alternativas que debe evaluar el informe

- SQLite local está definido para v1. La integración concreta se deja para el trabajo técnico posterior; este informe no compara SQLite con otras bases de datos ni selecciona un mecanismo de integración.
- OpenAI está definido como proveedor para v1. Los modelos, la configuración y los detalles de integración siguen pendientes; no se compararán proveedores alternativos.
- Responsabilidades dentro de una API local frente a adaptadores o procesos separados, explicando costos operativos, límites y consecuencias sin fijar arquitectura ni salir del alcance local.
- Mecanismos de procesamiento compatibles con la respuesta completa esperada por el scope, sin cambiar el comportamiento de producto ni el contrato aprobado.
- Nube, SSO y sincronización quedan fuera de v1; solo se reconsiderarán si se aprueba un alcance futuro que los incluya.

Cada alternativa técnica dentro del alcance aprobado debe presentar ventajas, desventajas, supuestos y riesgos, e identificar cualquier aprobación adicional necesaria si propone cambiar ese alcance. La recomendación de Marco debe indicar qué opción favorece y por qué; Ronald debe aprobarla antes de considerar cerradas las decisiones técnicas pendientes.

## Impacto actual y componentes

No hay componentes de backend de producto que modificar. El informe considerará responsabilidades conceptuales asociadas a `apps/api/`, `apps/web/`, `packages/contracts/` y los adaptadores necesarios, pero esos espacios están reservados y vacíos. Los POCs pueden aportar observaciones; no se asumirán como base del producto.

## Contratos, datos y dependencias

- El análisis cubrirá contratos candidatos para metadatos de reunión, transcripción y notas; no creará ni aprobará campos, endpoints, estados o esquemas.
- El informe distinguirá la transcripción temporal de las notas persistidas y seguirá las reglas de tratamiento y retención ya aprobadas para v1; no propondrá retención adicional.
- Se utilizará como marco el stack aprobado. No se agregarán dependencias ni versiones.
- SQLite y OpenAI son elecciones aprobadas para v1. Permanecen abiertos el mecanismo concreto de integración de SQLite, los modelos/configuración de OpenAI y los detalles de operación local. Nube, SSO y sincronización están fuera de v1; el modo de renderizado no forma parte de este informe.

## Riesgos y mitigaciones

- **Iniciar antes de las revisiones:** exigir evidencia de los requisitos previos que sigan pendientes antes de comenzar el informe técnico.
- **Reabrir decisiones aprobadas:** tratar SQLite y OpenAI como elecciones de producto ya definidas, y distinguirlas de sus detalles de integración aún pendientes.
- **Confundir análisis con autorización de ampliaciones:** identificar las fronteras de datos y limitar el informe al flujo aprobado con OpenAI; no usar datos reales ni configurar proveedores durante esta actividad.
- **Usar los POCs como arquitectura aprobada:** presentar su código como evidencia experimental únicamente.
- **Cerrar contratos demasiado pronto:** etiquetar campos, rutas, estados y payloads como candidatos hasta que Ronald los apruebe.

## Secuencia de trabajo

1. Confirmar y enlazar la revisión de UX, wireframes, scope y privacidad; mantener MN-08 en espera mientras falte evidencia.
2. Alinear el informe con el scope aprobado y separar sus reglas vigentes de las decisiones técnicas y controles operativos aún pendientes.
3. Inventariar límites actuales y decisiones técnicas sin inferir componentes implementados.
4. Preparar el informe comparativo de servicios, datos, contratos e integraciones dentro del stack aprobado.
5. Marco entrega el informe a Ronald y registra comentarios, aprobación y decisiones aún abiertas.
6. Planificar cualquier implementación como trabajo separado, después de las aprobaciones correspondientes.

## Criterios de aceptación verificables

1. Hay evidencia registrada de revisión del recorrido UX y los wireframes por Ronald.
2. El informe usa como autoridad el scope aprobado y registra la revisión de privacidad y los requisitos operativos aún pendientes antes de iniciar el análisis.
3. Marco entrega un informe de decisiones con alternativas, ventajas, desventajas, supuestos, riesgos y aprobaciones pendientes.
4. El informe mantiene SQLite y OpenAI como elecciones de v1, y señala como pendientes el mecanismo concreto de integración de SQLite, los modelos/configuración de OpenAI y los detalles locales de host, puerto e inicio junto a la aplicación de escritorio. Excluye nube, SSO y sincronización.
5. El informe no reabre las elecciones aprobadas de SQLite y OpenAI, no decide por inferencia los detalles técnicos que siguen abiertos y no inicia la implementación.
6. Ronald revisa el informe y sus decisiones quedan registradas.

## Validación y reversión

La validación será documental: comprobar que se cumplieron las condiciones de inicio, que las alternativas cubren los criterios y que cada decisión conserva su estado y evidencia. No hay código de producto que validar y no se ejecutan comandos ni pruebas.

La reversión no aplica a este plan documental. Cualquier implementación posterior deberá definir su propio plan de cambios, migración y reversión antes de afectar datos o integraciones.
