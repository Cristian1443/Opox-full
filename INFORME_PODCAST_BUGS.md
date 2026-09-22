# Reporte al equipo IA · Podcast del Aula Virtual (Bloque 8)

**Fecha**: 2026-09-21
**Curso probado**: Policía Local de Galicia · temas 3 y 10
**Endpoints afectados**: `POST https://ia.opox.ai/v1/classroom/podcast` (generación) y `GET https://ia.opox.ai/v1/classroom/podcast/{file}` (audio servido)
**Origen del reporte**: pruebas en dispositivo del módulo Podcast, dos problemas reproducibles de forma consistente.

## Resumen

Dos bugs distintos en el mismo flujo (generación y reproducción de podcasts con IA), ambos con causa en el Motor:

1. El usuario no puede adelantar/retroceder ni saltar en la barra de progreso — el endpoint que sirve el mp3 no soporta HTTP Range requests.
2. La duración real del audio generado no coincide con la solicitada — el guion generado por el LLM es más largo de lo que cabe en el target de tiempo.

De nuestro lado ya adaptamos el proxy (`GET /tutor/podcast/audio/:filename`) para reenviar `Range` y propagar `206 Partial Content` en cuanto el Motor lo soporte — ese fix ya está desplegado, no requiere ninguna acción adicional del equipo IA una vez ustedes agreguen soporte de Range.

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

**De nuestro lado (ya desplegado)**: nuestro proxy `GET /tutor/podcast/audio/:filename` (necesario porque `expo-audio` no puede mandar el header `X-API-Key` que exige el Motor) tampoco reenviaba el header `Range` del cliente ni el `206`/`Content-Range` de vuelta — aunque el Motor soportara Range, el seek seguiría roto por nuestro lado. Ya lo corregimos: el proxy ahora reenvía `Range` al Motor y hace pass-through de `Accept-Ranges` / `Content-Length` / `Content-Range` cuando el Motor los manda. En cuanto el endpoint del Motor soporte Range, el seek debería funcionar sin ningún otro cambio de nuestra parte.

## Bug 2 — La duración real del audio no coincide con la pedida

En la app el usuario elige entre "Corta (~5 min)" y "Media (~10 min)". Enviamos ese valor tal cual en el campo `duracion` del `PodcastIn` (`'corta'` o `'media'`).

Lo que medimos en dispositivo (velocidad 1.0x, curso Policía Local de Galicia, temas 3 y 10, consistente en varias generaciones):

| `duracion` enviada | Target   | Duración real del mp3 | Desvío |
|---|---|---|---|
| `corta` | ~5 min | **8:35** | 1.72× más largo |
| `media` | ~10 min | **16:07** | 1.61× más largo |

El problema no es solo cosmético: para un usuario que elige "5 minutos" porque tiene un descanso corto, recibir 8:35 rompe la promesa. Nos toca poner mensajes vagos tipo "duración aproximada" para tapar el desvío.

**Sospecha**: viene del guion generado por el LLM — más palabras de las que caben en el target según el WPM (palabras por minuto) de la voz de TTS usada.

**Posibles caminos**:
- Ajustar el *word budget* del prompt en función de la voz y velocidad configuradas.
- Recortar o resumir el audio final al target si se pasa del límite.

## Cómo reproducir

- Generar un podcast desde la app (Aula Virtual → Podcast) con `duracion: 'corta'` o `'media'`, cualquier tema del curso Policía Local de Galicia.
- Medir la duración real del mp3 devuelto vs. el target.
- Intentar hacer seek (arrastrar la barra o pulsar ±15s) sobre un episodio ya generado.

## Contacto

Cualquier cosa que necesiten de nuestro lado (payloads exactos, logs, más mediciones) la pasamos sin problema.
