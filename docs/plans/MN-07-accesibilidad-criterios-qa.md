# MN-07 | Definir requisitos de accesibilidad y criterios de aceptación de QA

**Estado:** Borrador para revisión humana; no aprobado.  
**Objetivo:** preparar una lista reutilizable que permita revisar la accesibilidad de la experiencia de v1 y, cuando exista una aplicación integrada y configuración de pruebas, evaluar los criterios ejecutables.  
**Entregable previsto:** checklist vinculada a cada pantalla y estado de los wireframes aprobados, con cada criterio clasificado como **revisión de diseño** o **verificación ejecutable**. El vínculo exacto queda pendiente: el repositorio contiene un plan aprobado para preparar wireframes, pero no encontré los wireframes ni constancia de su aprobación.

## Fuentes y autoridad

- **Requerimiento MN-07:** solicita navegación con teclado, orden del foco, etiquetas para lectores de pantalla, contraste, adaptación a distintos tamaños y estados de consentimiento, permisos, captura, procesamiento y errores. Cristina y Ericka preparan la lista.
- **Instrucciones vigentes:** [AGENTS.md](../../AGENTS.md) confirma que el alcance de producto de v1 está aprobado, pero que siguen pendientes detalles técnicos. También indica que no hay suite de pruebas de producto y que no se deben inventar ni ejecutar comandos de desarrollo.
- **Alcance aprobado:** [MEETINGNOTES_V1_SCOPE.md](../MEETINGNOTES_V1_SCOPE.md) define macOS y Windows. Describe un aviso de consentimiento visible y persistente que no bloquea la captura ni verifica el consentimiento de participantes.
- **MN-04:** el plan está aprobado para preparar wireframes estáticos con datos ficticios, pero la revisión de los wireframes sigue pendiente ([MN-04](./MN-04-wireframes.md)). Incluye estados de permisos, captura, procesamiento, revisión y recuperación como superficies de diseño; no encontré los wireframes como artefactos en el árbol actual.
- **Estado del producto:** [README.md](../../README.md) confirma que aún no existe una aplicación integrada ni un workspace de producto.
- **Prototipos y planes relacionados:** los POCs no son una base de producto aprobada ([README de prototipos](../../apps/prototypes/README.md)). El POC de captura muestra ejemplos de foco visible, nombres accesibles y estados ARIA ([CSS](../../apps/prototypes/poc-record-audio/src/index.css), [App.tsx](../../apps/prototypes/poc-record-audio/src/App.tsx)); son referencias experimentales, no criterios aprobados para el producto.
- No encontré una plantilla aprobada de checklist de QA.

**Discrepancia documental:** MN-04 conserva en algunas secciones afirmaciones sobre el estado de aprobación que corresponden a instrucciones anteriores y contradicen las instrucciones vigentes sobre el alcance de v1. Este borrador sigue las instrucciones vigentes; no copia aquellas afirmaciones como hechos actuales.

## Hechos comprobables

- El alcance de v1 cubre macOS y Windows, pero no define un estándar de accesibilidad ni umbrales de contraste ([scope, secciones 2 y 5](../MEETINGNOTES_V1_SCOPE.md)).
- El aviso de consentimiento debe ser visible y persistente; no bloquea la captura ni verifica por sí mismo el consentimiento de participantes ([scope, sección 2](../MEETINGNOTES_V1_SCOPE.md)).
- MN-04 propone superficies estáticas de estado vacío, configuración, aviso y permisos, captura, procesamiento, revisión y recuperación. También pide que los estados no dependan solo del color ([MN-04, alcance y validación](./MN-04-wireframes.md)).
- No hay suite de pruebas de producto ni comandos de validación en la raíz ([AGENTS.md](../../AGENTS.md), [README.md](../../README.md)). Los manifiestos de los POCs contienen comandos de desarrollo y compilación, no scripts de prueba ([poc-record-audio](../../apps/prototypes/poc-record-audio/package.json), [poc-openai-macos](../../apps/prototypes/poc-openai-macos/package.json)).
- El criterio de MN-07 pide asociar la lista a wireframes aprobados. El repositorio consultado contiene el plan para prepararlos, pero no los artefactos ni evidencia de que se hayan revisado y aprobado.

## Estado y patrones actuales

- Las carpetas de producto y tests siguen reservadas; no hay interfaz integrada donde verificar comportamiento real de teclado, lector de pantalla o tamaños de ventana ([AGENTS.md](../../AGENTS.md)).
- MN-04 tiene autorización para preparar wireframes estáticos, no para implementar una interfaz. Su revisión por Ronald figura pendiente en el documento.
- Hay ejemplos de foco visible y semántica ARIA en un POC, pero esos ejemplos no forman un patrón aprobado para el producto.
- El repositorio no documenta una configuración de pruebas de producto. No se inspeccionan ni ejecutan comandos de POC para validar MN-07.

