# OPOX — Guía global del proyecto

App móvil de preparación de oposiciones (exámenes públicos España).
Monorepo con Turborepo. Cliente confidencial.

---

## 1. Estructura del monorepo

```
Opox-full/
├── apps/
│   ├── mobile/          # React Native + Expo (JS, migrando a TS)
│   │   ├── App.js
│   │   ├── src/
│   │   │   ├── api/         # Clientes HTTP: auth, dashboard, planning, motivation, training, tutor, notes, boe, settings
│   │   │   ├── components/  # Componentes compartidos (ScreenHeader, modales, BoeAlertBanner, …)
│   │   │   ├── hooks/       # Custom hooks de UI (useNetworkWatcher, …)
│   │   │   ├── navigation/  # OnboardingNavigator.js, navigationRef.js
│   │   │   ├── screens/     # Pantallas por bloque: access/, health/, training/, tutor/, notes/, boe/
│   │   │   └── theme.js     # Tokens de diseño OPOX
│   │   └── app.json
│   └── backend/         # Node.js + Express + TypeScript, arquitectura por capas
│       ├── src/
│       │   ├── domain/          # Entidades, errores, interfaces de repositorio
│       │   ├── application/     # Use cases (orquesta dominio e infraestructura)
│       │   ├── infrastructure/  # Implementaciones concretas (Supabase, APIs, …)
│       │   ├── presentation/    # Controllers, routes, middleware, validators
│       │   ├── config/
│       │   ├── container.ts     # DI manual
│       │   └── server.ts
│       └── supabase/    # SQL seeds por bloque
├── packages/
│   ├── ai/              # Prompts y contratos IA (sin secretos). Solo lectura para mobile.
│   │   └── prompts/
│   ├── types/           # Contratos e interfaces compartidas entre mobile y backend
│   │   └── src/
│   │       ├── contracts/   # AiApiContract.ts, ClientApiContract.ts
│   │       ├── api.ts       # ApiResponse<T>, códigos de error
│   │       ├── auth.ts, dashboard.ts, planning.ts, motivation.ts, training.ts, tutor.ts, notes.ts, boe.ts, config.ts
│   │       └── index.ts
│   ├── constants/       # Constantes y rutas compartidas (routes.js)
│   ├── utils/           # logger, result pattern (result.ts)
│   └── tsconfig/        # Configuraciones TypeScript base
└── turbo.json
```

---

## 2. Reglas globales (todos los agentes deben respetar)

- Código en inglés; comentarios explicativos en español.
- TypeScript estricto en backend y packages. Mobile en JS, migrando a TS progresivamente.
- Nunca romper el barrel export (`index.ts` / `index.js`) de ninguna carpeta.
- Nunca importar entre `apps/` directamente — solo via `packages/`.
- La capa `domain/` del backend no importa nada externo (cero dependencias de npm ni de otras capas).
- Cada capa solo importa de la capa inmediatamente inferior:
  `presentation → application → domain ← infrastructure`
