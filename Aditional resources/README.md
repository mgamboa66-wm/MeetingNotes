# teams-notes

Graba el audio de reuniones de Microsoft Teams (o cualquier reunión de audio),
transcribe localmente con Whisper y genera notas estructuradas estilo Notion con Claude.

---

> ⚠️ **AVISO LEGAL — LEE ANTES DE USAR**
> Grabar una reunión sin el consentimiento de todos los participantes puede ser
> ilegal en tu país o región. **Obtén siempre el consentimiento explícito de todos
> los participantes antes de iniciar la grabación.** El autor de esta herramienta
> no se hace responsable del uso indebido.

---

## Características

- Captura simultánea de **audio del sistema** (loopback WASAPI) + **micrófono**
- Transcripción **100 % local** con [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (modelo large-v3)
- **Autodetección** de idioma (español, inglés, o mezcla)
- Notas en Markdown con: resumen ejecutivo, puntos clave, decisiones, action items y seguimiento
- Map-reduce automático para reuniones largas

---

## Requisitos previos

| Requisito | Notas |
|-----------|-------|
| Python 3.10+ | Recomendado 3.11 |
| [ffmpeg](https://ffmpeg.org/download.html) | Añádelo al PATH de Windows (`winget install ffmpeg`) |
| GPU NVIDIA (opcional) | Acelera Whisper ~5-10×; sin ella usa CPU |

---

## Instalación

```powershell
# 1. Clona o copia la carpeta teams-notes
cd teams-notes

# 2. Crea y activa un entorno virtual
python -m venv .venv
.venv\Scripts\Activate.ps1

# 3. Instala dependencias
pip install -r requirements.txt

# 4. Configura tu API key de Anthropic
copy .env.example .env
# Edita .env y pega tu ANTHROPIC_API_KEY
```

> **Nota sobre pyaudiowpatch:** es un fork de PyAudio con soporte WASAPI loopback
> nativo en Windows. Si la instalación falla, asegúrate de tener instalado
> Microsoft C++ Build Tools o usa el wheel precompilado:
> `pip install pyaudiowpatch --find-links https://github.com/s0d3s/PyAudioWPatch/releases`

---

## Uso

### Opción más fácil: acceso directo del escritorio

Se crea un acceso directo **`teams-notes`** en el escritorio. Solo haz **doble clic**:
abre una ventana, activa el entorno, muestra el recordatorio de consentimiento e
inicia la grabación. Presiona **Ctrl+C** para detener y generar las notas. La ventana
permanece abierta al terminar (gracias a `-NoExit`) para que leas las notas o escribas
otros comandos.

> El acceso directo ejecuta `Iniciar-TeamsNotes.ps1`. Si mueves la carpeta del proyecto,
> edita la ruta `$ProjectDir` dentro de ese script y vuelve a crear el acceso directo.

### Grabar una reunión (flujo completo)

```powershell
python main.py
```

1. Muestra lista de dispositivos detectados
2. Inicia grabación (sistema + micrófono)
3. Presiona **Ctrl+C** para detener
4. Transcribe localmente con Whisper
5. Genera notas con Claude
6. Guarda todo en `output/YYYY-MM-DD_HHMM/`

### Solo transcribir (sin notas de Claude)

```powershell
python main.py --solo-transcribir
```

### Procesar un archivo ya existente

```powershell
python main.py --archivo "C:\ruta\a\reunion.mp3"
python main.py --archivo reunion.wav --modelo medium
```

### Elegir modelo Whisper

```powershell
python main.py --modelo medium        # más rápido, menos preciso
python main.py --modelo large-v3      # default, más preciso
```

### Forzar dispositivo loopback

Si el loopback automático no detecta el audio correcto:

```powershell
python main.py                  # observa la lista de dispositivos al inicio
python main.py --loopback-index 5    # usa el dispositivo con índice 5
```

### Elegir micrófono

Por defecto la app usa el **micrófono integrado de la laptop** (detectado por nombre:
`Microphone Array`, `Smart Sound`, etc.), evitando auriculares externos como Jabra.
Para forzar otro micrófono, usa su índice de la lista inicial:

```powershell
python main.py --mic-index 7    # p. ej. usar el micrófono del headset Jabra
```

---

## Estructura de salida

```
output/
  2024-11-15_1430/
    2024-11-15_1430_audio.wav           # grabación mezclada
    2024-11-15_1430_transcripcion.txt   # transcripción con timestamps
    2024-11-15_1430_notas.md            # notas Markdown estructuradas
```

---

## Dependencias clave

| Paquete | Propósito |
|---------|-----------|
| `pyaudiowpatch` | Captura WASAPI loopback (audio del sistema) en Windows |
| `faster-whisper` | Transcripción local con Whisper optimizado |
| `numpy` | Mezcla y procesamiento de señales de audio |
| `pydub` | Conversión de formatos de audio (requiere ffmpeg) |
| `anthropic` | SDK oficial de Claude para generar notas |
| `python-dotenv` | Carga de variables de entorno desde `.env` |

---

## Solución de problemas

**"No se encontró dispositivo loopback"**
- Ve a Configuración de Windows → Sistema → Sonido → asegúrate de que el dispositivo
  de reproducción predeterminado esté activo.
- Prueba con `--loopback-index N` eligiendo un dispositivo que diga "Stereo Mix" o similar.

**Whisper descarga el modelo lentamente**
- La primera ejecución descarga el modelo (~1.5 GB para large-v3). Ejecuciones posteriores
  usan la caché local (`~/.cache/huggingface/hub/`).

**Error de ffmpeg**
- Instala ffmpeg y asegúrate de que esté en el PATH: `ffmpeg -version` debe funcionar.
