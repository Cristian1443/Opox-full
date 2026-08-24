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

### Onboarding / Acceso (Bloque 0 y 1) — sin backend propio

El flujo de entrada usa AsyncStorage para gestionar el estado de onboarding. No hay
endpoints nuevos — reutiliza `PATCH /planning/plan` para inicializar la intensidad.

**Flags de AsyncStorage** (todos exportados desde su pantalla de origen):
- `ONBOARDING_COMPLETED_KEY = 'opox.onboardingCompleted'` — exportado desde `SplashScreen.js`.
  Escrito en `SesionIniciadaScreen` al completar login. Mientras exista, `SplashScreen`
  manda al usuario a `Entrada` (login) en vez de al slider de bienvenida.
- `PENDING_OPOSICION_KEY` — exportado desde `OppositionSelectorScreen.js`.
  Guarda la oposición elegida para aplicarla en `SesionIniciadaScreen` via `authApi.updateProfile`.
- `PENDING_LEVEL_TEST_KEY` — exportado desde `LevelTestInProgressScreen.js`.
  Permite reanudar el test si la app se cierra a mitad.
- `LEVEL_TEST_RESULT_KEY = 'opox.levelTestResult'` — exportado desde `LevelTestInProgressScreen.js`.
  Guarda `{ score, level, intensity }` al completar el test. Leído en `SesionIniciadaScreen`
  para llamar `planningApi.updatePlan({ intensity })`. Borrado tras aplicar.

**`SplashScreen.resolveOnboardingEntryRoute()`** — árbol de decisión sin sesión:
1. `ONBOARDING_COMPLETED_KEY` existe → `'Entrada'` (login directo).
2. `PENDING_LEVEL_TEST_KEY` existe → `'LevelTestInProgress'` (reanudar test).
3. `PENDING_OPOSICION_KEY` existe → `'LevelTestProposal'`.
4. Ninguno → `'OnboardingSlider'` (usuario completamente nuevo).

**Test de nivel (`LevelTestInProgressScreen.js`)**:
- 20 preguntas únicas distribuidas en 4 temas: 8 Constitución, 8 Ley 39/2015, 2 Ley 40/2015, 2 Org. del Estado.
- `calcLevelAndIntensity(percent)`: `≥75% → Avanzado/high`, `≥50% → Intermedio/medium`, else `Básico/low`.
- `calcStrengthsAndWeaknesses(answers)`: hit rate por tema, ≥50% → fortaleza, <50% → a reforzar.
- Cronómetro real con `startTimeRef = useRef(Date.now())`.
- Navegación hacia atrás permitida dentro del test (array `answers` guarda la elección por pregunta).
- Último botón dice "Ver resultado" en vez de "Confirmar respuesta".
- Al finalizar: guarda en `LEVEL_TEST_RESULT_KEY`, borra `PENDING_LEVEL_TEST_KEY`, navega con `replace('LevelTestResult', { ...params reales })`.

**`SesionIniciadaScreen.js`** — tres operaciones en `Promise.all` tras login:
1. `applyPendingOposicion()` — aplica oposición guardada vía `authApi.updateProfile`.
2. `applyLevelTestResult()` — aplica intensidad vía `planningApi.updatePlan({ intensity })`.
3. `markOnboardingCompleted()` — escribe `ONBOARDING_COMPLETED_KEY = '1'`.

**Navegación post-test** — usar siempre `replace` (no `navigate`) para evitar vuelta atrás:
- `LevelTestProposalScreen`: "Ahora no" → `replace('Permissions')`.
- `LevelTestResultScreen`: "Crear mi plan" → `replace('Permissions')`.

---

### Planificación (Bloque 4) — endpoints propios

Rutas bajo `/planning/`. Revisado y auditado post-testing (2026-08-23).

**Zona horaria — patrón crítico**:
- `todayIso()` en backend usa UTC. Para evitar desfase horario, el mobile envía siempre
  `localDate = new Date().toLocaleDateString('sv')` (locale sueco → `YYYY-MM-DD` en la TZ del dispositivo).
- `getSummary`, `listTasks` y `getWeek` aceptan `?localDate=` opcional; si viene, lo usan en vez de `todayIso()`.

**Intensidad — `applyIntensity(base, intensity)`**:
- Helper en `application/planning/dateUtils.ts`. `low=0.75×`, `medium=1×`, `high=1.25×`. `Math.max(1, Math.round(...))`.
- Aplicado en 3 sitios: `GetPlanningSummaryUseCase` (goalCount), `ToggleTaskUseCase` (umbral de meta completada), `PlanningTodayScreen` (preview cliente).
- `PlanningEditScreen` muestra "objetivo real N tests/día" cuando la intensidad modifica el número base.

