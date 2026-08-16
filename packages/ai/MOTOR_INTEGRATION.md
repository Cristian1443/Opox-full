# Integración con el Motor de IA del cliente

## Qué es

El **Motor de IA** (`MotorIA_Ingesta_Tests.postman_collection.json` en la raíz del
repo) es un microservicio HTTP que el equipo IA del cliente construyó aparte.
Cubre dos capacidades que van MÁS allá de nuestro `AiApiContract` original:

1. **Ingesta de PDFs de temario** — subes un PDF de ~1000 páginas, hace parseo
   tolerante, OCR si hace falta, detección de índice, segmentación en
   Bloque→Tema, chunking semántico, embeddings y carga a un índice vectorial (RAG).
2. **Generación de tests con evidencia verbatim** — cada respuesta corregida
   incluye una cita literal del PDF y el número de página exacto.

---

## Estado actual (2026-08-15)

**DESPLEGADO en producción.**

- URL: `https://ingesta-demo-1097036487734.us-east1.run.app`
- Clave de servicio (`X-API-Key`): en `MOTOR_API_KEY` de `.env`
- Suite de pruebas: `scripts/test_motor_ia.py` — 65/66 PASS

**Integrado:** `CompositeAiClient` + `MotorAiClient` ya activos en `container.ts`.
Para desactivar el Motor temporalmente, vaciar `MOTOR_API_BASE_URL` en `.env`.

### Incidencias conocidas (reportadas al equipo IA 2026-08-15)

- **[INC-01]** `GET /v1/health` devuelve `{"ok":true,"version":"1.0.0"}` en lugar de `{"status":"ok"}`.
  Internamente ya adaptado: comprobar `body.ok === true`, no `body.status`.
- **[INC-02]** El Motor rechaza PDFs sin capa de texto nativo. Los PDFs deben tener
  texto seleccionable; los escaneados sin OCR previo devuelven error `"El PDF no tiene texto legible"`.
- **[INC-03]** Naming inconsistente: `/v1/modes/errors/{user_id}` devuelve `dominio` (lista de temas)
  pero `/v1/onboarding/.../finish` devuelve `dominio_por_bloque`. Pendiente de alinear por el equipo IA.
- **[INC-04] BLOQUEANTE** El job result (`GET /v1/jobs/{id}`) y la vista de sesión (`GET /v1/tests/{sesion_id}`)
  **no exponen `correcta_idx`**. Además, los campos del job usan nombres distintos a los de la guía:
  `id` (no `pregunta_id`), `enunciado` (no `texto`), `ref_legislativa` (no `evidencia.cita`).
  
  **Workaround activo en `MotorAiClient.ts`:** tras recibir el job, se carga el banco completo del curso
  (`GET /v1/courses/{curso_id}/questions`, que SÍ devuelve `correcta_idx` y `explicacion`) y se
  enriquece cada pregunta por ID. El banco se cachea 30 min en memoria.
  
  **Opción A oficial (pendiente de confirmación del equipo IA):** OPOX envía cada respuesta una a una
  vía `POST /v1/tests/{sesion_id}/answer` y el Motor devuelve la corrección al instante. Cuando el
  equipo IA confirme esta vía, habría que añadir en backend:
  1. Devolver `sesionId` junto a las preguntas en `POST /training/generate`.
  2. Nuevo endpoint `POST /training/validate-answer` → reenvía al Motor y retorna `{correct, explanation}`.
  3. Actualizar mobile para no asumir `correctIndex` en el payload de preguntas.

---

## Qué cubre el Motor y qué no

| Método del `AiApiContract` | Motor de IA | Alternativa actual |
|---|---|---|
| `generateQuestions` | ✅ Sí (`POST /v1/tests/generate`) | OpenAI `gpt-4o-mini` |
| `generateSurgicalTest` | 🟡 Con adaptador (varias llamadas por tema) | OpenAI `gpt-4o-mini` |
| `analyzePhoto` (Foto-Test) | ❌ No — el Motor solo ingesta PDFs | OpenAI `gpt-4o` (visión) — mantener |
| `generateHint` (Pista IA) | ❌ No — endpoint no existe | OpenAI `gpt-4o-mini` — mantener |

