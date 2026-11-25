# MN-02 | Mapear el recorrido de usuario de reunión a notas

**Estado:** Aprobado por Marco y Ericka; Marco confirmó la aprobación de Ericka el 2026-11-25.  
**Actualización:** 2026-11-25.  
**Propósito:** describir el recorrido conceptual de v1 y sus ramas de recuperación de acuerdo con el alcance de producto aprobado.  
**Registro de revisión:** Marco aprobó el flujo tras cotejarlo con el alcance y confirma que Ericka también lo aprobó. La confirmación de Ericka se registra según lo reportado por Marco.

> Este plan y su mapa no aprueban arquitectura ni autorizan cambios de código. Marco confirmó el 2026-11-25 que MN-01 ya cuenta con aprobación. El comportamiento de producto se rige por el alcance aprobado; los detalles técnicos que allí no se definen siguen abiertos.

## Fuentes y autoridad

- **Alcance aprobado de v1:** [MEETINGNOTES_V1_SCOPE.md](../MEETINGNOTES_V1_SCOPE.md) define la aplicación local para macOS y Windows, la captura combinada, el aviso, OpenAI, el idioma por reunión, el historial editable y el ciclo de vida de audio y transcripción.
- **Instrucciones vigentes:** [AGENTS.md](../../AGENTS.md) confirma el alcance aprobado, limita las ampliaciones y requiere un plan de implementación aprobado antes de elegir arquitectura no especificada, integrar POCs o modificar código de producto.
- **MN-01:** [plan de alcance](./MN-01-alcance-mvp.md) se declara ejecutado; Marco confirmó en esta conversación que MN-01 cuenta con aprobación.
- **MN-03 y MN-04:** [arquitectura de información](./MN-03-arquitectura-informacion.md) sigue como propuesta. El [plan de wireframes](./MN-04-wireframes.md) autoriza preparar wireframes estáticos, pero la revisión del artefacto sigue pendiente.
- **Contrato y guía frontend:** [API_CONTRACT.md](../api/API_CONTRACT.md) y [FRONTEND_API_GUIDE.md](../FRONTEND_API_GUIDE.md) son propuestas no implementadas. Ambos describen esperar el resultado completo de procesamiento; no hay un recurso de operación ni sondeo de progreso en esas propuestas. Timeout, idempotencia y recuperación siguen abiertos.
- **POCs:** [README de prototipos](../../apps/prototypes/README.md) documenta experimentos aislados; no son una aplicación integrada ni una arquitectura aprobada.

## Hechos comprobables

- v1 es una aplicación local para macOS y Windows, sin cuentas, login, nube ni sincronización.
- La aplicación combina audio del sistema y micrófono en una pista. El aviso de uso es visible y persistente, pero no bloquea la captura ni verifica por sí mismo el consentimiento de participantes.
- El audio se envía a OpenAI para transcribirlo y generar resumen y pendientes en español o inglés, según el idioma elegido para esa reunión.
- Si el procesamiento termina correctamente, se guarda título, idioma, resumen y pendientes en el historial local de SQLite y se eliminan las copias locales del audio y la transcripción. La transcripción no se guarda en el historial.
- Si el procesamiento falla, se descarta la transcripción y el audio fallido queda local, sin vencimiento automático, hasta reintento o eliminación manual.
- Se pueden consultar y editar título, resumen y pendientes, y eliminar manualmente una reunión junto con todos sus pendientes. El historial no vence automáticamente. Los pendientes no se marcan como completados. No se inventan compromisos, responsables ni fechas.
- El contrato API y la guía frontend son propuestas. El contrato propone una respuesta completa al procesar; su detalle técnico no equivale a un contrato aprobado.
- Las carpetas apps/web, apps/api, packages/contracts y tests siguen reservadas; el producto integrado y la suite consolidada no existen.

## Supuestos de trabajo

- El mapa representa estados y decisiones de producto, no pantallas finales, llamadas de API, tiempos ni comportamiento ya implementado.
- La elección de idioma ocurre antes de procesar la reunión porque el resumen y los pendientes deben generarse en el idioma elegido. La ubicación exacta del control en la interfaz es una propuesta.
- La persona puede salir sin iniciar una captura. Esto no convierte el aviso en una aceptación obligatoria ni en una verificación del consentimiento de participantes.
- La captura debe reunir ambas fuentes en una pista; el manejo de permisos parciales y de una interrupción de captura no se determina por este mapa.
- Las ramas de error de transcripción y generación comparten el tratamiento de fallo definido en el alcance. No se fija si esos errores se presentan como estados técnicos separados.

