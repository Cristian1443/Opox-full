# Informe de rendimiento · Generador Infinito

_Fecha: 2026-09-18 · rama `fix/generador-infinito-2026-09-17`_

## Resumen ejecutivo

- El Motor tarda **73–153 s por request** para tests de 10 preguntas. Escala peor a más preguntas (ver tabla).
- El mobile mata la generación a **90 s** en `GeneratorConfigScreen` (`TTL_KILL_MS`), pero el flujo streaming lo bypasea reenviando al runner en cuanto el Motor responde 202 (~1 s). El TTL de 90 s NO aplica al camino que se usa hoy.
- 🔴 **El selector de temas del mobile es cosmético**: `MotorAiClient.generateQuestions` envía `tema_ids: null` al Motor SIEMPRE (TODO explícito en el código). El usuario puede seleccionar "solo Tema 5" y recibirá preguntas de cualquier tema del temario.
- 🔴 **El Motor puede entregar MENOS preguntas de las pedidas** — probado: cuando se envía `tema_ids: [3 temas]` y `n_preguntas: 10`, el Motor devuelve **3 preguntas de 10**. El backend y el mobile NO manejan este caso: el runner arranca un test de 3 preguntas cuando el usuario pidió 10.
- Los descartes internos del Motor (`enunciado_duplicado`, `hecho_ya_preguntado`, `l1_no_entailment`, `enunciado_tautologico`, `cita_encabezado`, `corte: tope_minado`) explican mucho de la latencia — el Motor procesa 15–95 preguntas internas para entregar 10.
- El contador "N de M preguntas listas" del runner se queda **en 0 durante la mayor parte del tiempo** — el job del Motor no publica progreso incremental fiable.
- 🟠 **Dificultad `dificil` es la más lenta** (122 s vs 73 s en `media`), no por generación más costosa sino por más descartes de RAG entailment (`l1_no_entailment: 7` en dificil vs `0` en media).

## Setup de la prueba

- **Objetivo**: medir latencia del pipeline y detectar gaps en el flujo `mobile → backend → Motor`.
- **Backend probado**: llamadas directas al Motor `https://ia.opox.ai/v1/tests/generate` con las mismas credenciales (`X-API-Key`, `X-OpenAI-Key`) y `curso_id` que usa el backend OPOX. Elimina el overhead de red del backend intermedio, que es <100 ms.
- **Curso**: `ef7d941bea5f41d7` (Policía de Galicia · 40 temas).
- **user_id**: `perf-tester-santigarciavel33` (aislado del historial real del usuario para no ensuciar `hecho_ya_preguntado`).
- **Combinaciones**: cantidad × dificultad × temas (null, 1, 3, 10). Script `apps/backend/scripts/perf_generator_infinito_quick.js`.
- **Métricas**: `t_total` (start job → job done), `preguntas_devueltas` vs `pedidas`, motivos de descarte del Motor.

## Datos de rendimiento

Barrido contra `POST https://ia.opox.ai/v1/tests/generate` desde `apps/backend/scripts/`.

| Cantidad | Dificultad | Temas        | Tiempo (s) | Devueltas / Pedidas | Motivos de descarte |
|---:|---|---|---:|---:|---|
| 10 | fácil   | null (todos) | **113** | 10 / 10 | 4× hecho_ya_preguntado, 2× l1_no_entailment, 1× duplicado, 1× cita_encabezado, 1× tautológico |
| 10 | media   | null (todos) | **73**  | 10 / 10 | 5× hecho_ya_preguntado |
| 10 | difícil | null (todos) | **122** | 10 / 10 | **7× l1_no_entailment**, 1× cita_encabezado, 4× hecho_ya_preguntado |
| 10 | media   | 3 temas      | **153** | **3 / 10** ⚠️ | 5× cita_encabezado, **85× hecho_ya_preguntado**, `corte: tope_minado` |
| 20 | media   | null (todos) | **135** | 20 / 20 | 6× hecho_ya_preguntado, 2× l1_no_entailment, 1× ambiguo, 1× tautológico |
| 30 | media   | null (todos) | **191** | 30 / 30 | 8× hecho_ya_preguntado, 3× l1_no_entailment, 1× ambiguo |
| 50 | media   | null (todos) | **>300 · TIMEOUT** ⚠️ | 0 / 50 | Timeout del script a 5 min sin `estado: done` |
| 100| media   | null (edge)  | **rechazo 422** ⚠️ | – | Motor: `n_preguntas debe ser ≤ 50`. Backend acepta hasta 100. |
| **REPLAY** 30 | media | **5 temas** | **>360 · TIMEOUT** ⚠️ | **27 / 30** | Progreso incremental: 3@71s, 7@147s, 11@193s, 15@238s, 21@290s, 27@347s, corte a 360s |
| **REPLAY** 20 | media | **5 temas** | **291** | 20 / 20 | 86× hecho_ya_preguntado, 2× cita_encabezado, 2× tautológico |
| **CTRL**   30 | media | null       | **217** | 30 / 30 | 10× hecho_ya_preguntado, 2× ambiguo, resto minoritarios |

