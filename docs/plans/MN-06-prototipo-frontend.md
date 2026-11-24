# MN-06 | Construir el prototipo de frontend a partir de wireframes aprobados

**Estado:** Borrador para revisión humana; no aprobado.  
**Objetivo:** construir una primera experiencia de frontend que represente los wireframes aprobados, usando datos de ejemplo y sin integrarse con el backend.

> Este plan prepara trabajo de interfaz únicamente. No autoriza captura de audio, transcripción, persistencia, integración con servicios externos ni implementación del backend.

## Fuentes y autoridad

| Fuente | Estado | Uso en este plan |
|---|---|---|
| Requerimiento MN-06 recibido en esta conversación | Solicitud de trabajo | Define el objetivo, las exclusiones y los criterios de aceptación indicados por la persona usuaria. |
| [Alcance aprobado de v1](../MEETINGNOTES_V1_SCOPE.md), secciones 2–6 | Aprobado | Define las funciones de producto que puede representar la interfaz: historial local, idioma por reunión, título, resumen, pendientes, límites de cuenta y tratamiento de datos. |
| [AGENTS.md](../../AGENTS.md), secciones «Propósito y alcance aprobado», «Stack técnico aprobado» y «Plan de implementación» | Instrucciones vigentes | Confirma React + TypeScript estricto, la ausencia de una aplicación integrada y la necesidad de no inventar arquitectura, dependencias ni comandos. |
| [README.md](../../README.md), secciones «Estado del proyecto», «Estructura» y «Desarrollo y validación» | Estado del repositorio | Confirma que apps/web está reservada, que no existe un manifiesto raíz y que los POCs son independientes. |
| [MN-01](./MN-01-alcance-mvp.md) | Ejecución declarada; aprobación atribuible no documentada en ese plan | Registra la ejecución de MN-01, pero contiene referencias anteriores a la aprobación del alcance que contradicen las instrucciones vigentes y el scope aprobado. Se conserva la distinción entre esas fuentes. |
| [MN-02](./MN-02-recorrido-usuario-reunion-a-notas.md) | Borrador para revisión; la revisión requerida no está registrada | Informa escenarios de recorrido, pero sus decisiones pendientes no se tratan como requisitos aprobados. |
| [MN-03](./MN-03-arquitectura-informacion.md) | Borrador para revisión; no aprobado | Sus páginas y componentes son propuestas, no una arquitectura de información aprobada. |
| [MN-04](./MN-04-wireframes.md) | Plan aprobado para preparar wireframes estáticos con datos ficticios | Autoriza el plan de diseño estático. El propio plan indica que la revisión de los wireframes está pendiente; su aprobación no demuestra que el artefacto final esté aprobado ni autoriza código de producto. |
| [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md) | Borrador para revisión; no aprobado | Contiene preguntas de revisión y referencias antiguas sobre tratamiento. El alcance vigente se toma de MEETINGNOTES_V1_SCOPE.md y AGENTS.md. |
| [Contrato API](../api/API_CONTRACT.md) y [guía de frontend](../FRONTEND_API_GUIDE.md) | Propuestas, no implementadas | Sirven para evitar que el prototipo aparente una integración real. MN-06 mantiene el frontend independiente del backend. |

No se encontró una plantilla aprobada para planes. Este borrador sigue una estructura Markdown similar a los documentos existentes, sin convertirla en convención normativa.

## Hechos comprobables

