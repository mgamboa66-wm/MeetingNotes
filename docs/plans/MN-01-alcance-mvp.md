# MN-01 | Definir alcance del MVP y decisiones de producto pendientes

**Estado de ejecución:** Ejecutado, según confirmación de la persona usuaria.  
**Fecha de registro:** 2026-11-24.  
**Evidencia de aprobación:** las fuentes del repositorio consultadas se detallan abajo; no se adjuntó acta o registro que identifique a Ronald, Producto y Privacidad como aprobadores.

> El estado “Ejecutado” registra la confirmación de la persona usuaria sobre MN-01. No constituye por sí mismo aprobación de captura, procesamiento externo o retención de audio.

## Objetivo

Confirmar los límites de la primera versión antes de iniciar el diseño y la implementación.

## Trabajo definido por MN-01

La persona usuaria confirma que estas actividades se ejecutaron. Los resultados y la evidencia disponible en el repositorio se detallan en la tabla de criterios.

- Identificar a las personas usuarias principales y la plataforma objetivo.
- Acordar qué fuente de reuniones y qué flujo de notas incluirá el MVP.
- Registrar los requisitos de consentimiento, procesamiento, guardado y exportación.
- Tratar el README de `Additional resources` como referencia exploratoria: validar la propuesta de capturar audio del sistema y micrófono, transcribir con Whisper local y generar notas Markdown con Claude, sin asumir que está aprobada.

## Fuentes consultadas y estado

- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): se declara “alcance de producto aprobado” y documenta aplicación local, macOS y Windows, captura del sistema y micrófono, OpenAI, idioma por reunión, historial y reglas de tratamiento de audio.
- [AGENTS.md](../../AGENTS.md): conserva como pendientes la plataforma, el alcance, el método de captura, el procesamiento, el almacenamiento y el tratamiento de datos; prohíbe habilitar captura, transmisión o retención sin aprobación explícita del alcance y tratamiento.
- [README principal](../../README.md): refleja que varias decisiones de producto y tratamiento siguen pendientes.
- [README de `teams-notes`](<../additional resources/README.md>): referencia exploratoria de otro proyecto. Describe Whisper local, Claude y notas Markdown con resumen ejecutivo, puntos clave, decisiones, action items y seguimiento; no es una decisión aprobada de MeetingNotes.
- [MN-03](./MN-03-arquitectura-informacion.md): borrador para revisión; no aprueba estructura de notas, almacenamiento ni exportación.
- [MN-04](./MN-04-wireframes.md): aprobado únicamente para preparar wireframes estáticos con datos ficticios; no habilita captura o procesamiento.

**Discrepancia de autoridad:** `docs/MEETINGNOTES_V1_SCOPE.md` declara aprobado el alcance de v1, mientras `AGENTS.md` y `README.md` todavía marcan decisiones de alcance y tratamiento como pendientes. El scope identifica una aprobación de forma general, pero no nombra a Ronald, Producto y Privacidad ni enlaza su registro de aprobación. Este archivo conserva ambas referencias sin atribuir una aprobación individual no documentada.

## Criterios de aceptación y registro disponible

| Criterio | Registro en el repositorio |
|---|---|
| Ronald aprueba una definición del MVP y una lista priorizada de funcionalidades imprescindibles. | El scope de v1 documenta funcionalidades, pero no nombra a Ronald ni incluye una lista priorizada o evidencia atribuible de su aprobación. MN-01 se marca ejecutado por confirmación de la persona usuaria; el comprobante de esta aprobación no está adjunto. |
| Se documentan la plataforma compatible y el flujo previsto de reunión a notas. | El scope describe aplicación local para macOS y Windows y el recorrido de audio a transcripción, resumen y pendientes. `AGENTS.md` y `README.md` aún dejan plataforma y tratamiento pendientes; la discrepancia debe resolverse en la documentación rectora. |
| Cada decisión pendiente tiene una persona responsable y permanece marcada como pendiente hasta su aprobación. | Las instrucciones enumeran decisiones que requieren revisión, pero no asignan responsables por decisión. No se inventan responsables en este registro; no se encontró una matriz de responsables y aprobaciones. |
| No se considera aprobado capturar audio, procesarlo externamente ni conservarlo antes de la aprobación de Producto y Privacidad. | `AGENTS.md` mantiene esa restricción. El scope de v1 describe captura, OpenAI y tratamiento de audio, pero no enlaza evidencia separada de aprobación de Producto y Privacidad. Este registro no declara superada esa condición. |

## Decisiones que siguen requiriendo un registro explícito

| Decisión | Estado documental | Responsable |
|---|---|---|
| Autoridad vigente del alcance de v1 frente a `AGENTS.md` y `README.md` | Discrepancia abierta | No documentado |
| Aprobación de Producto y Privacidad para captura, procesamiento externo y tratamiento/retención de audio | No hay evidencia atribuible adjunta a este registro | No documentado |
| Responsable por cada decisión pendiente identificada en `AGENTS.md` | No asignado en las fuentes consultadas | No documentado |
| Exportación a Markdown: inclusión en MVP y comportamiento | No definida por el scope aprobado ni por este registro | No documentado |

El scope aprobado incluye almacenamiento local con SQLite, pero `AGENTS.md` mantiene la elección de base de datos y el tratamiento de datos bajo revisión. MN-01 registra esa diferencia; no añade un esquema ni amplía la aprobación de almacenamiento.

## Riesgos y límites

- Un documento que se titula “scope aprobado” puede interpretarse como autorización para tratar audio, aunque `AGENTS.md` exige aprobación explícita del tratamiento. Mantener visible la discrepancia y no habilitar captura, envío externo o retención sobre la base de este archivo.
- El README de `Additional resources` describe otro producto y otras tecnologías. Sus propuestas no se incorporan al MVP sin decisión explícita.
- El registro no identifica a las personas responsables ni aporta acta de aprobación; no se debe inferir esa información.

## Validación y reversión

La validación de este registro consiste en comprobar que cada criterio tiene una referencia documental o está marcado como no evidenciado. No se ejecutaron comandos de producto ni pruebas.

No aplica reversión de software o datos: este archivo es un registro documental. Las correcciones futuras deben actualizar el estado y enlazar la evidencia pertinente sin borrar la distinción entre propuestas, aprobaciones y decisiones pendientes.