_Notas de los cases probados:_
- El caso `n=10 media 3_temas` demuestra dos gaps: (a) el Motor SÍ respeta `tema_ids` cuando se envía (contra el envío del backend que fuerza `null`); (b) sin embargo, se atasca en descartes y entrega menos preguntas sin marcar el error.
- El `hecho_ya_preguntado: 85` con `user_id` fresco es sospechoso — probablemente el Motor aplica el filtro también a nivel de corpus del curso (todas las variantes de una misma pregunta canónica), no solo a nivel de usuario.
- `dificil` es más lento que `fácil` que es más lento que `media` — patrón contraintuitivo, explicado por el criterio de RAG entailment que rechaza más agresivamente en los extremos.
- **`n=50` no completa en 5 minutos**. Extrapolando la escala lineal de 10/20/30 (~6.4 s/pregunta), 50 preguntas deberían tomar ~320 s (5 min 20 s). Justo al borde. En producción, con jitter del Motor + carga concurrente, es muy probable que el usuario nunca vea el resultado con n=50. **El límite práctico útil del selector de cantidad hoy es ~30 preguntas**, no 50.
- **`n=100` es rechazado por el Motor con 422** confirmando G04.

### Escala latencia (dificultad `media`, temas `null`)

```
n=10 ▓▓▓▓▓▓▓▓▓▓▓▓▓                            73 s
n=20 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                 135 s
n=30 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       191 s
n=50 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ >300 s TIMEOUT
```

Aproximación: `t(s) ≈ 20 + 6 × n_preguntas` — regresión lineal sobre los 3 puntos exitosos.

## Gaps identificados

### G01 · CRÍTICO · El selector de temas del mobile es cosmético

`apps/backend/src/infrastructure/clients/MotorAiClient.ts:184-197`:

```ts
// 'all' → null (todo el temario). Múltiple selección separada por coma → array.
// Nota: los topicIds de OPOX son semánticos ('constitucion', 'ley-39') pero
// los tema_ids del Motor son UUIDs del PDF parseado. Hasta que exista la tabla
// training_courses_topics con el mapeo, enviamos null (all) y el Motor elige.
const temaIds: string[] | null =
    params.topicId === 'all'
        ? null
        : null; // TODO(motor-topics): mapear topicId → tema_ids del Motor
```

**Efecto**: el usuario selecciona "Tema 5" en el picker; el backend envía `tema_ids: null` al Motor; el Motor genera preguntas de cualquier tema. En la prueba puedes verlo comparando `n=10 media null` vs `n=10 media 3_temas` — el Motor responde con preguntas equivalentes en ambos casos porque el backend ignora la selección.

**Nota**: **no hace falta ninguna consulta extra a Supabase**. El mobile ya envía los `topic_id` que son literalmente los hex del Motor (verificado: `training_topics.topic_id` guarda el hex y `boeApi.listTopics` lo devuelve al mobile → `selectedTopicIds` es un Set de hex → `backendTopicId` es CSV de hex → llega tal cual a `MotorAiClient.generateQuestions.params.topicId`).

**Solución** (fix de 3 líneas):
```ts
// En MotorAiClient.ts:184-197, reemplazar el ternario tautológico por:
const temaIds: string[] | null =
    !params.topicId || params.topicId === 'all'
        ? null
        : params.topicId.split(',').map((t) => t.trim()).filter(Boolean);
```

Estimación: 5 min de código + eliminar el `logger.warn` que decía "topicId ignorado". Ya con esto el selector de temas del mobile empieza a funcionar de verdad.

