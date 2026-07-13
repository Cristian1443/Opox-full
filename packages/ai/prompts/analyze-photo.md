# Prompt: Foto-Test — análisis de imagen

**Método**: `AiApiContract.analyzePhoto(params)`
**Archivo a implementar**: `apps/backend/src/infrastructure/clients/AiApiClient.ts`

---

## Contexto

El Foto-Test (pantallas 6.3 → 6.4 → 6.5) permite al usuario fotografiar
un apunte manuscrito, un folio de teoría impresa, o incluso una pregunta de
examen que no ha entendido. La IA analiza la imagen y devuelve:
1. El concepto jurídico/administrativo principal que aparece en la foto
2. Una pregunta tipo flashcard sobre ese concepto
3. La respuesta correcta con explicación breve

El usuario puede guardar la flashcard y/o arrancar un test de 10 preguntas
sobre ese mismo concepto (usando `generateQuestions` con ese `topicId`).

---

## Tarea

1. Analiza el contenido visible en la imagen (texto, esquemas, subrayados)
2. Identifica el concepto jurídico/administrativo central
3. Genera UNA pregunta tipo test y su respuesta sobre ese concepto
4. Estima si el concepto pertenece a algún tema conocido del temario
5. Estima cuántas preguntas distintas podrías generar sobre ese concepto

---

## Input (`AnalyzePhotoParams`)

```json
{
  "imageBase64": "<base64 sin prefijo data:image/>",
  "mimeType": "image/jpeg",
  "oposicion": "justicia-tramitacion"
}
```

La imagen puede contener:
- Texto manuscrito de apuntes del opositor
- Páginas de manual o normativa impresa/escaneada
- Esquemas o cuadros sinópticos con texto
- Preguntas de examen que el usuario no ha sabido resolver

---

## Output (`PhotoTestResult`)

```json
{
  "concept": "Plazos en el procedimiento administrativo (Ley 39/2015)",
  "question": "¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?",
  "answer": "El plazo general es de 3 meses, salvo que una norma con rango de ley establezca un plazo mayor o menor (art. 21.2 Ley 39/2015).",
  "relatedTopicId": "ley-39",
  "availableQuestionsCount": 12
}
```

**Campos**:
- `concept`: nombre del concepto en lenguaje natural (máx. 80 caracteres)
- `question`: pregunta tipo test sobre ese concepto (máx. 200 caracteres)
- `answer`: respuesta + explicación breve con referencia legal si aplica
- `relatedTopicId`: si reconoces el tema, devuelve su ID (ver lista en `generate-questions.md`). Si no, omite el campo.
- `availableQuestionsCount`: estimación de cuántas preguntas distintas se podrían generar sobre este concepto (entre 5 y 30)

---

## Casos especiales

- **Imagen ilegible o borrosa**: lanza un error con mensaje `"IMAGE_NOT_READABLE"`. El backend lo convierte en `PhotoErrorModal`.
- **Imagen sin contenido jurídico**: devuelve `concept` describiendo lo que ves e `availableQuestionsCount: 0`. El frontend mostrará un aviso.
- **Texto en otro idioma**: analiza igualmente y responde en español.

---

## Notas de implementación

- Usar un modelo con capacidad de visión (ej. `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`)
- Enviar la imagen en base64 según el formato que exija el proveedor elegido
- Timeout más alto que en generateQuestions (el análisis de imagen es más lento)
- Loguear con `logger.info('[ai] analyzePhoto', { mimeType, oposicion })` al inicio
