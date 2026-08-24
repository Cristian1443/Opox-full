# GAPS pendientes — OPOX

Registro de features incompletas, deuda técnica y decisiones deliberadas de Fase 2.
Actualizar este fichero al cerrar cada ítem.

---

## Bloque 4 · Planificación

### GAP-04-01 — Selector de fecha de examen: teclado numérico en vez de calendario
**Estado**: Funcional, UX mejorable  
**Pantalla**: `PlanningEditScreen.js` → campo "Fecha de examen"  
**Contexto**: El selector actual usa tres `TextInput` (AAAA / MM / DD) con auto-avance de foco. Funciona correctamente pero no es tan intuitivo como un calendario.  
**Solución propuesta**: Sustituir por un date-picker nativo. En React Native la opción estándar es `@react-native-community/datetimepicker` (ya disponible en Expo). Requiere manejar `DateTimePickerEvent` y formatear la fecha resultante al formato `YYYY-MM-DD` que espera el backend.  
**Complejidad**: Baja (~1 h). No desbloquea nada crítico.

---

## Bloque 5 · Motivación

### GAP-05-01 — Verificación real de aprobación (Muro de la Gloria 5.4)
**Estado**: Fase 2 — deliberado  
**Pantalla**: `GloryWallScreen.js` → `POST /motivation/profile/passed`  
**Problema**: `markExamPassed()` es autorreportado. El usuario declara que aprobó sin ninguna verificación.  
**Solución propuesta**: Cruzar con el Monitor BOE (Bloque 10) — cuando se detecte resolución de nombramientos para la oposición del usuario, marcar automáticamente `passed_exam_at`. Requiere integración con `SyncBoeChangesUseCase` y nueva lógica de parseo de tipos de cambio BOE (`tipo = 'nombramiento'`).  
**Dependencias**: Bloque 10 estable, corpus BOE con nombramientos indexado en Motor.

---

### GAP-05-05 — Clanes privados con aprobación del líder
**Estado**: Fase 2 — deliberado  
**Decisión actual**: join abierto — cualquier usuario puede unirse a cualquier clan sin aprobación. Correcto para el MVP donde la motivación colectiva es prioritaria sobre la exclusividad.  
**Solución propuesta**:
- Campo `is_private BOOLEAN DEFAULT false` en tabla `clans`.
- Tabla `clan_join_requests (id, clan_id, user_id, status: pending|accepted|rejected, created_at)` con RLS.
- Push al líder cuando llega una solicitud (`SendClanJoinRequestUseCase`).
- Pantalla de gestión de solicitudes en `ClanDetailScreen` (solo visible para el líder).
**Dependencias**: sistema de roles de clan (ya existe `role: leader|member`).

---

### GAP-05-02 — Duelos en vivo 1vs1 (5.8b)
**Estado**: Fase 2 — deliberado  
**Pantalla**: `DuelsPlaceholderScreen.js` (solo UI de preview)  
**Problema**: No existe infraestructura de matchmaking ni canal bidireccional en tiempo real.  
**Solución propuesta**:
- Websocket dedicado (Socket.io o Supabase Realtime con canal efímero por duelo).
- Servicio de matchmaking: cola de espera por oposición, emparejamiento por nivel (Opopoints ± 20 %).
- Tabla `duels` en BD (jugador_a, jugador_b, preguntas_snapshot, estado, ganador).
- Pantalla split-screen (dos columnas, preguntas compartidas, progreso del rival en tiempo real).
**Estimación**: 3–4 semanas de backend + 2 semanas de mobile. El ítem más costoso del bloque.

---

### GAP-05-03 — Miembros "en línea" fuera del chat
**Estado**: Parcialmente resuelto  
**Contexto**: El contador de presencia ("X en línea") solo existe dentro de `ClanChatScreen.js` via Supabase Presence. `ClanDetailScreen.js` y `ClansListScreen.js` no lo exponen.  
**Solución**: Reutilizar el canal `clan-presence-{id}` desde `ClanDetailScreen` al abrirlo, sin necesidad de nuevos endpoints. Trabajo estimado: 1 h.

---

### GAP-05-04 — Ranking por tema sin datos históricos
**Estado**: Funcional, pero vacío hasta que haya intentos  
**Pantalla**: `RankingsScreen.js` tab "Tema"  
**Contexto**: El endpoint `GET /motivation/ranking?scope=topic&topicId=xxx` ya existe y agrega `training_attempt_responses`. En usuarios nuevos el ranking aparece vacío porque no tienen intentos.  
**Solución**: Ninguna técnica requerida — se llena solo con uso. Considerar mensaje de estado vacío más informativo ("Completa tests de este tema para aparecer aquí").

---

## Bloque 9 · Factoría de Apuntes

### GAP-09-01 — Pipeline IA real pendiente de entrega
**Estado**: Stub activo (`AiApiClientStub`)  
**Marcador**: `TODO(ia-bloque9)` en `AiApiClient.ts`  
**Solución**: Reemplazar los 3 métodos delegados al stub (`analyzeNoteDocument`, `generateTagsFromNote`, `generateQuestionsFromNote`) con llamadas reales cuando el equipo IA entregue los prompts del `BRIEF_IA_BLOQUE9.md`.

---

## Bloque 10 · Monitor BOE

### GAP-10-01 — Mini-test BOE con IA real pendiente de entrega
**Estado**: Stub activo (`AiApiClientStub`)  
**Marcador**: `TODO(ia-bloque10)` en `AiApiClient.ts`  
**Solución**: Implementar `generateBoeMiniTest` real cuando el equipo IA entregue el prompt del `BRIEF_IA_BLOQUE10.md`. Las preguntas tienen exactamente 3 opciones (no 4).

---

## Bloque 12 · Configuración

### GAP-12-01 — Exportación PDF de estadísticas
**Estado**: Stub 202 (`downloadUrl: null`)  
**Marcador**: `TODO(bloque-12)` en el use case de export  
**Solución**: Implementar generación PDF con pdfkit o puppeteer en `POST /config/pro-stats/export`. Enviar push cuando esté listo (`SendNoteReadyUseCase` como referencia de patrón).

---

## Motor de IA

### GAP-MOTOR-01 — `correcta_idx` ausente en job result
**Estado**: Workaround activo (caché de banco de preguntas 30 min)  
**Referencia**: `packages/ai/MOTOR_INTEGRATION.md` · [INC-04]  
**Solución definitiva (Opción A)**: Validar respuesta a respuesta vía `POST /v1/tests/{sesion_id}/answer` — pendiente de confirmación del equipo IA.

### GAP-MOTOR-02 — Re-ingesta del temario oficial
**Estado**: Pendiente  
**Contexto**: El curso activo (`1357e871b542425b`) contiene datos migrados del Cloud Run viejo. Pendiente re-ingestar el temario oficial y actualizar `MOTOR_DEFAULT_CURSO_ID` en `.env`.
