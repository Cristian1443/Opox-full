# Brief para el Responsable de IA — Bloque 8 · Aula Virtual / Tutor IA

## Qué es este bloque

Este brief complementa `BRIEF_IA_BLOQUE6.md` y `BRIEF_IA_BLOQUE7.md`. El Bloque 8 es el
**Aula Virtual** de OPOX: un espacio donde el usuario estudia con ayuda de la IA en 4 modos.

| Modo | Qué hace el usuario |
|---|---|
| **Chat** | Conversa con el Tutor IA para resolver dudas del temario |
| **Flashcards** | Repasa tarjetas generadas por IA sobre un tema concreto |
| **Resúmenes** | Lee un resumen estructurado (principios, estructura, a recordar) del tema |
| **Podcast** | Escucha el tema narrado por la IA (texto → TTS, fase futura) |

---

## Cómo funciona el handoff

```
App móvil → Nuestro backend → [TutorAiClient.ts] → Proveedor de IA
```

- **Tú entregas**: el `system_prompt` y la plantilla del mensaje de usuario para cada tarea.
- **Nosotros implementamos**: la llamada HTTP al proveedor y el parseo de la respuesta.
- **Tú no tocas código**: solo los prompts en formato JSON (ver sección "Formato de entrega").
- **La API key nunca sale de nuestro servidor**: el móvil nunca llama a la IA directamente.

---

## Las 4 tareas que necesitamos

### Tarea 1 — Responder al chat del Tutor (`generateChatResponse`)

**Cuándo se usa**: el usuario escribe una duda en el chat del Aula Virtual. La IA responde
como un tutor experto en la oposición del usuario. Puede haber historial de mensajes previos.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "topic": "Ley 39/2015",
  "history": [
    { "role": "user", "content": "¿Qué diferencia hay entre silencio positivo y negativo?" },
    { "role": "assistant", "content": "El silencio positivo implica estimación..." }
  ],
  "userMessage": "¿Y en qué casos aplica el silencio negativo obligatoriamente?"
}
```

| Campo | Descripción |
|---|---|
| `oposicion` | Oposición del usuario. Mismos valores que en Bloque 6. |
| `topic` | Tema activo de la conversación. Puede ser `null` si no hay contexto. |
| `history` | Últimos 10 mensajes de la conversación (alternando `user` / `assistant`). Puede ser `[]`. |
| `userMessage` | El mensaje que acaba de escribir el usuario. |

**Output que necesitamos** (JSON objeto):
```json
{
  "content": "El silencio negativo es obligatorio en tres supuestos principales: (1) cuando la solicitud implique ejercicio de actividades que puedan dañar el medioambiente o el patrimonio histórico, (2) cuando afecte a terceros que deban ser convocados, y (3) cuando lo establezca una norma con rango de ley. Ver art. 24.1 Ley 39/2015.",
  "suggestedActions": [
    { "label": "Crear flashcards", "icon": "layers-outline" },
    { "label": "Ponme un ejemplo", "icon": "bulb-outline" },
    { "label": "Hazme un test", "icon": "checkbox-outline" }
  ]
}
```

| Campo | Descripción |
|---|---|
| `content` | Respuesta del tutor. **Máx. 800 caracteres.** En español formal. |
| `suggestedActions` | Array de 2-3 acciones contextuales para mostrar como chips en la app. Opcional. |

**Reglas del output**:
- Respuesta en español formal, tono de tutor cercano (no condescendiente)
- Si hay referencia legal concreta, incluirla (ej. "art. 24.1 Ley 39/2015")
- `icon` en `suggestedActions` debe ser un nombre válido de Ionicons: `layers-outline`, `bulb-outline`, `checkbox-outline`, `document-text-outline`, `headset-outline`
- `suggestedActions` solo cuando la respuesta abra la puerta a una acción (no siempre)
- **No inventar jurisprudencia ni artículos**: si no estás seguro de la referencia, omítela

---

### Tarea 2 — Generar mazo de flashcards (`generateFlashcards`)

**Cuándo se usa**: el usuario pulsa "Crear flashcards" (desde el chat o desde Resúmenes).
La pantalla de carga muestra una animación de ~3 segundos mientras la IA genera las tarjetas.
Después aparece el mazo con `N` tarjetas para repasar con sistema de repetición espaciada.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "topicId": "ley-39",
  "topicTitle": "Ley 39/2015, Procedimiento Administrativo Común",
  "count": 10
}
```

