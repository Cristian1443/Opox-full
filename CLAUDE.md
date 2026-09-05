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
- `calcStrengthsAndWeaknesses(answers, qs)`: hit rate por tema, ≥50% → fortaleza, <50% → a reforzar.
  Acepta `qs` (array de preguntas activo) para funcionar con preguntas dinámicas del Motor.
- Cronómetro real con `startTimeRef = useRef(Date.now())`.
- Navegación hacia atrás permitida dentro del test (array `answers` guarda la elección por pregunta).
- Último botón dice "Ver resultado" en vez de "Confirmar respuesta".
- Al finalizar: guarda en `LEVEL_TEST_RESULT_KEY`, borra `PENDING_LEVEL_TEST_KEY`, navega con `replace('LevelTestResult', { ...params reales })`.
- **Motor IA (2026-09-02)**: al montar, intenta `trainingApi.getLevelTestQuestions(oposicion)` vía
  `GET /training/level-test` (ruta pública, sin auth). Si el Motor responde con ≥10 preguntas, las
  usa en lugar de `QUESTIONS` local. Banner de carga mientras se realiza el fetch inicial.
  Si falla (error o vacío), continúa con las preguntas estáticas sin interrupción.

**`GET /training/level-test` — ruta pública**:
- Sin `authMiddleware` — corre antes del login en onboarding.
- `TrainingController.getLevelTest` llama `MotorOnboardingClient.getLevelTestQuestions(oposicion, 20)`
  con timeout de **5 s**. Si el Motor no responde, devuelve `STATIC_LEVEL_TEST` (20 preguntas estáticas).
- Formato Motor: `{ preguntas: [{ id, tema, tema_label, enunciado, opciones: [{id, texto}], correcta }] }`
  → adaptado a `{ id, topic, topicLabel, question, options: [{id, text}], correct }`.
- `API_ROUTES.TRAINING.LEVEL_TEST = '/training/level-test'` en `packages/constants`.

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
- La racha se actualiza con `registerActivity()` en cuatro eventos: **cada tarea de planificación completada** (`points: 0`, y `DAILY_GOAL_POINTS` solo la vez que se cruza el objetivo diario), completar reto de clan, guardar cualquier intento de test (`SaveAttemptUseCase` llama `registerActivity({ points: 0 })`) y el endpoint público `POST /dashboard/register-activity`.
- **Fecha de la actividad** — `registerActivity` acepta `localDate?: string` (YYYY-MM-DD). Si viene, se usa; si no, cae a UTC. El mobile lo inyecta automáticamente en `trainingApi.saveAttempt`, `planningApi.toggleTask`, `motivationApi.completeChallenge` y `dashboardApi.registerActivity` con `new Date().toLocaleDateString('sv')` — evita que una actividad de las 20:00h Colombia se registre con la fecha UTC del día siguiente y desfase la racha.

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
es `TutorConversation`; el chat envía mensajes al Motor IA real cuando `isMotorConfigured`,
con fallback a OpenAI directo (`gpt-4o-mini`). Las flashcards y resúmenes también
usan el Motor cuando está disponible, con stubs como fallback.

Tipos en `packages/types/src/tutor.ts`. Cliente mobile en `apps/mobile/src/api/tutor.js`.
Colección de tests completa en `Bloque8_Tutor_Tests.postman_collection.json`.

Patrón de respuesta del API client mobile: devuelve `{ data, error }` — **nunca**
`{ success, data }`. Usar `!res?.error && res?.data` para comprobar éxito.

**Integración Motor IA (2026-09-02)**:
- `ITutorAiClient` — interfaz de dominio en `domain/repositories/` con métodos `chat()`,
  `generateFlashcards()`, `getSummary()`. Evita que los use cases importen infraestructura.
- `MotorTutorClient` — implementa `ITutorAiClient` contra endpoints `/v1/classroom/*` del
  Motor (timeout 15 s, auth `X-API-Key`). Instanciado en `container.ts` si `isMotorConfigured`.
- `SendMessageUseCase` — pasa historial (últimos 10 mensajes) y `toneProfile` al Motor.
  Fallback al stub de personalidad si Motor falla.
- `GenerateDeckUseCase` — 10 tarjetas vía Motor; fallback al stub por `topicId`.
- `GetSummaryUseCase` — resumen temporal (no persistido en Supabase) vía Motor;
  fallback a `SummaryNotFoundError`.