Conclusión: el Motor **no reemplaza** al cliente OpenAI, lo **complementa**.

---

## Autenticación

El Motor usa header `X-API-Key` (NO `Authorization: Bearer` como OpenAI).

Tres modos según el valor:
- **Producción**: la key debe coincidir con `MOTOR_API_KEY` del servicio → si no, `401`.
- **Dev**: `REQUIRE_API_KEY=0` en el servicio → no exige.
- **BYOK**: la key empieza por `sk-` (una key OpenAI) → esa key paga la ingesta
  y la generación del request en OpenAI. Útil para demos y para acotar coste
  por cliente.

Nuestro `MotorAiClient` ya manda el header correcto (`X-API-Key`), así que basta
con pegar la key en `MOTOR_API_KEY` sea cual sea el modo.

---

## Activación — COMPLETADA (2026-08-15)

### Env vars actuales en `.env`

```
MOTOR_API_BASE_URL=https://ingesta-demo-1097036487734.us-east1.run.app
MOTOR_API_KEY=opox-c1U6Ovj-drc-o6pFEWg62-PNpKN6CIEn
MOTOR_API_TIMEOUT_MS=60000
MOTOR_DEFAULT_CURSO_ID=1357e871b542425b   # Temario 1 · Bloque 1 (Temas 1-10)
```

### Arquitectura activa

- `config/env.ts` — `MOTOR_API_*` en schema Zod; `isMotorConfigured` exportado.
- `CompositeAiClient.ts` — enruta `generateQuestions`/`generateSurgicalTest` al Motor;
  todo lo demás (analyzePhoto, generateHint, Bloque 9, Bloque 10) va a OpenAI directo.
- `container.ts` — construye `CompositeAiClient` cuando `isMotorConfigured=true`.

### Flujo de generateQuestions (implementado)

1. `MOTOR_DEFAULT_CURSO_ID` como `curso_id` (hasta tabla `training_courses` en Supabase).
2. `topicId='all'` → `tema_ids=null`. Filtrado por tema pendiente de tabla
   `training_courses_topics` (mapeo `opox_topic_id → motor_tema_id`).
3. `POST /v1/tests/generate` → 202 (async) o 200 (from-cache).
4. Si async: polling `GET /v1/jobs/{job_id}` cada 3s.
5. `resultado.preguntas[]` del job **sí incluye `correcta_idx`** — bloqueante resuelto.
   (La vista pública `GET /v1/tests/{sesion_id}` oculta `correcta_idx`, pero el job
   resultado no: usamos siempre el job resultado, nunca la vista pública.)

### Ingesta de nuevos temarios (backoffice pendiente)

1. `POST /v1/courses` (multipart con PDF de texto nativo, no escaneado sin OCR).
2. Polling `GET /v1/jobs/{job_id}` hasta `done` — puede tardar minutos para 1000 páginas.
3. `GET /v1/courses/{curso_id}` devuelve el árbol Bloque→Tema con los `tema_id` del Motor.
4. Guardar en tabla `training_courses` (Supabase) el mapeo `oposicion → curso_id` y
   en `training_courses_topics` el mapeo `opox_topic_id → motor_tema_id`.
5. Actualizar `MOTOR_DEFAULT_CURSO_ID` o la lógica de lookup en `MotorAiClient`.

---

## Ventajas del Motor vs OpenAI directo

| Aspecto | Motor de IA | OpenAI directo |
|---|---|---|
| Fidelidad al temario del cliente | ✅ RAG sobre PDFs oficiales | ⚠️ Conocimiento general del modelo |
| Evidencia verbatim + página | ✅ Sí, en cada respuesta | ❌ No |
| Coste por test | ✅ Barato con `from-cache` | 💵 ~$0.008 por 25 preguntas (mini) |
| Latencia | ⚠️ Async con polling (segundos) | ✅ Síncrono (< 3s) |
| Foto-Test | ❌ No lo cubre | ✅ GPT-4o con visión |
| Pista IA | ❌ No lo cubre | ✅ GPT-4o-mini |
| Requiere ingesta previa | ⚠️ Sí (PDFs por oposición) | ✅ No |
