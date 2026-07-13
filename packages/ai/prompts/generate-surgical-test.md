# Prompt: Laboratorio de Errores — test quirúrgico

**Método**: `AiApiContract.generateSurgicalTest(params)`
**Archivo a implementar**: `apps/backend/src/infrastructure/clients/AiApiClient.ts`

---

## Contexto

El Laboratorio de Errores (pantallas 6.8 → 6.9) analiza el historial de
intentos del usuario y detecta sus puntos débiles. El backend calcula los
`errorPatterns` (temas con alta tasa de fallo) a partir de la tabla
`training_attempt_responses` sin necesidad de IA.

Lo que sí hace la IA es generar el test quirúrgico: un conjunto de preguntas
diseñado específicamente para atacar esos puntos débiles, con mayor
concentración de preguntas en los temas con más fallos.

La pantalla 6.9 muestra la distribución de preguntas por tema (barra de %
animada) antes de que el usuario empiece — por eso el output incluye `distribution`.

---

## Tarea

Genera `params.count` preguntas tipo test priorizando los temas de
`params.errorPatterns` según su `failRate` (mayor failRate = más preguntas
asignadas). Dentro de cada tema, elige los sub-conceptos más difíciles o
los que suelen confundirse con otros.

---

## Input (`GenerateSurgicalTestParams`)

```json
{
  "oposicion": "justicia-tramitacion",
  "count": 20,
  "errorPatterns": [
    {
      "topicId": "plazos",
      "topic": "Plazos y recursos",
      "failRate": 64,
      "domain": 36
    },
    {
      "topicId": "ley-39",
      "topic": "Ley 39/2015",
      "failRate": 48,
      "domain": 52
    },
    {
      "topicId": "organizacion-estado",
      "topic": "Organización del Estado",
      "failRate": 42,
      "domain": 58
    }
  ]
}
```

**Lógica de distribución recomendada** (puedes ajustarla):
- Reparte `count` preguntas proporcionalmente a `failRate`
- Asegura mínimo 1 pregunta por patrón aunque tenga failRate bajo
- Redondea de modo que la suma total sea exactamente `count`

---

## Output (`SurgicalTestResult`)

```json
{
  "questions": [
    {
      "id": "uuid-v4",
      "text": "¿En qué plazo puede interponerse un recurso de alzada?",
      "options": [
        "10 días hábiles",
        "15 días hábiles",
        "1 mes",
        "3 meses"
      ],
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

**Restricciones**:
- `questions.length` debe ser exactamente `params.count`
- `distribution` debe listar todos los topicIds de `errorPatterns`
- La suma de `distribution[].count` debe ser exactamente `params.count`
- `percentage` es el entero más cercano al porcentaje real (no tiene que sumar 100 exactamente por redondeos)
- Las preguntas del test quirúrgico deben ser de nivel `"hard"` por defecto
  (el objetivo es atacar los puntos débiles con preguntas exigentes)

---

## Notas de implementación

- Este método puede reutilizar internamente la lógica de `generateQuestions`
  llamándolo varias veces (una por tema) y concatenando los resultados
- Loguear con `logger.info('[ai] generateSurgicalTest', { patterns: params.errorPatterns.length, count: params.count })` al inicio
- Si un `topicId` no es reconocido, generar preguntas sobre el tema general de la oposición
