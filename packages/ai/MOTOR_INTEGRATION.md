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

## Estado actual (2026-07-25)

**No está desplegado.** El equipo IA solo lo tiene corriendo en su máquina local
(`http://localhost:8080`). Hasta que publiquen una URL accesible, OPOX usa
`AiApiClient` (OpenAI directo) para las 4 tareas de IA.

Cuando lo desplieguen, este documento explica cómo cambiar sin reescribir código.

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

## Pasos para activar el Motor (cuando esté desplegado)

### 1. Rellenar env vars en `apps/backend/.env`

```
MOTOR_API_BASE_URL=https://motor.opox.cliente.es   # URL real del cliente
MOTOR_API_KEY=<key del servicio o key OpenAI en modo BYOK>
MOTOR_API_TIMEOUT_MS=60000
```

### 2. Añadir las vars a `config/env.ts`

En el schema de Zod:
```ts
MOTOR_API_BASE_URL: optionalUrl,
MOTOR_API_KEY: optionalString,
MOTOR_API_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
```

Y exportar:
```ts
export const isMotorConfigured = Boolean(env.MOTOR_API_BASE_URL && env.MOTOR_API_KEY);
```

### 3. Componer los clientes en `container.ts`

Reemplazar el bloque actual de construcción del `aiApi` por una composición:

```ts
const openAi = env.AI_API_BASE_URL && env.AI_API_KEY && env.AI_API_DEFAULT_MODEL
    ? new AiApiClient({ ... })
    : new AiApiClientStub();

const aiApi: AiApiContract = isMotorConfigured
    ? new CompositeAiClient({
        // Motor cubre estos dos con RAG + evidencia verbatim del temario
        questions: new MotorAiClient({
            baseUrl: env.MOTOR_API_BASE_URL!,
            apiKey: env.MOTOR_API_KEY!,
            timeoutMs: env.MOTOR_API_TIMEOUT_MS,
        }),
        // OpenAI se queda con lo que el Motor no cubre
        fallback: openAi,
      })
    : openAi;
```

`CompositeAiClient` es una clase pequeña (~30 líneas) que implementa
`AiApiContract` delegando cada método al cliente correspondiente. No existe
todavía — se crea el día que activemos el Motor.

### 4. Implementar los métodos `TODO(motor)` en `MotorAiClient.ts`

Los dos métodos (`generateQuestions` y `generateSurgicalTest`) lanzan Error
hoy. Al activar el Motor:

**`generateQuestions`**:
1. Resolver `curso_id` desde `params.oposicion` (necesita una tabla
   `training_courses` nueva en Supabase con el mapeo `oposicion → curso_id`).
2. Resolver `tema_ids[]` desde `params.topicId` (`"all"` → `null`).
3. `POST /v1/tests/generate` con `{curso_id, user_id, tema_ids, n_preguntas, dificultad}`.
   Traducir dificultades: `easy→facil`, `medium→media`, `hard→dificil`.
4. Polling `GET /v1/jobs/{job_id}` cada 3s hasta `estado=done`.
5. Del `resultado.sesion_id`, hacer `GET /v1/tests/{sesion_id}` y mapear cada
   pregunta al shape `GeneratedQuestion`.

**Bloqueante**: la vista pública `GET /v1/tests/{sesion_id}` NO devuelve
`correcta_idx` (por diseño, para que el cliente no pueda filtrar la respuesta).
Nosotros necesitamos la respuesta correcta en el backend. Opciones:
- Pedir al equipo IA un endpoint privado `/v1/admin/tests/{sesion_id}` con la
  correcta expuesta.
- O aceptar el flujo asíncrono: el mobile responde vía
  `POST /v1/tests/{sesion_id}/answer` y el Motor devuelve la corrección con
  evidencia verbatim. Esto cambia el shape de las pantallas del Bloque 7.

**Decisión pendiente** con el equipo IA. Hasta resolverlo, mantenemos OpenAI
directo para `generateQuestions`.

**`generateSurgicalTest`**:
- Mismo flujo, pero con múltiples llamadas a `/v1/tests/generate` filtrando por
  `tema_ids` según la distribución `failRate`. O idealmente pedir al equipo IA
  un endpoint dedicado `/v1/tests/surgical`.

### 5. Ingesta previa de temarios

El Motor NO tiene datos hasta que subamos los PDFs de temario. Flujo esperado:

1. Backoffice de OPOX (no existe todavía) permite al admin subir un PDF por
   oposición (Justicia, Policía, etc.).
2. `POST /v1/courses` con el PDF → devuelve `curso_id`.
3. Polling `GET /v1/jobs/{job_id}` hasta `done` (minutos para 1000 páginas).
4. `GET /v1/courses/{curso_id}` devuelve el árbol Bloque→Tema.
5. Guardar `curso_id` y el árbol en Supabase (tabla `training_courses`) para
   que `generateQuestions` sepa qué curso usar según `oposicion`.

Este flujo de backoffice no está construido — es trabajo aparte del día que
activemos el Motor.

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

La composición ideal (post-despliegue): Motor para preguntas del temario oficial,
OpenAI para todo lo que el Motor no cubre.
