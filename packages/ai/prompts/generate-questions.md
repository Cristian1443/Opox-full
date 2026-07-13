# Prompt: Generador de preguntas tipo test

**Método**: `AiApiContract.generateQuestions(params)`
**Archivo a implementar**: `apps/backend/src/infrastructure/clients/AiApiClient.ts`

---

## Contexto

OPOX es una app de preparación de oposiciones españolas (Justicia, Policía,
Hacienda, etc.). El Generador Infinito (pantalla 6.2) produce tests a medida
para que el usuario practique sin límite fuera de los simulacros oficiales.

---

## Tarea

Genera `params.count` preguntas tipo test (una correcta, tres incorrectas)
sobre el temario de la oposición `params.oposicion`, filtrado por tema
`params.topicId` (o todo el temario si `topicId === 'all'`), con el nivel
de dificultad `params.difficulty`.

Las preguntas deben:
- Basarse en legislación española vigente (Constitución, leyes orgánicas, etc.)
- No repetir los IDs de `params.excludeIds`
- Tener exactamente 4 opciones (`options[0..3]`), solo una correcta
- Incluir una explicación breve y clara de por qué la respuesta es correcta
- Estar redactadas en español formal, estilo examen oficial de oposición

---

## Input (`GenerateQuestionsParams`)

```json
{
  "oposicion": "justicia-tramitacion",
  "topicId": "ley-39",
  "difficulty": "medium",
  "count": 10,
  "excludeIds": ["uuid-1", "uuid-2"]
}
```

**Valores posibles de `topicId`** (dependen de la oposición; el backend los
define en la tabla `training_topics`):
- `"all"` — todo el temario
- `"ley-39"` — Ley 39/2015, Procedimiento Administrativo Común
- `"ley-40"` — Ley 40/2015, Régimen Jurídico del Sector Público
- `"constitucion"` — Constitución Española 1978
- `"penal"` — Derecho Penal (parte general)
- `"laboral"` — Estatuto de los Trabajadores

**Valores de `difficulty`**:
- `"easy"` — preguntas directas sobre definiciones o artículos concretos
- `"medium"` — preguntas que requieren razonamiento o comparación entre normas
- `"hard"` — casos prácticos, excepciones, jurisprudencia o detalles técnicos

---

## Output (`GeneratedQuestion[]`)

Devuelve un array JSON con exactamente `count` objetos:

```json
[
  {
    "id": "uuid-v4-generado",
    "text": "¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?",
    "options": [
      "1 mes",
      "2 meses",
      "3 meses",
      "6 meses"
    ],
    "correctIndex": 2,
    "explanation": "El art. 21.2 de la Ley 39/2015 fija el plazo general de resolución en 3 meses, salvo que una norma con rango de ley establezca un plazo distinto.",
    "topicId": "ley-39",
    "topic": "Ley 39/2015",
    "difficulty": "medium"
  }
]
```

**Restricciones del output**:
- `options` es exactamente un array de 4 strings
- `correctIndex` es 0, 1, 2 o 3
- `id` debe ser un UUID v4 único (generarlo en el cliente o aquí)
- `topicId` y `topic` deben coincidir con los del input
- `difficulty` debe coincidir con la del input

---

## Notas de implementación

- Si el proveedor devuelve JSON en el body, parsear y validar con zod antes de devolver
- Si devuelve texto libre, extraer el bloque JSON con una regex/parse robusta
- Hacer retry automático si la respuesta no tiene la forma esperada (máx. 2 reintentos)
- Loguear con `logger.info('[ai] generateQuestions', { count, difficulty })` al inicio