- El alcance aprobado describe una aplicación local para macOS y Windows, con idioma español o inglés por reunión, historial editable y resúmenes con pendientes. La transcripción no forma parte del historial y los pendientes no se marcan como completados ([scope, secciones 2 y 6](../MEETINGNOTES_V1_SCOPE.md)).
- El alcance define el tratamiento del audio para éxito y fallo, pero MN-06 excluye implementar ese tratamiento en el frontend; aquí solo se pueden mostrar los estados representados por los wireframes, con datos ficticios ([scope, sección 3](../MEETINGNOTES_V1_SCOPE.md)).
- apps/web está reservada y no contiene una aplicación de producto integrada. No hay manifiesto raíz, workspace de producto ni configuración de pruebas consolidada ([AGENTS.md, líneas 11–15 y 33–35](../../AGENTS.md); [README.md, líneas 7–9 y 23–46](../../README.md)).
- Los únicos ejemplos de interfaz identificados están bajo apps/prototypes/. Las instrucciones del repositorio indican mantener esos POCs separados hasta que un plan aprobado decida si alguno se convierte en base ([AGENTS.md, líneas 13 y 42](../../AGENTS.md)).
- MN-04 aprueba preparar wireframes estáticos, no implementar componentes. Sus criterios indican que la revisión final de los wireframes continúa pendiente ([MN-04, líneas 3–7 y 71–79](./MN-04-wireframes.md)).
- No se encontró un artefacto de wireframes aprobado en el árbol actual; la búsqueda encontró el plan MN-04 y una imagen perteneciente a un POC, no los wireframes del producto. Si el artefacto vive fuera del repositorio, su ubicación y versión deben agregarse antes de implementar.
- La condición de inicio de MN-06 exige que se revisen MN-01 a MN-05. En el repositorio, MN-02, MN-03 y MN-05 están marcados como borradores sin aprobar; MN-02 registra revisiones pendientes y MN-04 indica que la revisión de wireframes aún no está registrada. No hay evidencia documental de que el requisito de revisión de MN-01 a MN-05 se haya completado.

## Supuestos de trabajo

- “Prototipo de frontend” significa una interfaz de producto navegable con contenido ficticio; no una aplicación funcional conectada al backend. Motivo: MN-06 pide navegación y pantallas con datos de ejemplo, y excluye las integraciones. Si esta lectura no es correcta, cambiarían los límites del prototipo.
- Las pantallas y estados se tomarán de la versión aprobada de los wireframes, no de las propuestas de MN-03 ni de los POCs. Si no existe una versión aprobada, la implementación visual no puede verificar el criterio de fidelidad.
- Las acciones editables, si aparecen en los wireframes, pueden demostrarse solo con contenido de ejemplo en memoria. No se conservarán cambios al cerrar o recargar el prototipo.
- Se usarán ejemplos sintéticos claramente identificados. No se reutilizará audio, transcripciones, reuniones ni nombres de personas reales.

## Preguntas abiertas

### Bloquean iniciar la implementación

1. ¿Se han revisado MN-01 a MN-05 según la condición de inicio? La evidencia actual del repositorio no muestra que todas las revisiones estén registradas. La implementación depende de que se complete la revisión o se aporte el registro correspondiente.
2. ¿Dónde está la versión aprobada de los wireframes y cuál es su referencia o fecha? El repositorio solo contiene el plan MN-04 y este indica que la revisión del artefacto está pendiente.
3. ¿Se mantiene como destino el espacio reservado apps/web? El directorio no contiene una aplicación ni configuración. La ubicación es candidata, pero la estructura concreta no se decide aquí.
4. ¿Qué manifiesto y configuración aprobados debe usar el prototipo? No hay manifiesto de producto ni scripts disponibles. La implementación espera esa evidencia para no inventar dependencias o comandos.
5. ¿En qué entorno debe presentarse el prototipo —navegador o dentro del shell de escritorio—? El alcance aprueba una aplicación local, pero no especifica el empaquetado o el modo de renderizado.

### Se pueden resolver al revisar el prototipo

6. ¿Qué interacción local debe ser demostrable además de la navegación? El requerimiento no especifica si los controles de edición deben permitir cambios temporales en memoria o solo mostrar su representación visual.
7. ¿Cristina y Ericka revisarán una versión concreta en una sesión o mediante comentarios? El plan no atribuye fechas ni responsables adicionales; el criterio solo se considera satisfecho cuando ambas hayan revisado y sus comentarios queden registrados.
8. ¿Los wireframes incluyen campos de fecha? El alcance aprobado no exige meetingDate; no debe añadirse por inferencia si no aparece en los wireframes aprobados y en una decisión de producto.

## Alcance

### Incluido

- Navegación y estructura visual del espacio de trabajo de acuerdo con los wireframes aprobados.
- Pantallas representativas del historial/lista de reuniones y de la revisión de una reunión, según dichos wireframes.
- Contenido ficticio para reuniones, resúmenes y pendientes, identificable como dato de ejemplo.
- Estados vacío, de carga y de error correspondientes a las vistas de los wireframes.
- Selección visual de idioma español o inglés cuando la incluyan los wireframes aprobados.
- Revisión del prototipo por Cristina y Ericka, con registro de comentarios y disposición.

### Excluido