**Modal de tareas (PlanningToday)**:
- Tab "Test de práctica": carga temas con `boeApi.listTopics('justicia-tramitacion')` (NO `trainingApi.listTopics()` — sin `oposicion` devuelve 0 filas).
- `TrainingTopic` usa campo `label` (no `name`).
- Subtitle de tarea test: `JSON.stringify({ topicId, count })`. `tryParseTestParams(subtitle)` lo decodifica.
- Al pulsar "Empezar": `navigation.navigate('GeneratorConfig', { topicId, questionCount })`.

**Macro con temas reales**:
- `PlanningController.getMacro` llama `listTopics` en paralelo. `enrichMacroWithTopics()` distribuye temas por fase con pesos `[0.35, 0.30, 0.25, 0.10]`.
- `container.ts` pasa `listTopics: useCases.listTopics` al `PlanningController`.

**Alertas del hub (PlanningHome)**:
- `let _alertsShownThisSession = false` a nivel de módulo (no `useRef`) — persiste aunque el componente se desmonte y remonte al navegar.
- Solo muestra el pop-up de "examen próximo" o "días sin estudiar" una vez por sesión de app.
- "Activar recta final": llama `planningApi.updatePlan({ intensity: 'high' })` y navega a `PlanningToday`.

**Patrón de recarga en pantallas de planificación**:
- Todas usan `useFocusEffect(useCallback(load, []))` de `@react-navigation/native`, no `useEffect`.
- `DashboardScreen` carga `planningApi.getSummary()` para la tarjeta de plan (sin esto muestra 0%).

---

### Motivación y Gamificación (Bloque 5) — endpoints propios

Rutas bajo `/motivation/`. Cubre racha, rankings, clanes, retos de clan y Muro de la Gloria.

**Racha y gamificación**:
- `GET /motivation/summary` — devuelve `{ gamification, myClan }`. Es el endpoint de arranque de `MotivationHomeScreen`.
- `GET /motivation/streak` — detalle de racha con `recentActivityDates`, `nextMilestone` y `longestStreak`.
- La racha se actualiza con `registerActivity()` en tres eventos: completar tarea de planificación, completar reto de clan, **y guardar cualquier intento de test** (`SaveAttemptUseCase` llama `registerActivity({ points: 0 })`). Sin este último, "Hacer test rápido" no salvaba la racha.

**Rankings**: `GET /motivation/ranking?scope=weekly|global|oposicion|topic&topicId=xxx`.
- Scope `topic` agrega `training_attempt_responses.is_correct` por `topic_id` usando `supabaseAdmin` (bypasa RLS cross-user). Requiere `topicId`.

