# Brief para el Responsable de IA — Bloque 3 · Salud Inteligente

## Qué es este bloque

El Bloque 3 es el módulo de **salud del opositor** dentro de OPOX. Se conecta a
Apple Health (iOS) y Google Health Connect (Android) para leer métricas biométricas
en tiempo real: HRV, frecuencia cardíaca en reposo, SpO₂, horas de sueño, pasos.

Hoy el bloque es funcional pero estático: las alertas de fatiga usan umbrales médicos
fijos (`HRV_BASE = 50 ms`, `HR_BASE = 61 ppm`), los menús vienen de un JSON local y
las meditaciones son guiones pregrabados. Este brief define las **4 tareas de IA** que
convierten esos datos crudos en diagnósticos personalizados y contenido dinámico.

---

## Cómo funciona el handoff

```
App móvil → Nuestro backend → [AiApiClient.método()] → Proveedor de IA (OpenAI)
```

- **Tú entregas**: `system_prompt` + plantilla del mensaje de usuario + formato JSON de output.
- **Nosotros implementamos**: la llamada HTTP a OpenAI, el parseo, el endpoint de backend
  y la actualización de la pantalla mobile.
- **La API key nunca sale de nuestro servidor.**
- **Mientras tanto**: el backend devuelve los datos hardcodeados actuales como stub,
  exactamente igual que en los bloques 8, 9 y 10.

---

## Estado actual del código (lo que hay hoy)

| Elemento | Estado actual |
|---|---|
| Motor de fatiga (`FatigueEngineScreen`) | Reglas fijas: `hrv < 50 → alerta`. Sin personalización ni mensaje explicativo. |
| Heurística de energía (`HomeHealthScreen`) | Fórmula fija: `HRV×50% + sueño×30% + FCreposo×20%`. Sin IA. |
| Menús (`MenusScreen`, `MenuDetailScreen`) | JSON estático en `src/data/healthContent.js`. Badge "AI" visual sin lógica real. |
| Meditaciones (`MeditationListScreen`) | Lista fija de 4 sesiones en `healthContent.js`. |
| Técnicas de estudio (`StudyTipsScreen`) | Lista hardcoded, sin contexto del estado del usuario. |

---

## Tareas de IA que necesitamos

### Tarea 1 — `analyzeFatigueState`

**Cuándo se usa**: cuando el usuario abre `HomeHealthScreen` o `FatigueEngineScreen` y
hay métricas disponibles del wearable. Reemplaza las reglas fijas de `buildSignals()`.

**Input que te mandamos** (JSON):

```json
{
  "oposicion": "justicia-tramitacion",
  "metrics": {
    "hrv": 38,
    "restingHeartRate": 68,
    "heartRate": 74,
    "spo2": 96,
    "sleepHours": 5.5,
    "steps": 3200
  },
  "baseline": {
    "hrv": 52,
    "restingHeartRate": 61,
    "sleepHours": 7.2
  },
  "context": {
    "examDaysAway": 14,
    "studySessionsThisWeek": 4
  }
}
```

| Campo | Descripción |
|---|---|
| `metrics` | Datos crudos de las últimas 24 h del wearable. Cualquier campo puede ser `null` si el dispositivo no lo provee. |
| `baseline` | Media de los últimos 7–14 días del mismo usuario (calculada por el backend). Si tiene menos de 7 días de datos, usamos los valores estándar médicos. |
| `context.examDaysAway` | Días hasta el examen registrado (puede ser `null`). |
| `context.studySessionsThisWeek` | Tests completados esta semana (de `training_attempts`). |

**Output que necesitamos** (JSON objeto):