- Captura de audio, solicitud o gestión de permisos reales, transcripción o procesamiento con OpenAI.
- Persistencia local o remota, conexión a SQLite, API, sincronización, cuentas, autenticación y servicios externos.
- Datos de reuniones reales, transcripciones reales, claves o llamadas de red.
- Incorporar funciones que no estén en el alcance aprobado, como búsqueda, exportación, marcar pendientes completados, o agregar una entidad separada de Note.
- Convertir un POC existente en la base del producto sin una decisión aprobada.
- Elegir dependencias, estructura de carpetas, versiones, modo de renderizado o comandos que no estén establecidos por manifiestos o configuración vigentes.

## Criterios de aceptación verificables

1. Se cumplen las condiciones de inicio: constan las revisiones requeridas de MN-01 a MN-05 y se identifica la versión aprobada de wireframes.
2. La navegación, la jerarquía y las pantallas del prototipo corresponden a esa versión de wireframes; cada diferencia queda anotada y resuelta antes de considerar el criterio cumplido.
3. La interfaz muestra únicamente datos sintéticos, con una indicación visible de que son ejemplos.
4. Se pueden recorrer los estados vacío, carga y error previstos en los wireframes, sin depender de API, audio, persistencia ni servicios externos.
5. La estructura representa reuniones, resumen y pendientes dentro del alcance de v1. No agrega estado de completado, campos o secciones sin respaldo aprobado.
6. Se usa React y TypeScript estricto según la base aprobada; cualquier dependencia o configuración adicional se encuentra en manifiestos aprobados antes de utilizarla.
7. Cristina y Ericka revisan el prototipo; sus observaciones, disposición y cambios acordados quedan registrados. El criterio no se marca cumplido antes de esa revisión.
8. No se implementan captura de audio, transcripción, persistencia ni integraciones externas.

## Estado y patrones actuales

- No hay componentes de producto en apps/web ni configuración de aplicación en ese espacio ([AGENTS.md, líneas 11–15](../../AGENTS.md)).
- Los prototipos React existentes viven en apps/prototypes/poc-record-audio/ y apps/prototypes/poc-openai-macos/. Son POCs independientes y no están aprobados como base para la aplicación.
- MN-03 propone una lista de reuniones y un detalle con resumen y pendientes, pero permanece como borrador ([MN-03, secciones “Supuestos de trabajo” y “Estructura conceptual”](./MN-03-arquitectura-informacion.md)). No se toma como estructura aprobada.
- Los contratos HTTP están documentados como propuestas y no se usarán como dependencias de ejecución del prototipo ([API_CONTRACT.md](../api/API_CONTRACT.md), [FRONTEND_API_GUIDE.md](../FRONTEND_API_GUIDE.md)).

## Impacto por componente

| Componente | Estado actual | Impacto previsto |
|---|---|---|
| apps/web/ | Espacio reservado, sin aplicación integrada | Destino candidato para la experiencia de frontend. Los archivos concretos dependen de los manifiestos, configuración y estructura aprobados. |
| apps/prototypes/ | POCs independientes con código | Sin cambios; solo se consultan como referencia y no se integran automáticamente. |
| apps/api/, packages/contracts/, tests/ | Espacios reservados | Sin cambios previstos; MN-06 no añade API, contratos compartidos ni pruebas del backend. |
| docs/plans/MN-06-prototipo-frontend.md | Este borrador | Registrar aprobación, decisiones y resultado de revisión cuando ocurran. |

No se nombran componentes o archivos de implementación porque aún no existen en la aplicación del producto.

## Contratos, datos y dependencias

- No se modifica ni consume el contrato API. La UI utilizará fixtures/datos de ejemplo locales y no enviará solicitudes de red.
- La forma visual de Meeting y ActionItem debe seguir el alcance aprobado: título, idioma, resumen y pendientes; responsables y fechas solo cuando la reunión los menciona. No crear una entidad Note independiente por inferencia ([scope, secciones 2 y 6](../MEETINGNOTES_V1_SCOPE.md)).
- La selección de idioma puede mostrarse como control de interfaz; no implica llamar al backend.
- React + TypeScript estricto son la base aprobada. No se propone una dependencia nueva. Vike es recomendado en AGENTS.md, no una decisión obligatoria del requerimiento.
- Los comandos y mecanismos de validación se determinarán solo a partir de los manifiestos y configuración existentes cuando el trabajo autorizado comience. No se ejecutarán comandos de POCs para validar la aplicación de producto.

