# MN-02 | Mapear el recorrido de usuario de reunión a notas

**Estado:** Borrador para revisión humana; no aprobado.  
**Propósito:** preparar un mapa conceptual desde el ingreso a la aplicación hasta la revisión y salida de las notas, incluidos los casos de recuperación indicados en MN-02. El mapa no autoriza captura, procesamiento externo ni retención de audio.  
**Revisión requerida:** Ronald y Ericka deben revisar el recorrido; la revisión aún no está registrada.

## Fuentes y autoridad

- **Requerimiento MN-02:** fuente de los tramos y escenarios que debe cubrir este mapa, incluida la revisión por Ronald y Ericka. También exige no presentar captura o procesamiento externo como aprobados.
- **Instrucciones vigentes:** [AGENTS.md](../../AGENTS.md) indica que no hay un plan de implementación aprobado y mantiene bajo revisión el alcance, las plataformas, la captura y el tratamiento de datos. Prohíbe habilitar grabación, transmisión o retención sin aprobación explícita.
- **Discrepancia de alcance:** [MEETINGNOTES_V1_SCOPE.md](../MEETINGNOTES_V1_SCOPE.md) se declara aprobado e incluye captura local, envío a OpenAI, historial y reglas de retención. Sin embargo, [MN-01](./MN-01-alcance-mvp.md) registra que la discrepancia sigue abierta y que no se encontró evidencia atribuible de aprobación de Producto y Privacidad. Este plan conserva la discrepancia; no toma el alcance como autorización operativa.
- **Planes relacionados:** MN-01 figura como ejecutado según confirmación de la persona usuaria, pero aclara que eso no aprueba el tratamiento de audio. [MN-03](./MN-03-arquitectura-informacion.md) es un borrador. [MN-04](./MN-04-wireframes.md) está aprobado únicamente para preparar wireframes estáticos con datos ficticios, no para habilitar captura ni procesamiento.
- **Contratos y prototipos:** el [contrato de API](../api/API_CONTRACT.md) es una propuesta; la [guía de frontend](../FRONTEND_API_GUIDE.md) describe endpoints no implementados. Los [POCs](../prototypes/README.md) son experimentos aislados, no una aplicación integrada ni una arquitectura aprobada.
- No encontré una plantilla aprobada para planes. Se usa Markdown como los planes existentes, sin afirmar que sea una convención normativa.

## Hechos comprobables

- Las carpetas apps/web, apps/api, packages/contracts y tests son espacios reservados; no hay aplicación de producto integrada ni suite consolidada ([README.md](../../README.md), [AGENTS.md](../../AGENTS.md)).
- El scope documenta una aplicación local, revisión y edición de título, resumen y pendientes, pero esas decisiones aparecen dentro de la discrepancia de autoridad. También dice que el aviso de consentimiento no verifica el consentimiento de participantes ni bloquea por sí mismo la captura ([scope, secciones 2–3](../MEETINGNOTES_V1_SCOPE.md)).
- El contrato propone conservar audio local si falla el procesamiento. La guía frontend propone estados y un flujo de operaciones distinto. Esos detalles no son contratos implementados ([API, secciones 2–4](../api/API_CONTRACT.md), [guía frontend, secciones Flujo y Operación y resultado](../FRONTEND_API_GUIDE.md)).
- MN-01 deja la exportación a Markdown sin definir, y MN-03 también la mantiene como decisión abierta ([MN-01](./MN-01-alcance-mvp.md), [MN-03](./MN-03-arquitectura-informacion.md)).
- El README principal indica que no hay comandos de validación para la raíz ni pruebas consolidadas ([README.md](../../README.md)).

## Supuestos de trabajo

- El mapa será conceptual y revisable; sus etapas no describen pantallas, API ni comportamiento ya implementados.
- La rama de rechazo se representa como escenario porque MN-02 pide cubrirla. Su significado y sus consecuencias quedan abiertos; el mapa no resuelve la discrepancia con el aviso descrito en el scope.
- «Guardar» y «exportar» se muestran como salidas a evaluar. No se presupone que SQLite, un formato de exportación o un destino de archivo estén aprobados.
- Ronald y Ericka revisarán el recorrido conforme al requerimiento. No se les atribuye responsabilidad de aprobación adicional.

## Preguntas abiertas

### Bloquean tratar el flujo como autorizado o implementable