- `TutorChatScreen` — lee `tonePrefs` de `AsyncStorage('opox.ai.tone')` y los envía al
  backend como `{ content, tonePrefs }`. El controller convierte a `ToneProfile` con
  `buildToneProfile()` antes de pasarlos al Motor.
- `tutorApi.sendMessage(conversationId, content, tonePrefs)` — tercer param es el objeto
  OPOX completo (`personality`, `detailLevel`, `hintStyle`, `reinforcementLevel`).

**Rediseño Figma (2026-08-26)**: 6 pantallas + 1 modal completamente reestilizados
con tokens exactos de Figma (`Poppins-*`, border-radius, paleta morada/verde):
`TutorHomeScreen`, `TutorChatScreen`, `TutorPodcastScreen`, `TutorSummariesScreen`,
`TutorFlashcardsScreen`, `TutorFlashcardsLoadingScreen`, `FlashcardsSuccessModal`.

**`TutorPodcastScreen` — `EpisodePicker`**: cuando no hay `episodeId` en los params,
muestra un selector que carga `tutorApi.listEpisodes(oposicion)`. Al seleccionar un
episodio navega al player. El timer simulado avanza con la velocidad elegida
(`0.5x / 1x / 1.5x / 2x`) y guarda progreso via `tutorApi.saveProgress` cada 10 s.

**`TutorSummariesScreen` — `TopicPicker`**: cuando no hay `topicId` en los params,
muestra un selector que carga `tutorApi.listSummaries(oposicion)`.

**`TutorFlashcardsScreen` — empty state**: si `paramCards` llega como array vacío
(`paramCards.length === 0`), muestra pantalla de error en lugar de intentar renderizar
una tarjeta undefined. La función `handleReviewFailed` fue eliminada (bug: `cards`
no tiene setter).

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

**Lectura de archivos en Android (SDK 57)**: `readAsStringAsync` de expo-file-system
**no** puede leer URIs `content://` del SAF de Android. Usar siempre
`new FSFile(uri).arrayBuffer()` (import `{ File as FSFile } from 'expo-file-system'`),
que delega en ContentResolver nativo. Para fotos de cámara/galería, usar
`base64: true` en `ImagePicker` — evita pasar por FileSystem por completo.

**Nombres de archivo Android**: `ImagePicker` devuelve IDs numéricos para galería
y UUIDs para cámara. `NotesUploadScreen.startAnalysis` detecta ambos patrones y
genera `Apunte DD mon AAAA.ext` cuando el nombre no tiene extensión real.

**Formato de preguntas**: el backend devuelve `{options: string[], correctIndex}`.
El runner espera `{options: [{id,text,correct}]}`. Aplicar siempre
`adaptGeneratedQuestions` (de `utils/questionAdapter.js`) antes de navegar a
`TrainingSession` desde `NotesTestConfigScreen`.

**Conteo de páginas real**: el backend crea el apunte con `pages = files.length`
(1 para un PDF). `runAnalysisPipeline` actualiza `notes.pages` a `ocr.pages.length`
tras el OCR. Con la IA real, el detalle mostrará las páginas reales del documento.

**Rediseño Figma (2026-08-26)**: 4 pantallas + 4 modales + 1 modal genérico reestilizados:
`NotesHomeScreen`, `NotesUploadScreen`, `NoteDetailScreen`, `NotesTestConfigScreen`.
Modales: `NotesDeleteConfirmModal`, `NotesDigitizedModal`, `NotesFormatErrorModal`,
`NotesOcrErrorModal`, `AlertCardModal`. Tokens Figma exactos (fondos outline con
`rgba(65,41,80,0.3)`, tipografía Poppins, border-radius 10.7/14.2).

**`NotesTestConfigScreen` — controles adicionales de Figma**: slider de dificultad
(Fácil/Medio/Difícil, índice 0/1/2) → pasa `difficulty: ['low','medium','high'][dificultadIdx]`
al API. Toggle "Solo temas etiquetados" → pasa `topics: onlyTaggedTopics ? note.tags : []`.
Spinner en el botón mientras `starting === true` (`ActivityIndicator` reemplaza el texto).

