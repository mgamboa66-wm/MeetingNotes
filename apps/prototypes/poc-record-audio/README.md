# MeetingNotes · POC local de audio

Prueba aislada para capturar el micrófono predeterminado y el audio de salida en macOS y Windows, usando una interfaz React y una API local Bun + Hono.

## Arquitectura

- React + TypeScript y Bun + Hono son compartidos.
- macOS usa un helper Swift con Core Audio taps.
- Windows usa un helper Python con PyAudioWPatch y WASAPI loopback para capturar el micrófono y la salida predeterminada.
- Ambos helpers convierten las fuentes a una mezcla mono de 48 kHz y WAV PCM de 16 bits.
- Los WAV se guardan en `recordings/`, excluido de Git, y se conservan hasta borrarlos manualmente.
- El helper escribe el audio localmente. Bun/Hono recibe estado, nivel y nombre de archivo, nunca los bytes de audio.
- La lista y descarga de WAV se sirve desde la API local, enlazada solamente a `127.0.0.1`.
- No hay transcripción, IA, base de datos, cloud ni servicios externos.

## Requisitos

- **macOS:** macOS 14.2 o posterior para Core Audio taps.
- **Windows:** Windows 10 versión 1809 o posterior, Bun y Python 3.11 de 64 bits. La instalación de PyAudioWPatch usa una rueda precompilada y no compila C++ localmente.
- **Permisos:** macOS pide acceso al micrófono y al audio del sistema por separado. En Windows, permite el acceso al micrófono para aplicaciones de escritorio en **Configuración → Privacidad y seguridad → Micrófono**.

El mínimo de Windows 10 1809 es técnico. Las ediciones de Windows 10 1809 que no son LTSC terminaron su servicio en 2021; usa una versión de Windows que todavía reciba actualizaciones. [Estado de Windows 10 1809](https://learn.microsoft.com/en-us/windows/release-health/status-windows-10-1809-and-windows-server-2019)

## Compilar y ejecutar

Desde `apps/prototypes/poc-record-audio/`, instala las dependencias de Bun una vez con `bun install`.

Prepara el capturador del equipo:

- **macOS:** `bun run native:build`
- **Windows:** instala Python 3.11 de 64 bits y asegúrate de que el lanzador `py` esté disponible. Luego ejecuta `bun run native:install:windows`. El comando solo acepta paquetes precompilados; no necesita Visual Studio ni Build Tools de C++.

Después, en dos terminales:

1. Inicia la API local con `bun run dev:api`.
2. Inicia la interfaz con `bun run dev`.
3. Abre <http://127.0.0.1:5173> y pulsa **Iniciar grabación**.
4. Habla por el micrófono y reproduce el tono de prueba; detén la grabación para finalizar el WAV.

En Windows, PyAudioWPatch usa el loopback WASAPI de la salida predeterminada y el micrófono predeterminado. Dirige el audio de prueba a esa salida. Si Windows cambia el dispositivo durante la grabación, detén y vuelve a iniciar.

Para esta POC, usa el tono integrado y tu propia voz. No la uses en reuniones reales hasta que se aprueben las decisiones de consentimiento y privacidad.

## Límites de la prueba

El tap de macOS captura la salida del sistema. En Windows, WASAPI loopback captura la mezcla que se reproduce por el endpoint de salida seleccionado; no combina automáticamente otras salidas independientes. La grabación final es una sola pista mono, por lo que no conserva micrófono y sistema por separado.

La captura con PyAudioWPatch debe verificarse en un equipo Windows; no se puede ejecutar desde macOS. El helper alinea los bloques recibidos del micrófono y del loopback por sus marcas de tiempo, pero la calidad de esa sincronización todavía debe comprobarse en Windows. [Microsoft: Loopback Recording](https://learn.microsoft.com/en-us/windows/win32/coreaudio/loopback-recording)