- Antes de crear un archivo nuevo, verificar que no existe ya.
- Antes de modificar un archivo, leerlo completo.
- Commits en Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`.

---

## 3. Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Mobile | React Native, Expo 57, JavaScript (migrando a TS), StyleSheet (NativeWind pendiente) |
| Backend | Node.js, Express, TypeScript, Supabase (auth/DB/storage/realtime) |
| Pagos | RevenueCat (webhook con verificación de firma obligatoria) |
| Push | Expo Push Notifications |
| Estado global | Zustand + React Query (pendiente de instalar en mobile) |
| Monorepo | Turborepo + pnpm workspaces |

---

## 4. APIs externas

Contratos en `packages/types/src/contracts/`:

- **`ClientApiContract.ts`** — pendiente (datos del cliente: usuarios, planes, historial).
- **`AiApiContract.ts`** — **cerrado y en uso**. Cuatro métodos (`generateQuestions`,
  `analyzePhoto`, `generateSurgicalTest`, `generateHint`) cubren toda la IA de los
  Bloques 6 y 7. Implementado en `apps/backend/src/infrastructure/clients/AiApiClient.ts`
  contra OpenAI directo (gpt-4o-mini + gpt-4o para visión).

Flujo de integración: **mobile → nuestro backend → OpenAI**. La API key de IA
nunca va al móvil; vive en `apps/backend/.env` (`AI_API_KEY`).

### Tutor IA (Bloque 8) — endpoints propios

El Aula Virtual tiene su propio conjunto de rutas bajo `/tutor/`. La entidad central
es `TutorConversation`; el chat envía mensajes a OpenAI real (`gpt-4o-mini`). Las
flashcards usan stubs por `topicId` con marcador `TODO(ia-bloque8)`. El podcast y
los resúmenes leen de tablas Supabase pobladas con seed.

Tipos en `packages/types/src/tutor.ts`. Cliente mobile en `apps/mobile/src/api/tutor.js`.
Colección de tests completa en `Bloque8_Tutor_Tests.postman_collection.json`.

Patrón de respuesta del API client mobile: devuelve `{ data, error }` — **nunca**
`{ success, data }`. Usar `!res?.error && res?.data` para comprobar éxito.

### Factoría de Apuntes (Bloque 9) — endpoints propios

Sube fotos/PDFs del temario del usuario, corre un pipeline de IA en background
(OCR → detectar temas → generar preguntas) y genera tests personalizados a partir
del apunte. Rutas bajo `/notes/`.

Tipos en `packages/types/src/notes.ts` (`Note`, `NoteDetail`, `NoteAnalysisStatus`,
`NoteAnalysisErrorCode`). SQL de creación en `apps/backend/supabase/bloque9_notes.sql`
(4 tablas: `notes`, `note_pages`, `note_tags`, `note_questions`, todas con RLS por
propietario). Cliente mobile en `apps/mobile/src/api/notes.js`. Colección de tests
en `Bloque9_Notes_Tests.postman_collection.json` (10 requests con asserts).

**IA — estado real**: los 3 métodos nuevos (`analyzeNoteDocument`,
`generateTagsFromNote`, `generateQuestionsFromNote`) están definidos en el
`AiApiContract` y en `AiApiClient.ts`. Como el equipo IA aún no ha entregado los
prompts del `packages/ai/BRIEF_IA_BLOQUE9.md`, `AiApiClient` delega esos tres
métodos en `AiApiClientStub` — el pipeline es ejecutable de punta a punta con datos
mock realistas. El día que llegue la implementación real basta con reemplazar los
tres métodos delegados por llamadas a OpenAI/Motor.

### Monitor BOE (Bloque 10) — endpoints propios

Detecta y notifica cambios legislativos en el BOE que afectan al temario del
usuario. Rutas bajo `/boe/` y un endpoint adicional `/training/topics`.

Tipos en `packages/types/src/boe.ts` (`BoeChange`, `BoeChangeDetail`,
`BoeComparisonResponse` con `blocks: BoeComparisonBlock[]`, `BoeMiniTestQuestionDto`,
`TrainingTopic`). SQL en `apps/backend/supabase/bloque10_boe.sql` (6 tablas con RLS).
Cliente mobile en `apps/mobile/src/api/boe.js`. Colección de tests en
`Bloque10_BOE_Tests.postman_collection.json` (14 requests, 61 assertions).

**Diff visual (pantalla 10.3 Comparativa)**: el backend pre-calcula el diff
word-by-word con el paquete npm `diff` en `application/boe/boeDiff.ts` y devuelve
`blocks: [{ type: 'antes', segments: [...] }, { type: 'despues', segments: [...] }]`.
Cada segmento tiene `type: 'normal' | 'deleted' | 'added'`. El mobile renderiza
directamente los segmentos — no hay diff en cliente.

**IA mini-test**: `AiApiContract.generateBoeMiniTest` definido. `AiApiClient` delega
en `AiApiClientStub` hasta que el equipo IA entregue el prompt del
`packages/ai/BRIEF_IA_BLOQUE10.md`. Las preguntas tienen **exactamente 3 opciones**
(no 4 como el Generador Infinito). Marcador `TODO(ia-bloque10)`.

**`TrainingTopic.topicId`**: identificador semántico (`'constitucion'`, `'ley-39'`,
etc.) distinto del `id` UUID. El mobile y el backend de generación de preguntas
SIEMPRE usan `topicId`, nunca el UUID, para las llamadas a la IA.

**Motor BOE externo** (`https://ingesta-demo-uadftnwmda-ue.a.run.app`): servicio
desplegado para detectar cambios en el BOE oficial. Integrado en:
- `infrastructure/boe/MotorBoeClient.ts` — cliente HTTP con auth `X-API-Key` +
  `X-OpenAI-Key`. Implementa `MotorBoeContract` (definido en `@opox/types`).
- `application/boe/BoeUseCases.ts` → `SyncBoeChangesUseCase` — orquesta el flujo:
  `checkForChanges → pollJob → getChanges → repo.upsertChange()`.