1. ¿Qué registro resuelve la diferencia entre AGENTS.md, MN-01 y el scope de v1, en particular para captura, servicios externos y retención?
2. ¿Qué significa «consentimiento» en el recorrido: aviso, decisión de la persona usuaria o consentimiento de participantes? ¿Qué debe pasar cuando alguien rechaza continuar?
3. ¿Qué plataformas y permisos se contemplan, y qué comportamiento debe mostrarse si se deniegan, revocan o no están disponibles?
4. ¿Qué ocurre con audio o datos parciales tras una interrupción o error: conservar, reintentar, descartar o eliminar? La decisión afecta privacidad y recuperación.
5. ¿Se aprueba guardar localmente? ¿Se incluye exportación? Si se incluye, faltan formato, destino y reglas de eliminación.

### Pueden definirse al cerrar el mapa, antes de diseñar implementación

6. ¿Qué pantalla recibe a la persona y a dónde vuelve tras rechazar o recuperarse de un error?
7. ¿El idioma de salida y otros datos de la reunión aparecen antes del procesamiento? El scope lo describe, pero su autoridad está en disputa.
8. ¿Cómo se armonizan los estados de procesamiento de la API propuesta con los estados asíncronos de la guía frontend?
9. ¿Qué comentarios dejan Ronald y Ericka, y cómo se registra que revisaron el recorrido?

## Alcance propuesto

**Incluye:** ingreso a la aplicación; aviso y estado de consentimiento; permisos; inicio, detención e interrupción de captura; progreso conceptual del procesamiento; errores de transcripción y generación de notas; revisión y edición; guardar/exportar como opciones pendientes; rutas candidatas de recuperación.

**Excluye:** implementar o simular captura real; enviar audio o notas a servicios externos; decidir permisos por sistema operativo; fijar almacenamiento, retención, API, estados técnicos o política de reintentos.

## Mapa conceptual candidato

Las decisiones señaladas quedan pendientes. La ruta de rechazo se incluye para revisión y no representa una decisión aprobada.

1. **Ingreso a la aplicación** → mostrar una pantalla inicial, cuya función y contenido están por definir.
2. **Aviso y estado del consentimiento** → aclarar qué comunica el aviso y qué significa continuar.
   - **Rechazo:** no continuar con este escenario; la salida o alternativa queda por definir. Esta rama no resuelve la diferencia con el scope, que dice que el aviso no bloquea la captura.
   - **Continuar:** revisar si están disponibles los permisos necesarios.
3. **Permisos**
   - **Faltan o se deniegan:** indicar que la captura no está disponible; definir la explicación y si la persona puede revisar permisos, reintentar o salir. El comportamiento depende de la plataforma.
   - **Disponibles:** avanzar a la etapa conceptual de captura.
4. **Captura**
   - **Inicio y detención normales:** mostrar el estado de la fuente o grabación; método y señales visibles pendientes.
   - **Interrupción:** mostrar que la captura no terminó. Definir si se puede recuperar el material parcial, iniciar otra captura o descartarlo; no asumir retención.
5. **Procesamiento conceptual**
   - Mostrar progreso sin fijar proveedor, estados técnicos, porcentajes ni tiempos.
   - **Error de transcripción:** distinguirlo del error de generación de notas; ofrecer reintentar o descartar como opciones por revisar. La conservación de datos queda pendiente.
   - **Error al generar notas:** ofrecer reintentar o descartar como opciones por revisar. El estado del audio y la transcripción queda pendiente.
6. **Revisión de notas** → mostrar el resultado y permitir revisar y editar los campos que se confirmen.
7. **Salida**
   - **Guardar:** destino e implementación de persistencia por confirmar.
   - **Exportar:** inclusión, formato, destino y eliminación por confirmar.

## Criterios de aceptación verificables

1. El mapa cubre el flujo normal desde el ingreso hasta la revisión de notas y muestra guardar y exportar como salidas, con sus decisiones abiertas.
2. Aparecen ramas diferenciadas para rechazo del consentimiento, permisos ausentes, captura interrumpida, error de transcripción y error al generar notas.
3. Cada rama de error incluye una ruta candidata de recuperación o identifica explícitamente qué decisión falta; no presupone retención del audio ni reintentos técnicamente posibles.
4. El mapa distingue etapas conceptuales de cualquier contrato de API o comportamiento implementado.
5. El documento marca captura y procesamiento externo como **no autorizados por este plan** y mantiene visible la discrepancia documental.
6. Ronald y Ericka revisan el recorrido y sus comentarios quedan registrados. **Pendiente:** este criterio solo se satisface cuando ocurra la revisión.

