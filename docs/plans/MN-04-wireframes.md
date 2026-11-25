# MN-04 | Crear wireframes para configuración, captura y revisión de notas

**Estado:** Aprobado por Marco para preparar wireframes estáticos.  
**Fecha de aprobación del plan:** 2026-11-24.  
**Revisión de wireframes:** pendiente; Ronald debe revisarlos.

> La aprobación de este plan autoriza preparar una propuesta visual con datos ficticios. No aprueba ni habilita captura, transmisión, procesamiento, retención de audio, permisos reales ni implementación de producto.

## Objetivo

Proponer una experiencia de usuario revisable antes de comenzar el trabajo de backend. El entregable será un conjunto de wireframes estáticos con anotaciones de supuestos y decisiones pendientes.

Se recomienda comenzar en baja fidelidad para revisar el recorrido, los contenidos y los estados antes de invertir en detalles visuales. La solicitud permite baja o alta fidelidad; esta recomendación no es una decisión de diseño definitiva.

## Autoridad y fuentes

- [Instrucciones del repositorio](../../AGENTS.md): indican que el alcance, plataformas, captura y tratamiento de datos requieren revisión humana; también prohíben habilitar captura, transmisión o retención sin aprobación explícita.
- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): se titula “alcance aprobado” y describe el producto, sus pantallas posibles y reglas de negocio.
- [Contexto temporal de v1](../MEETINGNOTES_V1_CONTEXT_TEMP.md): se declara borrador y dice que el equipo aún debe aprobar el alcance y tratamiento de datos.
- [Contrato de API](../api/API_CONTRACT.md) y [guía de frontend](../FRONTEND_API_GUIDE.md): son propuestas sujetas a revisión, no especificaciones implementadas.
- [README de prototipos](../../apps/prototypes/README.md): declara que los POCs son experimentos aislados y no aprueban por sí mismos decisiones de producto.

**Conflicto de autoridad:** el scope de v1 se declara aprobado, pero `AGENTS.md` aún clasifica el alcance y el tratamiento de datos como pendientes de revisión. Este plan no resuelve esa discrepancia. Hasta que se aclare, los wireframes usarán el scope como referencia para explorar pantallas, pero no describirán captura ni procesamiento como funciones autorizadas o disponibles.

No encontré una plantilla de wireframes ni planes previos en `docs/plans/`; antes de crear este archivo, la carpeta solo contenía `.gitkeep`. Este documento sigue el formato Markdown del repositorio, sin afirmar que sea una plantilla aprobada.

## Hechos documentados

- El scope de v1 describe una aplicación local, idioma elegido por reunión (español o inglés), historial editable, resumen y pendientes. También indica que no se deben inventar responsables, fechas ni compromisos; véase [MEETINGNOTES_V1_SCOPE.md](../MEETINGNOTES_V1_SCOPE.md), secciones 2 y 3.
- Ese documento especifica un aviso de consentimiento visible y persistente, y aclara que no bloquea la captura ni verifica el consentimiento de las personas participantes.
- El scope documenta eliminación local de audio y transcripción tras éxito y conservación local del audio fallido para reintento o eliminación manual. `AGENTS.md` mantiene la retención sujeta a aprobación explícita.
- `apps/web/`, `apps/api/`, `packages/contracts/` y `tests/` son espacios reservados sin aplicación ni suite integrada. Los POCs tienen código separado.
- Los POCs contienen ejemplos visuales de tarjetas, estados, indicadores de nivel, mensajes de estado/error y resultados con resumen y pendientes. Son referencias visuales, no componentes base aprobados: [POC de captura](../../apps/prototypes/poc-record-audio/src/App.tsx) y [POC OpenAI](../../apps/prototypes/poc-openai-macos/src/App.tsx).
- El contrato y la guía frontend describen estados y rutas propuestas. El contexto temporal señala que algunos detalles de procesamiento y el contrato no están alineados; por eso no se fijarán rutas ni semántica de API en los wireframes.

## Supuestos de trabajo

