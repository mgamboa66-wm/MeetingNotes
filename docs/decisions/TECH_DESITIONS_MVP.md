# MeetingNotes — decisiones técnicas del MVP

**Estado:** decisiones adoptadas por la persona usuaria el 25 de noviembre de 2026.  
**Base de producto:** [alcance aprobado de v1](MEETINGNOTES_V1_SCOPE.md).  
**Límite:** este registro concreta decisiones técnicas dentro del alcance v1. No modifica el alcance ni aprueba por sí solo el plan de implementación integral.

## Resumen de decisiones

| N.º | Tema | Decisión |
|---|---|---|
| 1 | Integración local | Seguir el enfoque de los POCs: SPA React en navegador y API Bun + Hono como proceso separado, en 127.0.0.1:4174; helper nativo por sistema operativo. Sin shell de escritorio empaquetado para el MVP. |
| 2 | Captura | Seguir los helpers y el flujo de captura de los POCs: Swift/Core Audio en macOS y Python/PyAudioWPatch/WASAPI en Windows. Sin captura parcial ni recuperación automática de interrupciones. |
| 3 | Persistencia | SQLite integrado con Bun y Drizzle; rutas de datos por sistema operativo, acceso de la cuenta del sistema, sin cifrado propio ni respaldos automáticos; migraciones SQL versionadas. |
| 4 | OpenAI | gpt-transcribe por REST para transcripción; Vercel AI SDK con el proveedor OpenAI para generar notas estructuradas con gpt-6.2-sol. |
| 5 | Fallos | Procesamiento en segundo plano, estados durables, sin timeout propio por llamada ni reintentos automáticos. Reintento manual con el mismo audio. |
| 6 | Frontend y dependencias | SPA directa con Vite, estructura de POC y sin workspace raíz. Versiones compartidas fijadas a las de los lockfiles de POC; AI SDK y Drizzle a las últimas versiones estables consultadas en la fecha indicada. |
| 7 | Contrato API | Adoptar los estados, la lista paginada de capturas fallidas y el formato común de error definidos abajo. Excluir meetingDate y el borrado individual de ActionItem. |
| 8 | MN-05 | Aprobación de Producto y Privacidad declarada por la persona usuaria. Revisión solicitada a Ronald pendiente. Se conservan visibles los puntos de tratamiento aún por revisar. |

## 1. Integración de escritorio y API local

- La interfaz será una SPA React + TypeScript servida localmente en navegador, siguiendo los POCs.
- Bun + Hono se ejecutará como proceso local separado. El POC documenta iniciar API e interfaz por separado.
- La API escuchará solamente en **127.0.0.1:4174**.
- El helper de captura será específico por sistema operativo: Swift en macOS y Python en Windows.
- Para el MVP no se integra un shell de escritorio ni un instalador que inicie y empaquete conjuntamente la interfaz y la API. Este punto sigue el modelo operativo de los POCs.
- Referencia: [POC de captura de audio](../apps/prototypes/poc-record-audio/README.md) y [POC de OpenAI](../apps/prototypes/poc-openai-macos/README.md).

## 2. Captura por plataforma

Se reutiliza el enfoque de captura descrito en el [POC de audio](../apps/prototypes/poc-record-audio/README.md):

- **macOS:** helper Swift con Core Audio taps. macOS solicita permiso para micrófono y audio del sistema por separado.
- **Windows:** helper Python con PyAudioWPatch y WASAPI loopback, usando micrófono y salida predeterminados. La persona usuaria permite el acceso al micrófono para aplicaciones de escritorio en la configuración de privacidad de Windows.
- Se requieren ambas fuentes para iniciar la captura. Si no se puede abrir una de ellas, se presenta un error y no se acepta una mezcla parcial.
- Si Windows cambia la salida de audio durante la captura, se detiene y la persona usuaria vuelve a iniciar la captura.
- Si el helper termina inesperadamente o no confirma que el WAV está completo, la captura queda en error y no se envía a OpenAI. No hay reanudación automática. Los errores de permiso denegado o revocado se presentan como error de captura.
- Solo una captura confirmada como completa pasa a procesamiento. Las reglas de retención del audio cuyo **procesamiento** falla son las del alcance aprobado; el audio parcial no se trata como una captura válida para reintentar.

El POC mezcla las fuentes en una pista mono de 48 kHz y WAV PCM de 16 bits. Windows captura el loopback de la salida predeterminada, no otras salidas independientes.

## 3. Persistencia local y migraciones

