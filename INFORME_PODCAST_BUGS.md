# Reporte al equipo IA · Podcast del Aula Virtual (Bloque 8)

**Fecha**: 2026-09-21 (actualizado 2026-09-23 — dos veces el mismo día, ver Bug 2)
**Curso probado**: Policía Local de Galicia · temas 3 y 10
**Endpoints afectados**: `POST https://ia.opox.ai/v1/classroom/podcast` (generación) y `GET https://ia.opox.ai/v1/classroom/podcast/{file}` (audio servido)
**Origen del reporte**: pruebas en dispositivo del módulo Podcast, reproducible de forma consistente.

## Resumen

Estado actualizado tras verificación en producción (2026-09-23):

1. **Bug 1 — Seek roto: PARCIALMENTE resuelto.** El endpoint ya soporta HTTP Range (`206` correcto, confirmado con `curl`). Pero encontramos una **segunda causa, independiente**: el mp3 que genera el Motor no trae cabecera `Xing`/`VBRI`, así que los reproductores nativos (ExoPlayer en Android, y probablemente AVPlayer en iOS) no pueden calcular a qué byte saltar en un archivo de bitrate variable, aunque el servidor sí soporte Range. El seek sigue sin funcionar en el dispositivo por esta segunda causa. Ver detalle abajo.
2. **Bug 2 — Duración real vs. pedida: NO resuelto, sigue habiendo desvío significativo (corregido el mismo día).** La medición de la mañana (`duration_seconds: 303.84` vs `target: 300`, 0.9%) resultó ser un caso puntual, no la norma. En pruebas posteriores del mismo día, con el mismo tema y `duracion: 'corta'`, obtuvimos **276.84 s** (objetivo 300 s, -7.7%), y en dispositivo el usuario midió **4:50** y **4:25** en dos generaciones consecutivas del mismo tema (-3.3% y -11.7% respectivamente). El desvío ya no es siempre "más largo" como documentamos originalmente — ahora varía en ambas direcciones y de forma inconsistente entre generaciones del mismo tema/tier. Dejamos la tabla original como referencia histórica.

De nuestro lado ya desplegamos el proxy (`GET /tutor/podcast/audio/:filename`) reenviando `Range` y el método HTTP real (`HEAD` incluido — antes siempre hacíamos `GET`, lo que le hacía perder a Node las cabeceras `Content-Length`/`Accept-Ranges` en las respuestas a `HEAD`). Confirmado con `curl` en producción: `HEAD` y `GET` con `Range` responden correctamente. No requiere más cambios de nuestro lado para el soporte de Range — pero el seek sigue bloqueado por la falta de cabecera Xing/VBRI en el archivo.

## Bug 1 — El usuario no puede adelantar ni retroceder el audio

Cuando el usuario abre un podcast generado y pulsa "15s atrás / 15s adelante", no pasa nada. Tampoco puede saltar tocando la barra de progreso — la reproducción solo avanza en línea, de principio a fin.

**Causa**: el endpoint `GET /v1/classroom/podcast/{file}` responde `405 Method Not Allowed` a peticiones `HEAD` y no expone las cabeceras `Accept-Ranges: bytes` ni `Content-Length`. Sin eso, los reproductores nativos de Android (ExoPlayer) e iOS (AVPlayer) no pueden hacer *seek* sobre un mp3 remoto — solo saben reproducir de principio a fin.

**Lo que necesitamos**: que el endpoint soporte HTTP Range requests (`206 Partial Content` cuando el cliente manda `Range: bytes=...`). En FastAPI esto normalmente se resuelve cambiando el handler de `StreamingResponse` a `FileResponse(path, media_type="audio/mpeg")`, que ya trae soporte de Range y HEAD nativos.

**Cómo verificarlo cuando esté listo**:
```
curl -I <url>
  → 200 OK, Accept-Ranges: bytes, Content-Length: <n>

curl -H "Range: bytes=0-1023" -I <url>
  → 206 Partial Content, Content-Range: bytes 0-1023/<total>
```

**De nuestro lado (ya desplegado)**: nuestro proxy `GET /tutor/podcast/audio/:filename` (necesario porque `expo-audio` no puede mandar el header `X-API-Key` que exige el Motor) tampoco reenviaba el header `Range` del cliente ni el `206`/`Content-Range` de vuelta — aunque el Motor soportara Range, el seek seguiría roto por nuestro lado. Ya lo corregimos: el proxy ahora reenvía `Range` al Motor y hace pass-through de `Accept-Ranges` / `Content-Length` / `Content-Range` cuando el Motor los manda. Verificado en producción con `curl`, ambos casos responden bien.

### Bug 1b — Nueva causa encontrada: falta cabecera Xing/VBRI en el mp3 (2026-09-23)

Con el soporte de Range ya funcionando en el servidor, el seek **seguía sin funcionar** en dispositivo (Android). Descargamos los primeros 8 KB de un mp3 generado y confirmamos que **no contiene ninguna de las cabeceras `Xing`, `Info` ni `VBRI`** — el marcador que los decoders usan para saber, en un archivo de bitrate variable (VBR), a qué byte exacto corresponde cada segundo de audio.

