# MeetingNotes - alcance aprobado de la versión 1

**Estado:** alcance de producto aprobado, según confirmación recibida el 24 de noviembre de 2026.  
**Propósito:** resumen sencillo de lo que se espera entregar en v1 y de las decisiones de negocio que guían el producto.

## 1. Objetivo

MeetingNotes ayudará a convertir conversaciones de reuniones en un resumen y una lista de pendientes, usando el audio de la computadora.

## 2. Qué incluirá v1

- **Aplicación local para macOS y Windows.** Cada computadora tendrá su propio historial, guardado localmente con SQLite.
- **Captura de audio local.** La aplicación capturará el audio del sistema y el micrófono y los combinará en una sola pista.
- **Aviso de consentimiento.** Se mostrará un aviso visible y persistente antes del uso. El aviso no bloqueará la captura ni verificará por sí mismo el consentimiento de las personas participantes.
- **Resumen y pendientes con OpenAI.** El backend local enviará el audio a OpenAI para transcribirlo y preparar las notas.
- **Idioma elegido por reunión.** La persona usuaria podrá elegir español o inglés para el resumen y los pendientes.
- **Historial editable.** Se podrán consultar y editar el título, el resumen y los pendientes de cada reunión.
- **Eliminación manual.** Se podrá eliminar una reunión junto con todos sus pendientes. El historial no tendrá eliminación automática.
- **Acceso local.** No habrá cuentas de MeetingNotes ni inicio de sesión. El acceso a los datos dependerá de la cuenta del sistema operativo.

Las tareas incluirán responsables y fechas solo cuando la reunión los mencione. El producto no debe presentar ideas tentativas como compromisos ni inventar asignaciones o fechas.

### Prioridad de implementación y complejidad

Esta prioridad ordena el trabajo dentro del alcance aprobado de v1; no elimina ni reduce ninguna función. **P0** identifica las capacidades que forman el flujo esencial y deben completarse para la entrega de v1. **P1** identifica una capacidad que se implementará después de que el flujo principal funcione, pero que también debe completarse antes de dar v1 por terminada. La complejidad es una estimación cualitativa preliminar, no una estimación de esfuerzo ni una decisión de arquitectura. Se mantienen las versiones de plataforma indicadas en la sección 5.

| Prioridad | Función | Importancia | Complejidad relativa | Motivo |
|---|---|---|---|---|
| P0 | Aplicación local para macOS y Windows | Muy alta | Muy alta | Es la base que condiciona la captura y la integración por plataforma. |
| P0 | Acceso mediante la cuenta del sistema operativo, sin cuentas ni inicio de sesión de MeetingNotes | Alta | Media | Define el límite de acceso a los datos locales desde el inicio. |
| P0 | Capturar el audio del sistema y el micrófono en una sola pista | Muy alta | Muy alta | Es la entrada principal del producto y tiene detalles específicos por plataforma. |
| P0 | Mostrar un aviso de consentimiento visible y persistente antes del uso | Alta | Baja | Debe estar presente antes del uso. El aviso no bloquea la captura ni verifica por sí mismo el consentimiento de las personas participantes. |
| P0 | Enviar el audio a OpenAI para transcribirlo y procesar allí la transcripción para generar resumen y pendientes | Muy alta | Alta | Es el procesamiento central de MeetingNotes. El tratamiento local de la transcripción sigue las reglas de la sección 3. |
| P0 | Elegir español o inglés por reunión | Alta | Baja–media | El idioma elegido determina el idioma del resumen y los pendientes. |
| P0 | Guardar el historial local en SQLite con título, idioma elegido, resumen y pendientes | Alta | Media–alta | Permite conservar y consultar los resultados; la integración concreta de SQLite sigue abierta. |
| P0 | Gestionar fallos: mostrar capturas fallidas, permitir reintentar o eliminar, descartar la transcripción y conservar el audio hasta reintento o eliminación manual, sin vencimiento automático | Muy alta | Muy alta | Combina privacidad, recuperación y manejo de datos durante errores. |
| P0 | Consultar reuniones, resúmenes y pendientes | Alta | Media | Permite revisar los resultados guardados en el historial local. |
| P0 | Eliminar manualmente una reunión y todos sus pendientes | Alta | Media | Da a la persona usuaria control explícito sobre los datos guardados. |
| P1 | Editar el título, el resumen y los pendientes | Alta | Media | Se implementa después de que el flujo principal funcione; sigue siendo requisito de v1. |

## 3. Tratamiento de audio y resultados

| Resultado del procesamiento | Qué se conserva localmente |
|---|---|
| Termina correctamente | Se guarda la reunión con su título, idioma elegido, resumen y pendientes. Se borran el audio y la transcripción locales. |
| Falla el procesamiento | Se descarta la transcripción, pero el audio permanece en la computadora sin vencimiento automático. La captura aparece en una lista para reintentar o eliminar manualmente. Si un reintento termina correctamente, se borra el audio. |

La transcripción no se guarda en el historial. El audio solo permanece localmente cuando el procesamiento falla y hasta que la persona usuaria lo reintente o lo elimine.

## 4. OpenAI y costos

- El audio se envía a OpenAI para transcribirlo y la transcripción se procesa allí para generar las notas.
- Se usarán los controles actuales de la cuenta de OpenAI. La eliminación de la copia local no elimina datos que el proveedor pudiera conservar según esos controles.
- Los costos pueden variar según la duración de las reuniones y los modelos utilizados. v1 no tendrá un límite de gasto dentro de la aplicación.

## 5. Compatibilidad y operación

- macOS 14.2 o posterior.
- Windows 10 versión 1809 es un mínimo técnico para pruebas. Para uso oficial se requiere una versión de Windows que siga recibiendo actualizaciones.
- El audio del sistema y el micrófono se combinarán en una sola pista; v1 no conservará fuentes separadas.
- El historial de una computadora no se sincronizará con otras computadoras.

## 6. Fuera del alcance de v1

- Despliegue en la nube, SSO o cuentas de usuario.
- Compartir o sincronizar historiales entre computadoras.
- Guardar transcripciones en el historial.
- Eliminar automáticamente reuniones guardadas.
- Marcar pendientes como completados.

## 7. Nota sobre documentos técnicos

Este documento fija el alcance de producto aprobado. El contrato de API y la guía de integración para frontend deben mantenerse alineados con estas decisiones, incluyendo el idioma por reunión, el procesamiento que espera la respuesta completa y la lista de capturas fallidas para reintentar o eliminar. Esos documentos detallarán las rutas, payloads y errores técnicos.