## Riesgos y mitigaciones

- **Wireframes ausentes o desactualizados:** pueden hacer imposible validar fidelidad o llevar a inventar pantallas. Confirmar la versión aprobada y contrastarla con el scope antes de codificar.
- **Revisiones previas sin registrar:** MN-06 podría empezar antes de cumplir su propia condición de inicio. Mantener el gate visible y documentar las revisiones de MN-01 a MN-05.
- **Falsa apariencia de integración:** una vista de carga, error o captura puede parecer funcional. Usar solo estados deterministas con datos sintéticos y no conectar servicios.
- **Deriva de alcance:** controles de búsqueda, exportación, estado de pendiente o fecha no están aprobados por el scope. Incluirlos solo si están respaldados por wireframes aprobados y por una decisión de producto compatible.
- **Dependencias o arquitectura inventadas:** no hay configuración del frontend de producto. Esperar por los manifiestos o una decisión aprobada de estructura antes de seleccionar herramientas o comandos.
- **Datos sensibles en ejemplos:** usar información sintética y marcarla como ejemplo; no usar reuniones internas reales.

## Alternativas

- **Esperar las revisiones y wireframes aprobados:** mantiene la fidelidad verificable y cumple la condición de inicio, pero aplaza el trabajo visual.
- **Preparar solo un mapa de cobertura estático:** permite detectar brechas mientras se completan las revisiones, pero no satisface el prototipo frontend solicitado.
- **Usar un POC como punto de partida:** puede acelerar una demostración, pero los POCs no son base aprobada y MN-06 no autoriza integrarlos. No se selecciona esta alternativa.

## Secuencia propuesta

1. Completar y registrar las revisiones exigidas de MN-01 a MN-05.
2. Localizar la versión aprobada de los wireframes y comprobar que refleje el alcance v1 vigente; resolver diferencias antes de implementar.
3. Confirmar el espacio de trabajo, los manifiestos y la configuración aprobados para el frontend. No seleccionar versiones, dependencias o comandos por suposición.
4. Preparar una matriz pantalla/estado → wireframe → criterio de aceptación, usando únicamente contenido ficticio.
5. Implementar navegación y pantallas representativas con datos de ejemplo locales, sin API, persistencia ni servicios externos.
6. Revisar cada estado contra los wireframes y ejecutar solo la validación definida por la configuración existente.
7. Presentar el prototipo a Cristina y Ericka, registrar sus comentarios y acordar los cambios dentro del alcance.
8. Actualizar el plan con los resultados observados; cualquier cambio de alcance o tecnología se somete a revisión antes de aplicarlo.

## Validación

- Comparación visual pantalla por pantalla con la versión aprobada de los wireframes.
- Recorrido manual de navegación, estados vacío, carga y error, e idioma de salida si aparece en los wireframes.
- Comprobación de que todos los registros son ficticios y que no hay llamadas de red, captura, transcripción ni persistencia.
- Verificación de TypeScript estricto mediante el comando definido en la configuración del producto, si existe al iniciar la implementación. Actualmente no hay manifiesto ni comando de frontend de producto identificable; no se inventa uno.
- Revisión por Cristina y Ericka con comentarios y disposición registrados.

La validación está prevista para la futura implementación y no se ejecuta como parte de este borrador.

## Reversión

No aplica reversión de audio, base de datos ni datos de usuario porque el prototipo no debe persistir ni procesar datos reales. Los cambios de interfaz podrían revertirse mediante el control de versiones disponible cuando se implemente; este plan no presupone una estrategia de ramas o commits.

## Decisiones para revisión humana

- Confirmar que se completaron las revisiones de MN-01 a MN-05 requeridas por la condición de inicio.
- Indicar la ubicación y versión de los wireframes aprobados; registrar cualquier aprobación visual que no esté ya documentada.
- Confirmar el manifiesto, la configuración y el espacio del producto donde se construirá el frontend.
- Aclarar si las interacciones de edición deben funcionar temporalmente en memoria o solo representarse visualmente.
- Confirmar el entorno de presentación del prototipo; el empaquetado de escritorio y el modo de renderizado siguen fuera de las decisiones de este plan.
- Registrar la revisión de Cristina y Ericka y decidir qué comentarios se aceptan dentro del alcance.