## Supuestos de trabajo

- La lista tendrá una referencia a la pantalla o estado del wireframe para que sus criterios sean trazables y reutilizables.
- Cada criterio indicará si corresponde a revisión del diseño o a verificación posterior sobre una interfaz implementada.
- La lista no fijará un estándar de conformidad, umbral de contraste, tamaño de ventana ni lector de pantalla sin una decisión aprobada.

Si los wireframes aprobados no están disponibles, el vínculo y la cobertura por pantalla no pueden completarse todavía; puede prepararse la estructura de la lista mientras tanto.

## Preguntas abiertas

### Bloquean completar la lista vinculada

1. ¿Dónde están los wireframes aprobados y qué evidencia confirma su aprobación? MN-04 acredita la aprobación del plan para prepararlos, pero indica que la revisión del artefacto está pendiente.
2. ¿Qué estándar o nivel de accesibilidad se usará, si corresponde? Sin esa decisión no se puede fijar un umbral verificable de contraste.
3. ¿Qué tamaños de ventana y configuraciones de escala deben cubrirse para macOS y Windows?
4. ¿Qué combinaciones de lector de pantalla y sistema operativo se evaluarán?

### Pueden cerrarse antes de cualquier verificación ejecutable

5. ¿Qué estados de permiso, captura, procesamiento y error aparecerán en los wireframes finales? Los detalles nativos de permisos siguen abiertos en AGENTS.md.
6. ¿Qué evidencia registrará que Cristina y Ericka prepararon y revisaron la lista? El requerimiento las identifica como responsables de prepararla, pero no define un formato de registro.
7. Cuando exista una suite, ¿qué criterios se verificarán manualmente y cuáles se convertirán en pruebas automatizadas? No hay base para elegirlo ahora.

## Alcance propuesto

**Incluye:** estructurar una checklist reutilizable; cubrir teclado y foco, etiquetas accesibles, contraste, adaptación a tamaños, consentimiento y permisos, estados de captura y procesamiento, y errores; asociar cada criterio a wireframes cuando estén disponibles; separar revisión del diseño de pruebas ejecutables.

**Excluye:** implementar cambios de interfaz, elegir un estándar de accesibilidad, definir comportamiento nuevo de consentimiento o permisos, crear una suite de pruebas, y ejecutar pruebas o comandos.

## Estructura candidata de la lista

Cada fila podría contener:

| Campo | Uso |
|---|---|
| Referencia al wireframe | Identificar pantalla y estado; queda pendiente hasta localizar los artefactos aprobados. |
| Criterio observable | Describir qué debe poder percibirse o hacerse. |
| Tipo de verificación | Revisión de diseño o verificación ejecutable posterior. |
| Evidencia y resultado | Registrar observación, resultado o bloqueo según el procedimiento que acuerden Cristina y Ericka. |

Cobertura propuesta:

| Área | Revisión de diseño | Verificación posterior, si existe UI |
|---|---|---|
| Teclado y foco | Identificar acciones y anotar el orden esperado del foco en cada estado y transición. | Confirmar que se puede operar con teclado, que el foco visible sigue el orden acordado y que no queda atrapado. |
| Lectores de pantalla | Identificar controles, nombres, encabezados y estados que deben tener una representación accesible. | Comprobar nombres y estados accesibles y que los cambios de procesamiento y errores se comuniquen. |
| Contraste | Revisar texto, controles, foco y estados según el umbral que se apruebe. | Medir la interfaz implementada contra ese mismo umbral. |
| Tamaños de pantalla | Revisar que los wireframes cubran los tamaños acordados y que el contenido conserve orden y legibilidad. | Comprobar desbordamientos, superposiciones y orden al cambiar el tamaño dentro de la matriz acordada. |
| Consentimiento y permisos | Verificar que el aviso sea visible y persistente, sin sugerir que verifica el consentimiento de participantes. Representar denegación de permisos según los wireframes. | Comprobar anuncios y comportamiento de los estados aprobados en las plataformas definidas. |
| Captura, procesamiento y errores | Revisar que los estados se distingan con texto y no solo con color, siguiendo el criterio de MN-04. | Comprobar anuncios, foco y recuperación contra el comportamiento funcional aprobado. |

La revisión de un wireframe no demuestra que la interfaz implementada funcione con teclado o lector de pantalla. Esos resultados pertenecen a una verificación posterior.

## Criterios de aceptación verificables