| Campo | Descripción |
|---|---|
| `oposicion` | Oposición del usuario. |
| `topicId` | ID del tema (ver lista en `BRIEF_IA_BLOQUE6.md`). |
| `topicTitle` | Nombre completo del tema en lenguaje natural. |
| `count` | Número de tarjetas a generar. Siempre entre 5 y 20. |

**Output que necesitamos** (JSON array, exactamente `count` objetos):
```json
[
  {
    "question": "¿Cuál es el plazo general para resolver un procedimiento administrativo?",
    "answer": "3 meses, salvo que una norma con rango de ley fije un plazo distinto (art. 21.2 Ley 39/2015)."
  },
  {
    "question": "¿Qué efecto produce el silencio administrativo positivo?",
    "answer": "La solicitud se entiende estimada de pleno derecho si la Administración no resuelve en el plazo legal (art. 24.1)."
  }
]
```

| Campo | Descripción |
|---|---|
| `question` | Pregunta concisa. **Máx. 120 caracteres.** |
| `answer` | Respuesta completa con referencia legal si aplica. **Máx. 300 caracteres.** |

**Reglas del output**:
- Las tarjetas deben cubrir los **conceptos más examinados** del tema, no definiciones triviales
- No repetir conceptos entre tarjetas
- Preguntas en interrogativa directa, sin rodeos
- Respuestas completas: incluir el "por qué" y la referencia legal cuando sea corta
- Variedad: mezclar definiciones, plazos, excepciones y comparativas
- Exactamente `count` tarjetas, ni una más ni una menos

---

### Tarea 3 — Generar resumen inteligente de un tema (`generateSummary`)