- Los wireframes serán estáticos, no funcionales y usarán únicamente datos sintéticos, rotulados como “Datos de ejemplo”.
- La interfaz se redactará en español para seguir el idioma predominante de la documentación; la configuración ilustrará la elección de idioma de salida es/en descrita en el scope.
- Los estados de captura, procesamiento y error serán representaciones conceptuales. No mostrarán datos de audio real, actividad de red, permisos concedidos realmente, porcentajes medidos ni tiempos estimados.
- La baja fidelidad es el punto de partida recomendado; se puede cambiar si la revisión de Ronald requiere validar estilo visual.

## Alcance

### Incluido

| Superficie | Cobertura propuesta |
|---|---|
| Espacio principal e historial | Vista vacía y vista con reuniones ficticias. No sugerir sincronización entre equipos. |
| Configuración de reunión | Selector ilustrativo de idioma de salida español/inglés. Marcar título y fecha como campos sujetos a definición si aparecen. |
| Aviso y permisos | Aviso de uso y estados ilustrativos de permisos. Etiquetar el texto como borrador y no representar el aviso como verificación de consentimiento. |
| Captura | Estados visuales de lista, inicio, captura, detención y error; cualquier medidor tendrá valor ficticio claramente indicado. |
| Procesamiento | Estado en progreso, resultado completado y fallo; sin porcentaje, ETA, cancelación o secuencia técnica no aprobada. |
| Revisión de notas | Título, resumen y pendientes editables en una muestra; también estado sin pendientes. No añadir estado “completado” a los pendientes. |
| Estados transversales | Vacío, carga y error para las consultas o etapas pertinentes del recorrido. |
| Recuperación | Lista de captura fallida, reintento y eliminación solo como escenario exploratorio y sujeto a aprobar retención y comportamiento. |

### Fuera de alcance

- Código, componentes funcionales, API, captura de audio, permisos reales, llamadas a OpenAI, almacenamiento o retención.
- Uso de transcripciones, audio, notas o datos reales de reuniones.
- Decidir arquitectura, tecnología de diseño, rutas, payloads, semántica final de estados o estructura adicional del repositorio.
- Afirmar que los wireframes constituyen aprobación de producto, privacidad, consentimiento o tratamiento de datos.

## Recorrido conceptual

Espacio principal → configuración de reunión → aviso/permisos ilustrativos → estado de captura → progreso de procesamiento → revisión y edición de notas → historial.

Desde captura o procesamiento se mostrarán variantes de error. La vista de captura fallida y sus acciones son una exploración del scope documentado, no una autorización para retener audio. Todas las pantallas y transiciones permanecerán estáticas.

## Criterios de aceptación verificables

1. Hay wireframes para cada superficie y familia de estados de la tabla de alcance.
2. Todo contenido de reunión es ficticio y está identificado visiblemente como dato de ejemplo.
3. Cada pantalla incluye anotaciones que separan hechos documentados, supuestos y preguntas abiertas, con referencias a las fuentes pertinentes.
4. El aviso de consentimiento no se presenta como prueba de consentimiento; la captura y el procesamiento se identifican como exploratorios y no funcionales.
5. No se fijan rutas, porcentajes de progreso, ETA, estados técnicos ni comportamiento de retención que las fuentes dejan pendientes o en conflicto.
6. Ronald revisa los wireframes; sus comentarios y su disposición quedan registrados antes de considerar cumplido este criterio.
7. Si la discrepancia de aprobación entre `AGENTS.md` y el documento de scope sigue abierta, el artefacto lo declara y no etiqueta el recorrido como aprobado.

## Impacto por componente

No hay componentes de producto implementados que deban cambiar. El impacto previsto es únicamente en el artefacto de diseño: espacio principal, configuración, aviso/permisos, captura, procesamiento, resultado editable e historial. Los POCs pueden consultarse como referencias de jerarquía visual; no se propone convertirlos en base del producto.

## Contratos y dependencias