## Impacto por componente

| Componente existente | Responsabilidad actual | Impacto previsto |
|---|---|---|
| docs/MEETINGNOTES_V1_SCOPE.md, docs/plans/MN-01-alcance-mvp.md | Scope documentado y registro de discrepancias | Referencias para marcar qué partes del flujo son propuestas y qué requiere aclaración. No se modifican en este plan. |
| docs/plans/MN-03-arquitectura-informacion.md, docs/plans/MN-04-wireframes.md | Borrador de arquitectura de información y plan aprobado para wireframes estáticos | Consultar consistencia de notas, revisión y estados; no tratar sus propuestas visuales como aprobación de producto. |
| docs/api/API_CONTRACT.md, docs/FRONTEND_API_GUIDE.md | Propuestas de contratos y flujo técnico | Señalar discrepancias; no fijar rutas o estados en MN-02. |
| apps/web/, apps/api/, packages/contracts/, tests/ | Espacios reservados | Ningún cambio de código previsto para este plan. |
| apps/prototypes/ | POCs aislados | No se propone integrarlos ni convertirlos en base del producto. |

## Contratos, datos y dependencias

No se proponen cambios de API, eventos, esquemas, persistencia ni dependencias. El mapa debe evitar concretar captureId, estados técnicos, llamadas externas o manejo de errores de proveedor porque las fuentes que los describen son propuestas y no coinciden entre sí. Cualquier decisión sobre audio, transcripción, notas, retención o exportación requiere resolver primero las preguntas de autoridad y tratamiento de datos.

## Riesgos y alternativas

- **Aprobación implícita:** un recorrido detallado podría leerse como autorización. Mitigación propuesta: rotular captura y procesamiento como escenarios conceptuales pendientes.
- **Consentimiento ambiguo:** se podría confundir un aviso con consentimiento verificable. Mitigación propuesta: mantener separadas la negativa a continuar, los permisos del sistema y el consentimiento de participantes hasta acordar su significado.
- **Pérdida o retención accidental:** las rutas de error pueden sugerir que el audio se conserva. Mitigación propuesta: no asignar retención a ninguna rama hasta que se apruebe.
- **Contrato prematuro:** diferenciar estados técnicos de transcripción y generación no debe resolver la divergencia síncrona/asíncrona de los documentos técnicos.
- **Alternativas de detalle:** un mapa genérico con notas por plataforma evita fijar permisos; mapas separados por sistema operativo serían más concretos, pero dependen de decisiones pendientes. También se puede posponer el detalle hasta aclarar autoridad y consentimiento, aunque eso dejaría sin revisar escenarios exigidos por MN-02.

## Secuencia propuesta

1. Mantener visible la discrepancia de autoridad y tratamiento.
2. Trazar el flujo normal y las cinco ramas requeridas por MN-02.
3. Marcar decisiones sin evidencia como pendientes; no convertir propuestas técnicas en requisitos.
4. Revisar cobertura y coherencia con Ronald y Ericka.
5. Registrar comentarios, decisiones y preguntas abiertas antes de usar el mapa como insumo de diseño o implementación.

## Validación

La validación prevista es una revisión documental: comprobar la cobertura de cada criterio, rastrear las afirmaciones a las fuentes citadas y confirmar que ningún texto presenta captura o procesamiento externo como autorizado. El repositorio no documenta validación consolidada para esta tarea. No ejecutar comandos de desarrollo o pruebas para este plan.

## Reversión

No aplica reversión de software ni datos porque este plan no modifica sistemas ni datos de producto. Si se revisa el documento, mantener visible su estado de borrador hasta que exista aprobación explícita.

## Decisiones para revisión humana

- Resolver la autoridad del alcance y el registro de aprobaciones.
- Definir el sentido del consentimiento y las ramas de rechazo y permisos.
- Acordar el tratamiento de datos interrumpidos o fallidos.
- Decidir si guardar y/o exportar forma parte del alcance y con qué condiciones.
- Registrar la revisión de Ronald y Ericka.