## Preguntas abiertas

### Detalles técnicos que siguen abiertos

1. ¿Qué mensaje y ruta de recuperación se usan si se deniega o revoca un permiso, o si solo una fuente de audio está disponible en macOS o Windows?
2. ¿Qué ocurre con una captura interrumpida o un archivo parcial antes de iniciar el procesamiento? El alcance define el tratamiento de un fallo de procesamiento, pero no el de una interrupción de captura.
3. ¿Cómo se recupera el flujo tras un cierre inesperado o timeout, y cómo se coordinan reintentos e idempotencia sin duplicar reuniones? ¿Qué ruta y protección local se usan para el audio fallido?
4. ¿Qué campos, errores y estados definitivos expondrá la API? Las propuestas no cierran la paginación de capturas fallidas, códigos HTTP ni formato de errores.
5. ¿Qué título se muestra inicialmente y cuándo se solicita o asigna? El título debe guardarse y puede editarse, pero su valor inicial no está definido.

### Fuera del alcance aprobado

6. Exportación a Markdown, búsqueda, organización avanzada y secciones extra como puntos clave, decisiones o seguimiento no forman parte del recorrido de v1. Requieren una aprobación de producto antes de incluirse.

### Registro de revisión humana

- Aprobación de Marco: 2026-11-25, después de cotejar el flujo con el alcance.
- Aprobación de Ericka: confirmada por Marco el 2026-11-25.
- No se reportaron comentarios adicionales.

## Alcance del mapa

**Incluye:** inicio e historial local; idioma por reunión; aviso visible; permisos como estado conceptual; inicio, detención e interrupción de captura; procesamiento con OpenAI; revisión y edición de notas; guardado y eliminación local; y recuperación tras un fallo de procesamiento.

**Excluye:** implementar o simular captura real; enviar datos desde este mapa; elegir permisos o adaptadores por sistema operativo; fijar arquitectura, rutas, estados de API, timeouts o reintentos; añadir exportación u otras funciones no aprobadas.

## Recorrido conceptual

El flujo de éxito y el de fallo siguen las reglas del alcance aprobado. Los detalles indicados como pendientes no se deciden en este mapa.

**Flujo normal:** iniciar MeetingNotes → mostrar el aviso visible y persistente antes del uso → abrir el historial local → iniciar una reunión → elegir español o inglés → revisar permisos → capturar audio del sistema y micrófono en una pista → detener la captura → enviar audio a OpenAI → guardar título, idioma, resumen y pendientes en SQLite si el procesamiento termina correctamente → borrar audio y transcripción locales → consultar o editar las notas.

**Si la persona decide no iniciar:** salir sin capturar. El alcance especifica que el aviso no bloquea la captura ni verifica por sí mismo el consentimiento de participantes.

**Si faltan permisos o solo una fuente está disponible:** el estado y la ruta quedan pendientes de definición por plataforma. El alcance requiere combinar ambas fuentes; el mapa no aprueba captura parcial ni fija el mensaje o la recuperación.

**Si la captura se interrumpe:** marcar el evento como interrupción de captura. El tratamiento del archivo parcial —recuperar, descartar o eliminar— sigue pendiente y no se deduce de la regla para fallos de procesamiento.

**Si falla la transcripción o la generación de notas:** descartar la transcripción, conservar el audio local sin vencimiento automático y mostrar la captura en la lista de fallidas. La persona puede reintentar o eliminar el audio manualmente. La semántica técnica de reintentos e idempotencia sigue pendiente.

**Si el procesamiento termina correctamente:** guardar la reunión con su título, idioma, resumen y pendientes; borrar las copias locales de audio y transcripción; mostrar el resultado editable. No mostrar ni persistir la transcripción. Eliminar una reunión elimina también todos sus pendientes.

**Progreso:** el estado de procesamiento es conceptual; no fija porcentaje, ETA ni ejecución en segundo plano. Las propuestas API/frontend esperan el resultado completo y no definen sondeo de progreso.

## Criterios de aceptación verificables