- No se proponen cambios de API, esquemas, contratos compartidos ni datos persistentes.
- No se agregan dependencias de software. La herramienta y ubicación final de los wireframes quedan por decidir.
- Las rutas y modelos de `docs/api/API_CONTRACT.md` y `docs/FRONTEND_API_GUIDE.md` no se tratarán como contratos aprobados.

## Riesgos y mitigaciones

- **Aprobación implícita:** una pantalla de captura puede parecer una autorización para implementarla. Mantener etiquetas de exploración y la nota de no autorización en el artefacto.
- **Confusión sobre consentimiento:** el aviso documentado no prueba consentimiento. No usar casillas o estados que indiquen consentimiento verificado sin decisión aprobada.
- **Datos sensibles en muestras:** usar exclusivamente nombres, reuniones y pendientes ficticios; no reutilizar transcripciones ni datos del equipo.
- **Contrato prematuro:** porcentajes, ETA o progreso detallado pueden cerrar decisiones técnicas. Usar texto genérico hasta acordar esos comportamientos.
- **Inconsistencia entre documentos:** resolver o mantener visible la discrepancia de autoridad antes de presentar el recorrido como aprobado.

## Alternativas

- **Baja fidelidad (recomendada inicialmente):** facilita revisar orden, jerarquía y contenido, y reduce la apariencia de que existe una interfaz funcional.
- **Alta fidelidad:** permite revisar con más detalle estilo y legibilidad, pero puede hacer que comportamientos pendientes parezcan definitivos.
- **Storyboard estático frente a prototipo clicable:** el storyboard deja claro que es una propuesta; un prototipo clicable requiere límites adicionales para asegurar que no simule integración real. No se elige herramienta ni formato interactivo todavía.

## Secuencia propuesta

1. Mantener visible la diferencia entre el estado indicado por el scope y las restricciones de `AGENTS.md`.
2. Preparar una matriz de cobertura que relacione cada pantalla/estado con la solicitud y las fuentes.
3. Crear la primera versión de baja fidelidad con datos sintéticos y anotaciones.
4. Revisar cobertura, textos, jerarquía, estados vacíos y errores; comprobar que nada sugiera comportamiento real.
5. Presentar el artefacto a Ronald y registrar comentarios y cambios pendientes.
6. Si se desea alta fidelidad o prototipo clicable, decidirlo tras la revisión y documentar el alcance del siguiente paso.

## Validación

- Recorrer la matriz pantalla por pantalla y comprobar que cada criterio de aceptación tiene evidencia en el artefacto.
- Revisar escenarios: primer uso sin reuniones, permiso denegado, error de captura, procesamiento en progreso, procesamiento fallido, resultado sin pendientes y edición de resumen/pendientes.
- Verificar que los estados no dependen solo del color y que los textos distinguen claramente ejemplos de contenido real.
- Confirmar con Ronald que revisó los wireframes y registrar comentarios o aprobación del diseño.
- No hay comandos de validación de producto aplicables a un artefacto estático; no ejecutar comandos de Bun/npm ni pruebas.

## Reversión

No aplica reversión de software ni de datos porque este plan solo contempla wireframes estáticos. Si el artefacto se guarda en una herramienta con historial de versiones, se podrán revertir revisiones visuales allí; la herramienta todavía no está elegida.

## Decisiones pendientes

1. Aclarar si el documento de scope aprobado puede considerarse autoridad vigente pese a las instrucciones actuales de `AGENTS.md`.
2. Confirmar el texto y comportamiento del aviso de consentimiento, permisos por plataforma y límites de lo que el aviso comunica.
3. Elegir fidelidad final, herramienta y destino del artefacto de wireframes.
4. Decidir si título y fecha aparecen en configuración y si son opcionales.
5. Definir qué etapas de progreso, errores, reintento, cancelación, porcentaje o tiempo se pueden mostrar sin fijar un contrato prematuro.
6. Confirmar si la experiencia de captura fallida debe mostrar retención, reintento y eliminación, conforme a las aprobaciones de tratamiento de datos.
7. Obtener y registrar la revisión de Ronald; el plan aprobado no significa que los wireframes ya hayan sido revisados.
