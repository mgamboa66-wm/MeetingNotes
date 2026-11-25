# MN-01 | Definir alcance del MVP y decisiones de producto pendientes

**Estado de ejecución:** Ejecutado, según confirmación de Marco. La priorización y los responsables de las decisiones pendientes se registraron el 2026-11-25.
**Fecha de registro inicial:** 2026-11-24.
**Evidencia de aprobación:** `AGENTS.md`, `README.md` y el scope de v1 identifican el alcance de producto como aprobado. Marco confirmó el 2026-11-25 que MN-01 ya cuenta con aprobación. Este registro no atribuye la aprobación a una persona no identificada ni adjunta una constancia externa.

> El estado “Ejecutado” registra la confirmación de Marco sobre MN-01. La autoridad para capturar, procesar y tratar audio proviene del scope aprobado y se limita a lo descrito allí.

## Objetivo

Confirmar los límites de la primera versión antes de iniciar el diseño y la implementación.

## Trabajo definido por MN-01

Marco confirma que estas actividades se ejecutaron. Los resultados y la evidencia disponible en el repositorio se detallan en la tabla de criterios.

- Identificar a las personas usuarias principales y la plataforma objetivo.
- Acordar qué fuente de reuniones y qué flujo de notas incluirá el MVP.
- Registrar los requisitos de consentimiento, procesamiento, guardado y exportación.
- Tratar el README de `Additional resources` como referencia exploratoria: validar la propuesta de capturar audio del sistema y micrófono, transcribir con Whisper local y generar notas Markdown con Claude, sin asumir que está aprobada.

## Fuentes consultadas y estado

- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): declara aprobado el alcance de producto y documenta la aplicación local, macOS y Windows, captura del sistema y micrófono, procesamiento con OpenAI, idioma por reunión, historial y tratamiento del audio.
- [AGENTS.md](../../AGENTS.md): confirma el alcance y el stack aprobados, establece sus límites y enumera las decisiones técnicas que siguen abiertas.
- [README principal](../../README.md): confirma el alcance aprobado de v1 y distingue las decisiones técnicas pendientes.
- [README de `teams-notes`](<../additional resources/README.md>): referencia exploratoria de otro proyecto. Describe Whisper local, Claude y notas Markdown con resumen ejecutivo, puntos clave, decisiones, action items y seguimiento; no es una decisión aprobada de MeetingNotes.
- [MN-03](./MN-03-arquitectura-informacion.md): borrador para revisión; no aprueba estructura de notas, almacenamiento ni exportación.
- [MN-04](./MN-04-wireframes.md): aprobado únicamente para preparar wireframes estáticos con datos ficticios; no habilita captura o procesamiento.

**Autoridad vigente:** la discrepancia registrada originalmente entre el scope, `AGENTS.md` y `README.md` quedó resuelta. Las tres fuentes actuales declaran aprobado el alcance de producto de v1 y mantienen abiertas únicamente decisiones técnicas no definidas. Marco confirmó el 2026-11-25 que MN-01 cuenta con aprobación. No se atribuye esa aprobación a una persona específica.

## Criterios de aceptación y registro disponible

| Criterio | Registro en el repositorio |
|---|---|
| Ronald aprueba una definición del MVP y una lista priorizada de funcionalidades imprescindibles. | El alcance está aprobado y la priorización P0/P1 con complejidad relativa se incorporó al [scope de v1](../MEETINGNOTES_V1_SCOPE.md). Marco confirmó el 2026-11-25 que MN-01 ya cuenta con aprobación; no se atribuye el aprobador por nombre. |
| Se documentan la plataforma compatible y el flujo previsto de reunión a notas. | Satisfecho: el scope documenta macOS y Windows, captura, procesamiento, resultados, historial y tratamiento de datos; `AGENTS.md` y `README.md` están alineados con ese alcance. |
| Cada decisión pendiente tiene una persona responsable y permanece marcada como pendiente hasta su aprobación. | Satisfecho en cuanto a asignación: los responsables están registrados en la tabla siguiente. La asignación no decide ni aprueba las opciones técnicas; cada tema continúa pendiente hasta que su definición se documente. |
| El tratamiento de audio y resultados se limita al flujo aprobado. | Satisfecho: captura, procesamiento con OpenAI y retención local de audio fallido se permiten únicamente según el scope. Cualquier tratamiento distinto requiere aprobación humana. |

## Responsables y decisiones pendientes

| Decisión pendiente | Responsable asignado | Estado |
|---|---|---|
| Aprobación de MN-01 y su priorización (responsable previsto: Ronald) | Ronald | Confirmada por Marco el 2026-11-25; el aprobador no se identifica en este registro |
| Permisos y detalles de captura nativa para macOS y Windows | Marco | Pendiente de definición |
| Recuperación ante interrupciones y comportamiento por plataforma | Marco | Pendiente de definición |
| Modelos concretos de OpenAI y su configuración | Marco | Pendiente de definición |
| Integración de SQLite, ruta y protección local de archivos de audio fallidos | Marco | Pendiente de definición |
| Reintentos, idempotencia, timeouts y recuperación tras cierre inesperado | Marco | Pendiente de definición |
| Host y puerto local; integración para iniciar la API junto con la app de escritorio | Marco | Pendiente de definición |
| Versiones de dependencias de backend | Marco | Pendiente de definición |
| Versiones de dependencias de frontend y escritorio | Ericka y Cristina (responsabilidad compartida) | Pendiente de definición |
| Modo de renderizado del frontend | Marco | Pendiente de decisión |
| Estructura de workspaces del producto | Ronald | Pendiente de definición |
| Integración continua (CI) | Marco | Pendiente de definición |
| Proceso de publicación del producto | Marco | Pendiente de definición |
| Inclusión y alcance de la exportación a Markdown | Ronald | No está definida ni aprobada para v1; requiere una decisión explícita antes de incluirla |

La priorización y las estimaciones cualitativas de complejidad están en la sección 2 del scope. P1 también debe completarse antes de dar v1 por terminada. La exportación a Markdown no aparece definida en el alcance aprobado; no se debe inferir su inclusión ni su comportamiento.

## Riesgos y límites

- El scope autoriza solo el tratamiento descrito en su sección 3. Cualquier cambio de destino, retención o tratamiento necesita aprobación humana.
- El README de `Additional resources` describe otro producto y otras tecnologías. Sus propuestas no se incorporan al MVP sin decisión explícita.
- La asignación de responsables no equivale a una decisión técnica aprobada. Mantener cada definición como pendiente hasta documentarla.
- No se debe atribuir a Ronald una aprobación de la priorización mientras no exista un registro explícito.

## Validación y reversión

La validación de este registro consiste en comprobar que cada criterio tiene una referencia documental o está marcado como no evidenciado. No se ejecutaron comandos de producto ni pruebas.

No aplica reversión de software o datos: este archivo es un registro documental. Las correcciones futuras deben actualizar el estado y enlazar la evidencia pertinente sin borrar la distinción entre propuestas, aprobaciones y decisiones pendientes.
