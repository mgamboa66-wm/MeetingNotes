# MeetingNotes — guía de integración para frontend

**Estado:** guía de trabajo basada en la propuesta de [contrato de API](api/API_CONTRACT.md). El alcance de producto v1 está aprobado; estas rutas y detalles aún no están implementados y deben coordinarse con backend.

## Responsabilidad del frontend

El frontend presenta el aviso de consentimiento, controla la captura local, permite elegir español o inglés para cada reunión, muestra el estado del procesamiento y presenta el historial local. El backend realiza la captura nativa, transcribe y genera las notas, y guarda el historial en SQLite.

El frontend trabaja con un **captureId** opaco. No construye rutas de archivos, no lee el audio y no envía audio ni transcripciones. La captura combina audio del sistema y micrófono en una sola pista. Las capturas cuyo procesamiento falla permanecen disponibles localmente para reintentar o eliminar, incluso después de cerrar y volver a abrir la aplicación.

## Flujo propuesto

1. **Iniciar captura** — llamar a **POST /api/captures** y guardar el **captureId** devuelto.
2. **Mostrar estado o nivel** — consultar **GET /api/captures/{captureId}** mientras la captura está activa. El nivel, si está presente, es un número entre 0 y 1.
3. **Detener captura** — llamar a **POST /api/captures/{captureId}/stop**. La respuesta **ready** indica que el backend dejó el archivo combinado listo.
4. **Crear y procesar** — solicitar a la persona usuaria el idioma de salida y llamar a **POST /api/meetings** con **captureId** y **outputLanguage**. No enviar audio, transcripción, resumen ni pendientes.
5. **Mostrar el resultado** — la solicitud espera y devuelve la reunión completa. Actualizar la lista o la caché de reuniones.
6. **Recuperar fallos** — al abrir la aplicación, consultar **GET /api/captures?status=failed** para mostrar capturas fallidas guardadas. Reintentar enviando **POST /api/meetings** con el mismo **captureId** y el idioma elegido, o eliminar mediante **DELETE /api/captures/{captureId}**.

No hay un recurso Operation ni sondeo de progreso del procesamiento en esta propuesta. Si falla una solicitud de procesamiento, el backend descarta la transcripción y conserva el audio; el frontend puede refrescar la lista de capturas fallidas para recuperar su estado. En caso de timeout, el resultado puede ser incierto hasta revisar reuniones y capturas fallidas; el mecanismo para reconciliar ese caso sigue pendiente.

## Payloads y tipos propuestos

### Iniciar captura

**POST /api/captures** no requiere body.

    type CaptureStarted = {
      captureId: string;
      status: 'capturing';
      startedAt: string;
    };

### Estado de captura

    type CaptureStatus =
      | 'starting'
      | 'capturing'
      | 'stopping'
      | 'ready'
      | 'processing'
      | 'failed';

    type CaptureState = {
      captureId: string;
      status: CaptureStatus;
      level?: number; // 0..1
      updatedAt: string;
    };

Los estados son propuestas del contrato API. No asumir expiración automática. Los campos adicionales de la lista de capturas fallidas aún deben acordarse.

### Crear reunión

**POST /api/meetings**:

    type OutputLanguage = 'es' | 'en';

    type CreateMeetingRequest = {
      captureId: string;
      outputLanguage: OutputLanguage;
      title?: string | null;
      meetingDate?: string | null; // Campo candidato; RFC 3339 con zona horaria.
    };

    type ActionItem = {
      id: string;
      meetingId: string;
      task: string;
      assignee: string | null;
      dueDateText: string | null;
    };

    type Meeting = {
      id: string;
      title: string | null;
      outputLanguage: OutputLanguage;
      summary: string;
      actionItems: ActionItem[];
      createdAt: string;
      updatedAt: string;
      meetingDate?: string | null; // Campo candidato, aún no fijado por el alcance.
    };