**`AccentSlider.js`** (componente compartido): thumb rediseñado — fondo `colors.textDark`
con punto interior más pequeño, antes era blanco con borde de color del acento.
Afecta a todos los sliders de la app (Bloque 6 Generador, Bloque 9 test config).

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
  Cuerpo: `{ curso_id: string }` (ID del curso en el Motor). Validado con Zod.
- `SupabaseBoeRepository.upsertChange()` — idempotente, deduplica por
  `boe_identifier + día de detected_at`. Persiste campo `resumen` del Motor.
- `SupabaseBoeRepository.addRegulation()` — **UPSERT** por `(user_id, boe_identifier)`;
  idempotente si el usuario ya sigue la norma.
- `SyncBoeChangesUseCase` — tras upsert, si `preguntas_afectadas.length > 0`,
  llama `motor.regenerateQuestions(changeId, cursoId)` fire-and-forget.
- Vars de entorno: `MOTOR_BOE_BASE_URL`, `MOTOR_BOE_API_KEY`, `MOTOR_BOE_OPENAI_KEY`
  (opcional, cae a `AI_API_KEY`), **`MOTOR_BOE_CURSO_ID`** (obligatorio cuando el
  Motor está activo — ID del curso en el Motor para la oposición activa).
  Sin `MOTOR_BOE_BASE_URL`, el cliente no se instancia.

**`SearchBoeRegulationsUseCase` — búsqueda con fallback**:
- Llama `motor.searchCatalog(q)` con timeout de 5 s (configurado por request).
- Si supera el timeout o devuelve vacío/no-sincronizado, hace fallback automático
  a `motor.listRegulations(MOTOR_BOE_CURSO_ID)` y filtra localmente por el query.
- Así el modal "Añadir norma" muestra siempre las normas monitorizadas del curso
  sin requerir `POST /boe/catalog/sync` previo.

**Modal "Añadir norma" (mobile `BoeHomeScreen`)**:
- Al abrir: carga en paralelo `listRegulations()` (normas ya seguidas) y
  `searchCatalog('')` (sugerencias). Sin escribir nada el usuario ve las 8 normas.
- Normas ya seguidas → badge gris "Siguiendo" (no botón). Guard en `handleFollow`.
- Tras seguir: actualiza `followedIds` y `watchedCount` localmente sin cerrar el modal.

**Cross-bloque BOE**:
- `BoeDetailScreen`: carga `affectedQuestionsCount` desde API; si > 0 muestra CTA
  "Practicar" → `GeneratorConfig`. Migrado de `useEffect` a `useFocusEffect`.
- `DashboardScreen`: alerta de leyes obsoletas usa `boeApi.getFeed().totalUnread`
  real (era mock = 3). Flag de módulo `_boeAlertShownThisSession` para no repetir.
- `TrainingResultScreen`: tras guardar intento, consulta feed BOE; si hay no leídos
  muestra tarjeta hint "Revisar →" hacia `BoeHome`.
- `App.js BoeRealtimeWatcher`: banner Realtime navega a `BoeDetail` con `itemId`
  específico cuando el payload incluye `id`; si no, cae a `BoeHome`.

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

**Puente earn → store ledger** (revisión 2026-08-27): `registerActivity()` en
`SupabaseDashboardRepository` inserta fila `type='earn'` en `user_opopoints_ledger`
cuando `input.points > 0`. Sin este puente el balance siempre era 0 porque los
eventos `daily_goal` solo escribían en `opopoints_ledger` (tabla de auditoría
separada). El error es no-fatal (solo log); no afecta la racha ni la gamificación.

**Canje de producto real** (`POST /store/products/:id/redeem`):
1. Verifica stock > 0 e `isAvailable`.
2. Verifica saldo >= coste (422 si no alcanza).
3. Inserta fila `spend` en el ledger.
4. Decrementa stock.
5. Genera código con `generateCode(partner)` (prefijo 3 letras + 6 chars random).
6. Crea item en `user_wallet` con `status='active'` y fecha de caducidad.

**Canje de descuento** (`POST /store/discounts/:id/redeem`): flujo sin stock ni wallet.
`RedeemDiscountUseCase` verifica balance, inserta `spend` en ledger y devuelve el
`code` precargado en la fila `store_discounts`. No crea fila en `user_wallet`.
`StoreDiscount` y `StoreDiscountDTO` tienen campos `cost: number; code: string;`.
**Pendiente SQL** (correr en Supabase si la tabla fue creada antes de la revisión):
```sql
ALTER TABLE store_discounts
  ADD COLUMN IF NOT EXISTS cost integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS code  text    NOT NULL DEFAULT '';
```

