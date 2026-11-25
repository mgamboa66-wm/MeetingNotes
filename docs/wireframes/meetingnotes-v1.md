# Wireframes v1 — propuesta estática

**Estado:** propuesta de baja fidelidad para revisión de Ronald. No es una interfaz funcional.  
**Base:** alcance aprobado en `docs/MEETINGNOTES_V1_SCOPE.md` y autorización limitada de MN-04.  
**Datos:** todos los nombres y contenidos siguientes son ficticios.

## Recorrido

Inicio / historial → preparar reunión → aviso y permisos → captura → procesamiento → revisar notas.  
Las capturas cuyo procesamiento falla aparecen en una lista local con opciones de reintento o eliminación manual.

## 1. Historial — sin reuniones

```text
┌──────────────────────────────────────────────────────────────┐
│ MeetingNotes                                      [Ajustes]   │
├──────────────────────────────────────────────────────────────┤
│ Reuniones                                                     │
│                                                              │
│                 Todavía no hay reuniones                     │
│       Cuando termines una reunión, tus notas aparecerán aquí. │
│                                                              │
│                    [ Iniciar una reunión ]                   │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** historial local por computadora; no hay cuentas ni sincronización.  
**Pregunta:** ¿qué información mínima se muestra en cada fila del historial?

## 2. Preparar reunión

```text
┌──────────────────────────────────────────────────────────────┐
│ Nueva reunión                                                │
│                                                              │
│ Idioma de las notas                                          │
│ (•) Español             ( ) English                          │
│                                                              │
│ El audio de la reunión se procesa con OpenAI para preparar   │
│ un resumen y una lista de pendientes.                         │
│                                                              │
│                         [ Continuar ]                         │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** idioma español o inglés, elegido por reunión; OpenAI es el proveedor aprobado.  
**Pregunta:** ¿el título se pide aquí o se asigna después de procesar?

## 3. Aviso y permisos

```text
┌──────────────────────────────────────────────────────────────┐
│ Antes de iniciar                                             │
│ MeetingNotes capturará el audio del sistema y el micrófono.   │
│ El audio se enviará a OpenAI para generar las notas.          │
│                                                              │
│ Este aviso informa sobre el tratamiento; no verifica el      │
│ consentimiento de las personas participantes.                 │
│                                                              │
│ Estado de permisos: [ilustrativo, pendiente por plataforma]   │
│                                                              │
│                 [ Iniciar captura ]   [ Volver ]              │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** el aviso es visible y persistente; por sí mismo no bloquea la captura ni verifica el consentimiento de participantes.  
**Supuesto visual:** el aviso permanece visible antes de cada captura.  
**Pendiente:** texto final, permisos denegados o revocados e indicadores por sistema operativo. El aviso no representa una verificación de consentimiento.

## 4. Captura activa

```text
┌──────────────────────────────────────────────────────────────┐
│ Captura en curso · EJEMPLO                                   │
│                                                              │
│ Audio del sistema: [estado ilustrativo]                       │
│ Micrófono:         [estado ilustrativo]                       │
│                                                              │
│             Audio del sistema + micrófono                     │
│                  una pista combinada                          │
│                                                              │
│                       [ Detener ]                             │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** se combinan ambas fuentes en una sola pista.  
**Pendiente:** representación exacta de permisos, fuente parcial, interrupción y error por plataforma. No se muestran niveles, porcentajes ni tiempos medidos.

## 5. Procesamiento

```text
┌──────────────────────────────────────────────────────────────┐
│ Preparando tus notas                                         │
│                                                              │
│ Procesando la reunión.                                       │
│ El resultado aparecerá aquí cuando esté disponible.           │
│                                                              │
│ [indicador indeterminado; sin porcentaje ni ETA]              │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** el audio se envía a OpenAI para transcripción y generación de notas.  
**Pendiente:** texto y recuperación ante timeout o cierre inesperado. Esta pantalla es ilustrativa; no fija el mecanismo técnico ni promete una duración.

## 6. Revisar notas — con pendientes

```text
┌──────────────────────────────────────────────────────────────┐
│ Revisión de ejemplo                                          │
│                                                              │
│ Título                                                       │
│ [ Planificación semanal                              ]       │
│                                                              │
│ Resumen                                                      │
│ [ El equipo revisó los temas de la semana...          ]       │
│                                                              │
│ Pendientes                                                  │
│ [ Compartir la propuesta  ·  Ana  ·  viernes          ]       │
│ [ Confirmar la fecha      ·  Sin responsable indicado ]       │
│                                                              │
│                         [ Guardar cambios ]                   │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** título, resumen y pendientes se pueden editar; responsables y fechas aparecen solo si la reunión los menciona.  
**Hecho:** no se muestra una casilla de completado ni una transcripción.  
**Pregunta:** ¿qué confirmación visual acompaña el guardado local?

## 7. Revisar notas — sin pendientes

```text
┌──────────────────────────────────────────────────────────────┐
│ Revisión de ejemplo                                          │
│                                                              │
│ Título: Conversación de seguimiento                           │
│ Resumen: Se compartieron actualizaciones del equipo.          │
│                                                              │
│ No se identificaron pendientes explícitos.                    │
│                                                              │
│                         [ Editar notas ]                       │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** no se inventan compromisos, responsables ni fechas para llenar la lista.

## 8. Capturas fallidas

```text
┌──────────────────────────────────────────────────────────────┐
│ No se pudieron preparar estas notas                          │
│ El audio fallido sigue guardado en esta computadora.          │
│                                                              │
│ EJEMPLO · Reunión de planificación                            │
│ [ Reintentar ]                                  [ Eliminar ]  │
└──────────────────────────────────────────────────────────────┘
```

**Hecho:** si falla el procesamiento, se descarta la transcripción y el audio local permanece hasta reintento o eliminación manual, sin vencimiento automático.  
**Pendiente:** estados y mensajes de error, recuperación tras cierre inesperado y protección local del archivo.

## Revisión solicitada

- Confirmar si las pantallas y el orden representan el recorrido deseado.
- Revisar el texto del aviso, la pantalla de captura y la pantalla de error.
- Registrar comentarios de Ronald y los cambios acordados.
- La revisión de este artefacto no aprueba arquitectura, permisos, contratos API ni implementación.
