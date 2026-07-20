# Brief para el Responsable de IA — Bloque 6 · Entrenamiento OPOX

## Qué es OPOX

App móvil de preparación de oposiciones españolas (Justicia, Policía, Hacienda, etc.).
El Bloque 6 es el módulo de entrenamiento: el usuario practica con tests, fotografía sus
apuntes para generar flashcards, y la app detecta sus puntos débiles para atacarlos.

---

## Cómo funciona el handoff

```
App móvil → Nuestro backend → [AiApiClient.ts] → Proveedor de IA (OpenAI / Anthropic / etc.)
```

- **Tú entregas**: el `system_prompt` y la plantilla del mensaje de usuario para cada tarea.
- **Nosotros implementamos**: la llamada HTTP al proveedor y el parseo de la respuesta.
- **Tú no tocas código**: solo los prompts en formato JSON (ver sección "Formato de entrega").
- **La API key nunca sale de nuestro servidor**: el móvil nunca llama a la IA directamente.

---

## Las 3 tareas que necesitamos

### Tarea 1 — Generar preguntas tipo test (`generateQuestions`)

**Cuándo se usa**: el usuario configura un test en la pantalla 6.2 (elige tema, dificultad
y número de preguntas) y pulsa "Empezar". La IA genera preguntas originales al vuelo.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "topicId": "ley-39",
  "difficulty": "medium",
  "count": 10,
  "excludeIds": ["uuid-ya-visto-1", "uuid-ya-visto-2"]
}
```

| Campo | Descripción |
|-------|-------------|
| `oposicion` | Oposición del usuario. Valores posibles: `justicia-tramitacion`, `policia-nacional`, `hacienda`, `administracion-general` |
| `topicId` | Tema filtrado. `"all"` = todo el temario. Ver lista completa abajo. |
| `difficulty` | `"easy"` (definiciones directas) / `"medium"` (razonamiento) / `"hard"` (casos prácticos, excepciones, jurisprudencia) |
| `count` | Número de preguntas: 10, 25, 50 o 100 |
| `excludeIds` | IDs ya vistos por el usuario — no repetir |

**Temas posibles de `topicId`**:
- `"all"` — Todo el temario
- `"ley-39"` — Ley 39/2015, Procedimiento Administrativo Común
- `"ley-40"` — Ley 40/2015, Régimen Jurídico del Sector Público
- `"constitucion"` — Constitución Española 1978
- `"penal"` — Derecho Penal (parte general)
- `"laboral"` — Estatuto de los Trabajadores

**Output que necesitamos** (JSON array, exactamente `count` objetos):
```json
[
  {
    "id": "uuid-v4-unico",
    "text": "¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?",
    "options": ["1 mes", "2 meses", "3 meses", "6 meses"],
    "correctIndex": 2,
    "explanation": "El art. 21.2 Ley 39/2015 fija el plazo general en 3 meses salvo norma especial con rango de ley.",
    "topicId": "ley-39",
    "topic": "Ley 39/2015",
    "difficulty": "medium"
  }
]
```

**Reglas del output**:
- `options` siempre 4 strings (A, B, C, D)
- `correctIndex` es 0, 1, 2 o 3
- `id` debe ser UUID v4 único
- `topicId` y `topic` deben coincidir con lo que mandamos en el input
- Preguntas en español formal, estilo examen oficial de oposición
- Basadas en legislación española vigente

---

### Tarea 2 — Analizar foto de apunte (`analyzePhoto`)

**Cuándo se usa**: el usuario fotografía un apunte manuscrito, una hoja de teoría impresa
o una pregunta de examen que no ha entendido. La IA analiza la imagen y genera una flashcard.

**Input que te mandamos** (JSON):
```json
{
  "imageBase64": "<imagen en base64 sin el prefijo data:image/>",
  "mimeType": "image/jpeg",
  "oposicion": "justicia-tramitacion"
}
```

La imagen puede contener:
- Texto manuscrito de apuntes
- Páginas de manual o normativa impresa / escaneada
- Esquemas o cuadros sinópticos
- Preguntas de examen

**Output que necesitamos** (JSON objeto único):
```json
{
  "concept": "Plazos en el procedimiento administrativo (Ley 39/2015)",
  "question": "¿Cuál es el plazo general para resolver un procedimiento administrativo?",
  "answer": "El plazo general es de 3 meses, salvo que una norma con rango de ley establezca uno distinto (art. 21.2 Ley 39/2015).",
  "relatedTopicId": "ley-39",
  "availableQuestionsCount": 12
}
```

| Campo | Descripción |
|-------|-------------|
| `concept` | Nombre del concepto en lenguaje natural. Máx. 80 caracteres. |
| `question` | Pregunta tipo test sobre ese concepto. Máx. 200 caracteres. |
| `answer` | Respuesta + explicación breve con referencia legal si aplica. |
| `relatedTopicId` | Si reconoces el tema, pon su ID (ver lista de topicIds arriba). Si no, omite el campo. |
| `availableQuestionsCount` | Estimación de cuántas preguntas distintas se podrían generar sobre este concepto (entre 5 y 30). |

**Casos especiales a manejar**:
- Imagen ilegible o borrosa → lanza error con mensaje `"IMAGE_NOT_READABLE"` (nosotros lo convertimos en un modal de error en la app)
- Imagen sin contenido jurídico → devuelve `concept` describiendo lo que ves y `availableQuestionsCount: 0`
- Texto en otro idioma → analiza igualmente y responde en español

**Nota técnica**: necesita un modelo con capacidad de visión (ej. `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`). El timeout para esta llamada será mayor que para las otras dos.

---

### Tarea 3 — Generar test quirúrgico (`generateSurgicalTest`)

**Cuándo se usa**: el usuario entra al Laboratorio de Errores (pantalla 6.8). Nuestro backend
ya calculó sus puntos débiles (qué temas falla más). La IA genera un test personalizado que
ataca exactamente esos puntos débiles, asignando más preguntas a los temas con mayor tasa de fallo.

**Input que te mandamos** (JSON):
```json
{
  "oposicion": "justicia-tramitacion",
  "count": 20,
  "errorPatterns": [
    { "topicId": "plazos", "topic": "Plazos y recursos", "failRate": 64, "domain": 36 },
    { "topicId": "ley-39", "topic": "Ley 39/2015", "failRate": 48, "domain": 52 },
    { "topicId": "organizacion-estado", "topic": "Organización del Estado", "failRate": 42, "domain": 58 }
  ]
}
```

| Campo | Descripción |
|-------|-------------|
| `errorPatterns` | Temas donde el usuario más falla, ordenados por `failRate` descendente |
| `failRate` | % de preguntas falladas en ese tema (0–100) |
| `domain` | % de dominio actual del tema (0–100, complementario al failRate) |
| `count` | Total de preguntas del test (siempre 20) |

**Lógica de distribución** (sugerida, puedes ajustar):
- Reparte `count` preguntas proporcionalmente al `failRate` de cada tema
- Mínimo 1 pregunta por tema aunque tenga failRate bajo
- La suma de preguntas en `distribution` debe ser exactamente `count`

**Output que necesitamos** (JSON objeto con dos campos):
```json
{
  "questions": [
    {
      "id": "uuid-v4",
      "text": "¿En qué plazo puede interponerse un recurso de alzada?",
      "options": ["10 días hábiles", "15 días hábiles", "1 mes", "3 meses"],
      "correctIndex": 2,
      "explanation": "El recurso de alzada se interpone en el plazo de 1 mes si el acto es expreso (art. 121 Ley 39/2015).",
      "topicId": "plazos",
      "topic": "Plazos y recursos",
      "difficulty": "hard"
    }
  ],
  "distribution": [
    { "topicId": "plazos", "topic": "Plazos y recursos", "count": 9, "percentage": 45 },
    { "topicId": "ley-39", "topic": "Ley 39/2015", "count": 7, "percentage": 35 },
    { "topicId": "organizacion-estado", "topic": "Organización del Estado", "count": 4, "percentage": 20 }
  ]
}
```

**Reglas del output**:
- `questions.length` debe ser exactamente `count`
- `distribution` debe incluir todos los `topicId` que mandamos en `errorPatterns`
- La suma de `distribution[].count` debe ser exactamente `count`
- `percentage` es el entero más cercano al porcentaje real (no tiene que sumar 100 exactamente por redondeos)
- Las preguntas deben ser de nivel `"hard"` — el objetivo es atacar los puntos débiles con exigencia

La `distribution` se muestra en la pantalla 6.9 (preview antes de empezar) con una barra de
porcentaje animada por tema, por eso es obligatorio devolverla aunque la IA genere las preguntas
sin seguir la distribución al pie de la letra.

---

## Formato de entrega

Para cada tarea necesitamos que nos entregues un JSON con esta forma:

```json
{
  "task": "generateQuestions",
  "model_recommendation": "gpt-4o",
  "system_prompt": "Eres un experto en oposiciones españolas...",
  "user_template": "Genera {{count}} preguntas sobre {{topicId}} con dificultad {{difficulty}}...",
  "output_format": "json_array",
  "examples": [
    {
      "input": { "oposicion": "justicia-tramitacion", "topicId": "ley-39", "difficulty": "medium", "count": 2 },
      "output": [ ... ]
    }
  ]
}
```

| Campo | Descripción |
|-------|-------------|
| `task` | Nombre de la tarea: `generateQuestions`, `analyzePhoto` o `generateSurgicalTest` |
| `model_recommendation` | Qué modelo recomiendas para esta tarea y por qué |
| `system_prompt` | El system message completo que le mandamos al modelo |
| `user_template` | La plantilla del mensaje de usuario con `{{placeholders}}` para los campos del input |
| `output_format` | `"json_array"` o `"json_object"` — qué estructura devuelve el modelo |
| `examples` | Al menos 2 ejemplos de input/output para que podamos validar que el output tiene el shape correcto |

Entrega un JSON separado por cada una de las 3 tareas.

---

## Resumen de lo que necesitamos de ti

| Tarea | Modelo con visión | Formato output |
|-------|:-----------------:|:--------------:|
| `generateQuestions` | No | JSON array |
| `analyzePhoto` | **Sí** | JSON objeto |
| `generateSurgicalTest` | No | JSON objeto con `questions` + `distribution` |

**Prioridad sugerida**: `analyzePhoto` primero (es la más diferenciadora), luego
`generateQuestions` (más volumen de uso), y por último `generateSurgicalTest`.

Con los JSONs que nos entregues nosotros implementamos la conexión al proveedor —
tú no tienes que tocar el código.
