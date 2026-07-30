# Brief para el Responsable de IA — Bloque 9 · Factoría de Apuntes

## Qué es este bloque

Este brief complementa `BRIEF_IA_BLOQUE6.md`, `BRIEF_IA_BLOQUE7.md` y `BRIEF_IA_BLOQUE8.md`.
El Bloque 9 es la **Factoría de Apuntes** de OPOX: el usuario sube sus propios apuntes
(PDF o fotos) y la IA los digitaliza, los clasifica por temas y genera un banco de
preguntas tipo test personalizado.

| Modo | Qué hace el usuario |
|---|---|
| **Subir** | Sube PDFs o fotos de sus apuntes desde cámara, galería o document picker |
| **Analizar** | La IA extrae el texto (OCR), detecta los temas y genera preguntas |
| **Practicar** | El usuario configura un test filtrando por temas y practica con el runner del Bloque 7 |

---

## Cómo funciona el handoff

```
App móvil → Nuestro backend → [AiApiClient.ts] → Proveedor de IA
```

- **Tú entregas**: el `system_prompt` y la plantilla del mensaje de usuario para cada tarea.
- **Nosotros implementamos**: la llamada HTTP al proveedor y el parseo de la respuesta.
- **Tú no tocas código**: solo los prompts en formato JSON (ver sección "Formato de entrega").
- **La API key nunca sale de nuestro servidor**: el móvil nunca llama a la IA directamente.

---

## Las 3 tareas que necesitamos

### Tarea 1 — Analizar documento con OCR (`analyzeNoteDocument`)