**`StoreConfirmRedeemScreen`** — canje real por tipo:
Recibe `productId` + `redeemType: 'product' | 'discount' | 'community_test'` desde
`route.params`. `handleConfirm` llama `redeemDiscount`, `obtainCommunityTest` o
`redeemProduct` según el tipo. En éxito muestra `RedeemSuccessModal` con el
`newBalance` real del response y navega a `StoreWallet` (o `StoreMarketplace` si es
`community_test`).

**Motor earn por tests** (revisión 2026-08-28): `SaveAttemptUseCase` calcula Opopoints
automáticamente al guardar cualquier intento (Bloques 6, 7, 9). Fórmula:
`correctas × multiplicador(≥80%→1.5, ≥60%→1.2, resto→1.0)`, cap diario 100 O/día
(filtrado por `reason LIKE 'test_%'` en `getTodayTestEarnings`). `CompleteBoeMiniTestUseCase`
(Bloque 10) gana hasta 5 O por mini-test BOE proporcional a aciertos.
Ambos pasan por `dashboardRepo.registerActivity` → puente earn → ledger tienda.
Sin nuevas tablas ni rutas. `getTodayTestEarnings(userId)` añadido a `IStoreRepository`.

**Pantallas conectadas al backend** (revisión 2026-08-27 — todas eliminan mocks):
- `StoreHomeScreen`: `useFocusEffect` carga balance + discounts + products en paralelo.
- `StoreProductDetailScreen`: enriquece el producto con `storeApi.getProduct(id)`.
- `StoreDiscountsScreen`: carga `storeApi.listDiscounts()`, pasa `redeemType:'discount'`.
- `StoreWalletScreen`: carga `storeApi.getWallet()` (elimina `WALLET_DATA`).
- `StoreRealRewardsScreen`: carga balance + `storeApi.listProducts()`.
- `StoreRealRedeemConfirmScreen`: canje real con `storeApi.redeemProduct(reward.id)`.
- `StoreMarketplaceScreen`: carga `storeApi.listCommunityTests()`, free → `obtainCommunityTest` directo.
- `StoreHowToEarnScreen`: textos alineados con `DAILY_GOAL_POINTS = 40`.

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
Valida `personality` ∈ `{cercano,formal,directo,motivador,equilibrado,exigente}`, `theme` ∈ `{auto,light,dark}`,
`detailLevel` ∈ `{0,1,2}`, `hintStyle` ∈ `{socraticas,directas}`, `reinforcementLevel` ∈ `{alto,normal,ninguno}`.

**Tono IA — campos alineados con Motor (revisión 2026-09-02)**:
- `personality`: `'cercano'|'formal'|'directo'|'motivador'` (Motor: Cercano/Formal/Directo/Motivador).
  Legacy `'equilibrado'→'cercano'`, `'exigente'→'formal'` normalizados en mapper Supabase y en SQL.
- `detailLevel`: `0|1|2` (Motor: Breve/Medio/Profundo). Labels del slider actualizados en `ConfigToneScreen`.
- `hintStyle`: `'socraticas'|'directas'` (Motor: Socráticas/Directas). Reemplaza `directHints: boolean`.
- `reinforcementLevel`: `'alto'|'normal'|'ninguno'` (Motor: Alto/Normal/Ninguno). Reemplaza `motivational: boolean`.
- `buildToneProfile(prefs: UserPreferences): ToneProfile` en `ConfigUseCases.ts` — transforma al formato del Motor.
- **Migración Supabase requerida antes de desplegar**: ejecutar el bloque `-- Migración Motor IA (2026-09-02)` al final de `bloque12_config.sql`.

**Mapeo mobile → backend para accesibilidad** (revisión 2026-08-30):
- Mobile `'claro'/'oscuro'` → API `'light'/'dark'` (CHECK constraint lo exige).
- Mobile `'pequeno'/'medio'/'grande'` → API `fontScale: 0.85/1.0/1.15`.
- Mobile `reduceAnimations` → API `reduceMotion`.
- `highContrast` no tiene columna en backend → solo persiste en `AsyncStorage('opox.accessibility')`.
Los mapeos están en `ConfigAccessibilityScreen.js` (`THEME_TO_API`, `FONT_TO_SCALE`, etc.).