- `POST /boe/sync` (ruta `BOE.SYNC`) — endpoint autenticado que dispara la sync.
  Cuerpo: `{ curso_id: string }` (ID del curso en el Motor).
- `SupabaseBoeRepository.upsertChange()` — idempotente, deduplica por
  `boe_identifier + día de detected_at`.
- Vars de entorno opcionales: `MOTOR_BOE_BASE_URL`, `MOTOR_BOE_API_KEY`,
  `MOTOR_BOE_OPENAI_KEY`. Sin `MOTOR_BOE_BASE_URL`, el cliente no se instancia.

**Generador Infinito (pantalla 6.2) — `GeneratorConfigScreen.js`**:
- TTL de 15 s (aviso) / 60 s (cancelación con tarjeta de error + Reintentar).
- Selector de tema con **multi-selección**: opción "Todos los temas" (`topicId='all'`)
  más checkboxes individuales acumulables. Múltiple selección → IDs separados por
  coma en `topicId`. Sin cambio en `GenerateQuestionsParams`.

### Configuración (Bloque 12) — endpoints propios

Preferencias de tono IA + accesibilidad, estadísticas pro calculadas en tiempo real
y feedback de usuario. Rutas bajo `/config/`.

Tipos en `packages/types/src/config.ts` (`UserPreferences`, `UpdatePreferencesInput`,
`ProStats`, `ProStatsTopicBreakdown`, `ProStatsExportResult`). SQL en
`apps/backend/supabase/bloque12_config.sql` (2 tablas: `user_preferences` con UNIQUE
por usuario, `user_feedback` con CHECK de tipo y longitud, ambas con RLS).
Cliente mobile en `apps/mobile/src/api/settings.js` exportado como `settingsApi`.
Colección de tests en `Bloque12_Config_Tests.postman_collection.json` (10 requests, 31 assertions).

**`GET /config/preferences`**: devuelve las preferencias del usuario; si no existen
las crea con defaults (`equilibrado`, `detailLevel:1`, `theme:auto`, `fontScale:1.0`).

**`PATCH /config/preferences`**: upsert parcial — solo enviar los campos a cambiar.
Valida `personality` ∈ `{cercano,equilibrado,exigente}`, `theme` ∈ `{auto,light,dark}`,
`detailLevel` ∈ `{0,1,2}`.

**`GET /config/pro-stats`**: calcula en tiempo real desde `training_attempt_responses`
(agregación por `topic_id`) + streak desde `user_gamification`. Devuelve
`accuracyPct`, `passedProbabilityPct` (heurística: accuracy×0.85 + streak×0.5),
`topicsStrong` (≥80%), `topicsWeak` (<50%), `topicBreakdown[]` con accuracy por tema.

**`POST /config/pro-stats/export`**: stub — devuelve 202 con `downloadUrl:null` y mensaje
de notificación pendiente. `TODO(bloque-12)`: implementar PDF con pdfkit/puppeteer.

**`POST /config/feedback`**: inserta en `user_feedback`. Tipo: `suggestion|bug|other`.
Mensaje: 1–500 caracteres (validado con Zod y con CHECK en BD).

**Nota sobre naming**: el cliente mobile se llama `settingsApi` (en `settings.js`)
porque `config.js` ya está tomado por la utilidad de URL base del cliente HTTP.

### Notificaciones Push (Bloque 13) — endpoints propios

Infraestructura completa de push notifications en 3 fases. Rutas bajo `/push/`.

Tipos en `packages/types/src/notifications.ts` (`RegisterPushTokenInput`,
`RegisterPushTokenResponse`, `PushNotificationData` con tipos `boe_alert`,
`note_ready`, `streak_warning`, `daily_reminder`). SQL en
`apps/backend/supabase/bloque13_notifications.sql` (tabla `user_push_tokens`
con UNIQUE por `user_id+device_id`, RLS owner-all). Cliente mobile en
`apps/mobile/src/api/push.js` exportado como `pushApi`.

**`POST /push/token`**: registra o actualiza el token Expo del dispositivo.
Valida formato `ExponentPushToken[...]`. Upsert idempotente por `(user_id, device_id)`.