**captureId** y **outputLanguage** son obligatorios. La respuesta propuesta es la reunión completa con HTTP 201. **title** es opcional; **meetingDate** permanece como campo candidato porque el alcance aprobado no exige guardarla.

Las tareas deben representar compromisos explícitos. No inventar tareas, responsables ni fechas. **dueDateText** puede contener una fecha relativa tal como se dijo; el frontend no debe asumir que es una fecha ISO ni convertirla en fecha calendario.

### Capturas fallidas

    type FailedCapture = {
      captureId: string;
      status: 'failed';
      startedAt: string;
      failedAt: string;
    };

    type FailedCapturesResponse = {
      items: FailedCapture[];
    };

**GET /api/captures?status=failed** lista capturas reintentables sin revelar rutas ni audio. Los campos exactos y la paginación siguen pendientes. Para reintentar, enviar una nueva solicitud a **POST /api/meetings** con el mismo **captureId**; para eliminar el archivo local, llamar a **DELETE /api/captures/{captureId}**.

## Consultas y edición de reuniones

- **GET /api/meetings?limit=20&cursor=...** carga el historial local paginado.
- **GET /api/meetings/{meetingId}** carga el detalle.
- **PATCH /api/meetings/{meetingId}** edita el título y el resumen. La edición de **meetingDate** sigue sin definirse.
- **POST /api/meetings/{meetingId}/action-items** agrega un pendiente.
- **PATCH /api/meetings/{meetingId}/action-items/{actionItemId}** edita un pendiente.
- **DELETE /api/meetings/{meetingId}** elimina la reunión y todos sus pendientes.

No está definido si se podrán eliminar pendientes individuales. Invalidar o refrescar las consultas de TanStack Query después de crear, editar o eliminar recursos.

## Errores para la interfaz

Formato común propuesto:

    {
      "error": {
        "code": "CAPTURE_NOT_READY",
        "message": "La captura aún no está lista para procesar."
      }
    }

Interpretación sugerida:

- **400:** corregir los datos de la solicitud.
- **404:** el recurso no existe; no implica expiración automática.
- **409:** captura ocupada, estado incompatible o conflicto de idempotencia; refrescar el estado antes de volver a actuar.
- **502 / 503:** falló OpenAI o una dependencia; mostrar el error y refrescar la cola de capturas fallidas para ofrecer reintentar o eliminar el audio.
- **500:** error local inesperado; consultar el historial y la cola de fallidas antes de volver a enviar para reducir el riesgo de duplicar una reunión.

Los códigos y el formato de error aún son propuestas. El cliente debe basarse en códigos estables, no en texto libre. No mostrar errores internos, rutas, claves, prompts ni detalles que expongan datos de la reunión.

## Comportamiento y privacidad

- Mantener el **captureId** como valor opaco. No depender solo del estado en memoria para recuperar fallos: cargar la lista de fallidas desde la API al iniciar la aplicación.
- Deshabilitar acciones duplicadas mientras captura o procesa. El backend debe permitir un nuevo intento con el mismo **captureId** tras un fallo.
- Detener el sondeo de estado de captura al dejar de capturar; el procesamiento de **POST /api/meetings** espera su respuesta completa en este diseño.
- No escribir audio, transcripciones, claves de proveedor ni respuestas sensibles en logs del navegador.
- Mantener el aviso visible y persistente según el alcance aprobado. El aviso no comprueba por sí mismo el consentimiento de participantes.
- No hay cuentas, login ni sincronización en v1. El historial es local a cada computadora.
- El uso de OpenAI y el tratamiento de audio descrito en el alcance v1 están aprobados. La eliminación local no elimina datos que el proveedor pudiera conservar conforme a los controles vigentes de la cuenta.

## Detalles para acordar con backend

Host y puerto local, semántica de **Idempotency-Key**, reconciliación de timeouts y reintentos, códigos HTTP definitivos, campos y paginación de capturas fallidas, recuperación ante cierre inesperado, y decisión sobre **meetingDate** y eliminación individual de pendientes.