**`GET /config/pro-stats`**: calcula en tiempo real desde `training_attempt_responses`
(agregación por `topic_id`) + streak desde `user_gamification`. Devuelve
`accuracyPct`, `passedProbabilityPct` (heurística: accuracy×0.85 + streak×0.5),
`topicsStrong` (≥80%), `topicsWeak` (<50%), `topicBreakdown[]` con accuracy por tema,
`avgSecsPerQuestion` (null si no hay datos de tiempo). `serializeProStats` expone todos los
campos incluyendo `avgSecsPerQuestion` — asegurarse de no omitirlo al añadir campos nuevos.

**`POST /config/pro-stats/export`** (revisión 2026-08-30 — PDF real):
- `pdfkit` instalado en backend. `ExportProStatsUseCase` genera buffer PDF A4 (cabecera
  morada, resumen de stats, tabla de temas coloreada por rendimiento).
- `IConfigRepository.storePdfReport(userId, period, buffer)` sube a Supabase Storage
  (`pro-stats-exports`, bucket privado auto-creado) y devuelve URL firmada (1 h).
- El endpoint devuelve 200 con `{ downloadUrl: string }` (no 202 stub).
- Mobile: `ConfigExportScreen` abre la URL con `Linking.openURL`. `ReportSuccessModal`
  muestra botón "Abrir PDF" primario + "Cerrar" secundario.

**`POST /config/feedback`**: inserta en `user_feedback`. Tipo: `suggestion|bug|other`.
Mensaje: 1–500 caracteres (validado con Zod y con CHECK en BD).

**Racha — corrección de lectura** (revisión 2026-08-30):
`toDomainGamification` en `SupabaseDashboardRepository` devolvía `current_streak` bruto
sin comprobar si había expirado. Ahora calcula `effectiveStreak`: si `last_activity_date`
no es hoy ni ayer (UTC), devuelve 0. `withActivity()` (escritura) siempre fue correcto.

**TutorChat — botón de envío** (revisión 2026-08-30):
`TutorChatScreen` añade un botón redondo naranja (`arrow-up`) a la derecha del input.
`returnKeyType="send"` en multiline no funciona en Android — el botón es la acción fiable.
Se deshabilita cuando `inputText.trim()` está vacío o `isTyping === true`.

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
Plugin `expo-build-properties` con `android.minSdkVersion: 26` — obligatorio para que
`react-native-health-connect` compile en EAS (la librería exige API 26+).

**`ConnectDeviceScreen.js`**: iconos SVG inline de reloj/smartwatch eliminados,
reemplazados por `Ionicons` para mayor consistencia visual con el resto de la app.

**Flujo pairing** (`PairingScreen.js`): monta pantalla → llama `requestHealthPermissions()`
automáticamente. Estados: `loading → complete / denied / unavailable`.
`denied`: "Ir a Ajustes" (`Linking.openSettings()`) + "Continuar igualmente".

**Datos en HomeHealth** (`HomeHealthScreen.js`): `useFocusEffect` + `getHealthMetrics()`.
Heurística de energía: `HRV×50% + sueño×30% + FC_reposo×20%`. Muestra `—` sin datos.

**Motor de fatiga** (`FatigueEngineScreen.js`): recibe `metrics` vía `route.params`.
Al montar, llama `healthApi.analyzeFatigue(metrics)` → `POST /health/fatigue` → `MotorFatigueClient` → Motor IA `/v1/fatigue/analyze`.
Si el Motor responde, usa sus señales y nivel; si falla (timeout/offline), cae al cálculo local:
`buildSignals(metrics)` → status `ok/warning/critical/unknown` por señal.
Nivel local: `high` (≥2 críticas), `medium` (1 crítica o ≥2 warning), `low` (resto).
Motor activo solo cuando `MOTOR_API_BASE_URL` está configurado (`isMotorConfigured`).

**Fallback local en backend (revisión 2026-09-03)**: `HealthController.analyzeFatigue`
envuelve la llamada al Motor en try/catch. Si el Motor no está configurado o falla
por cualquier motivo (404, timeout, offline), el controller cae a
`buildFatigueLocally(input)` — heurística en el mismo controller con la misma forma
que `MotorFatigueResult`. Antes propagaba `AxiosError 404` como 500 crudo al mobile;
ahora siempre devuelve 200 con nivel válido.

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