**Triggers de notificación push** (backend):
- `SendBoeAlertUseCase` — broadcast a todos los tokens cuando `SyncBoeChangesUseCase` detecta cambios (> 0 registros nuevos).
- `SendNoteReadyUseCase` — push dirigido al owner del apunte cuando el pipeline OCR→tags→preguntas termina (`UploadNoteUseCase.onNoteReady`).
- `SendStreakWarningUseCase` — broadcast diario a las 01:00 UTC (20:00h Colombia, sin DST), disparado por `NotificationScheduler` con cron `0 1 * * *`.
- `SendDailyGoalCompletedUseCase` — push al usuario cuando `ToggleTaskUseCase` detecta que ha cruzado el umbral `plan.testsPerDay`.

**Mobile — flujo de registro**:
1. `App.js` — exporta `registerForPushNotifications()` que usa `require('expo-notifications')` lazy (no `import` top-level, para evitar crash en Expo Go SDK 53+). Guard `IS_EXPO_GO = Constants.appOwnership === 'expo'`.
2. `SesionIniciadaScreen.js` — llama `registerForPushNotifications()` fire-and-forget tras login exitoso, antes de navegar al Dashboard.

**Mobile — visualización**:
- `InAppNotificationBanner.js` — banner animado, auto-dismiss 4 s, iconos por tipo.
- Montado en `App.js` con `useState`. `PushNotificationHandler` escucha foreground + tap. En tap navega a `data.screen`.
- `BoeRealtimeWatcher` en `App.js` — Supabase Realtime `postgres_changes` INSERT en `boe_changes`. Muestra el banner in-app sin latencia cuando el backend inserta un cambio BOE con la app abierta.

**Mobile — Realtime chat de clanes**:
- `ClanChatScreen.js` migrado de `setInterval(poll, 4000)` a canal Realtime `clan_messages` filtrado por `clan_id`.
- Fallback automático a polling si `supabase === null` (vars EXPO_PUBLIC_SUPABASE_* no configuradas).
- Cliente en `apps/mobile/src/lib/supabase.js` (requiere `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env`).

**Limitación Expo Go**: push remotos no funcionan en Expo Go SDK 53+. Requiere EAS development build (`eas build --profile development`) para prueba end-to-end de tokens reales.

### Motor de IA del cliente (sin desplegar)

El equipo IA entregó un microservicio RAG separado
(`MotorIA_Ingesta_Tests.postman_collection.json`) que ingesta PDFs de temario y
genera tests con evidencia verbatim + página. **No está hosteado todavía**;
`MotorAiClient.ts` es esqueleto listo para el día que publiquen URL. Guía completa
en `packages/ai/MOTOR_INTEGRATION.md`.

---

## 5. Comandos útiles

```bash
pnpm dev                        # levanta todo en paralelo
pnpm dev --filter=backend       # solo backend
pnpm dev --filter=mobile        # solo mobile
pnpm build                      # build completo
pnpm lint                       # lint completo
```

---

## 6. Referencia de bloques (wireframe oficial: opox.netlify.app)

| Bloque | Nombre | Estado |
|---|---|---|
| 1 | Acceso (Auth/Onboarding) | Frontend cerrado |
| 2 | Dashboard | Frontend + backend completo |
| 3 | Salud | Frontend cerrado |
| 4 | Planificación | Frontend + backend completo |
| 5 | Motivación | Frontend + backend completo |
| 6 | Entrenamiento | Frontend + backend + IA completo (los 4 flujos cableados a OpenAI real) |
| 7 | Sesión de test activa | Frontend + backend + IA completo (Pista IA vía OpenAI) |
| 8 | Aula Virtual / Tutor IA | Frontend + backend completo (Chat OpenAI real, Flashcards stub IA, Podcast, Resúmenes) |
| 9 | Factoría de Apuntes | Frontend + backend completo (upload, pipeline OCR→tags→preguntas con AiApiClientStub, generación de tests, 10/10 smoke test verde). IA real esperando entrega del `BRIEF_IA_BLOQUE9.md` |
| 10 | Monitor BOE | Frontend + backend completo (feed, detalle, comparativa con diff word-by-word, mini-test con AiApiClientStub, 14 requests / 61 assertions verde). IA real (`generateBoeMiniTest`) esperando entrega del prompt del `BRIEF_IA_BLOQUE10.md` |
| 11 | Tienda OPOX | Frontend + backend completo (65/65 smoke test verde) |
| 12 | Configuración | Frontend + backend completo (11 pantallas + 2 modales, 5 endpoints, 10 requests / 31 assertions verde) |
| 13 | Notificaciones Push | Backend + mobile completo (3 fases: infraestructura base, hábito/retención, Supabase Realtime). Prueba end-to-end pendiente de EAS development build |

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
