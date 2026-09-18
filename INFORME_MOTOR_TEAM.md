# Reporte al equipo IA · Motor de OPOX

**Fecha**: 2026-09-18
**Curso probado**: `ef7d941bea5f41d7` (Policía de Galicia · 40 temas)
**Endpoint**: `POST https://ia.opox.ai/v1/tests/generate` (+ polling `/v1/jobs/{id}`)
**Origen del reporte**: usuarios finales de OPOX reportan tests amputados cuando seleccionan pocos temas ("solo pudimos generar 1 de 6").

## Resumen

Cuando el usuario restringe la selección de temas, el Motor **descarta agresivamente** por `hecho_ya_preguntado` y otros motivos internos, entregando muchas menos preguntas de las pedidas. Al aislar la causa (usando `user_id` aleatorio en cada test para descartar historial de usuario), el patrón se mantiene — apunta a un **pool limitado de preguntas únicas por tema en el corpus** + **dedupe interno demasiado agresivo dentro del propio job**.

## Datos del barrido

Todos los casos con `user_id` **fresco y aleatorio** (sin historial acumulado). El dedupe `hecho_ya_preguntado` NO puede venir del usuario porque cambia en cada test.

| Config                        | Pedidas | Entregadas | `hecho_ya_preguntado` | Otros descartes                     | Tiempo | Corte             |
|-------------------------------|:-:|:-:|:-:|---|:-:|-------------------|
| 5 temas × 30 preg (media)     | 30 | **27** | 85 | – | >360s | `tope_minado` |
| 5 temas × 20 preg (media)     | 20 | 20     | **86** | 5× cita_encabezado, 2× tautológico | 291s | ok |
| 3 temas × 10 preg (media)     | 10 | **3**  | **85** | 5× cita_encabezado                 | 153s | `tope_minado` |
| null × 30 preg (media, control)| 30 | 30    | 10 | 3× l1_no_entailment, 1× ambiguo    | 217s | ok |
| null × 20 preg (media)         | 20 | 20    | 6  | 2× l1_no_entailment, 1× ambiguo, 1× tautológico | 135s | ok |
| null × 10 preg (media)         | 10 | 10    | 5  | –                                   | 73s  | ok |
| null × 10 preg (fácil)         | 10 | 10    | 4  | 2× l1_no_entailment, 1× duplicado, 1× cita_encabezado, 1× tautológico | 113s | ok |
| null × 10 preg (difícil)       | 10 | 10    | 4  | **7× l1_no_entailment**             | 122s | ok |

**Observaciones clave**:

1. **Restringir temas amplifica el descarte por `hecho_ya_preguntado`** de forma no-lineal:
   - `null × 20` → 6 descartes por `hecho_ya_preguntado`
   - `5 temas × 20` → **86** descartes (14× más), aunque el `user_id` es distinto en cada run
   - `3 temas × 10` → 85 descartes, entrega solo 3/10
2. Con `user_id` distinto en cada test, el dedupe `hecho_ya_preguntado` no puede ser "el usuario ya la vio" — apunta a un dedupe **intra-job** o **por corpus finito**.
3. El corte `tope_minado` aparece consistentemente con selecciones de 3-5 temas y N≥10.
4. La dificultad `dificil` con `null` genera muchos `l1_no_entailment` (7 en un job de 10). Puede indicar prompt de generación que produce preguntas que no pasan tu propio filtro de entailment.
5. n=50 con `null` **NO completa en 360 s** de nuestro techo (extrapolando 6.4 s/pregunta × 50 = 320 s + jitter).

## Impacto en producto

Antes del análisis creíamos que era problema de la app; ahora está claro que el cliente (mobile) y el backend intermedio **pasan bien los parámetros** al Motor. El techo lo pone el corpus + el dedupe.