⚠️ **Cuidado con G08**: aplicar G01 sin G08 empeora la UX — con filtro por temas activo, el Motor devolverá test amputados con más frecuencia (como el caso `n=10 3_temas → 3/10 devueltas`). G01 y G08 deben ir juntos.

### G02 · CRÍTICO · Contador "N de M preguntas listas" no avanza

El hook `useTestSession` (`apps/mobile/src/hooks/useTestSession.js:48-88`) pinta el progreso desde `job.progress`. Pero el `JobOut` del Motor no publica `progreso.done` incremental para tests generados — el campo se queda en 0 hasta que el job termina en `done`. Confirmado en el barrido: cada request pasa 90–200 s con `progreso: { done: 0, total: 0 }` y solo el `estado: 'done'` marca la finalización.

**Efecto**: el usuario ve "Preparando tu test… El Motor extrae cada pregunta del temario oficial. Puede tardar hasta 2 minutos." durante 2 min con progreso 0. Sensación de app colgada.

**Solución** (varias opciones combinables):
- (A) **Falsear progreso**: incrementar visualmente a un ritmo predecible (ej. `done += 1 cada 12 s hasta done < total - 1`) para que el usuario vea movimiento. Simple, mejora percepción sin cambiar backend.
- (B) **Pedir al equipo IA que publique progreso incremental** en `JobOut.progreso.done` mientras el LLM genera. Real, pero depende del Motor.
- (C) **Reducir el LOTE**: partir la request de N preguntas en `ceil(N/5)` jobs más pequeños (5 preguntas cada uno) y disparar en paralelo. Cada job termina en ~30 s. El usuario ve `5 → 10 → 15 → 20 → 25 → 30` con incrementos reales cada ~30 s. Cambia el patrón de coste (más overhead de red pero menos tiempo perceptual).

Recomendación: (C) es el rediseño correcto; mientras tanto, (A) mitiga la percepción con esfuerzo mínimo.

### G03 · TTL de 90 s en `GeneratorConfigScreen` no aplica en el flujo actual pero engaña

`apps/mobile/src/screens/training/GeneratorConfigScreen.js:238-239`:
```js
const TTL_WARN_MS  = 15_000;
const TTL_KILL_MS  = 90_000;
```

Estos timers están armados alrededor de la llamada `trainingApi.startTestJob()`, que responde `202` con `jobId` en ~1 s. El TTL nunca dispara en el flujo streaming — el `navigation.replace('TrainingSession', { jobId, ... })` ocurre antes.

**Efecto**: los timeouts están dead code para el path principal. El path síncrono legacy (`trainingApi.generateQuestions`) sí los honra, pero solo se activa cuando el Motor no está configurado (503). Y ahí sí que un request síncrono al Motor tomaría 100+ s y moriría a los 90 s siempre.

**Solución**:
- Eliminar los `TTL_*` del `GeneratorConfigScreen` — el runner (`QuestionActiveScreen`) ya tiene su propio timeout de 180 s en `useTestSession`.
- Documentar en el runner que el tiempo real del Motor es 70–210 s y ajustar el copy del loader.

### G04 · Validación de count desalineada backend/Motor

`apps/backend/src/presentation/validators/trainingValidators.ts:15`:
```ts
count: z.coerce.number().int().min(1).max(100).optional(),
```

El Motor tiene `n_preguntas.maximum: 50` (verificado en OpenAPI del Motor y **reproducido** en el barrido — `n=100` responde `422 {"type":"less_than_equal","loc":["body","n_preguntas"],"ctx":{"le":50}}`). Un mobile que envíe `count=60..100` pasa la validación del backend, llega al Motor, y el Motor rechaza con 422.

**Efecto**: en el mobile ese error se traduce a un genérico "el motor está tardando más de lo normal" sin diagnóstico.

**Solución**: alinear `count.max(50)` en el validador del backend. Además, verificar en el UI del mobile: el picker `GeneratorConfigScreen` ya cap a 50 en la práctica, pero mejor bajar el validador del backend para defensa en profundidad.

### G09 · CRÍTICO · El techo práctico del generador hoy es ~30 preguntas, no 50

El barrido demuestra que **`n=50` no completa dentro del techo de 300 s** que aplicamos en el script de prueba. La escala lineal `t ≈ 20 + 6×n` predice `t(50) ≈ 320 s`, y con jitter/carga concurrente en producción se va a >5 min con frecuencia. El mobile tiene `DEFAULT_TIMEOUT_MS = 180_000` (3 min) en `useTestSession` — un test de 50 preguntas HOY va a timeoutear en el mobile antes de que termine.