### Motor de IA del cliente (ACTIVO — operativo 2026-09-04)

Microservicio RAG del equipo IA. Dominio: `ia.opox.ai`. URL en `.env` (`MOTOR_API_BASE_URL`).
Auth: `X-API-Key: MOTOR_API_KEY`. `isMotorConfigured = Boolean(MOTOR_API_BASE_URL && MOTOR_API_KEY)`.
Curso activo: `MOTOR_DEFAULT_CURSO_ID=0bed919120024e5f` (Bloque 1, 266 páginas, 11 temas).

**Endpoints reales en uso (2026-09-04)** — alineados con OpenAPI `ia.opox.ai`:
- `/v1/classroom/tutor` — chat Tutor IA con historial y tono (Bloque 8).
- `/v1/classroom/flashcards/generate` — generación de mazos (Bloque 8).
- `/v1/classroom/summary` — resúmenes de tema (`nivel: 'esquema'|'medio'|'profundo'`).
- `/v1/courses/{curso_id}/questions` — banco de preguntas del test de nivel (Bloque 0).
- `/v1/fatigue/biometrics` — análisis de fatiga (Bloque 3; campos: `hrv_ms`, `fc_reposo`, `horas_sueno`).
- `/v1/tests/generate` — generador de preguntas de entrenamiento (Bloques 6/7).
- `/v1/modes/hint` — pista IA por pregunta (Bloque 7; requiere `pregunta_id` del banco).
- `/v1/tone/{user_id}` — perfil de tono (`nivel_detalle: 'breve'|'medio'|'profundo'`).
- `/v1/bank/exams?course_id=` — banco de exámenes oficiales.
- `/v1/boe/regulations?course_id=` — regulaciones BOE del Motor.

**Estado INC-04 (verificado 2026-09-04)**:
El job result de `/v1/tests/generate` y `/v1/onboarding/placement-test` sigue sin
incluir `correcta_idx` en el payload. Sin embargo, los **IDs de las preguntas del job
coinciden con los IDs del banco** (`/v1/courses/{id}/questions`), por lo que el
workaround por id-cruce del `MotorAiClient` funciona correctamente:
1. Job devuelve preguntas sin `correcta_idx` (~5 s en caché, ~30 s generación fresca).
2. `MotorAiClient.ensureQuestionBank()` carga el banco completo (paginado `limit=200`).
3. Cruza por `id` → obtiene `correcta_idx` del banco → pregunta válida.
4. Resultado: ~5.6 s total, `articleRef` presente (evidencia verbatim del temario).
Pendiente del equipo IA: exponer `correcta_idx` en el job para eliminar la carga extra del banco.

**Comportamiento con Motor activo**:
- `generateQuestions` / `generateSurgicalTest` → `MotorAiClient` (RAG + banco) → ~5.6 s.
  Fallback `CompositeAiClient` → OpenAI directo si el Motor falla.
- `analyzeFatigue` → `MotorFatigueClient` `/v1/fatigue/biometrics` → mapeo color→nivel.
  Fallback → `buildFatigueLocally` en `HealthController`.
- `getTutorChat` / `generateFlashcards` / `getSummary` → `MotorTutorClient` → Motor real.
  Fallback → stub personalidad / stub banco por topicId / `SummaryNotFoundError`.
- `getLevelTestQuestions` → `MotorOnboardingClient` `/v1/courses/{id}/questions` directo
  (banco tiene `correcta_idx`; no usa el job de placement-test). Timeout 5 s → estáticas.

**Clientes y mapeos clave**:
- `MotorTutorClient`: constructor recibe `cursoId` (desde `env.MOTOR_DEFAULT_CURSO_ID`).
  Respuesta tutor: `respuesta` → `content`, `acciones` → `suggestedActions`.
  Flashcards: array directo `{front, back}`, no `{tarjetas:[{pregunta,respuesta}]}`.
  Summary: `{resumen:{titulo,ideas_clave,desarrollo}}` → `[{title,content}]`.
- `MotorFatigueClient`: mapeo request `hrv→hrv_ms`, `sueno_horas→horas_sueno`.
  Mapeo respuesta: `nivel:'verde'→'bajo'`, `'amarillo'→'medio'`, `'rojo'→'alto'`.
