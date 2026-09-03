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
**Estado**: ~~Cerrado~~ — implementado en revisión 2026-08-30 con pdfkit + Supabase Storage. URL firmada (1 h). Este gap es obsoleto.

---

## Motor de IA

### GAP-MOTOR-01 — `correcta_idx` ausente en job result
**Estado**: Workaround activo (caché de banco de preguntas 30 min)  
**Referencia**: `packages/ai/MOTOR_INTEGRATION.md` · [INC-04]  
**Solución definitiva (Opción A)**: Validar respuesta a respuesta vía `POST /v1/tests/{sesion_id}/answer` — pendiente de confirmación del equipo IA.

### GAP-MOTOR-02 — Re-ingesta del temario oficial
**Estado**: Pendiente  
**Contexto**: El curso activo (`1357e871b542425b`) contiene datos migrados del Cloud Run viejo. Pendiente re-ingestar el temario oficial y actualizar `MOTOR_DEFAULT_CURSO_ID` en `.env`.

---

## Bloque 0 · Acceso / Onboarding

### GAP-00-01 — Test de nivel estático vs Motor IA
**Estado**: Divergencia documentada — decisión pendiente  
**Contexto**: `FLUJO_NAVEGACION.md` y `LevelTestInProgressScreen.js` implementan un test de 20 preguntas **estáticas** hardcoded (8 Constitución, 8 Ley 39/2015, 2 Ley 40/2015, 2 Org. Estado). El Motor IA en `https://ia.opox.jaeverba.com/onboarding` ya ofrece generación dinámica con distribución configurable (40% easy/40% medium/20% hard) y cantidad de preguntas seleccionable.  
**Decisión requerida**: ¿Integrar Motor para el test de nivel (más adaptativo, requiere Motor activo en onboarding) o mantener estático (sin dependencia de red en el flujo crítico de primera apertura)?  
**Si se integra**: añadir `GenerateLevelTestParams` al `AiApiContract`, nuevo endpoint `POST /auth/level-test/generate`, y sustituir las preguntas hardcoded en `LevelTestInProgressScreen.js`.

---

## Bloque 3 · Salud (integración Motor pendiente)

### GAP-03-01 — Motor de fatiga con umbral personalizado
**Estado**: Funcional con valores hardcoded — Motor disponible  
**Contexto**: `FatigueEngineScreen.js` compara contra `HRV_BASE=50, HR_BASE=61` hardcoded. El Motor en `/fatigue` acepta HRV + FC reposo + horas de sueño y devuelve semáforo + histórico 7 días + recomendaciones de descanso calculados contra la **línea base personal** del usuario (no un valor fijo).  
**Solución**: Ver Plan de implementación Bloque 3 en este documento.

---

## Bloque 8 · Aula Virtual (integración Motor pendiente)

### GAP-08-01 — Tutor Chat, Flashcards, Podcast, Resúmenes con Motor
**Estado**: Chat via OpenAI directo, Flashcards stub IA  
**Contexto**: El Motor en `/classroom` ofrece tutor RAG sobre el temario oficial, resúmenes con 3 niveles de profundidad (cacheados), podcast con selector de duración, y flashcards con cantidad configurable. La integración con el Motor elevaría la calidad del tutor al usar el corpus indexado en lugar de un LLM genérico.  
**Solución**: Ver Plan de implementación Bloque 8 en este documento.

---

## Bloque 12 · Configuración (integración Motor pendiente)

### GAP-12-02 — Perfil de tono IA no propagado a las respuestas del Motor
**Estado**: `PATCH /config/preferences` guarda `personality` en BD — Motor no lo recibe  
**Contexto**: El Motor en `/tone` expone personalidad (Cercano/Formal/Directo/Motivador), modo de discurso, estilo de pista y nivel de referencia. Actualmente `TutorChatScreen` llama al backend que llama a OpenAI directo sin aplicar el perfil guardado. Cuando se integre el Motor para el Aula Virtual, hay que propagar el perfil de tono en cada request.  
**Solución**: Ver Plan de implementación Bloque 12 en este documento.