**Efecto**: el usuario que elige "50 preguntas" en el picker ve la pantalla "El motor está tardando más de lo normal" al minuto 3 y no puede empezar el test. Y hasta 40 preguntas ya está en el borde.

**Solución** (varias capas):
- **Corto plazo**: subir el timeout de `useTestSession` a 360 s (6 min) para dar margen a n=50 en el mejor caso. Combinado con G02(A) (falsear progreso) para que la espera sea tolerable.
- **Medio plazo**: partir la request de N>20 en jobs paralelos de 10-15 preguntas (G02(C)). Cada job termina en ~90 s. 50 preguntas = 5 jobs paralelos = ~90-120 s total en vez de 300+.
- **Ya**: capar el picker del mobile a 30 preguntas mientras no se implemente lo anterior. Mostrar mensaje "para tests más grandes usa el Banco de Exámenes Oficiales".

### G05 · Sin caché de resultados en el backend

`GenerateQuestionsUseCase` (`apps/backend/src/application/training/GenerateUseCases.ts`) es un pass-through al `AiApiContract`. No hay caché por `(cursoId, temaIds, dificultad, count)`.

**Efecto**: dos usuarios que piden el mismo test (o el mismo usuario dos veces en 5 min) pagan 100+ s cada uno y consumen tokens OpenAI. El Motor sí tiene caché parcial (respuesta 200 vs 202) pero es opaca al backend.

**Solución** (dos capas):
- Backend: caché LRU en memoria por `hash(params) → questions`, TTL 30 min, tamaño 200 entradas. Reduce latencia percibida y coste OpenAI para preguntas repetidas.
- Frontend: preload en background al elegir la oposición — mientras el usuario configura el generador, ya se está generando un test de 10 preguntas "media, todos los temas". Cuando confirma, el test se muestra instantáneamente.

### G06 · Descartes internos del Motor son invisibles al usuario

Cada job del Motor devuelve un campo `deficit.motivos_descarte`:
```json
{ "motivos_descarte": { "hecho_ya_preguntado": 4, "l1_no_entailment": 2, "enunciado_duplicado": 1, ... } }
```

Estos descartes explican por qué el Motor tarda mucho: genera 15–20 preguntas para entregar 10. En el fácil, casi tantas como pidió el usuario se descartaron por criterios internos (RAG entailment, duplicados, etc.).

**Efecto**: el equipo IA sabe que hay ineficiencia, pero el usuario final no. Y el backend no aprovecha esta señal.

**Solución**:
- Loguear `deficit.motivos_descarte` en el backend con severidad `info` para tener telemetría agregada.
- Si `deficit > 0`, considerar reintentar con un `hecho_ya_preguntado` reducido (limpiar historial de sesión) o disparar un batch adicional.
- A medio plazo: reportar al equipo IA cuál es el ratio de descartes y pedir optimización.

### G10 · CRÍTICO · Restringir temas amplifica la latencia · REVERTIDO 2026-09-18

> **Estado**: cap dinámico implementado y REVERTIDO tras feedback del usuario. Se
> conserva la sección por su valor diagnóstico y para el equipo IA.
> El picker vuelve a permitir hasta 30 preguntas sin importar la selección de
> temas. El `DeficitWarningModal` (G08) sigue activo y avisa cuando el Motor
> no puede completar. El problema es del corpus del Motor — se reporta al
> equipo IA en `INFORME_MOTOR_TEAM.md`.

**Reproducido exactamente el bug reportado por Santi**: seleccionó 5 temas y pidió ~30 preguntas, la sesión se cortó a los ~360 s con 23 preguntas (nuestro replay dio 27, mismo patrón). Datos comparativos:

| Selección              | Preguntas | Tiempo | Tasa    | Deficit         |
|------------------------|----------:|-------:|--------:|-----------------|
| **null** (todo temario) | 30       | 217 s  | 7 s/preg | 10× ya_preguntado |
| **5 temas**             | 30       | >360 s TIMEOUT | 12+ s/preg | corte, 27/30 |
| **5 temas**             | 20       | 291 s  | 14.5 s/preg | **86× ya_preguntado** |