**Cuándo se usa**: al subir un apunte, arrancamos el pipeline. Esta es la primera fase.
La IA recibe cada página como imagen y devuelve el texto extraído + una métrica de
confianza. Si la confianza es baja en muchas páginas, la app muestra el modal de
"No hemos podido leer bien" (9.3·err).

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "pages": [
    {
      "pageNumber": 1,
      "imageBase64": "iVBORw0KGgoAAAANSUhEUg...",
      "mimeType": "image/jpeg"
    },
    {
      "pageNumber": 2,
      "imageBase64": "iVBORw0KGgoAAAANSUhEUg...",
      "mimeType": "image/jpeg"
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `oposicion` | Oposición del usuario. Mismos valores que en Bloque 6. Orienta la limpieza del texto (nombres propios de leyes, siglas, etc.). |
| `pages[].pageNumber` | 1-based. El backend rasteriza los PDF a imágenes antes de mandártelas. |
| `pages[].imageBase64` | Imagen sin prefijo `data:image/...`. |
| `pages[].mimeType` | `image/jpeg`, `image/png` o `image/webp`. |

**Output que necesitamos** (JSON objeto):
```json
{
  "suggestedTitle": "Esquema de la Constitución Española",
  "pages": [
    {
      "pageNumber": 1,
      "extractedText": "TÍTULO PRELIMINAR\n\nArtículo 1. España se constituye en un Estado social y democrático de Derecho...",
      "ocrConfidence": 0.95
    },
    {
      "pageNumber": 2,
      "extractedText": "TÍTULO I. De los derechos y deberes fundamentales...",
      "ocrConfidence": 0.88
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `suggestedTitle` | Título propuesto por la IA leyendo el contenido. **Máx. 60 caracteres.** El usuario podrá editarlo después. |
| `pages[].extractedText` | Texto limpio, sin artefactos de OCR (saltos raros, letras sueltas, marcas de agua). |
| `pages[].ocrConfidence` | 0..1. **< 0.6 = página problemática** (el móvil la destaca visualmente). |

**Reglas del output**:
- Preserva estructura básica: titulares en mayúsculas o con `##`, artículos numerados
- Elimina texto de encabezado/pie recurrente (nº de página, fecha, autor)
- Si una página está en blanco o ilegible, devuelve `extractedText: ""` con `ocrConfidence: 0`
- Un `pageNumber` por cada página del input, exactamente el mismo orden

---

### Tarea 2 — Detectar etiquetas del apunte (`generateTagsFromNote`)

**Cuándo se usa**: tras el OCR, la IA lee el texto completo y devuelve 3-6 etiquetas
temáticas cortas. El usuario las verá en 9.4 y podrá editarlas.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "fullText": "TÍTULO PRELIMINAR\n\nArtículo 1. España se constituye en un Estado social y democrático de Derecho..."
}
```

| Campo | Descripción |
|---|---|
| `oposicion` | Contexto para elegir etiquetas relevantes al temario. |
| `fullText` | Concatenación de los `extractedText` de todas las páginas separados por `\n\n`. |

**Output que necesitamos** (JSON objeto):
```json
{
  "tags": ["Constitución", "Derechos fundamentales", "Título I"]
}
```

| Campo | Descripción |
|---|---|
| `tags` | Entre **3 y 6** etiquetas. Cada una máx. **30 caracteres**. |

**Reglas del output**:
- Etiquetas en español, capitalización natural (no todo en mayúsculas)
- Prefiere nombres canónicos del temario ("Ley 39/2015" antes que "Ley del procedimiento")
- No repitas conceptos: "Constitución" y "CE" no van los dos
- Si el apunte cubre varios temas, prioriza los más presentes en el texto (frecuencia + peso semántico)

---

### Tarea 3 — Generar banco de preguntas (`generateQuestionsFromNote`)

**Cuándo se usa**: última fase del pipeline. La IA genera un banco privado del usuario
a partir de su propio apunte. Estas preguntas se guardan en `note_questions` y se
sirven al runner del Bloque 7 cuando el usuario "Genera test" desde 9.5.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "fullText": "TÍTULO PRELIMINAR\n\nArtículo 1. España se constituye...",
  "tags": ["Constitución", "Derechos fundamentales", "Título I"],
  "count": 24
}
```

| Campo | Descripción |
|---|---|
| `count` | Número de preguntas a generar. Lo calculamos proporcional al tamaño del texto (~3 preguntas por página, máximo 50). |
| `tags` | Las etiquetas de la Tarea 2. Cada pregunta debe llevar la `tag` que le aplique. |

**Output que necesitamos** (JSON objeto):
```json
{
  "questions": [
    {
      "id": "uuid-o-string-único",
      "text": "¿Cuántos artículos tiene la Constitución Española de 1978?",
      "options": [
        "150 artículos",
        "169 artículos",
        "180 artículos",
        "200 artículos"
      ],
      "correctIndex": 1,
      "explanation": "La CE tiene 169 artículos distribuidos en un Título Preliminar y diez Títulos.",
      "topicId": "constitucion",
      "topic": "Constitución Española",
      "difficulty": "medium",
      "tag": "Constitución"
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `text` | Enunciado de la pregunta. Máx. 240 caracteres. |
| `options` | **Exactamente 4** opciones. **No prefijes A)/a./1.** — la app añade la letra. |
| `correctIndex` | 0, 1, 2 o 3 (posición de la opción correcta). |
| `explanation` | Justificación breve (máx. 300 chars) con referencia legal si aplica. |
| `difficulty` | `easy` / `medium` / `hard` según qué tan sutil sea la pregunta. |
| `tag` | Una de las etiquetas del input (`tags`), la que mejor encaje con esta pregunta. |

**Reglas del output**:
- Genera exactamente `count` preguntas, ni una más ni una menos
- **Solo del contenido del `fullText`**: no inventes datos que no estén en el apunte
- Variedad de tipos: definiciones, plazos, excepciones, comparativas
- Distribuye las preguntas entre las `tags` de forma proporcional a la presencia de cada tema en el texto
- No repitas conceptos entre preguntas
- Las opciones incorrectas deben ser plausibles (no obviamente absurdas)

---

## Formato de entrega

Para cada tarea necesitamos un JSON con esta forma:

```json
{
  "task": "analyzeNoteDocument",
  "model_recommendation": "gpt-4o (necesita visión) — más barato que Claude 4 Sonnet para OCR",
  "system_prompt": "Eres el motor de digitalización de apuntes de OPOX...",
  "user_template": "El usuario prepara {{oposicion}}. Analiza las siguientes {{n_pages}} páginas:\n\n{{pages_block}}",
  "output_format": "json_object",
  "examples": [
    {
      "input": { "oposicion": "justicia-tramitacion", "pages": [ /* ... */ ] },
      "output": { "suggestedTitle": "...", "pages": [ /* ... */ ] }
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `task` | `analyzeNoteDocument`, `generateTagsFromNote` o `generateQuestionsFromNote` |
| `model_recommendation` | Modelo recomendado y por qué. Para OCR: `gpt-4o` (visión). Para texto: `gpt-4o-mini`. |
| `system_prompt` | El system message completo. |
| `user_template` | La plantilla con `{{placeholders}}`. |
| `output_format` | `"json_object"` (todas las tareas del Bloque 9). |
| `examples` | Al menos 2 ejemplos input/output realistas. |

Entrega un JSON separado por cada tarea.

---

## Resumen de lo que necesitamos

| Tarea | Urgencia | Necesita visión | Formato output |
|---|:---:|:---:|---|
| `analyzeNoteDocument` | 🔴 Alta | **Sí** (gpt-4o) | JSON objeto |
| `generateTagsFromNote` | 🔴 Alta | No | JSON objeto |
| `generateQuestionsFromNote` | 🔴 Alta | No | JSON objeto con `questions[]` |

**Prioridad sugerida**: `analyzeNoteDocument` primero (bloquea todo el pipeline), luego
`generateQuestionsFromNote` (es lo que el usuario acaba usando en el runner), y por
último `generateTagsFromNote` (es la más simple pero se ejecuta en medio del pipeline).

Con los JSONs que nos entregues nosotros implementamos la conexión al proveedor —
tú no tienes que tocar código. Mientras tanto, el backend usa `AiApiClientStub`
con datos mock realistas para que el pipeline funcione sin IA real.

---

## Estado actual de la integración

- ✅ **Contratos TS**: `packages/types/src/contracts/AiApiContract.ts` extendido con los 3 métodos del Bloque 9
- ✅ **Backend por capas**: use cases, controller, routes, repositorio y pipeline orquestador en `apps/backend/src/**/notes*`
- ✅ **SQL seed**: `apps/backend/supabase/bloque9_notes.sql` con RLS por propietario
- ✅ **Stub ejecutable**: `AiApiClientStub` responde con datos plausibles para que el pipeline sea probable sin IA real
- ⏳ **AiApiClient real**: los 3 métodos lanzan `Error('no implementado — esperando entrega del BRIEF_IA_BLOQUE9')`. Se activarán en cuanto el equipo IA entregue los prompts según este brief.
