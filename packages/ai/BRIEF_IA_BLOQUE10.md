# Brief para el Responsable de IA — Bloque 10 · Monitor BOE

## Qué es este bloque

Este brief complementa los briefs de Bloques 6–9. El Bloque 10 es el **Monitor de BOE** de
OPOX: vigila automáticamente las leyes del temario del usuario, detecta cambios publicados
en el Boletín Oficial del Estado y ayuda al opositor a asimilar esos cambios con un
mini-test de validación.

| Paso | Qué ocurre |
|---|---|
| **Detección** | Un motor externo (Motor BOE) compara el texto consolidado de cada ley con el snapshot guardado y detecta preceptos modificados. |
| **Alerta** | Nuestro backend notifica al usuario: "El art. 14 de tu temario ha cambiado." |
| **Comprensión** | El usuario lee el antes/después (pantalla 10.3) en lenguaje visual: tachado rojo = derogado, verde = añadido. |
| **Validación** | El usuario hace el **mini-test** (pantalla 10.4): 2-3 preguntas sobre el cambio concreto. Si las pasa, el sistema confirma que el temario está al día. |

La IA que necesitamos es para el **paso de validación**: generar el mini-test a partir
del texto del cambio legal.

---

## Cómo funciona el handoff

```
App móvil → Nuestro backend → [AiApiClient.generateBoeMiniTest()] → Proveedor de IA
```

- **Tú entregas**: el `system_prompt` y la plantilla del mensaje de usuario.
- **Nosotros implementamos**: la llamada HTTP al proveedor y el parseo de la respuesta.
- **La API key nunca sale de nuestro servidor.**
- **Mientras tanto**: el backend usa `AiApiClientStub` con datos mock.

---

## La tarea que necesitamos

### `generateBoeMiniTest` — Generar mini-test sobre un cambio legislativo

**Cuándo se usa**: cuando el usuario abre un cambio BOE detectado en su temario y pulsa
"Mini-test" (pantalla 10.4). La IA genera 2-3 preguntas que validan que el usuario
entendió el cambio específico.

**Input que te mandamos** (JSON):

```json
{
  "oposicion": "justicia-tramitacion",
  "articulo": "Art. 14",
  "ley": "Ley 39/2015, Procedimiento Administrativo Común",
  "identificador_boe": "BOE-A-2015-10565",
  "antes": "Estarán obligados a relacionarse electrónicamente con las Administraciones Públicas para la realización de cualquier trámite de un procedimiento administrativo, al menos, los sujetos siguientes: a) Las personas jurídicas. b) Las entidades sin personalidad jurídica. c) Quienes ejerzan una actividad profesional para la que se requiera colegiación obligatoria, para los trámites e actuaciones que realicen con las Administraciones Públicas en ejercicio de dicha actividad profesional.",
  "despues": "Estarán obligados a relacionarse electrónicamente con las Administraciones Públicas para la realización de cualquier trámite de un procedimiento administrativo, al menos, los sujetos siguientes: a) Las personas jurídicas. b) Las entidades sin personalidad jurídica. c) Quienes ejerzan cualquier actividad profesional colegiada. d) Los empleados públicos en el ejercicio de sus funciones.",
  "count": 3
}
```

| Campo | Descripción |
|---|---|
| `oposicion` | Oposición del usuario (contexto del temario). |
| `articulo` | Precepto modificado (ej. "Art. 14", "Art. 21.2"). |
| `ley` | Nombre y número de la ley modificada. |
| `identificador_boe` | Código oficial `BOE-A-AAAA-NNNNN` — no lo uses en las preguntas, es trazabilidad. |
| `antes` | Redacción derogada. Puede ser un fragmento del artículo, no necesariamente el artículo completo. |
| `despues` | Redacción vigente. Mismo alcance que `antes`. |
| `count` | Número de preguntas a generar: **2 o 3** (nunca más). |

**Output que necesitamos** (JSON objeto):

