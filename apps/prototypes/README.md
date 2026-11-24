# POCs aislados de MeetingNotes

Los POCs con código conservan su propio manifiesto, lockfile e instrucciones. Estos experimentos no forman una aplicación de producto integrada ni aprueban por sí mismos el alcance, el tratamiento de audio o las decisiones pendientes de MeetingNotes.

- `poc-record-audio/`: captura local de audio en macOS y Windows.
- `poc-openai-macos/`: experimento macOS que envía audio a OpenAI para transcribirlo y generar notas.
- `poc-macos-audio/`: carpeta auxiliar que contiene solo archivos de caché de Vite; no incluye código fuente.

Consulta el `README.md` de cada POC antes de ejecutarlo. El manifiesto y el lockfile de cada POC se mantienen dentro de su carpeta; no hay un workspace raíz.