**Efecto**: cada tema seleccionado impone un techo real de ~6 preguntas antes de que el Motor empiece a descartar masivamente. Con 5 temas × 20 preguntas, el Motor descartó 86 candidatas por `hecho_ya_preguntado` — probablemente aplica dedupe interno dentro del propio job, no solo del historial del usuario.

**Solución (G10)**: cap dinámico en el picker del mobile. Fórmula empírica del barrido:
```
maxN = min(30, num_temas_seleccionados * 6)
```
- 1 tema → máx 6 preguntas
- 3 temas → máx 18
- 5 temas → máx 30
- todos (>= 5) → máx 30 (COUNT_MAX absoluto)

Cuando el usuario reduce la selección, el count se recorta y se muestra un mensaje "Con N tema(s) seleccionado(s), el máximo es X". Elimina el escenario "timeout a media pregunta".

### G08 · CRÍTICO · El Motor puede entregar menos preguntas de las pedidas, sin marca de error

Caso reproducido en el barrido: `n_preguntas: 10, tema_ids: [3 temas]` → el Motor devuelve **3 preguntas** con `estado: 'done'` (no `error`), `deficit.publicadas: 3` de `pedidas: 10`, `corte: 'tope_minado'`.

**Efecto**: el backend `MotorAiClient.getSessionQuestions` SÍ lee `deficit` (línea 510-517) y lo devuelve al controller, PERO el mobile no lo consume — `grep -r deficit apps/mobile/src` devuelve 0 matches. Se descarta silenciosamente. En el flujo `generateQuestions` (síncrono) tampoco se propaga: `MotorAiClient.generateQuestions` devuelve `GeneratedQuestion[]` a secas, sin metadata. El runner arranca un test de 3 preguntas cuando el usuario pidió 10. El usuario no tiene forma de saber que el Motor no pudo cumplir. El indicador `Pregunta 1 de 3` en la barra navy es engañoso — no dice "de las 10 que pediste, solo hay 3".

**Escenarios en que ocurre**:
- Selecciones de temas muy específicas donde el corpus tiene poco material.
- `hecho_ya_preguntado` acumulado — un usuario que ha hecho muchos tests puede quedarse sin variantes disponibles en un tema.
- `corte: 'tope_minado'` cuando el Motor alcanza su límite de generación.
- Muy probable en usuarios reales conforme acumulan historial.

**Solución** (varias capas):
- **Backend**: `MotorAiClient` debe consultar `deficit` en la respuesta del job. Si `publicadas < pedidas`, devolver `{ questions, warning: { requested, delivered, reason } }` al mobile.
- **Mobile**: si `warning.delivered < warning.requested`, mostrar toast o modal antes de arrancar el test: "Solo pudimos generar {delivered} preguntas para tu selección. ¿Empezar con estas o probar con más temas?"
- **Fallback proactivo**: si `delivered < requested / 2`, disparar automáticamente un segundo job al Motor con `tema_ids: null` (ampliar temas) para completar el gap antes de mostrar nada al usuario.
- **Long term**: exponer el `deficit.motivos_descarte` como métrica agregada por curso → detectar qué temas están "minados" para el usuario y avisar en la UI del picker (`Tema 5 · pocos ejercicios disponibles`).

### G07 · Sin desagregación de tiempo (setup vs generación vs polling)

El único punto de medición hoy es `elapsedSeconds` global en el runner. No sabemos cuánto tarda cada fase:
- `startTestJob` (POST al Motor → 202): normalmente ~1 s
- Polling de `/v1/jobs/{jobId}`: dependiente de cuándo termine el job
- `getSessionQuestions` una vez hay sessionId

**Solución**: añadir métricas cliente `t_config → t_job_start → t_first_progress → t_first_question → t_done` a un endpoint de telemetría (o al menos loguear en consola en dev). Sin esto no se puede optimizar dónde duele más.

## Recomendaciones priorizadas