```json
{
  "questions": [
    {
      "id": "boe-q1",
      "context": "Art. 14 modificado",
      "question": "Tras la modificación del art. 14 Ley 39/2015, ¿qué colectivo se añade expresamente entre los obligados a relacionarse electrónicamente con la Administración?",
      "options": [
        "Los autónomos sin colegiación.",
        "Los empleados públicos en el ejercicio de sus funciones.",
        "Los ciudadanos mayores de 18 años."
      ],
      "correctIndex": 1,
      "explanation": "La nueva redacción añade expresamente a 'los empleados públicos en el ejercicio de sus funciones' (apartado d), junto con quienes ejerzan actividad profesional colegiada (apartado c)."
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `id` | String único por pregunta en el lote (ej. `"boe-q1"`, `"boe-q2"`). |
| `context` | Etiqueta corta del cambio para mostrar en el banner de contexto (máx. 40 chars). |
| `question` | Enunciado de la pregunta. Máx. 280 caracteres. |
| `options` | **Exactamente 3 opciones**. No prefijes A)/a./1. — la app añade la letra. |
| `correctIndex` | 0, 1 o 2 (posición de la opción correcta en el array). |
| `explanation` | Justificación breve citando la redacción vigente (máx. 300 chars). |

**Reglas del output:**

- Genera exactamente `count` preguntas (2 o 3), ni una más ni una menos.
- Las preguntas deben cubrir **distintos aspectos del mismo cambio**: no hagas 3 preguntas
  idénticas reformuladas. Usa ángulos distintos: qué se añadió, qué se eliminó, cuál es
  el efecto práctico, qué colectivo se ve afectado, etc.
- **Solo el texto del cambio** (`antes` + `despues`): no inventes implicaciones que no
  estén en los fragmentos recibidos.
- Las opciones incorrectas deben ser plausibles (confundibles con el texto anterior o con
  colectivos cercanos), no absurdas.
- El `context` debe ser ultra-corto: "Art. 14 modificado", "Nuevo apartado d)", etc.
- La `explanation` debe citar literalmente la frase del `despues` que lo demuestra.
- Formato `json_object` estricto: sin markdown, sin texto fuera del JSON.

---

## Casos límite a manejar

| Situación | Qué debe hacer la IA |
|---|---|
| El cambio es tipográfico/menor (errata) | Generar igualmente las preguntas, pero orientarlas a "¿qué cambia en la práctica?" (respuesta: nada o mínimo) |
| El fragmento `antes` está vacío (es un artículo **nuevo**) | Las preguntas giran en torno a lo que **establece** el artículo nuevo, no al contraste |
| El fragmento `despues` está vacío (artículo **derogado**) | Las preguntas giran en torno a lo que **ya no aplica** |
| `count: 2` | Genera exactamente 2 preguntas, con los ángulos más relevantes |

---

## Formato de entrega

Un único JSON con la tarea:

```json
{
  "task": "generateBoeMiniTest",
  "model_recommendation": "gpt-4o-mini — texto corto, sin visión, bajo coste (~$0.0002 por mini-test)",
  "system_prompt": "Eres el generador de mini-tests de OPOX para cambios legislativos...",
  "user_template": "El usuario prepara {{oposicion}}. El BOE ha modificado {{articulo}} de la {{ley}}.\n\nREDACCIÓN ANTERIOR:\n{{antes}}\n\nREDACCIÓN VIGENTE:\n{{despues}}\n\nGenera exactamente {{count}} preguntas tipo test...",
  "output_format": "json_object",
  "examples": [
    {
      "input": { "oposicion": "justicia-tramitacion", "articulo": "Art. 14", "ley": "Ley 39/2015", "antes": "...", "despues": "...", "count": 3 },
      "output": { "questions": [ /* ... */ ] }
    }
  ]
}
```

---

## Resumen

| Tarea | Urgencia | Necesita visión | Modelo recomendado | Output |
|---|:---:|:---:|---|---|
| `generateBoeMiniTest` | 🔴 Alta | No | `gpt-4o-mini` | JSON objeto con `questions[]` |

**Prioridad**: única tarea del Bloque 10 — desbloquea el paso de validación del mini-test.

Con el JSON que nos entregues nosotros implementamos la conexión al proveedor. Mientras tanto
el backend usa `AiApiClientStub` con 3 preguntas mock para que el flujo sea funcional.

> ⚠️ **El diff visual (verde/tachado) de la pantalla 10.3 NO es tarea de IA**: lo calcula
> nuestro backend con un algoritmo word-by-word (`diffWords` de la librería `diff`). Tú solo
> necesitas implementar `generateBoeMiniTest`.

---

## Estado actual de la integración

- ✅ **Contrato TS**: `AiApiContract.ts` extendido con `generateBoeMiniTest`
- ✅ **Backend por capas**: domain, application, infrastructure, presentation para `/boe/*`
- ✅ **SQL seed**: `apps/backend/supabase/bloque10_boe.sql` con 3 cambios de ejemplo
- ✅ **Stub ejecutable**: `AiApiClientStub.generateBoeMiniTest()` devuelve 3 preguntas plausibles
- ⏳ **AiApiClient real**: delega al stub hasta que el equipo IA entregue el prompt. El día que llegue, se reemplaza la delegación por la llamada a OpenAI en `AiApiClient.ts` — sin tocar el resto de la arquitectura.
- ✅ **Motor BOE externo**: `MotorBoeClient.ts` apunta a `https://ingesta-demo-uadftnwmda-ue.a.run.app`. Configurable con `MOTOR_BOE_BASE_URL` / `MOTOR_BOE_API_KEY` en `.env`.
