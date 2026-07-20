# Brief para el Responsable de IA — Bloque 7 · Sesión de entrenamiento OPOX

## Contexto

Este brief complementa `BRIEF_IA_BLOQUE6.md`. El Bloque 7 es la **pantalla activa de resolución
de preguntas**. El usuario responde una a una mientras la app mide su tiempo y registra sus fallos.

La única tarea de IA en este bloque es `generateHint`: el "Tutor IA" que da una pista contextual
cuando el usuario la solicita (máximo 3 por sesión).

---

## Tarea — Generar pista contextual (`generateHint`)

**Cuándo se usa**: el usuario lleva tiempo bloqueado en una pregunta y pulsa el botón "Pista IA"
en la barra inferior. La app envía la pregunta completa y la IA responde con una pista que
**orienta sin revelar la respuesta directa**.

### Regla de oro
La pista debe ayudar al usuario a razonar, **nunca decirle "la respuesta es X"** ni señalar
directamente la opción correcta. El objetivo es desarrollar su comprensión del tema, no darle
la solución.

---

### Input que te mandamos (JSON)

```json
{
  "questionText": "¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?",
  "options": [
    "1 mes",
    "2 meses",
    "3 meses",
    "6 meses"
  ],
  "topicId": "ley-39",
  "topic": "Ley 39/2015",
  "oposicion": "justicia-tramitacion"
}
```

| Campo | Descripción |
|-------|-------------|
| `questionText` | Texto completo de la pregunta |
| `options` | Las 4 opciones en orden A, B, C, D |
| `topicId` | ID del tema (ver lista en BRIEF_IA_BLOQUE6.md) |
| `topic` | Nombre legible del tema |
| `oposicion` | Oposición del usuario |

---

### Output que necesitamos (JSON objeto)

```json
{
  "hint": "Recuerda que la Ley 39/2015 distingue entre el plazo general y los plazos especiales fijados por normas sectoriales. El plazo general se mide en meses completos y es el mismo que un trimestre natural. No confundas el plazo máximo legal con el plazo habitual de la Administración.",
  "articleRef": "art. 21.2 Ley 39/2015"
}
```

| Campo | Descripción |
|-------|-------------|
| `hint` | Pista contextual. **Máx. 300 caracteres.** Debe orientar sin revelar la opción correcta. |
| `articleRef` | Referencia legal relevante (opcional). Formato: `"art. X Ley YY/AAAA"`. |

---

### Ejemplos de pistas buenas y malas

**✅ Pista buena**:
> "El art. 21 distingue el plazo 'general' (aplicable cuando no hay norma especial) del plazo máximo absoluto. Fíjate en cuántos meses dura un trimestre y compáralo con las opciones."

**❌ Pista mala (revela la respuesta)**:
> "La respuesta es 3 meses porque el art. 21.2 fija ese plazo."

**✅ Pista buena**:
> "La Ley 40/2015 enumera sus principios en el art. 3. Uno de los que aparece en las opciones NO figura en ese artículo — busca el que suene más a lenguaje económico-empresarial que jurídico-administrativo."

**❌ Pista mala (demasiado vaga)**:
> "Lee bien la pregunta y las opciones."

---

### Reglas del output

- `hint` máximo 300 caracteres — se muestra en un box destacado en la app
- Tono: didáctico, cercano, sin condescendencia
- Idioma: español formal
- NO mencionar la opción correcta por su letra (A/B/C/D) ni por su texto exacto
- SÍ puedes hacer referencia al tema, al artículo de ley, o a principios generales
- `articleRef` es opcional — solo incluir si hay una referencia concreta y útil

---

## Formato de entrega

```json
{
  "task": "generateHint",
  "model_recommendation": "claude-haiku-4-5 o gpt-4o-mini (respuesta rápida — el usuario espera < 1s)",
  "system_prompt": "Eres el Tutor IA de OPOX, una app de preparación de oposiciones españolas...",
  "user_template": "El usuario está respondiendo esta pregunta de {{topic}}:\n\n{{questionText}}\n\nOpciones:\nA) {{options[0]}}\nB) {{options[1]}}\nC) {{options[2]}}\nD) {{options[3]}}\n\nGenera una pista que le ayude a razonar sin revelar la respuesta correcta.",
  "output_format": "json_object",
  "examples": [
    {
      "input": {
        "questionText": "¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?",
        "options": ["1 mes", "2 meses", "3 meses", "6 meses"],
        "topicId": "ley-39",
        "topic": "Ley 39/2015",
        "oposicion": "justicia-tramitacion"
      },
      "output": {
        "hint": "La Ley 39/2015 fija un plazo 'general' para cuando ninguna norma especial diga lo contrario. Piensa en cuántos meses hay en un trimestre — esa es la pista.",
        "articleRef": "art. 21.2 Ley 39/2015"
      }
    },
    {
      "input": {
        "questionText": "¿Cuál de los siguientes principios NO recoge expresamente la Ley 40/2015?",
        "options": ["Principio de eficacia", "Principio de transparencia", "Principio de proporcionalidad", "Principio de beneficio máximo"],
        "topicId": "ley-40",
        "topic": "Ley 40/2015",
        "oposicion": "justicia-tramitacion"
      },
      "output": {
        "hint": "El art. 3 de la Ley 40/2015 lista los principios de la Administración. Busca la opción que no suene a lenguaje jurídico-administrativo clásico, sino más bien a terminología del sector privado.",
        "articleRef": "art. 3 Ley 40/2015"
      }
    }
  ]
}
```

---

## Resumen

| Tarea | Modelo recomendado | Formato output | Visión |
|-------|:------------------:|:--------------:|:------:|
| `generateHint` | Haiku / GPT-4o-mini | JSON objeto | No |

**Prioridad**: alta — es la única tarea nueva del Bloque 7. Sin esta pista, el usuario se queda
bloqueado y abandona la sesión.

Con el JSON que nos entregues nosotros implementamos la llamada al proveedor.