1. El mapa representa el flujo de v1 desde el historial local hasta revisar y editar resultados.
2. El flujo de éxito guarda únicamente los datos aprobados y elimina audio y transcripción locales.
3. El flujo de fallo descarta la transcripción y conserva el audio hasta reintento o eliminación manual, sin vencimiento automático.
4. El mapa separa los fallos de procesamiento de una interrupción de captura, cuyo tratamiento sigue pendiente.
5. El aviso se describe como visible y persistente, no bloqueante y no verificativo del consentimiento de participantes.
6. Exportación y otras ampliaciones no aparecen como opciones funcionales de v1 sin aprobación de producto.
7. Las decisiones técnicas abiertas se identifican sin atribuirles una aprobación.
8. La aprobación de Marco y la confirmación de Ericka quedan registradas antes de marcar MN-02 aprobado. **Satisfecho** según confirmación de Marco del 2026-11-25.
9. Las referencias internas son válidas y el documento no presenta propuestas API como comportamiento implementado.

## Impacto por componente

| Componente | Estado | Uso en MN-02 |
|---|---|---|
| docs/MEETINGNOTES_V1_SCOPE.md y AGENTS.md | Autoridad de producto e instrucciones vigentes | Base del recorrido y de los límites. |
| docs/api/API_CONTRACT.md y docs/FRONTEND_API_GUIDE.md | Propuestas no implementadas | Referencia para identificar detalles técnicos abiertos, sin fijarlos. |
| docs/plans/MN-03-arquitectura-informacion.md y MN-04-wireframes.md | Propuestas; MN-04 aprueba solo wireframes estáticos | Insumos de diseño sujetos a revisión. |
| apps/web/, apps/api/, packages/contracts/, tests/ | Espacios reservados | Sin cambios de código en MN-02. |
| apps/prototypes/ | POCs independientes | No se integran ni se seleccionan como base. |

## Contratos, datos y dependencias

MN-02 no modifica contratos, esquemas, persistencia ni dependencias. El mapa refleja el almacenamiento y el ciclo de vida aprobados, pero no define captureId, códigos HTTP, campos de API, política de reintentos ni el mecanismo de captura. El procesamiento y la captura se describen como comportamiento de producto aprobado; esto no autoriza implementación ni resuelve sus detalles técnicos.

## Riesgos y mitigaciones

- **Confundir aviso con consentimiento:** mantener explícito que el aviso no bloquea ni verifica el consentimiento de participantes.
- **Reabrir decisiones aprobadas:** usar el ciclo de éxito y fallo ya definido por el alcance, sin presentarlo como una pregunta de producto.
- **Decidir la interrupción por inferencia:** separar la interrupción de captura del fallo de procesamiento y dejar el archivo parcial pendiente.
- **Tratar propuestas como contratos:** mostrar procesamiento como etapa conceptual y conservar abiertas idempotencia, timeouts, errores y recuperación.
- **Ampliar v1:** dejar exportación, búsqueda, organización avanzada y secciones extra fuera del flujo hasta una aprobación de alcance.

## Secuencia de trabajo

1. Tomar el alcance aprobado y la confirmación de aprobación de MN-01 como base; no reabrir esas decisiones en MN-02.
2. Revisar el flujo normal contra cada regla de negocio del alcance.
3. Revisar las ramas de permisos e interrupción y mantener pendientes sus detalles técnicos.
4. Verificar que las ramas de éxito y fallo reflejen el ciclo de vida de audio y transcripción aprobado.
5. Registrar la aprobación de Marco y la confirmación de Ericka.
6. Mantener abierto el issue de GitHub para que la persona usuaria lo cierre manualmente.

## Validación

Validación documental: comprobar cobertura del flujo normal, éxito, fallo, eliminación, aviso y decisiones pendientes; revisar las referencias citadas; y confirmar que el mapa no amplía el alcance. No ejecutar comandos de desarrollo, POCs ni pruebas.

## Reversión

No aplica reversión de software ni datos porque MN-02 solo documenta un recorrido conceptual. Las modificaciones del plan pueden revertirse mediante el control de versiones disponible; no se modifican datos de producto.

## Decisiones para revisión humana

- La aprobación de Marco y la confirmación de Ericka están registradas; no se reportaron comentarios adicionales.
- Las decisiones sobre permisos, captura interrumpida, archivos parciales, timeout, idempotencia y recuperación quedan para el plan técnico de implementación.
- La exportación y otras ampliaciones continúan fuera de v1 salvo que se apruebe un cambio de alcance.