**Clanes**:
- `clan_challenges` tiene columna `topic_id TEXT` (nullable) añadida en `bloque5_motivacion.sql` (migration: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS topic_id text`). Correr en Supabase SQL Editor si la BD es anterior a 2026-08-21.
- `ClanChallengeDTO` expone `topicId?: string`. `CreateClanChallengeRequest` acepta `topicId?: string`.
- El insert de `createClanChallenge` en `SupabaseMotivationRepository` es **condicional**: solo incluye `topic_id` si `input.topicId != null` para no fallar en BDs que aún no corrieron la migración.
- `ClanSummaryDTO` y `ClanDetailDTO` exponen `challengeCount: number` (retos activos con `expires_at IS NULL OR expires_at > NOW()`).
- Join abierto (sin aprobación de líder) — decisión deliberada. GAP-05-05 documenta la ruta para clanes privados en Fase 2.

**Flujo de retos de clan (mobile)**:
1. `ChallengesScreen` wizard 2 pasos: Step 1 = selector de tema (`trainingApi.listTopics()`), Step 2 = nombre + steppers de preguntas (5–100 step 5) y Opopoints (10–500 step 10).
2. "Iniciar →" navega a `GeneratorConfig` con `{ challengeId, clanId, topicId, questionCount }`.
3. `GeneratorConfigScreen` acepta `route.params` del reto, pre-selecciona tema y cuenta, pasa `challengeId`/`clanId` a `TrainingSession`.
4. `QuestionActiveScreen` propaga `challengeId`/`clanId` a `TrainingResult`.
5. `TrainingResultScreen` llama `motivationApi.completeChallenge(clanId, challengeId)` si `percentage >= 60`.

**Discoverabilidad de clanes (mobile)**:
- `MotivationHomeScreen` muestra una tarjeta CTA "Únete a un clan" cuando `myClan === null`, navegando a `ClansList`.
- Tras `joinClan` exitoso: si `clan.challengeCount > 0`, navega directo a `Challenges`.
- Label EXPLORAR cambia de "Mis clanes" a "Ver clanes" cuando sin clan.

**`RachaPeligroModal`** — 3 botones:
- Primario: "Hacer test rápido" → `GeneratorConfig`.
- Secundario: "Ver mis tareas" → `PlanningToday`.
- Terciario: "En otro momento" → dismiss.
`BaseModal` extendido con `tertiaryLabel`/`onTertiaryPress`.

**Pips de racha** (`MotivationHomeScreen`): derivados de `currentStreak` sin llamada extra. Los últimos N pips (hasta 14) en verde desde la derecha; el resto en gris (`#DDE1EA`).

**`useFocusEffect`** en `MotivationHomeScreen`: los datos se recargan cada vez que la pantalla recibe foco (volver de Challenges, Rankings, etc.).

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

**Motor BOE externo** (`https://ingesta-demo.onrender.com`): servicio
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

### Tienda OPOX (Bloque 11) — endpoints propios

Canje de Opopoints por recompensas reales y virtuales + marketplace de tests
de la comunidad. Rutas bajo `/store/`.

Tipos en `packages/types/src/store.ts` (`StoreProductDTO`, `StoreDiscountDTO`,
`WalletItemDTO`, `PurchaseResultDTO`, `CommunityTestDTO`, `CommunityTestDetailDTO`,
`CommunityTestActionResultDTO`, `StoreBalanceDTO`).
SQL en `apps/backend/supabase/bloque11_tienda.sql` (6 tablas con RLS).
Cliente mobile en `apps/mobile/src/api/store.js`.
Colección de tests en `Bloque11_Tienda_Tests.postman_collection.json`
(20 requests, 65 assertions).

**Saldo Opopoints**: calculado como suma neta del ledger `user_opopoints_ledger`
(filas `type='earn'` suman, `type='spend'` restan). No hay columna de saldo
precalculada — siempre se recalcula en `getBalance()`.

**Canje de producto real** (`POST /store/products/:id/redeem`):
1. Verifica stock > 0 e `isAvailable`.
2. Verifica saldo >= coste (422 si no alcanza).
3. Inserta fila `spend` en el ledger.
4. Decrementa stock.
5. Genera código con `generateCode(partner)` (prefijo 3 letras + 6 chars random).
6. Crea item en `user_wallet` con `status='active'` y fecha de caducidad.

**Marketplace**: `community_tests` con campo `is_free` generado (`price = 0`).
Compra idempotente por unique constraint `(user_id, test_id)` en `community_test_purchases`.

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

### Salud (Bloque 3) — integración con plataformas de salud del SO

Toda la UI del bloque está implementada (14 pantallas). Los datos reales vienen
de HealthKit (iOS) y Health Connect (Android) a través de `HealthService.js`.

**`apps/mobile/src/services/HealthService.js`** — abstracción multiplataforma:
- `isHealthAvailable()` — false en Expo Go, false si módulos no cargados.
- `requestHealthPermissions()` — llama `HealthKit.requestAuthorization` (iOS) o
  `HealthConnect.requestPermission` (Android). Retorna boolean.
- `getHealthMetrics()` — lee HR, FC reposo, HRV, SpO₂, sueño y pasos de las últimas 24 h.
  Retorna `{ heartRate, restingHeartRate, hrv, spo2, sleepHours, steps }` o `null`.
- Carga lazy (`require()` condicional, NO import) igual que expo-notifications en App.js.

**Paquetes** (en `apps/mobile/package.json`):
- `@kingstinct/react-native-healthkit ^13.0.0` — iOS HealthKit (Expo config plugin incluido).
- `react-native-health-connect ^3.1.0` — Android Health Connect (Expo config plugin incluido).
- Ambos requieren **EAS development build** (no funcionan en Expo Go).

**`app.json` plugins**: `@kingstinct/react-native-healthkit` con `NSHealthShareUsageDescription`
y `react-native-health-connect` con permisos `android.permission.health.*`.

**Flujo pairing** (`PairingScreen.js`): monta pantalla → llama `requestHealthPermissions()`
automáticamente. Estados: `loading → complete / denied / unavailable`.
`denied`: "Ir a Ajustes" (`Linking.openSettings()`) + "Continuar igualmente".

**Datos en HomeHealth** (`HomeHealthScreen.js`): `useFocusEffect` + `getHealthMetrics()`.
Heurística de energía: `HRV×50% + sueño×30% + FC_reposo×20%`. Muestra `—` sin datos.

**Motor de fatiga** (`FatigueEngineScreen.js`): recibe `metrics` vía `route.params`.
`buildSignals(metrics)` → status `ok/warning/critical/unknown` por señal.
Nivel: `high` (≥2 críticas), `medium` (1 crítica o ≥2 warning), `low` (resto).

**Permisos de notificaciones** (`PermissionsScreen.js`):
- "¡A por más!" → `Notifications.requestPermissionsAsync()` real (lazy require).
- Si denegado: `DeniedState` con texto correcto + "Ir a Ajustes" (`Linking.openSettings()`).
- `App.js registerForPushNotifications()`: cuando `existing === 'denied'`, muestra
  `Alert` con "Ir a Configuración" → `Linking.openSettings()` en vez de retornar silencio.

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

### Motor de IA del cliente (DESPLEGADO y activo)

Microservicio RAG del equipo IA, desplegado en producción:
`https://ingesta-demo.onrender.com` (migrado desde GCP Cloud Run el 2026-08-18).

Ingesta PDFs de temario y genera tests con evidencia verbatim + página exacta.
Autentica con `X-API-Key` (no Bearer). Curso activo: `1357e871b542425b` — es el
id del Cloud Run viejo que sigue resolviendo en Render (datos migrados), pero
está pendiente re-ingestar el temario oficial y actualizar `MOTOR_DEFAULT_CURSO_ID`.

**Integración activa (`CompositeAiClient.ts`):**
- `generateQuestions` y `generateSurgicalTest` → Motor RAG (async job, ~50-70 s).
- `analyzePhoto`, `generateHint`, Bloques 9/10 → OpenAI directo (sin cambios).
- Para desactivar: vaciar `MOTOR_API_BASE_URL` en `.env`.

**[INC-04] `correcta_idx` ausente en job result** — el Motor no expone el índice
correcto en el job result. Workaround activo: `MotorAiClient` carga el banco de
preguntas del curso (`GET /v1/courses/{id}/questions`) y cachea `correcta_idx` 30 min.
Solución definitiva (Opción A del equipo IA): validar respuesta a respuesta vía
`POST /v1/tests/{sesion_id}/answer` — pendiente de confirmación del equipo IA.
Ver `packages/ai/MOTOR_INTEGRATION.md` para el detalle completo.

**Smoke test E2E:** `scripts/smoke_bloques_0_6_7.js` — 30/30 PASS (bloques 0, 6 y 7).

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
| 1 | Acceso (Auth/Onboarding) | Frontend cerrado + Bloque 0 revisado: onboarding no repetido, test real de 20 preguntas, inicialización de intensidad del plan |
| 2 | Dashboard | Frontend + backend completo |
| 3 | Salud | Frontend cerrado |
| 4 | Planificación | Frontend + backend completo (revisado y auditado post-testing: 10 bugs/gaps cerrados) |
| 5 | Motivación | Frontend + backend completo |
| 6 | Entrenamiento | Frontend + backend + IA completo (los 4 flujos cableados a OpenAI real) |
| 7 | Sesión de test activa | Frontend + backend + IA completo (Pista IA vía OpenAI) |
| 8 | Aula Virtual / Tutor IA | Frontend + backend completo (Chat OpenAI real, Flashcards stub IA, Podcast, Resúmenes) |
| 9 | Factoría de Apuntes | Frontend + backend completo (upload, pipeline OCR→tags→preguntas con AiApiClientStub, generación de tests, 10/10 smoke test verde). IA real esperando entrega del `BRIEF_IA_BLOQUE9.md` |
| 10 | Monitor BOE | Frontend + backend completo (feed, detalle, comparativa con diff word-by-word, mini-test con AiApiClientStub, 14 requests / 61 assertions verde). IA real (`generateBoeMiniTest`) esperando entrega del prompt del `BRIEF_IA_BLOQUE10.md` |
| 11 | Tienda OPOX | Frontend + backend completo (recompensas reales, descuentos virtuales, cartera de códigos, marketplace comunidad, 20 requests / 65 assertions verde). Saldo Opopoints gestionado por ledger earn/spend en Supabase. |
| 12 | Configuración | Frontend + backend completo (11 pantallas + 2 modales, 5 endpoints, 10 requests / 31 assertions verde) |
| 13 | Notificaciones Push | Backend + mobile completo (3 fases: infraestructura base, hábito/retención, Supabase Realtime). Prueba end-to-end pendiente de EAS development build |

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