Sin esa cabecera, ExoPlayer (Android) y probablemente AVPlayer (iOS) no pueden calcular una posición de seek fiable — es una limitación conocida de esos frameworks con mp3 VBR sin seek table, **independiente de si el servidor soporta HTTP Range o no**. Por eso el seek sigue bloqueado aunque ya arreglamos la parte del servidor.

**Lo que necesitamos**: que el mp3 se codifique con la cabecera Xing/VBRI incluida (la mayoría de encoders, incluyendo LAME, la agregan automáticamente si no se desactiva explícitamente — p. ej. `lame` la escribe por defecto salvo `--noreplaygain`/flags específicos que la omitan; en `ffmpeg` con `libmp3lame` normalmente también se escribe salvo que el pipeline la esté recortando después). Alternativa más simple si el pipeline ya genera CBR (bitrate constante): declararlo explícitamente en vez de VBR — con CBR los decoders pueden estimar la posición de seek por bitrate fijo sin necesitar la cabecera.

**Cómo verificar**: los primeros ~1-2 KB del archivo deben contener la cadena ASCII `Xing`, `Info` o `VBRI` poco después del primer frame header MP3 (`0xFF 0xFx`).

## Bug 2 — La duración real del audio no coincide con la pedida

En la app el usuario elige entre "Corta (~5 min)" y "Media (~10 min)". Enviamos ese valor tal cual en el campo `duracion` del `PodcastIn` (`'corta'` o `'media'`).

Lo que medimos en dispositivo (velocidad 1.0x, curso Policía Local de Galicia, temas 3 y 10, consistente en varias generaciones):

| `duracion` enviada | Target   | Duración real del mp3 | Desvío |
|---|---|---|---|
| `corta` | ~5 min | **8:35** | 1.72× más largo |
| `media` | ~10 min | **16:07** | 1.61× más largo |

El problema no es solo cosmético: para un usuario que elige "5 minutos" porque tiene un descanso corto, recibir 8:35 rompe la promesa. Nos toca poner mensajes vagos tipo "duración aproximada" para tapar el desvío.

**Sospecha (histórica)**: viene del guion generado por el LLM — más palabras de las que caben en el target según el WPM (palabras por minuto) de la voz de TTS usada.

**Actualización 2026-09-23 (mañana)**: generamos un podcast nuevo (`duracion: 'corta'`, mismo curso) y medimos `duration_seconds: 303.84` contra `target_seconds: 300` — **0.9% de desvío**. En ese momento pensamos que estaba resuelto.

**Actualización 2026-09-23 (tarde) — el desvío reaparece, ahora hacia abajo**: un usuario probando en dispositivo (Tema 1, `duracion: 'corta'`, velocidad 1.0x) reportó dos generaciones consecutivas más cortas de lo esperado: **4:50** (290 s, -3.3%) y **4:25** (265 s, -11.7%). Reprodujimos el problema nosotros mismos llamando directamente a `POST /v1/classroom/podcast` con el mismo tema (`tema_id: 4f97d34a291646bf`, curso `ef7d941bea5f41d7`) y obtuvimos:

```json
{"resultado":{"duration_seconds":276.84,"target_seconds":300,"words":672}, "tokens_out":883}
```

**276.84 s contra 300 s objetivo (-7.7%)**. En menos de 12 horas vimos desvíos de +0.9%, -3.3%, -7.7% y -11.7% para el mismo tema y el mismo tier — el problema no está resuelto, es inestable. Sospechamos que sigue siendo el guion generado por el LLM (`words: 672` en esta corrida — si la meta son ~300s y el TTS ronda ~150 wpm, 672 palabras rinden ~4:29, coherente con los 276.84 s medidos: el guion mismo ya viene corto/largo de forma variable, no es un problema de la síntesis de voz). Sugerimos fijar un rango de palabras objetivo más estricto en el prompt del guion (o un paso de validación que regenere si el conteo de palabras se sale de ±5% del target) en vez de confiar en que el LLM lo calcule bien cada vez.

De nuestro lado ya usamos la duración real que ustedes devuelven (`duration_seconds`) en vez de un estimado fijo — antes lo ignorábamos y siempre mostrábamos 300s/600s según el tier pedido, lo cual generaba confusión adicional independiente de la precisión real del Motor. Eso ya está bien de nuestro lado; lo que falta corregir es la precisión del guion/generación en el Motor.

## Cómo reproducir

- Generar un podcast desde la app (Aula Virtual → Podcast) con `duracion: 'corta'` o `'media'`, cualquier tema del curso Policía Local de Galicia.
- Medir la duración real del mp3 devuelto vs. el target.
- Intentar hacer seek (arrastrar la barra o pulsar ±15s) sobre un episodio ya generado — seguirá sin funcionar en Android/ExoPlayer hasta que el mp3 traiga cabecera Xing/VBRI (o sea CBR).
- Para confirmar la falta de cabecera: descargar los primeros 2-8 KB del mp3 y buscar las cadenas `Xing`, `Info` o `VBRI`.

## Contacto

Cualquier cosa que necesiten de nuestro lado (payloads exactos, logs, más mediciones) la pasamos sin problema.