- `MotorAiClient`: `fail-fast` si TODAS las preguntas del job son `origen="generada"`
  sin `correcta_idx` y no están en el banco → `CompositeAiClient` cae a OpenAI.

**Scripts E2E**:
- `scripts/e2e_flujo_navegacion.js` — 60/60 PASS (backend OPOX completo, usuario real).
  Usar `SKIP_REGISTER=1 SEED_EMAIL=x SEED_PASS=y node ...` con usuario ya verificado.
- `scripts/e2e_motor_coleccion.js` — 27/27 PASS (Motor directo, rutas reales).
- `scripts/diagnostico_motor.js` — verifica `correcta_idx` en job result del generador.

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
| 1 | Acceso (Auth/Onboarding) | Frontend cerrado + Bloque 0 revisado: onboarding no repetido, test real de 20 preguntas, inicialización de intensidad del plan. Revisión 2026-09-04: `MotorOnboardingClient` usa banco `/v1/courses/{id}/questions` (tiene `correcta_idx`); timeout 5 s → estáticas si el Motor tarda. |
| 2 | Dashboard | Frontend + backend completo |
| 3 | Salud | Frontend cerrado. `HealthController.analyzeFatigue` llama `MotorFatigueClient` → `/v1/fatigue/biometrics` con mapeo de campos. Try/catch → `buildFatigueLocally` si el Motor falla. Siempre devuelve 200. |
| 4 | Planificación | Frontend + backend completo (revisado y auditado post-testing: 10 bugs/gaps cerrados) |
| 5 | Motivación | Frontend + backend completo |
| 6 | Entrenamiento | Frontend + backend + IA completo. Motor RAG **activo** vía workaround banco (2026-09-04): job IDs coinciden con banco → `correcta_idx` resuelto por id-cruce → ~5.6 s, `articleRef` presente. INC-04 pendiente en el Motor (job result sin `correcta_idx` directo). |
| 7 | Sesión de test activa | Frontend + backend + IA completo. Pista IA vía `/v1/modes/hint` del Motor (requiere `pregunta_id` real del banco). Fallback a OpenAI directo. |
| 8 | Aula Virtual / Tutor IA | Frontend + backend completo. Rediseño Figma (2026-08-26). Motor IA operativo (2026-09-04): chat → `/v1/classroom/tutor`, flashcards → `/v1/classroom/flashcards/generate`, summary → `/v1/classroom/summary`. `cursoId` propagado desde container. Stubs como fallback. |
| 9 | Factoría de Apuntes | Frontend + backend completo. Rediseño Figma completo (2026-08-26): 4 pantallas + 5 modales reestilizados. Upload end-to-end funcional en Android (PDF + galería + cámara). Pipeline OCR→tags→preguntas con AiApiClientStub. IA real esperando entrega del `BRIEF_IA_BLOQUE9.md` |
| 10 | Monitor BOE | Frontend + backend completo. Revisión 2026-08-27: fallback catálogo→listRegulations, UPSERT idempotente en addRegulation, campo resumen, regenerateQuestions fire-and-forget, modal "Añadir norma" con preload + badge "Siguiendo", cross-bloque (Dashboard alerta real, TrainingResult hint, Realtime → BoeDetail). IA real (`generateBoeMiniTest`) esperando prompt `BRIEF_IA_BLOQUE10.md` del equipo IA |
| 11 | Tienda OPOX | Frontend + backend completo. Revisión 2026-08-28: motor earn automático por tests (1 O/acierto × multiplicador, cap 100 O/día), mini-test BOE hasta 5 O, `getTodayTestEarnings` en repo. Revisión 2026-08-27: puente earn→ledger, `POST /store/discounts/:id/redeem`, 8 pantallas sin mocks, canje por `redeemType`, fixes tabs UI. |
| 12 | Configuración | Frontend + backend completo. Revisión 2026-08-30 (3 pasadas): feedback real, tono IA multi-dispositivo, accesibilidad mapeada, stats reales con velocidad, subtextos API, PDF real (pdfkit+Supabase Storage URL firmada), racha caduca correctamente en lectura, botón envío TutorChat. Gaps pendientes: ThemeContext global, chat soporte (Intercom), RevenueCat (suscripción). |
| 13 | Notificaciones Push | Backend + mobile completo (3 fases: infraestructura base, hábito/retención, Supabase Realtime). Prueba end-to-end pendiente de EAS development build |

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