```json
{
  "level": "high",
  "type": "physical_fatigue",
  "energyScore": 34,
  "headline": "Fatiga alta detectada",
  "explanation": "Tu HRV está 14 ms por debajo de tu base (38 ms vs 52 ms) y solo has dormido 5.5 h. Tu cuerpo no ha podido recuperarse del todo.",
  "recommendation": {
    "action": "break",
    "label": "Pausa guiada recomendada",
    "detail": "Antes de continuar con el temario, una pausa de respiración de 8 min puede ayudar a bajar la activación."
  },
  "signals": [
    { "id": "hrv", "label": "HRV por debajo de tu base", "status": "critical", "value": "38 ms (base: 52)" },
    { "id": "resting_hr", "label": "FC reposo elevada", "status": "warning", "value": "+7 vs tu media" },
    { "id": "stress", "label": "Estrés sostenido en la sesión", "status": "warning", "value": "Alto" },
    { "id": "spo2", "label": "Saturación de oxígeno", "status": "ok", "value": "96%" },
    { "id": "sleep", "label": "Sueño noche anterior", "status": "critical", "value": "5.5 h" }
  ]
}
```

| Campo | Descripción |
|---|---|
| `level` | `"low"` / `"medium"` / `"high"` — nivel de fatiga global. |
| `type` | `"optimal"` / `"physical_fatigue"` / `"acute_stress"` / `"recovery_needed"`. Distingue fatiga física (sueño + HRV bajos) de estrés agudo (HRV bajo pero sueño normal). |
| `energyScore` | 0–100. Reemplaza la heurística fija del código actual. |
| `headline` | Título corto para la tarjeta de energía. Máx. 30 caracteres. |
| `explanation` | Párrafo breve (máx. 180 chars) citando las métricas del usuario con sus valores reales y los de su base. **Nunca genérico** — siempre personalizado. |
| `recommendation.action` | `"break"` / `"light_study"` / `"full_study"` / `"exercise"`. |
| `recommendation.label` | Texto del CTA en la pantalla. Máx. 40 chars. |
| `recommendation.detail` | Explicación de por qué se recomienda esa acción. Máx. 160 chars. |
| `signals[]` | Array de 5 señales en el mismo orden que las muestra la app (hrv, resting_hr, stress, spo2, sleep). Status: `"ok"` / `"warning"` / `"critical"` / `"unknown"` (si `null`). |

**Reglas del output**:
- La `explanation` **debe citar los valores reales** del usuario (`38 ms vs tu base 52 ms`), no frases genéricas como "tus métricas están alteradas".
- Si la diferencia vs base es <10%: nivel `"low"`, tipo `"optimal"`.
- Si HRV baja pero sueño fue ≥7 h: tipo `"acute_stress"` (nerviosismo de estudio), no `"physical_fatigue"`.
- Si `examDaysAway` ≤ 7: la `recommendation.detail` debe mencionar el examen próximo.
- Si alguna métrica es `null`: esa señal tiene status `"unknown"`, valor `"Sin datos"`. No la uses en el cálculo del nivel.
- Formato `json_object` estricto. Sin markdown. Sin texto fuera del JSON.

---

### Tarea 2 — `generateDailyMenus`

**Cuándo se usa**: cuando `MenusScreen` carga y solicita menús al backend via
`GET /health/menus?goal=concentracion`. Reemplaza el JSON estático de `healthContent.js`.

**Input que te mandamos** (JSON):

```json
{
  "goal": "concentracion",
  "oposicion": "justicia-tramitacion",
  "fatigueLevel": "high",
  "restrictions": [],
  "count": 3
}
```

| Campo | Descripción |
|---|---|
| `goal` | `"concentracion"` / `"energia"` / `"examen"` / `"recuperacion"`. Mapea a los filtros de la pantalla. |
| `fatigueLevel` | `"low"` / `"medium"` / `"high"` — salida de `analyzeFatigueState`. Si `null`, ignorar. |
| `restrictions` | Array de restricciones dietéticas del perfil del usuario (ej. `["vegetariano", "sin_gluten"]`). Vacío si no hay. |
| `count` | Número de menús a generar: **1, 2 o 3**. |