Consecuencia: cuando el usuario selecciona un tema concreto para reforzarlo (uso principal del Generador Infinito en la app), la experiencia se degrada:
- Pide 10 preguntas → recibe 3.
- Nuestro modal `DeficitWarningModal` avisa honestamente ("Solo pudimos preparar 3 de 10") pero el usuario percibe el generador como poco fiable para el caso más común (repasar un tema puntual).

## Peticiones concretas al equipo IA

Ordenadas por impacto en UX:

### 1. Aumentar el pool de preguntas únicas por tema

Si un tema tiene 5-10 preguntas canónicas y el usuario ya recibió 3, el Motor no puede entregar más sin repetir. Opciones:
- **Regenerar variaciones semánticas** al ingestar el temario (misma pregunta con distintos enunciados).
- **Bajar el umbral de similitud** del dedupe para permitir variaciones que hoy caen como "duplicado".
- **Cross-tema controlado**: cuando el pool del tema pedido está exhausto, aceptar preguntas de temas *muy* relacionados marcadas con `tema_id` real. En vez de rechazar, servir con warning.

### 2. Exponer inventario disponible por tema

Endpoint `GET /v1/courses/{curso_id}/topics-inventory` (o similar) que devuelva:
```json
[
  { "tema_id": "abc123", "titulo": "Régimen local", "preguntas_disponibles": 12, "pool_saludable": true },
  { "tema_id": "def456", "titulo": "Ley 39/2015", "preguntas_disponibles": 3,  "pool_saludable": false },
  ...
]
```

Con esto podemos:
- Avisar al usuario en el picker: "Tema X · pocas preguntas disponibles" (chip amarillo).
- Adaptar el cap del slider por tema en el cliente.
- Reportarles a ustedes automáticamente los temas con pool bajo para priorizar re-ingestas.

### 3. Considerar relajar el dedupe intra-job

Si el usuario pide 20 preguntas de 5 temas, no debería descartarse **86 candidatas** dentro del mismo job. Sospecha: el algoritmo compara cada nueva pregunta contra todas las anteriores del batch + un histórico global; en batches grandes se atasca. Posibles ajustes:
- Bajar sensibilidad de similitud para candidatas del mismo job (aceptar variaciones más cercanas).
- Limitar la ventana de comparación a las últimas N preguntas emitidas al usuario, no al histórico completo.

### 4. Publicar `progreso.done` incremental de forma consistente

En el barrido replay observamos que **a veces sí publican progreso incremental** (`3 @ 71s → 7 @ 147s → 11 @ 193s → 15 @ 238s → 21 @ 290s → 27 @ 347s`) y **a veces no** (`progreso.done: 0` hasta el final). Necesitamos que sea siempre incremental para poder mostrar el contador "N de M preguntas listas" real en el cliente, en vez de simular el progreso.

### 5. Investigar los tiempos de dificultad `difícil`

`null × 10 preg` en `dificil` tarda **122 s vs 73 s** en `media` — 66 % más lento. Los descartes se concentran en `l1_no_entailment: 7`. Posiblemente el prompt de generación en `dificil` produce preguntas con menos anclaje al temario y el filtro RAG las rechaza.

## Cómo reproducir

Scripts disponibles en el repositorio de OPOX (`apps/backend/scripts/`):
- `perf_generator_infinito_quick.js` · barrido corto (~10 min)
- `perf_generator_infinito_replay.js` · replay del escenario "5 temas × 30"
- `perf_generator_infinito.js` · barrido completo (~90 min)

Todos leen `MOTOR_API_KEY` + `AI_API_KEY` de `apps/backend/.env` y disparan directo contra `ia.opox.ai`. Usan `user_id` aleatorio para no arrastrar historial entre corridas.

## Contacto

Repo: `apps/backend/scripts/perf_generator_infinito*.js`
Datos crudos: `INFORME_GENERADOR_INFINITO.md` en la misma rama.
Rama: `fix/generador-infinito-2026-09-17`.

Feedback bienvenido — podemos coordinar una sesión conjunta si ayuda.