**Cuándo se usa**: el usuario accede a "Resúmenes" y selecciona un tema. Si el resumen no
está en caché, la IA lo genera. El resumen tiene **siempre 3 secciones** con estructura fija.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "topicId": "ley-39",
  "topicTitle": "Ley 39/2015, Procedimiento Administrativo Común"
}
```

**Output que necesitamos** (JSON objeto con `sections` array de exactamente 3 elementos):
```json
{
  "sections": [
    {
      "id": "principles",
      "type": "principles",
      "title": "PRINCIPIOS CLAVE",
      "icon": "star-outline",
      "content": [
        "Eficacia y eficiencia como guías de actuación administrativa",
        "Transparencia y participación ciudadana activa",
        "Administración electrónica como canal preferente desde 2016"
      ]
    },
    {
      "id": "structure",
      "type": "structure",
      "title": "ESTRUCTURA",
      "icon": "layers-outline",
      "content": [
        "Título I — Disposiciones generales y actividad administrativa",
        "Título III — Actos administrativos: requisitos y eficacia",
        "Título IV — Procedimiento: inicio, ordenación, instrucción y terminación",
        "Título V — Revisión de actos en vía administrativa"
      ]
    },
    {
      "id": "reminder",
      "type": "reminder",
      "title": "A RECORDAR",
      "icon": "alert-circle-outline",
      "content": [
        "Plazo general de resolución: 3 meses (art. 21.2). Cae en casi todos los exámenes.",
        "Silencio positivo es la regla general; el negativo es la excepción (art. 24).",
        "Las personas jurídicas tienen obligación de relacionarse electrónicamente (art. 14)."
      ]
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `sections[].type` | Fijo: `"principles"`, `"structure"`, `"reminder"`. En ese orden y siempre los 3. |
| `sections[].title` | Etiqueta visible en la app. Puedes adaptarla al tema. |
| `sections[].icon` | Nombre de Ionicons. Usar: `star-outline`, `layers-outline`, `alert-circle-outline`. |
| `sections[].content` | Array de 3 a 5 bullets. Concisos. Sin punto al final de cada bullet. |

**Reglas del output**:
- Siempre 3 secciones, en el orden `principles → structure → reminder`
- `"principles"`: los 3-4 principios o ideas fuerza del tema
- `"structure"`: la organización real del texto legal (títulos, capítulos, artículos clave)
- `"reminder"`: los 2-3 datos que más caen en examen + una trampa frecuente
- Bullets concisos: máx. 80 caracteres por bullet
- **No inventar numeración de artículos**: si no estás seguro, describe el contenido sin citar artículo

---

### Tarea 4 — Generar script de podcast (`generatePodcastScript`) — Fase futura

**Estado actual**: los episodios de podcast se crean manualmente en la base de datos.
Esta tarea estará activa cuando el servicio TTS esté integrado.

**Cuándo se usará**: un job nocturno pide a la IA un script de narración para un tema;
el backend lo convierte a audio con TTS y lo sirve como episodio de podcast.

**Input que te mandaremos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "topicId": "ley-39",
  "topicTitle": "Ley 39/2015, Procedimiento Administrativo Común",
  "durationTarget": 600
}
```

| Campo | Descripción |
|---|---|
| `durationTarget` | Duración objetivo en segundos. 600 = 10 minutos a ~150 palabras/minuto ≈ 1500 palabras. |

**Output que necesitaremos** (JSON objeto):
```json
{
  "title": "Ley 39/2015 a fondo: el procedimiento que debes dominar",
  "script": "Bienvenido al Aula Virtual de OPOX. Hoy vamos a repasar la Ley 39/2015...",
  "segments": [
    { "heading": "¿Qué es la Ley 39/2015?", "startChar": 0 },
    { "heading": "El procedimiento paso a paso", "startChar": 420 },
    { "heading": "Los plazos que más caen en examen", "startChar": 980 }
  ]
}
```

| Campo | Descripción |
|---|---|
| `script` | Narración completa en texto continuo. ~1500 palabras para 10 min. |
| `segments` | Secciones del episodio con su posición en el `script` (para mostrar en la app). |

**Reglas del output** (para cuando se active):
- Tono conversacional y pedagógico, como un tutor que explica en voz alta
- Sin listas ni bullets: el texto tiene que sonar bien al ser narrado
- Empezar siempre con una introducción de 30 segundos que enganche al oyente
- Terminar con un resumen de los 3 puntos más importantes
- `startChar` es la posición exacta del carácter en `script` donde empieza ese segmento

> **Nota**: esta tarea no es urgente. Avísanos cuando el equipo esté listo para activarla.

---

## Formato de entrega

Para cada tarea necesitamos que nos entregues un JSON con esta forma:

```json
{
  "task": "generateChatResponse",
  "model_recommendation": "claude-haiku-4-5 (respuesta rápida < 1s) o gpt-4o-mini",
  "system_prompt": "Eres el Tutor IA de OPOX, una app de preparación de oposiciones españolas...",
  "user_template": "El usuario está preparando {{oposicion}}. Tema activo: {{topic}}.\n\nHistorial:\n{{history}}\n\nNueva pregunta: {{userMessage}}",
  "output_format": "json_object",
  "examples": [
    {
      "input": {
        "oposicion": "justicia-tramitacion",
        "topic": "Ley 39/2015",
        "history": [],
        "userMessage": "¿Qué es el silencio administrativo?"
      },
      "output": {
        "content": "El silencio administrativo es la respuesta que la ley atribuye a la inacción de la Administración cuando no resuelve en el plazo legal. Puede ser positivo (se estima la solicitud) o negativo (se desestima). La Ley 39/2015 consagra el silencio positivo como regla general y el negativo como excepción (art. 24).",
        "suggestedActions": [
          { "label": "Crear flashcards", "icon": "layers-outline" },
          { "label": "Ponme un ejemplo", "icon": "bulb-outline" }
        ]
      }
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `task` | Nombre de la tarea: `generateChatResponse`, `generateFlashcards`, `generateSummary` o `generatePodcastScript` |
| `model_recommendation` | Qué modelo recomiendas y por qué (latencia vs. calidad) |
| `system_prompt` | El system message completo que le mandamos al modelo |
| `user_template` | La plantilla del mensaje de usuario con `{{placeholders}}` para los campos del input |
| `output_format` | `"json_array"` o `"json_object"` |
| `examples` | Al menos 2 ejemplos de input/output para validar el shape de la respuesta |

Entrega un JSON separado por cada tarea.

---

## Resumen de lo que necesitamos

| Tarea | Urgencia | Modelo con visión | Formato output |
|---|:---:|:---:|---|
| `generateChatResponse` | 🔴 Alta | No | JSON objeto |
| `generateFlashcards` | 🔴 Alta | No | JSON array |
| `generateSummary` | 🟡 Media | No | JSON objeto con `sections[]` |
| `generatePodcastScript` | 🟢 Baja (fase futura) | No | JSON objeto con `script` + `segments[]` |

**Prioridad sugerida**: `generateFlashcards` primero (es la acción más usada y cierra el flujo
principal del Aula Virtual), luego `generateChatResponse` (es el corazón del modo Chat), y
después `generateSummary`.

Con los JSONs que nos entregues nosotros implementamos la conexión al proveedor —
tú no tienes que tocar código.