- **SQLite:** usar la integración incluida con Bun mediante **bun:sqlite** y el adaptador **drizzle-orm/bun-sqlite**; no incorporar better-sqlite3.
- **macOS:** base y datos de aplicación bajo **~/Library/Application Support/MeetingNotes/**.
- **Windows:** base y datos de aplicación bajo **%LOCALAPPDATA%/MeetingNotes/**.
- El audio pendiente de reintento se guarda en un subdirectorio **failed-audio/** dentro del directorio de datos de la aplicación; la base guarda su metadata y estado, no la ruta local en respuestas de API.
- El acceso se apoya en la cuenta y permisos de archivo del sistema operativo. No se agrega una dependencia de cifrado propio ni se crean respaldos automáticos.
- Usar migraciones SQL versionadas de Drizzle Kit, guardadas con el código y aplicadas al iniciar la API antes de aceptar solicitudes. Si falla una migración, la API no inicia.
- Se conserva el tratamiento aprobado: al completar el procesamiento se eliminan el audio y la transcripción locales; si falla el procesamiento, se descarta la transcripción y se conserva el audio sin vencimiento hasta reintento o borrado manual. No se conserva la transcripción en el historial.

## 4. OpenAI, modelos e integración

- **Transcripción:** modelo **gpt-transcribe**, mediante solicitud HTTP desde Bun usando fetch al endpoint de transcripciones de OpenAI. Se valida la respuesta con Zod. Se conserva el enfoque del POC porque su uso de este modelo no depende de soporte experimental de transcripción del AI SDK.
- Los archivos se dividen en segmentos de **20 MiB** con un solapamiento breve, dejando margen bajo el límite documentado de 25 MB; se combinan las transcripciones antes de generar las notas.
- **Resumen y pendientes:** **ai** + **@ai-sdk/openai**, usando **generateText** con **Output.object** y el esquema Zod del producto. Modelo **gpt-6.2-sol**, nivel de razonamiento **medium**, Responses API y **store: false**.
- El idioma elegido por reunión, español o inglés, determina las instrucciones de generación.
- La clave de OpenAI se configura solo en el servidor, siguiendo el POC con **OPENAI_API_KEY** en archivo local **.env** excluido de Git. No se envía al navegador ni se escribe en logs.
- OpenAI es el único proveedor aprobado para este flujo. La eliminación local no implica borrar datos que OpenAI pudiera conservar; se aplican los controles de la cuenta de OpenAI descritos en el alcance.

Referencia: [POC OpenAI para macOS](../apps/prototypes/poc-openai-macos/README.md).

## 5. Procesamiento, idempotencia y recuperación

- El procesamiento corre en segundo plano; el estado se persiste en SQLite y la interfaz consulta el estado hasta que el trabajo termina.
- No se define un timeout propio por llamada ni se configuran reintentos automáticos.
- Un reintento manual procesa otra vez el mismo audio asociado con el mismo captureId.
- Los cambios locales de estado y la creación de la reunión deben impedir duplicar reuniones para un mismo captureId. No se promete procesamiento exactamente una vez en el proveedor: un cierre después de que OpenAI haya recibido una solicitud podría requerir volver a procesarla y generar otra solicitud/costo.
- Al reiniciar la API, trabajos que hayan quedado en transcribing o summarizing pasan a failed; se descarta cualquier transcripción transitoria y se conserva el audio para el reintento manual, de acuerdo con el alcance.
- No se define vencimiento automático del audio fallido ni del historial.

## 6. Frontend, workspaces y versiones

- La interfaz se implementa como **SPA** React + TypeScript estricto con Vite directamente. No se selecciona Vike; no se usa SSR ni SSG.
- Seguir la estructura sencilla del POC con procesos de interfaz y API separados y manifiestos/lockfiles propios. No se añade un manifiesto raíz ni un workspace de producto.
- Para dependencias compartidas se fijan las versiones resueltas en los lockfiles de los POCs. La siguiente tabla refleja las versiones consultadas en esos lockfiles al adoptar esta decisión:

| Dependencia | Versión |
|---|---:|
| react | 19.3.1 |
| react-dom | 19.3.1 |
| vite | 8.3.8 |
| @vitejs/plugin-react | 6.3.0 |
| typescript | 7.0.2 |
| hono | 4.13.19 |
| zod | 4.6.7 |
| tailwindcss | 4.3.5 |
| @tanstack/react-query | 5.108.1 |

- Se usarán las últimas versiones estables consultadas el **25 de noviembre de 2026** para AI SDK y Drizzle:

| Dependencia | Versión estable |
|---|---:|
| ai | 7.0.181 |
| @ai-sdk/openai | 4.0.123 |
| drizzle-orm | 0.45.4 |
| drizzle-kit | 0.31.11 |

Fuentes para verificar versiones: [ai](https://www.npmjs.com/package/ai?activeTab=versions), [@ai-sdk/openai](https://www.npmjs.com/package/%40ai-sdk/openai?activeTab=versions), [drizzle-orm](https://www.npmjs.com/package/drizzle-orm?activeTab=versions) y [drizzle-kit](https://www.npmjs.com/package/drizzle-kit?activeTab=versions).

## 7. Contrato de API

### Estados de captura y procesamiento

Se adoptan estos estados:

**starting → capturing → stopping → ready → transcribing → summarizing → completed**

Ante un fallo, la captura pasa a **failed**. El estado es durable y la persona usuaria puede reintentar manualmente una captura fallida que conserve su audio.

### Capturas fallidas

La lista será paginada con **limit=20** por defecto y un **cursor** opaco. Su respuesta tendrá la forma **{ items, nextCursor }**. Cada elemento expondrá solo:

- **captureId**
- **status** (failed)
- **startedAt**
- **failedAt**
- **failureCode** (código estable y sanitizado)

No se exponen rutas del sistema de archivos, audio, transcripciones ni mensajes internos del proveedor.

### Errores

Se usa el formato común:

**{ error: { code, message } }**

Los códigos son estables y los mensajes sanitizados para su presentación; no incluirán secretos, contenido de reunión, transcripción ni rutas locales.

### Campos y acciones excluidos

- Se excluye **meetingDate**, porque no está aprobado por el alcance de producto.
- No se agrega borrado de un **ActionItem** individual. Para borrar pendientes se elimina la reunión con todos sus pendientes, según el alcance.
- No se persisten transcripciones.

Al actualizar la propuesta de [contrato API](api/API_CONTRACT.md), se deberán reflejar estas decisiones y el alcance aprobado.

## 8. Revisión operativa de privacidad y seguridad (MN-05)

La persona usuaria confirmó: **“Apruebo ambas; Ronald pendiente”**, en respuesta a la solicitud de registrar las aprobaciones de Producto y Privacidad y la revisión de Ronald. Se registra por tanto:

- **Producto:** aprobado por declaración explícita de la persona usuaria el 25 de noviembre de 2026.
- **Privacidad:** aprobado por declaración explícita de la persona usuaria el 25 de noviembre de 2026.
- **Revisión de Ronald:** pendiente. No se atribuye revisión ni aprobación a Ronald.

Controles operativos adoptados para el MVP:

- Mostrar el aviso visible y persistente requerido por el alcance antes del uso. El aviso no bloquea la captura ni verifica por sí mismo el consentimiento.
- Si se deniega o revoca un permiso, o falla una de las fuentes de audio, mostrar el error y no aceptar captura parcial. No reanudar automáticamente.
- Guardar los datos localmente en las rutas de aplicación indicadas en la decisión 3, con acceso según la cuenta del sistema operativo. No agregar cifrado propio ni respaldos automáticos.
- No incluir audio, transcripciones, claves ni rutas locales en logs; exponer errores con códigos y mensajes sanitizados.
- Enviar el audio a OpenAI según la decisión 4. Usar store:false para generación de notas y los controles de datos de la cuenta de OpenAI. La retención externa depende del proveedor y no queda bajo control de la eliminación local.
- Borrar audio y transcripción locales al completar. En fallos de procesamiento, descartar la transcripción y mantener solo el audio fallido hasta reintento o eliminación manual, sin vencimiento automático.
- Mantener fuera del historial la transcripción y no agregar una política de expiración para reuniones.

La revisión pendiente de Ronald deberá confirmar que esta matriz y el comportamiento ante objeciones o retiro del consentimiento reflejan las decisiones esperadas. El aviso existente no decide por sí solo qué debe hacer el operador ante una objeción. MN-05 sigue pendiente de esa revisión y de registrar evidencia adicional que se solicite. Esta aprobación técnica no sustituye el plan aprobado que se requiere antes de integrar o implementar el producto completo.

## Referencias

- [Alcance aprobado de MeetingNotes v1](MEETINGNOTES_V1_SCOPE.md)
- [Contrato de API propuesto](api/API_CONTRACT.md)
- [POC local de captura de audio](../apps/prototypes/poc-record-audio/README.md)
- [POC OpenAI para macOS](../apps/prototypes/poc-openai-macos/README.md)
- [Plan MN-05 de privacidad, seguridad y ciclo de vida de datos](plans/MN-05-privacidad-seguridad-ciclo-vida-datos.md)