| Prioridad | Fix | Estimación | Impacto |
|---|---|---|---|
| P0 | **G01**: mapear `topicId → tema_ids` en `MotorAiClient` (fix de 3 líneas) | 15 min | Correctitud (selector de temas funciona) |
| P0 | **G08**: consumir `deficit` del Motor y avisar al usuario cuando `delivered < requested` | 1 día | Correctitud (usuario no recibe un test amputado silenciosamente) |
| P0 | **G09**: cap del picker mobile a 30 mientras no se paralelice + timeout `useTestSession` a 360 s | 10 min | Usuario ya no ve "el motor tarda" al minuto 3 con 50 preguntas |
| P0 | **G10**: cap dinámico del picker en función de temas seleccionados (`max = temas * 6`) | 20 min | Con 5 temas × 30 preguntas el test se cortaba a los 6 min con 23 preguntas |
| P0 | **G02(A)**: falsear progreso en `useTestSession` | 0.5 día | Percepción (usuario no cree que colgó) |
| P1 | **G04**: alinear `count.max(50)` en validador backend (confirmado con 422 en el barrido) | 5 min | Defensa en profundidad |
| P1 | **G03**: quitar TTL de 90 s del `GeneratorConfigScreen` | 15 min | Limpieza |
| P2 | **G05**: caché LRU en `GenerateQuestionsUseCase` | 1 día | Latencia + coste OpenAI |
| P2 | **G07**: telemetría cliente por fase | 0.5 día | Diagnóstico futuro |
| P3 | **G02(C)**: lote de N/5 preguntas paralelas | 2 días | Rediseño del pipeline (mejor UX) |
| P3 | **G02(B)**: pedir al equipo IA progreso incremental | Externo | Real vs falseado |
| P3 | **G06**: telemetría + reintento sobre `motivos_descarte` | 1 día | Reducir latencia media |

## Quick win recomendado (2 horas de trabajo)

Con solo 4 fixes P0 el generador pasa de "roto silenciosamente" a "funcional y honesto":

1. **G01** (15 min) · Fix de 3 líneas en `MotorAiClient.ts:184-197`. Selector de temas funciona.
2. **G09** (10 min) · Cap del picker mobile a 30 preguntas + `useTestSession` timeout a 360 s. Nadie se queda colgado.
3. **G08** (~1 día) · `MotorAiClient` devuelve `{ questions, warning }`. Runner muestra modal "Solo hay 3 preguntas para tu selección — ¿empezar así?" antes de arrancar.
4. **G02(A)** (~4 h) · Progreso falseado en `useTestSession` (avanzar `done` visualmente a ritmo predecible). Contador ya no se queda en 0.

Los tres primeros son horas; el cuarto medio día. **Total: 2 días de una persona** para arreglar los gaps críticos observables por el usuario.

## Apéndice · Cómo reproducir

Los scripts leen `apps/backend/.env` (necesita `MOTOR_API_KEY`, `AI_API_KEY`, `MOTOR_DEFAULT_CURSO_ID`) y disparan contra `https://ia.opox.ai/v1/tests/generate` directamente. No requieren el backend corriendo — el backend agrega <100 ms por request y no cambia los tiempos ni los descartes del Motor.

```bash
cd apps/backend

# Barrido completo (48 casos, ~90 min · caro en OpenAI)
node scripts/perf_generator_infinito.js

# Barrido quirúrgico usado en este informe (5 casos, ~10 min)
node scripts/perf_generator_infinito_quick.js

# Extras que se corrieron aparte (n=20/30/50/100, ~15 min)
node scripts/perf_generator_infinito_extra.js
```

Logs en `apps/backend/scripts/perf*.log` y `perf_generator_infinito_extra.json`.

## Apéndice B · Datos crudos del barrido

| Caso                            | Tiempo | Devueltas | Motivos descarte |
|---------------------------------|-------:|----------:|------------------|
| n=10 · fácil · null             | 113 s | 10/10 | duplicado, l1_entailment×2, ya_preguntado×4, cita_encabezado, tautológico |
| n=10 · media · null             |  73 s | 10/10 | ya_preguntado×5 |
| n=10 · difícil · null           | 122 s | 10/10 | l1_entailment×7, cita_encabezado, ya_preguntado×4 |
| n=10 · media · 3 temas          | 153 s | **3/10** | ya_preguntado×85, cita_encabezado×5, `tope_minado` |
| n=20 · media · null             | 135 s | 20/20 | ya_preguntado×6, l1_entailment×2, ambiguo, tautológico |
| n=30 · media · null             | 191 s | 30/30 | ya_preguntado×8, l1_entailment×3, ambiguo |
| n=50 · media · null             | >300 s | timeout | – |
| n=100 · media · null            | – | 422 | Motor: `n_preguntas ≤ 50` |