**Output que necesitamos** (JSON objeto):

```json
{
  "menus": [
    {
      "id": "menu-gen-1",
      "type": "AI",
      "title": "Día de concentración máxima",
      "goal": "concentracion",
      "highlighted": true,
      "meals": [
        {
          "slot": "desayuno",
          "name": "Avena con arándanos y nueces",
          "kcal": 320,
          "macros": "HC: 45 g · Prot: 12 g · Grasas: 11 g",
          "benefit": "Omega-3 + antioxidantes para la memoria"
        },
        {
          "slot": "comida",
          "name": "Salmón al horno con quinoa y espinacas",
          "kcal": 540,
          "macros": "HC: 38 g · Prot: 42 g · Grasas: 18 g",
          "benefit": "DHA para la función cognitiva"
        },
        {
          "slot": "cena",
          "name": "Tortilla francesa con aguacate",
          "kcal": 390,
          "macros": "HC: 8 g · Prot: 22 g · Grasas: 28 g",
          "benefit": "Proteína + grasas saludables para recuperación nocturna"
        }
      ],
      "shoppingList": [
        "100 g avena en copos",
        "50 g arándanos frescos",
        "20 g nueces",
        "180 g filete de salmón",
        "80 g quinoa",
        "100 g espinacas frescas",
        "3 huevos",
        "1 aguacate"
      ],
      "totalKcal": 1250
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `type` | Siempre `"AI"` para los generados por este endpoint. |
| `highlighted` | `true` para el primer menú del lote (el más recomendado). |
| `meals[].slot` | `"desayuno"` / `"comida"` / `"cena"`. |
| `meals[].benefit` | Frase corta (máx. 60 chars) con el beneficio cognitivo específico. No genérica. |
| `shoppingList` | Ingredientes con cantidades exactas. Ordenados por slot (desayuno → comida → cena). |
| `totalKcal` | Suma de las kcal de las 3 comidas. |

**Reglas**:
- Si `fatigueLevel: "high"`: priori menús de recuperación aunque el `goal` sea `"concentracion"` (nota al usuario en `benefit`).
- Las kcal deben ser realistas: desayuno 250-400, comida 450-600, cena 300-450.
- La `shoppingList` debe poder imprimirse directamente. Sin redundancias entre slots.
- Variedad real: no repitas el mismo plato en distintas llamadas. Los 3 menús del lote deben ser distintos.
- Formato `json_object` estricto.

---

### Tarea 3 — `generateMeditationScript`

**Cuándo se usa**: cuando el usuario selecciona una sesión de meditación en
`MeditationListScreen` y pulsa "Reproducir". El backend genera el guion que la app
lee secuencialmente como texto (la lectura de audio se implementa en una fase posterior
con TTS; hoy el mobile muestra el texto centrado en la pantalla).

**Input que te mandamos** (JSON):

```json
{
  "type": "pre_exam",
  "durationMinutes": 8,
  "fatigueLevel": "medium",
  "oposicion": "justicia-tramitacion",
  "examDaysAway": 2
}
```

| Campo | Descripción |
|---|---|
| `type` | `"pre_exam"` / `"post_study"` / `"break"` / `"focus"`. Determina el tono y el objetivo. |
| `durationMinutes` | 3, 5, 7 u 8. El guion debe estar calibrado para esa duración. |
| `fatigueLevel` | Output de `analyzeFatigueState`. Ajusta la intensidad del ejercicio. |
| `examDaysAway` | Días hasta el examen (puede ser `null`). Si ≤2, el tipo recomendado es `"pre_exam"`. |

**Output que necesitamos** (JSON objeto):

```json
{
  "title": "Calma antes del examen",
  "subtitle": "Gestión de la ansiedad · 8 min",
  "durationMinutes": 8,
  "phases": [
    {
      "id": "intro",
      "label": "Preparación",
      "durationSeconds": 30,
      "text": "Encuentra una posición cómoda, ya sea sentado o tumbado. Cierra los ojos suavemente. En los próximos minutos vas a dar a tu mente el descanso que necesita antes del examen."
    },
    {
      "id": "breathing_4_7_8",
      "label": "Respiración 4-7-8",
      "durationSeconds": 120,
      "text": "Inhala por la nariz durante 4 tiempos... 1, 2, 3, 4. Retén el aire durante 7 tiempos... 1, 2, 3, 4, 5, 6, 7. Exhala lentamente por la boca durante 8 tiempos... 1, 2, 3, 4, 5, 6, 7, 8. Repite este ciclo 4 veces."
    },
    {
      "id": "visualization",
      "label": "Visualización",
      "durationSeconds": 180,
      "text": "Imagina que entras al lugar del examen. Estás tranquilo/a, preparado/a. Cada pregunta que ves te resulta familiar. Tu mente está clara y enfocada..."
    },
    {
      "id": "closing",
      "label": "Cierre",
      "durationSeconds": 30,
      "text": "Toma una última respiración profunda. Al exhalar, siente cómo vuelves a tu ritmo natural. Cuando estés listo/a, abre los ojos despacio. Llevas contigo esa calma."
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `phases[]` | Array de fases secuenciales. La suma de `durationSeconds` debe igualar `durationMinutes × 60` (±15 s). |
| `phases[].label` | Nombre corto para mostrar en la barra de progreso. Máx. 20 chars. |
| `phases[].text` | Texto que la app muestra centrado en pantalla mientras transcurre esa fase. Tono calmado, segunda persona. Máx. 500 chars por fase. |

**Reglas**:
- `pre_exam`: enfoque en gestión de ansiedad + visualización positiva. Mencionar el examen.
- `post_study`: enfoque en descompresión y reconocimiento del esfuerzo.
- `break`: más corto (3–5 min), enfoque en respiración y reset mental.
- `focus`: preparación para empezar una sesión de estudio. Activación suave.
- Si `fatigueLevel: "high"` y `type: "focus"`: incluir fase de recuperación antes de activar.
- Los tiempos de cada fase deben ser coherentes con la respiración descrita (si describes 4 ciclos de 4-7-8, eso son ~76 s — no pongas `durationSeconds: 30`).
- Formato `json_object` estricto.

---

### Tarea 4 — `suggestStudyTechnique`

**Cuándo se usa**: al abrir `StudyTipsScreen`, el backend solicita una sugerencia
contextual que se muestra como tarjeta destacada en la parte superior de la pantalla,
antes de la lista de técnicas genéricas.

**Input que te mandamos** (JSON):

```json
{
  "oposicion": "justicia-tramitacion",
  "fatigueLevel": "high",
  "fatigueType": "physical_fatigue",
  "examDaysAway": 5,
  "currentTopic": "Ley 39/2015",
  "studySessionsThisWeek": 6,
  "timeAvailableMinutes": 90
}
```

| Campo | Descripción |
|---|---|
| `fatigueLevel` | Output de `analyzeFatigueState`. |
| `fatigueType` | Output de `analyzeFatigueState`. |
| `examDaysAway` | Puede ser `null` si no hay fecha de examen configurada. |
| `currentTopic` | Último tema trabajado (del plan de planificación). Puede ser `null`. |
| `timeAvailableMinutes` | Tiempo disponible estimado (se puede omitir o enviar `null`). |

**Output que necesitamos** (JSON objeto):

```json
{
  "technique": "Pomodoro con pausas alargadas",
  "why": "Hoy estás fatigado físicamente (HRV bajo + sueño escaso). La Repetición Espaciada exige alta concentración sostenida — mejor reservarla para mañana.",
  "howTo": "Estudia 25 min · descansa 10 min (en lugar de los 5 habituales) · repite 3 ciclos máximo. Usa los descansos para hacer respiraciones profundas.",
  "duration": "~1 h 45 min para 3 ciclos completos",
  "topicSuggestion": "Para Ley 39/2015 con tiempo limitado: enfócate hoy solo en los arts. 14–18 (obligados a relacionarse electrónicamente) — es el punto más examinado."
}
```

| Campo | Descripción |
|---|---|
| `technique` | Nombre de la técnica recomendada. Máx. 40 chars. |
| `why` | Justificación contextual citando el estado del usuario. Máx. 200 chars. **Siempre mencionar el motivo concreto** (HRV, sueño, días hasta examen, etc.). |
| `howTo` | Instrucciones adaptadas (no el Pomodoro estándar si hay fatiga: cambia los tiempos). Máx. 250 chars. |
| `duration` | Duración estimada de la sesión completa con la técnica. Máx. 40 chars. |
| `topicSuggestion` | Sugerencia específica sobre qué parte del temario priorizar hoy. Máx. 200 chars. `null` si `currentTopic` es `null`. |

**Técnicas disponibles** (las que la app ya tiene en `StudyTipsScreen`):
`"Pomodoro estándar"`, `"Pomodoro con pausas alargadas"`, `"Repetición Espaciada"`,
`"Lectura activa"`, `"Mapas mentales"`, `"Práctica de preguntas cortas"`, `"Repaso pasivo (audio/podcast)"`.

**Reglas**:
- Si `fatigueLevel: "high"` + `examDaysAway ≤ 3`: recomendar **Práctica de preguntas cortas** (alta eficiencia, bajo desgaste cognitivo) con nota de urgencia.
- Si `fatigueLevel: "low"` + `studySessionsThisWeek ≥ 5`: recomendar **Repetición Espaciada** (momento de buena forma).
- Si `fatigueLevel: "high"` + `fatigueType: "acute_stress"` + `examDaysAway ≤ 7`: recomendar **Repaso pasivo (audio/podcast)** → enlazar con Bloque 8 (TutorPodcast).
- El `why` nunca puede ser genérico tipo "porque estás cansado". Debe citar el dato concreto.
- Formato `json_object` estricto.

---

## Casos límite a manejar

| Situación | Qué debe hacer la IA |
|---|---|
| Todas las métricas son `null` (sin wearable) | `analyzeFatigueState`: devolver `level: "low"`, `type: "optimal"`, `energyScore: null`, `explanation: null`. La app muestra el estado "Sin datos" ya existente. |
| `baseline` es igual a los valores estándar médicos (usuario nuevo, <7 días) | Señalarlo en `explanation` con "Aún no tenemos tu base personal. Usando valores de referencia médica." |
| `goal: "examen"` + `examDaysAway > 30` | Los menús de `generateDailyMenus` no deben mencionar el examen — es prematuro. |
| `durationMinutes: 3` en meditación | Solo 2 fases: `intro` (30 s) + ejercicio principal (150 s). Sin visualización ni cierre largo. |
| `restrictions: ["vegetariano"]` | Ningún ingrediente animal en el menú. Si el `goal` es `"concentracion"` y el salmón es la mejor opción: usar alternativa vegetal equivalente (nueces + lino para omega-3, tofu para proteína). |

---

## Formato de entrega

Un único JSON por tarea:

```json
{
  "task": "analyzeFatigueState",
  "model_recommendation": "gpt-4o-mini — texto corto, bajo coste (~$0.0003 por análisis)",
  "system_prompt": "Eres el analizador de fatiga de OPOX...",
  "user_template": "El usuario prepara {{oposicion}}.\n\nMÉTRICAS ACTUALES:\nHRV: {{metrics.hrv}} ms · FC reposo: {{metrics.restingHeartRate}} ppm · SpO2: {{metrics.spo2}}% · Sueño: {{metrics.sleepHours}} h\n\nBASE PERSONAL:\nHRV base: {{baseline.hrv}} ms · FC reposo base: {{baseline.restingHeartRate}} ppm · Sueño base: {{baseline.sleepHours}} h\n\nCONTEXTO:\nDías hasta el examen: {{context.examDaysAway}} · Sesiones esta semana: {{context.studySessionsThisWeek}}\n\nGenera el análisis JSON de fatiga...",
  "output_format": "json_object",
  "examples": [
    {
      "input": { "oposicion": "justicia-tramitacion", "metrics": { "hrv": 38, "restingHeartRate": 68, "spo2": 96, "sleepHours": 5.5, "steps": 3200 }, "baseline": { "hrv": 52, "restingHeartRate": 61, "sleepHours": 7.2 }, "context": { "examDaysAway": 14, "studySessionsThisWeek": 4 } },
      "output": { "level": "high", "type": "physical_fatigue", "energyScore": 34, ... }
    }
  ]
}
```

Entrega un JSON por cada una de las 4 tareas, en el orden de prioridad indicado abajo.

---

## Resumen y prioridades

| Prioridad | Tarea | Modelo | Coste estimado | Necesita visión |
|:---:|---|---|---|:---:|
| 🔴 1 | `analyzeFatigueState` | `gpt-4o-mini` | ~$0.0003/análisis | No |
| 🟠 2 | `generateDailyMenus` | `gpt-4o-mini` | ~$0.0008/lote | No |
| 🟡 3 | `suggestStudyTechnique` | `gpt-4o-mini` | ~$0.0002/sugerencia | No |
| 🟢 4 | `generateMeditationScript` | `gpt-4o-mini` | ~$0.0005/guion | No |

**Ninguna tarea requiere visión ni streaming.**  
Todas devuelven `json_object` estricto y son compatibles con `gpt-4o-mini`.

---

## Integración con otros bloques

| Dato de salida | Lo consume |
|---|---|
| `fatigueLevel` + `fatigueType` | `suggestStudyTechnique` (Bloque 3 interno) |
| `fatigueLevel` + `fatigueType` | `TutorChat` (Bloque 8): ajusta tono del tutor si el usuario viene de una sesión de fatiga alta |
| `fatigueLevel: "high"` + `recommendation.action: "break"` | Nudge en `DashboardScreen`: tarjeta "Tu cuerpo necesita un descanso" |
| `fatigueType: "acute_stress"` + `examDaysAway ≤ 7` | `suggestStudyTechnique` recomienda podcast → navega a `TutorPodcast` (Bloque 8) |

---

## Estado actual de la integración

- ✅ **Frontend completo**: `HomeHealthScreen`, `FatigueEngineScreen`, `MenusScreen`, `MenuDetailScreen`, `MeditationListScreen`, `MeditationPlayerScreen`, `StudyTipsScreen` existen y muestran datos.
- ✅ **Wearable conectado**: `HealthService.js` lee datos reales de Apple Health / Health Connect en EAS build.
- ⏳ **Endpoints de backend**: por implementar. Hoy los datos vienen del JSON local `src/data/healthContent.js` y de la función `buildSignals()` con reglas fijas.
- ⏳ **`AiApiContract.ts`**: por extender con los 4 métodos nuevos.
- ⏳ **`AiApiClient.ts`**: por implementar los 4 métodos (delegarán al stub hasta que el equipo IA entregue los prompts).
- ⏳ **Línea base personal**: el backend debe agregar y guardar el historial de métricas por usuario (media rolling de 7–14 días). La tabla `user_health_baselines` no existe aún — se creará con el sprint de backend.

> ⚠️ **La lectura de audio de las meditaciones NO es tarea de IA**: el mobile renderiza el texto de cada fase en pantalla durante el tiempo indicado por `durationSeconds`. El TTS puede añadirse en una fase posterior con el mismo contrato — el campo `text` ya está preparado para ello.
