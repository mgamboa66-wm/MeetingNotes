# MeetingNotes API local

Backend de MN-08 implementado como proceso local Bun + Hono. Se enlaza solo a `127.0.0.1:4174`; no requiere ni configura un workspace en la raíz.

## Preparación

Desde esta carpeta:

1. Instala las dependencias de este backend con `bun install`.
2. Copia `.env.example` a `.env` y agrega `OPENAI_API_KEY` para probar el procesamiento con OpenAI. La clave solo se lee en el servidor.
3. Ejecuta `bun run dev`. El comando prepara el helper correspondiente y después inicia la API:
   - macOS: compila el helper Swift en cada inicio (requiere macOS 14.2 o posterior y las herramientas de desarrollo de Apple).
   - Windows: crea `native/windows/.venv` e instala la dependencia fijada si hace falta. Se requiere Python 3.11 de 64 bits, el lanzador `py` y conexión a internet la primera vez.

Si la preparación del helper falla, el servidor API aun así inicia para permitir probar endpoints que no requieren captura; la captura devolverá su estado `failed` con un código de error. Para compilar o preparar el helper manualmente siguen disponibles `bun run native:build:macos` y `bun run native:install:windows`.

Las migraciones SQL versionadas de Drizzle se aplican automáticamente antes de escuchar solicitudes. Una migración fallida impide el arranque. La base y el audio reintentable se guardan bajo `~/Library/Application Support/MeetingNotes/` en macOS y `%LOCALAPPDATA%/MeetingNotes/` en Windows.

## Captura y procesamiento

La API exige `Origin` exactamente igual a `http://127.0.0.1:5173` o `http://localhost:5173`, también en health. El cliente frontend debe usar el proxy local de Vite para `/api`. El host de escucha no es configurable y no expone la API a la red.

La captura genera una única pista mono WAV PCM de 16 bits. El procesamiento se inicia con `POST /api/meetings`, responde 202 y se consulta por `GET /api/captures/{captureId}`. El resumen y los pendientes se guardan primero en staging interno; después se borra el WAV y una transacción SQLite publica la reunión. La transcripción permanece en memoria y nunca se guarda. Si falla el procesamiento se conserva el WAV para reintento manual o eliminación.

No se escriben claves, audio, transcripciones, prompts, rutas locales ni errores crudos del proveedor en logs o respuestas.

## Alcance de verificación

El helper macOS se debe compilar y verificar en un equipo macOS con permisos de captura. El helper WASAPI requiere instalación y verificación real en Windows; no se declara validado desde macOS. No usar audio de reuniones reales para las verificaciones.

En el entorno donde se preparó esta implementación, `bun run check` pasó. La compilación Swift no terminó por una incompatibilidad entre el toolchain y el SDK instalados, por lo que el helper no se ejecutó. La captura Windows tampoco se ha verificado.
