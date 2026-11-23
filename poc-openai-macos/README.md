# MeetingNotes · POC OpenAI para macOS

POC local para capturar audio del sistema y el micrófono en macOS, enviarlo a OpenAI para transcribirlo y generar un resumen con TODOs.

## Alcance

- macOS 14.2 o posterior; reutiliza el helper Swift y el control local Bun + Hono del POC de captura.
- El WAV se guarda temporalmente fuera del repositorio y se elimina al terminar el procesamiento, tanto si tiene éxito como si falla.
- La transcripción vive solo en memoria durante el procesamiento. La interfaz muestra únicamente el resumen y los TODOs.
- Los resultados viven en la memoria del servidor y desaparecen al cerrar la API o al pulsar Limpiar resultados.
- La captura combina el sistema y el micrófono en una pista mono; no conserva canales separados.
- En caso de error se eliminan los temporales; para volver a intentar hay que grabar otra vez.

## Configuración

Requisitos: macOS 14.2 o posterior, Bun y una clave de OpenAI API.

1. Instala dependencias con `bun install`.
2. Copia .env.example como .env.
3. Completa OPENAI_API_KEY con tu clave y OPENAI_TEXT_MODEL con un identificador de modelo de texto disponible en tu cuenta que admita respuestas estructuradas.
4. Compila el helper con `bun run native:build`.

Bun lee el archivo .env. La clave se usa solo en el servidor local y nunca se entrega al navegador. No pegues la clave en el código ni en el chat. El archivo .env está excluido de Git.

## Ejecutar

Desde esta carpeta, inicia en dos terminales:

Terminal 1: bun run dev:api
Terminal 2: bun run dev

Abre http://127.0.0.1:5173. macOS solicitará permisos para el micrófono y la captura del audio del sistema. Al detener, la API envía el audio a OpenAI. Si el WAV supera 20 MiB, lo divide en fragmentos con un solapamiento breve y combina sus transcripciones antes del resumen.

Para limpiar la memoria de la aplicación, pulsa Limpiar resultados. Para cerrar completamente el POC, detén también la API con Ctrl+C.

## TODOs

Cada TODO incluye tarea, responsable y fecha. Si la reunión no indica responsable o fecha, se guardan como null y la interfaz muestra “No especificado”. El modelo debe incluir solo tareas acordadas, sin inventar asignaciones ni fechas.

## Tratamiento de datos

El audio y la transcripción se envían a OpenAI para procesarlos. La aplicación elimina sus copias temporales y no persiste los resultados en disco. La retención del lado de OpenAI es independiente; revisa la guía oficial de controles de datos y la configuración de tu organización.

La transcripción usa el modelo gpt-transcribe y el endpoint de archivos de OpenAI, con máximo documentado de 25 MB por archivo. Los segmentos de 20 MiB mantienen margen bajo ese límite. El resumen usa la Responses API con salida JSON estructurada y store false.

Usa grabaciones de prueba y verifica que tienes consentimiento para grabar a las personas participantes.