1. Cristina y Ericka preparan una lista reutilizable con los campos y áreas de cobertura acordados.
2. La lista cubre todos los criterios solicitados por MN-07 y cada criterio se clasifica como revisión de diseño o verificación ejecutable.
3. Cada criterio se vincula a una pantalla o estado identificable de los wireframes aprobados. **Pendiente:** los artefactos y su aprobación no aparecen en el repositorio.
4. Los criterios de contraste usan un umbral explícitamente acordado; el plan no inventa uno.
5. La lista cubre consentimiento y permisos sin contradecir el alcance aprobado ni asignar a la interfaz una verificación del consentimiento de participantes.
6. Las verificaciones ejecutables quedan identificadas como futuras; no se agregan ni se ejecutan comandos de prueba mientras no exista configuración de pruebas.
7. La preparación y la revisión de la lista quedan registradas. Este criterio no se considera satisfecho hasta que se produzca esa evidencia.

## Impacto por componente

| Componente existente | Responsabilidad actual | Impacto previsto |
|---|---|---|
| docs/plans/MN-04-wireframes.md | Plan aprobado para preparar wireframes estáticos; revisión del artefacto pendiente | Proveer las superficies y estados que luego se enlazarían en la checklist. No se modifica en este plan. |
| docs/MEETINGNOTES_V1_SCOPE.md | Alcance aprobado de v1 | Referencia para el aviso de consentimiento y las plataformas. No se amplía el comportamiento aprobado. |
| apps/web/, apps/api/, packages/contracts/, tests/ | Espacios reservados; no hay producto ni suite integrados | Ningún cambio de código previsto en MN-07. |
| apps/prototypes/ | POCs independientes | Solo referencias experimentales; no se integran ni se convierten en patrones obligatorios. |

## Contratos, datos y dependencias

No se proponen cambios a API, esquemas o datos, ni se agregan dependencias. La checklist describirá expectativas de UX y referencias a wireframes; no cambiará contratos de captura o procesamiento. La configuración de pruebas y cualquier comando de QA pertenecen a un trabajo posterior cuando exista una suite de producto.

## Riesgos y alternativas

- **Tomar el plan por los wireframes:** MN-04 está aprobado para preparar wireframes, pero no demuestra que el artefacto esté aprobado. Mantener pendiente la referencia a pantallas hasta localizarlo.
- **Confundir diseño con funcionamiento:** un boceto no verifica el orden real del teclado ni los anuncios de un lector de pantalla. Mantener esos criterios en una fase ejecutable posterior.
- **Inventar umbrales o dispositivos:** sin estándar, tamaños y tecnologías de asistencia definidos, los resultados podrían no ser reproducibles. Dejarlos como preguntas abiertas.
- **Alterar consentimiento:** el scope aprueba un aviso persistente que no bloquea la captura ni verifica el consentimiento de participantes. La checklist no debe introducir un bloqueo o una promesa nueva.
- **Una matriz única frente a listas separadas:** una columna de tipo mantiene el vínculo y diferencia revisión de diseño de prueba; listas separadas pueden aclarar responsabilidades, pero duplicar referencias. La decisión de formato queda para Cristina y Ericka.

## Secuencia propuesta

1. Localizar los wireframes y confirmar su estado de aprobación.
2. Acordar el estándar de accesibilidad, el umbral de contraste y la matriz de tamaños y tecnologías de asistencia.
3. Vincular cada pantalla y estado con las áreas de cobertura de MN-07.
4. Cristina y Ericka preparan la lista, separando revisión de diseño y verificación ejecutable.
5. Revisar cobertura, referencias y criterios pendientes; registrar cambios.
6. Cuando la aplicación y la configuración de pruebas existan, planificar la fase de verificación ejecutable y sus comandos a partir de esa configuración.

## Validación

La validación de este plan es documental: comprobar que cada criterio solicitado tenga cobertura, tipo de verificación y referencia al wireframe correspondiente. No ejecutar pruebas ni comandos. El repositorio no tiene configuración de pruebas de producto.

## Reversión

No aplica reversión de software o datos porque este borrador no modifica el producto. La lista futura debería conservar referencias a la versión de los wireframes que revise.

## Decisiones para revisión humana

- Ubicar y confirmar la aprobación de los wireframes.
- Acordar estándar o nivel de accesibilidad, umbral de contraste, tamaños y tecnologías de asistencia.
- Confirmar estados de permisos y cómo representar en wireframes el comportamiento aprobado de consentimiento.
- Registrar la preparación de Cristina y Ericka.
- Dejar para una fase posterior la configuración de pruebas y los criterios ejecutables.
