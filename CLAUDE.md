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

**Biometría — tablas Supabase requeridas (revisión 2026-09-09)**:
`setupBiometric()` llama `authApi.biometricLink()` → `POST /auth/biometric/link`. Si las
tablas `biometric_challenges` y `biometric_devices` no existen, la llamada devuelve 500 y
`setupBiometric()` hace rollback silencioso (`clearLocalKeys()`). La huella nunca queda
vinculada y el toggle aparece como OFF al volver a la pantalla.
- `apps/backend/supabase/bloque1_biometria.sql` — SQL de creación de ambas tablas con
  índices y RLS. **Ejecutar en Supabase SQL Editor antes de habilitar biometría en producción.**
- `LoginScreen.js` usa `useFocusEffect` (no `useEffect`) para re-verificar `isBiometricLinked()`
  cada vez que la pantalla recibe foco. Sin esto el botón de huella no aparece tras configurarla
  en `ConfigPerfilScreen` y volver al login.

**Biometría — `logout` no borra la vinculación local (revisión 2026-09-10)**:
`authApi.logout` llamaba a `disableBiometric()` (→ `clearLocalKeys()`), que borraba
`SecureStore['opox.biometric.enabled']`. Efecto: aunque la fila del dispositivo en
`biometric_devices` siguiera intacta en Supabase, en el siguiente arranque de
LoginScreen `isBiometricLinked()` devolvía `false` y el botón de huella **desaparecía
para siempre** hasta reconfigurar la biometría desde Ajustes. Fix: `logout` solo
limpia la sesión ahora; la privada Ed25519 sigue en SecureStore protegida por el
prompt biométrico del OS. `disableBiometric()` solo se ejecuta desde `deleteAccount`
o cuando el usuario desactiva explícitamente el toggle en `ConfigPerfilScreen`.

**Biometría — paridad multi-plataforma Face ID / Touch ID / huella (revisión 2026-09-14)**:
Antes solo se ofrecían Face ID en iPhone y huella en Android — Touch ID (iPad/iPhone SE/8)
mostraba icono de rostro y face en Android no se ofrecía en absoluto.

- `detectBiometricType()` en `apps/mobile/src/lib/biometric.js`: consulta
  `LocalAuthentication.getEnrolledLevelAsync()`. Devuelve `'face'`, `'finger'`, `'both'`
  o `'none'`. En Android solo expone face cuando (a) es el único biométrico enrolado y
  (b) `getEnrolledLevelAsync()` reporta `BIOMETRIC_STRONG`. En iOS el Secure Enclave
  garantiza Class 3 → basta con detectar `FACIAL_RECOGNITION`.
- `promptBiometric()` pasa `biometricsSecurityLevel: 'strong'` a `authenticateAsync` —
  el prompt del OS en Android rechaza Class 2 antes de intentar desbloquear el keystore.
  `SecureStoreOptions` no expone ese flag; ya usa Class 3 por defecto cuando
  `requireAuthentication: true`.
- `setupBiometric()`: `authenticationPrompt` de `SecureStore.setItemAsync` es dinámico
  ahora (`Confirma para usar tu ${biometricLabel(type)}`).
- `BioLinkScreen.js`: hero (`FaceScanIcon` size 100) y modal "no reconocido" ahora eligen
  `Ionicons name="finger-print"` vs `FaceScanIcon` según el tipo detectado. Requiere
  `import { Ionicons } from '@expo/vector-icons'`.
- `ConfigPerfilScreen.js` (sección Seguridad): fila biométrica dividida en dos cuando
  `bioType === 'both'` — una fila "Face ID" con `FaceIdIcon` y otra "Huella / Touch ID"
  con `FingerprintIcon`. Ambas comparten el mismo toggle `bioEnabled` y llaman al mismo
  `handleBioToggle` porque la clave Ed25519 en SecureStore es única y el prompt del OS
  acepta cualquier biometría strong.

**Falso positivo Face ID en Android con huella coexistente (Tecno Spark Go 1)**:
`getEnrolledLevelAsync()` devuelve el nivel MÁXIMO enrolado en el dispositivo, NO por
tipo. En un Android con face Class 2 (cámara 2D) + huella Class 3, el nivel reporta
STRONG por la huella — creíamos que face era strong, exponíamos la fila "Face ID", y
al activarla el prompt del OS pedía huella (porque el face era débil). Fix definitivo:
en Android exigir face-only (sin huella enrolada) además del nivel strong. Trade-off:
Pixel 8+ con face Class 3 + huella enrolados no ve la fila dedicada "Face ID", pero
puede desbloquear con face desde el prompt del OS igualmente. `expo-local-authentication`
no expone un API público de "nivel por tipo" — cualquier detección más fina requeriría
módulo nativo.

**Feedback WhatsApp — mensaje más humano (revisión 2026-09-14)**:
`WhatsAppNotificationClient.sendFeedback` (`apps/backend/src/infrastructure/notifications/`)
antes enviaba `[OPOX Feedback] Tipo: suggestion\n\n<mensaje>` — estilo log. Reescrito con
formato WhatsApp (`*negrita*` con asteriscos simples), traducción del tipo a español
(`TYPE_LABELS: suggestion → Sugerencia`, `bug → Reporte de un error`, `other → Otro comentario`),
timestamp en zona Madrid vía `Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid' })`
(Render corre en UTC), mensaje entrecomillado, cierre en `_cursiva_`. Sin cambios de firma —
el cliente sigue recibiendo `(type, message)`. Variables `WHATSAPP_API_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENT_NUMBER` documentadas en `.env.example`.

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
- `PENDING_OTP_KEY = 'opox.pendingOtp'` — exportado desde `OtpScreen.js` (revisión
  2026-09-10). Guarda `{ email, purpose }` al entrar a la pantalla OTP. `SplashScreen`
  lo consulta al arrancar; si existe, retoma el OTP con los mismos params en vez de
  perder el contexto y forzar registro desde cero. Se borra al verificar OK o al
  pulsar "Volver" (abandono explícito).

**`SplashScreen.resolveOnboardingEntryRoute()`** — árbol de decisión sin sesión
(revisión 2026-09-10: añadido paso 1 · retomar OTP; función ahora devuelve
`string | { name, params }` para poder pasar params al Otp):
1. `PENDING_OTP_KEY` existe → `{ name: 'Otp', params: { email, purpose } }`.
2. `ONBOARDING_COMPLETED_KEY` existe → `'Entrada'` (login directo).
3. `PENDING_LEVEL_TEST_KEY` existe → `'LevelTestInProgress'` (reanudar test).
4. `PENDING_OPOSICION_KEY` existe → `'LevelTestProposal'`.
5. Ninguno → `'OnboardingSlider'` (usuario completamente nuevo).

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
- **Fix crash React Rules of Hooks (2026-09-13)**: el tercer `useEffect` (persiste `qIndex`
  en AsyncStorage para reanudar si el usuario cierra la app) estaba declarado DESPUÉS del bloque
  `if (!questions) return <loading>`. En el primer render (Motor cargando) se ejecutaban 8 hooks;
  en el segundo render (preguntas disponibles) se intentaban 9 → "Rendered more hooks than during
  the previous render" → crash con diálogo "OPOX continúa fallando". Fix: mover ese `useEffect`
  ANTES del return condicional. La guarda `if (!hasRestoredRef.current) return` evita que se
  sobreescriba `PENDING_LEVEL_TEST_KEY` antes de que la restauración termine.

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

**Refresh de sesión local tras `updateProfile` (revisión 2026-09-10)**:
`authApi.updateProfile` actualiza `user_metadata.oposicion` en Supabase y espeja a
`profiles.oposicion`, pero **no** devuelve una sesión nueva. La sesión que guarda
el mobile en AsyncStorage se cacheó en `register`/`verifyOtp`, cuando aún no había
oposición, así que su `user.oposicion` queda `null` para siempre en ese dispositivo.
Sin refrescarla, todas las pantallas de temario (`GeneratorConfigScreen`,
`PlanningTodayScreen`, `ChallengesScreen`, `TutorSummariesScreen`, etc.) leen
`session.user.oposicion` vacío → caen al fallback `'justicia-tramitacion'` y sólo
muestran 10 temas en lugar del temario real del curso.

**Fix**: `applyPendingOposicion` recarga la sesión con `api.loadSession()` y parchea
`user.oposicion` + `user.user_metadata.oposicion` con el slug elegido antes de
guardarla de nuevo. Sin re-login manual.

**Backfill SQL para usuarios previos** (correr una vez en Supabase SQL Editor):
```sql
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        '{oposicion}',
        to_jsonb(p.oposicion)),
    updated_at = NOW()
FROM public.profiles p
WHERE p.id = u.id
  AND p.oposicion IS NOT NULL
  AND p.oposicion <> ''
  AND (u.raw_user_meta_data->>'oposicion') IS DISTINCT FROM p.oposicion;
```
Los usuarios afectados deben cerrar sesión y volver a entrar para que su
AsyncStorage cache lea el nuevo `user_metadata`. El fix de código sólo cubre a
usuarios nuevos desde este build en adelante.

**Navegación post-test** — usar siempre `replace` (no `navigate`) para evitar vuelta atrás:
- `LevelTestProposalScreen`: "Ahora no" → `replace('Permissions')`.
- `LevelTestResultScreen`: "Crear mi plan" → `replace('Permissions')`.

**Password reset — flujo completo (revisión 2026-09-10)**:

- Backend: `POST /auth/password/reset-request` →
  `supabaseAuth.auth.resetPasswordForEmail(email, { redirectTo: env.PASSWORD_RESET_REDIRECT_URL })`.
  Antes se hacía `.catch(() => undefined)` que tragaba **todos** los errores (SMTP
  rate-limit, dominio no verificado, email inexistente) y el mobile veía siempre
  `202 { sent: true }`. Ahora el use case en `SupabaseAuthRepository.requestPasswordReset`
  loguea el error con `logger.warn` enmascarando el email (`ab***@dominio.com`) para
  poder diagnosticar en logs de Render; se sigue devolviendo 202 al cliente para
  preservar la anti-enumeración.
- Configuración Supabase Dashboard (manual, obligatoria):
  - Auth → Email Templates → Reset Password: el href debe apuntar a
    `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`
    (no al `{{ .ConfirmationURL }}` por defecto — ese endpoint es HTTP y no abre
    la app).
  - Auth → URL Configuration → Redirect URLs: incluir `opox://reset-password`
    (o el HTTPS de Universal Links cuando se despliegue el dominio).
- Configuración SMTP en Supabase Dashboard: **imprescindible** en producción. El
  SMTP compartido de Supabase tiene rate limit de ~4 emails/hora, y los errores
  llegaban silenciados. Actualmente configurado con Gmail SMTP (App Password
  de 16 chars, no la clave del usuario) — `smtp.gmail.com:587`, límite 500/día.
  Migrar a Resend o SendGrid antes de escalar el APK.
- Mobile:
  - `RecuperarPasswordEmailScreen` — pide email, llama backend, navega a Enviado.
  - `RecuperarPasswordEnviadoScreen` — botón "Abrir app de correo". Antes usaba
    `Linking.openURL(\`mailto:${email}\`)` que abría la app de correo **en modo
    composición** con destinatario = el propio email del usuario (por eso Santi
    veía Outlook redactando un mail a sí mismo). Ahora prueba `message://` en
    iOS, `googlegmail://` / `ms-outlook://` en Android, fallback web (`mail.google.com`,
    `outlook.live.com`, `mail.yahoo.com`) según el dominio del email, y último
    recurso `mailto:` sin destinatario para abrir el selector limpio.
    **Fix (2026-09-13)**: el selector de cliente de correo no detectaba el dominio
    correctamente — si el email era `@gmail.com` probaba igualmente `ms-outlook://`
    primero. Ahora usa `isGmail`, `isOutlook`, `isYahoo` booleans para intentar
    únicamente el esquema que corresponde al dominio antes de caer al fallback web.
  - `RecuperarPasswordNuevaScreen.js` — recibe `token_hash` vía `route.params` (deep
    link `opox://reset-password?token_hash=xxx&type=recovery`) y lo canjea con
    `authApi.confirmPasswordReset` → `verifyOtp({ type: 'recovery' })` en backend.
    **Fix (2026-09-13)**: añadido campo de pegado manual para el caso en que Gmail
    Android bloquee el custom scheme del botón del email. El usuario copia el enlace
    y lo pega en un textarea; `parseTokenFromInput()` extrae el `token_hash` de una
    URL completa `opox://...` o lo usa directamente si ya es el hash en bruto.
- **`GET /auth/password/reset-redirect` — ruta pública (añadida 2026-09-13)**:
  Endpoint `https://opox-backend-x2mu.onrender.com/auth/password/reset-redirect?token_hash=X&type=recovery`
  que devuelve `302 → opox://reset-password?token_hash=X&type=recovery`. El template
  de Supabase apunta a este endpoint HTTPS (Gmail no bloquea HTTPS); el SO recibe
  el `302` y abre la app con el deep-link. `AuthController.resetRedirect` (sin use
  case — solo redirect HTTP). Ruta constante `API_ROUTES.AUTH.PASSWORD_RESET_REDIRECT`.
  **Acción manual requerida en Supabase**: Auth → Email Templates → Reset Password,
  href del botón → `https://opox-backend-x2mu.onrender.com/auth/password/reset-redirect?token_hash={{ .TokenHash }}&type=recovery`.
- Deep link `opox://reset-password` — **no funciona en Expo Go** (Expo Go solo
  registra `exp://`). Requiere development build o standalone APK con el
  `"scheme": "opox"` de `app.json:6` compilado en el AndroidManifest. Verificar
  con `adb shell am start -a android.intent.action.VIEW -d "opox://reset-password?token_hash=fake"`.
- Gmail Android puede bloquear los custom schemes en botones del email. Solución
  intermedia: backend redirect `https://` → `opox://`. Solución definitiva:
  Universal / App Links (`https://opox.ai/reset-password`) con `assetlinks.json`
  en el dominio + `intentFilters` con `autoVerify: true` en `app.json`.
  Pendiente hasta tener dominio propio.

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
  `PlanningWeekScreen.js` incluye la misma función para evitar que el JSON raw aparezca en la vista semanal (revisión 2026-09-09).
- Al pulsar "Empezar": `navigation.navigate('GeneratorConfig', { topicId, questionCount })`.

**Macro con temas reales**:
- `PlanningController.getMacro` llama `listTopics` en paralelo. `enrichMacroWithTopics()` distribuye temas por fase con pesos `[0.35, 0.30, 0.25, 0.10]`.
- `container.ts` pasa `listTopics: useCases.listTopics` al `PlanningController`.

**`PlanningAgendaScreen` — selector de fecha nativo (revisión 2026-09-09)**:
El campo de fecha era un `TextInput` libre propenso a errores de formato (`2026/09/10` en vez
de `2026-09-10`). Reemplazado por `TouchableOpacity` + `DateTimePicker` nativo:
- `@react-native-community/datetimepicker@9.1.0` instalado en el workspace.
- Android: `display='default'` → diálogo nativo del SO, sin modal extra.
- iOS: modal de confirmación con `display='spinner'` y `locale='es-ES'`.
- `handleSave` tiene spinner en el botón y `Alert.alert` para errores de red o fecha vacía.
- **Nota pnpm**: añadir `neverBuiltDependencies: [expo-build-properties]` en `pnpm-workspace.yaml`
  es necesario para que `pnpm install` no falle en Windows con paquetes de lifecycle scripts.

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
- Label EXPLORAR: `myClan ? 'Mis clanes' : 'Ver clanes'` (revisión 2026-09-09: antes mostraba `myClan.name`).
- `ClanDetailScreen` tiene botón "Descubrir otros clanes" (naranja, ícono brújula)
  que navega a `ClansList` sin obligar al usuario a salir de su clan primero.
- `ClansListScreen` — botón "Unirse" siempre visible (revisión 2026-09-09): cuando el
  usuario ya pertenece a un clan aparece atenuado (gris) y al pulsarlo muestra un
  `Alert.alert` con texto explicativo y opción "Ir a mi clan" (navega a `ClanDetail`
  del clan actual) en lugar de ocultarse sin motivo.
- `leaveClan` — pipeline full-stack: `DELETE /motivation/clans/:id/leave` + `LeaveClanUseCase`
  + `SupabaseMotivationRepository.leaveClan` (delete de `clan_members`) +
  `MotivationController.leaveClan` + ruta en `motivationRoutes.ts` + constante
  `CLAN_LEAVE` en `packages/constants` + `motivationApi.leaveClan(clanId)` en mobile.
  `ClanDetailScreen` tiene botón rojo "Salir del clan" con `Alert.alert` de confirmación
  y spinner `ActivityIndicator` mientras procesa. Navega a `ClansList` con `replace` al salir.

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
- **Fix Zod (2026-09-08)**: `sendMessageBody` solo declaraba `content` y `personality` —
  Zod stripaba `tonePrefs` silenciosamente. Añadido `tonePrefs` al schema y actualizado
  enum `personality` con los 4 valores actuales (`cercano`, `formal`, `directo`, `motivador`,
  `equilibrado`, `exigente`). Sin este fix `toneProfile` llegaba siempre `undefined` al Motor.
- **Motor `/v1/classroom/tutor` — bug conocido (2026-09-08)**: endpoint crashea con 500.
  Confirmado con payload mínimo `{ curso_id, mensaje, user_id }`. Pendiente de fix por el equipo IA.
  Flashcards y resúmenes del Motor funcionan correctamente. `buildStubAiResponse` distingue
  ahora entre 5xx (`code: 'MOTOR_SERVER_ERROR'` → "tutor no disponible") y timeout/otros
  (→ mensaje de "espera, reintenta").
- **Fix `getSummary` (2026-09-08)**: Motor devuelve `desarrollo: string[]` (no `string`) y
  `puntos_examen: string[]`. `MotorTutorClient` corregido: tipo `string | string[]`, join
  con `\n\n` si es array, nueva sección "Puntos de examen". Sin este fix el Resumen
  Inteligente llegaba con secciones vacías.
- **Selector de profundidad (2026-09-08)**: `TutorSummariesScreen` tiene pills Esquema /
  Medio / Profundo. `tutorApi.getSummary(topicId, oposicion, detailLevel)` acepta tercer
  param. Backend: `summaryQuery` Zod con `?detailLevel=0|1|2`, `GetSummaryUseCase` propaga
  al Motor y salta caché de Supabase para nivel ≠ 1. Sin cambios en DB.

**Rediseño Figma (2026-08-26)**: 6 pantallas + 1 modal completamente reestilizados
con tokens exactos de Figma (`Poppins-*`, border-radius, paleta morada/verde):
`TutorHomeScreen`, `TutorChatScreen`, `TutorPodcastScreen`, `TutorSummariesScreen`,
`TutorFlashcardsScreen`, `TutorFlashcardsLoadingScreen`, `FlashcardsSuccessModal`.

**`TutorPodcastScreen` — 3 fases (revisión 2026-09-09)**: reescrito completamente con
generación real vía Motor + reproducción in-app con `expo-audio`:
1. `EpisodePicker` — carga `tutorApi.listEpisodes(oposicion)` (fallback a `listTopics`
   cuando la tabla `tutor_podcast_episodes` está vacía).
2. `PodcastConfig` — selectores de Duración (Corta≈5min / Media≈10min) + Velocidad
   (0.5/1/1.5/2x) + botón "Generar podcast con IA" que llama `tutorApi.generatePodcast()`
   con timeout de 150 s (backend hace polling del job del Motor).
3. `PodcastPlayer` — player Figma original con `useAudioPlayer` + `useAudioPlayerStatus`
   de `expo-audio ~57.0.4`: waveform animado, barra de progreso real, play/pause,
   skip ±15 s, temporizador de sueño, modal de salida.

**Podcast — pipeline backend**:
- `POST /tutor/podcast/generate` (auth) → `GeneratePodcastUseCase` → `MotorTutorClient.generatePodcast(userId, cursoId, topicId, duracion, velocidad)`
  → `POST /v1/classroom/podcast` al Motor (**sin `/generate`** — el sufijo devolvía 405)
  → polling `GET /v1/jobs/{id}` cada 3 s hasta 2 min → devuelve `{filename, mp3Url, estimatedSeconds}`.
- **`user_id` obligatorio en el body** del Motor (o 422 `Field required`).
- **Auth dual `X-API-Key` + `X-OpenAI-Key`** (BYOK) — sin la segunda, cualquier
  endpoint del Motor devuelve `falta_openai_key`.
- `GET /tutor/podcast/audio/:filename` — **ruta pública** que hace stream del mp3
  del Motor con X-API-Key hacia el cliente. Necesario porque `expo-audio` /
  `<audio>` no envían headers custom. Valida el patrón `podcast-[a-f0-9]{8,64}.mp3`
  para evitar path traversal (el filename actúa como secreto compartido — solo lo
  conoce quien acaba de generar el podcast).
- Ruta constante: `API_ROUTES.TUTOR.PODCAST_GENERATE`, `PODCAST_AUDIO`.

**Resúmenes y podcast — fallback a listTopics (revisión 2026-09-09)**:
`ListSummariesUseCase` y `ListEpisodesUseCase` reciben `IBoeRepository` opcional.
Si la tabla de caché (`tutor_summaries` / `tutor_podcast_episodes`) está vacía,
caen a `boeRepo.listTopics(oposicion)` y devuelven los temas del temario como
placeholders. El picker del mobile los muestra; al seleccionar uno, la generación
se dispara bajo demanda vía Motor.

**`TutorSummariesScreen` — `TopicPicker`**: cuando no hay `topicId` en los params,
muestra un selector que carga `tutorApi.listSummaries(oposicion)`. Una vez elegido
el tema, la pantalla muestra el resumen con un selector de 3 pills de profundidad
(Esquema=0 / Medio=1 / Profundo=2) debajo del header; al cambiar recarga desde el Motor.
`tutorApi.getSummary(topicId, oposicion, detailLevel)` envía `?detailLevel=N`.

**`TutorFlashcardsScreen` — empty state**: si `paramCards` llega como array vacío
(`paramCards.length === 0`), muestra pantalla de error en lugar de intentar renderizar
una tarjeta undefined. La función `handleReviewFailed` fue eliminada (bug: `cards`
no tiene setter).

**`TutorFlashcardsScreen` — TopicPicker (revisión 2026-09-09)**: cuando el usuario
entra desde el hub sin params (`!paramCards && !topicId`), muestra picker de temas
(reutiliza `tutorApi.listSummaries` que devuelve `topicId`+`topicTitle`). Al elegir
tema navega a `TutorFlashcardsLoading` con params reales. Antes se iba directo con
`topicId='constitucion'` (slug del curso viejo) y el Motor devolvía 404
`tema_no_encontrado`. `TutorChatScreen` acción "Crear flashcards" también fue
actualizada para navegar al picker (antes iba directo a Loading).

**Motor — `n=15` en flashcards**: `MotorTutorClient.generateFlashcards` pide 15
tarjetas por defecto (antes 10). El Motor es determinista y tiende a repetir las
mismas 5 primeras; pedir más da más variedad visible al usuario.

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

**Mini-test BOE con Motor real (2026-09-05)**: flujo Motor activo vía `MotorBoeClient`.
- `GET /boe/changes/:id/mini-test` → `GET /v1/boe/changes/{id}/mini-test?course_id=&user_id=`
  al Motor → `{ sesionId, questions }`. Sesión idempotente por `user_id`. Preguntas SIN `correctIndex`.
- `POST /boe/changes/:id/mini-test/answer` → `POST /v1/tests/{sesionId}/answer` al Motor →
  `{ correcta, correctaIdx, explicacion, justificaciones, evidencia }`.
  `evidencia.cita` = cita verbatim del BOE + `evidencia.pagina`.
- 409 `mini_test_no_disponible` → `BoeMiniTestNotAvailableError` (409) → móvil muestra
  "Preguntas en preparación".
- Path stub (Motor sin configurar o cambio sin regenerar): `sesionId: null`, preguntas con
  `correctIndex` para resolución local — no llama a `/answer`.
- Las preguntas tienen **exactamente 3 opciones** (no 4 como el Generador Infinito).
- `BoeMiniTestAnswerInput` / `BoeMiniTestAnswerResponse` en `packages/types/src/boe.ts`.
- Ruta `CHANGE_MINI_TEST_ANSWER` en `packages/constants` (routes.js + index.d.ts).
- E2E: `scripts/test_boe_minitest.js` → 16/17 PASS.
- **Fix `.env`**: `MOTOR_API_KEY` y `MOTOR_BOE_API_KEY` deben ir entre comillas dobles —
  contienen `#` que dotenv interpreta como comentario (truncaba la clave → 401 del Motor).

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
  (opcional, cae a `AI_API_KEY`). `MOTOR_BOE_CURSO_ID` ya no se usa para BOE use cases
  — el curso se resuelve dinámicamente via `GetCursoIdUseCase` (tabla `training_courses`).
  Sin `MOTOR_BOE_BASE_URL`, el cliente no se instancia.

**`MotorBoeClient.searchCatalog` — normalización de campos (revisión 2026-09-12)**:
El Motor devuelve `identificador` en el catálogo (no `identificador_boe`). El cliente
normaliza cada entrada: `identificador → identificador_boe`, `vigente → activa`,
`id = e.id ?? e.identificador`. Sin esta normalización `followRegulation` enviaba
`boeIdentifier: undefined` y Zod lo rechazaba con 422 "Datos inválidos".

**`SearchBoeRegulationsUseCase` — búsqueda con fallback (revisión 2026-09-12)**:
- Sin query (`q` vacío): salta el catálogo y devuelve `listRegulations(cursoId)` directamente.
  El catálogo genérico sin filtro devuelve 12 000+ leyes del BOE — no es lo útil para el modal.
- Con query: llama `motor.searchCatalog(q)` con timeout de 5 s (AbortController en cliente).
  Si supera el timeout o devuelve vacío, fallback a `listRegulations(cursoId)` filtrado localmente.
- `cursoId` resuelto via `GetCursoIdUseCase` (mismo patrón que `TrainingController`).
- `FollowRegulationUseCase` también usa `GetCursoIdUseCase`; `BoeController` le pasa
  `req.authUser?.oposicion`. `MOTOR_BOE_CURSO_ID` queda solo como fallback de `GetCursoIdUseCase`.

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
- **Patrón `replace` al iniciar sesión (revisión 2026-09-08)**: `GeneratorConfigScreen`,
  `SurgicalTestPreviewScreen` y `MockInstructionsScreen` usan `navigation.replace('TrainingSession')`
  (antes `navigate`). Evita que la pantalla de config/instrucciones quede en el stack al
  terminar el test — con `navigate` el usuario atravesaba esas pantallas al volver.
  Regla: cualquier transición "punto de no retorno" (config → sesión activa) debe usar `replace`.

**Infraestructura multi-curso (revisión 2026-09-07)**:
- `training_courses` (tabla Supabase): `oposicion TEXT PK → motor_curso_id TEXT`.
  Seed: `policia-local-galicia → 0bed919120024e5f` (is_default=true).
  SQL: `apps/backend/supabase/training_courses.sql`.
- `GetCursoIdUseCase`: resuelve `oposicion → cursoId` vía DB; fallback `MOTOR_DEFAULT_CURSO_ID`.
  Siempre devuelve un ID, nunca lanza excepción.
- `authMiddleware`: expone `oposicion: string | null` en `req.authUser`.
- `TrainingController` y `TutorController`: llaman `getCursoId.execute(oposicion)` antes
  de cada llamada al Motor. `TrainingController` lee `body.oposicion`;
  `TutorController` lee `req.authUser!.oposicion`.
- `bloque6_topics.sql`: `justicia-tramitacion` mantiene slugs semánticos
  (`constitucion`, `ley-39`, etc.). `policia-local-galicia` usa IDs hex del Motor.
  Desde 2026-09-09 el curso activo es `672e3a8bad0f45c8` con 40 temas
  (SQL: `bloque6_topics_policia_galicia.sql`). Ambos formatos son válidos — el
  Motor acepta cualquiera como `tema_id`.

**`ListTopicsUseCase` — mapeo `label = 'Tema N'` (revisión 2026-09-09)**:
Los títulos que devuelve el Motor son inconsistentes (unos completos, otros truncados
a "Tema 13" o "Vida"). Para uniformar la UI de todos los pickers del temario, el
use case reetiqueta `label` a `"Tema ${i+1}"` según el orden (`sort_order` ASC).
`topicId` intacto (la IA recibe el ID hex real). Afecta a 4 bloques con 1 solo cambio:
Bloque 4 (modal test en `PlanningToday`), Bloque 6 (`GeneratorConfigScreen`),
Bloque 8 (Aula Virtual — chat/resúmenes/podcast/flashcards) y Bloque 10 (pestaña
"Mi temario" en `BoeHome`). `ListSummariesUseCase` / `ListEpisodesUseCase` aplican
el mismo mapeo en su fallback interno.

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

**`ConnectDeviceScreen.js` (revisión 2026-09-07)**: reescrito para reflejar la
realidad de cada plataforma. Antes tenía 5 tarjetas hardcodeadas (Apple Watch,
Garmin, Fitbit, Samsung, Solo smartphone) con Apple Watch fake "Conectado".
Ahora:
- **iOS**: 2 tarjetas — "Apple Salud" + "Solo smartphone"
- **Android**: tarjeta única de **Health Connect** según estado real via
  `getHealthConnectStatus()`: `available` (verde), `not_installed` (naranja +
  "No instalado" badge + "Instalar" → Play Store), `update_required` (naranja +
  "Desactualizado" badge + "Actualizar" → Play Store), `not_supported` (Android <8).
  Plus tarjeta "Solo smartphone".
- Subtítulo aclara que OPOX **no** se conecta por Bluetooth al reloj — lee los datos
  que la app del fabricante ya escribió en Health Connect.

**`getHealthConnectStatus()` — mapeo correcto (revisión 2026-09-08)**:
`react-native-health-connect` v3 usa `SDK_AVAILABLE = 3`, `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED = 2`,
`SDK_UNAVAILABLE = 1`. El código anterior tenía los valores invertidos (2→available, 3→update_required).
Mapeo correcto: `3 → 'available'`, `2 → 'update_required'`, `1 → 'not_supported'`.

**Flujo pairing** (`PairingScreen.js`): monta pantalla → chequea `getHealthConnectStatus()`
en Android **antes** de llamar `requestHealthPermissions()` (evita crash nativo si
Health Connect no está instalado). Estados: `loading → complete / denied / unavailable / needs_install`.
- `denied`: "Ir a Ajustes" (`Linking.openSettings()`) + "Continuar igualmente".
- `needs_install`: "Abrir Google Play" (`openHealthConnectPlayStore()`) + "Continuar sin datos".
- Textos revisados (2026-09-08): título "Configurando acceso" (antes "Emparejando"), body
  "Conectando con … / Acepta los permisos de lectura" (antes describía búsqueda BLE inexistente).
  OPOX no escanea Bluetooth — solo solicita permisos de lectura a Health Connect/HealthKit.
  Steps diferenciados por plataforma en `STEPS_ANDROID` / `STEPS_IOS`.

**Fix "Health Connect sigue molestando" (revisión 2026-09-09)**:
`PairingScreen` mostraba el diálogo de permisos cada vez que se montaba, aunque el
usuario ya los había concedido desde Ajustes del dispositivo.

- `HealthService.js` — `hasAllHealthPermissions()` (exportada): llama
  `HealthConnect.getGrantedPermissions()` (sin dialog) y comprueba si todos los
  permisos de `ANDROID_PERMISSIONS` están ya concedidos. `requestHealthPermissions()`
  verifica esto antes de llamar `requestPermission()`; si ya están todos, devuelve
  `true` sin abrir ningún diálogo.
- `HEALTH_PAIRING_SKIPPED_KEY = 'opox.health.pairingSkipped'` — constante exportada
  de `HealthService.js`. Persiste la decisión del usuario de "no vincular ahora".
- `PairingScreen.js` — `run()`: tras verificar estado HC, llama `hasAllHealthPermissions()`;
  si `true`, salta directo a `phase = 'complete'`. Botón "Continuar igualmente" y botón
  atrás en estado `denied` persisten `HEALTH_PAIRING_SKIPPED_KEY` en AsyncStorage.
- `HomeHealthScreen.js` — lee `pairingSkipped` al cargar. Si el flag existe pero los
  permisos ya están concedidos (usuario los activó desde Ajustes), borra el flag.
  CTA: `!hasData && pairingSkipped` → "Activa permisos en Ajustes del dispositivo"
  (→ `Linking.openSettings()`); `!hasData && !pairingSkipped` → "Conecta tu wearable"
  (→ `ConnectDevice`).

**Fix integración Health Connect — app invisible en ajustes y permisos denegados (revisión 2026-09-11)**:
Dos causas independientes corregidas.

**Causa 1 — `ACTION_SHOW_PERMISSIONS_RATIONALE` sin handler:**
Google exige que la Activity que declara este intent-filter responda mostrando una pantalla
de privacidad. Sin respuesta válida, HC marca la app como inválida → invisible en sus ajustes
→ `requestPermission()` devuelve `[]` silenciosamente.
- `HealthConnectRationaleScreen.js` (nueva) — pantalla de justificación de privacidad:
  5 tipos de dato, por qué se leen, garantías (solo lectura, sin venta). Ruta de navegación:
  `HealthConnectRationale`, deep-link `opox://health-rationale` en `linking` de `App.js`.
- `plugins/withHealthConnectPermissionDelegate.js` — inyección `TAG_RATIONALE` en `onCreate`
  **antes** de `super.onCreate()` (`offset: 0`): detecta el intent de rationale y lo muta a
  `ACTION_VIEW + Uri("opox://health-rationale")` con clases completamente cualificadas
  (sin imports extra). React Native lo procesa como deep-link y navega a la pantalla.
- `plugins/withHealthConnect.js` — **revisión 2026-09-13: `withDangerousMod`**:
  El enfoque anterior (`fixRationaleIntentFilter` vía `withAndroidManifest`) no funcionaba
  porque Expo aplica los `withAndroidManifest` en orden LIFO dentro de cada fase (sync
  primero, async después). El plugin oficial de `react-native-health-connect` usa
  `async withAndroidManifest` y corría SIEMPRE después de nuestro plugin, añadiendo una
  segunda copia del filtro. Fix: `withDangerousMod` corre en una fase completamente
  posterior a todos los `withAndroidManifest`; lee el `AndroidManifest.xml` ya escrito
  en disco, elimina todas las copias del filtro y reinserta exactamente una en
  `.MainActivity` usando una regex sobre el XML. Verificado con `npx expo prebuild --clean`:
  exactamente 1 copia del filtro en `.MainActivity`, sin importar cuántos plugins lo añadan.

**Causa 2 — `requestHealthPermissions()` con falso positivo (revisión 2026-09-13):**
`HealthService.js` usaba `existing.length >= ANDROID_PERMISSIONS.length` para detectar
permisos ya concedidos — podía devolver `true` con N permisos de CUALQUIER tipo. Corregido
con la misma comparación estricta que `hasAllHealthPermissions()`: `.every((required) =>
existing.some(g => g.recordType === required.recordType && g.accessType === required.accessType))`.

**Pendiente**: `eas build --profile development --platform android` — sin rebuild los
cambios de manifest y MainActivity no tienen efecto (no hay `android/` en el repo).

**Datos en HomeHealth** (`HomeHealthScreen.js`): `useFocusEffect` + `getHealthMetrics()`.
Heurística de energía: `HRV×50% + sueño×30% + FC_reposo×20%`. Muestra `—` sin datos.
`hasData` correcto (revisión 2026-09-07): `isHealthAvailable() && !!metrics &&
[hr, restHr, hrv, spo2, sleep].some((v) => v != null)`. Antes solo comprobaba
truthiness del objeto y ocultaba la CTA "Conecta tu wearable" cuando Health Connect
respondía con todos los campos null (caso real sin wearable emparejado).

**Widget de Salud del Dashboard** (`DashboardScreen.js`, revisión 2026-09-07):
antes hardcodeado con `77 ppm` y `85%`. Ahora carga `getHealthMetrics()` en paralelo
con dashboard summary. Muestra HR real o `—`, `%` de energía real (misma fórmula
que HomeHealthScreen) y color dinámico del anillo: verde ≥75%, naranja 50-74%,
rojo <50%, morado sin datos. Label: "Energía buena / media / Nivel de fatiga elevado /
Sin datos de wearable".

**Motor de fatiga** (`FatigueEngineScreen.js`): recibe `metrics` vía `route.params`.
Al montar, llama `healthApi.analyzeFatigue(metrics)` → `POST /health/fatigue` → `MotorFatigueClient` → Motor IA `/v1/fatigue/biometrics`.
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

**Revisión 2026-09-07 — fixes Motor Fatiga**: `MotorFatigueClient` ahora recibe el
`userId` real del usuario autenticado (antes enviaba `'opox-backend'` hardcodeado,
impidiendo personalización e historial por usuario en el Motor). Se añade `spo2`
al payload enviado al Motor y al fallback local `buildFatigueLocally` — mobile ya
tenía el dato de HealthKit pero no lo enviaba. `healthApi.analyzeFatigue` acepta
y envía `spo2` desde `FatigueEngineScreen` (llega vía `route.params.metrics`).

**IA directa para Salud (revisión 2026-09-09)** — 3 nuevos endpoints sin Motor ni RAG:

- `POST /health/menus` — genera 1 menú diario personalizado (objetivo + fatiga + restricciones).
- `POST /health/meditation` — genera guión de sesión con fases que suman exactamente `duracion×60 s`.
- `POST /health/study-technique` — recomienda la técnica de estudio adecuada para el día.

**`HealthAiClient`** (`infrastructure/clients/HealthAiClient.ts`) — clase con soporte dual:
- Provider `'gemini'`: `POST /v1beta/models/gemini-3.6-flash:generateContent?key={apiKey}`.
  `systemInstruction` + `contents` + `generationConfig.responseMimeType: 'application/json'`.
  3 intentos con retry: 5xx (4 s), truncación `rawLen<20` (2 s), JSON parse fail (inmediato).
  Stripping de bloques markdown + extracción del objeto `{...}` más externo.
- Provider `'openai'`: `POST /chat/completions`, `json_object`, `temperature: 0.3`, reintentar 1×.
- `maxOutputTokens`: menus=2500, meditation=2000, study=1000.

**Instanciación en `container.ts`**:
```ts
// Gemini tiene prioridad; fallback a OpenAI; undefined si ninguno configurado.
const healthAiClient = env.HEALTH_GEMINI_API_KEY
    ? new HealthAiClient({ baseUrl: 'https://generativelanguage.googleapis.com/v1beta', apiKey: env.HEALTH_GEMINI_API_KEY, provider: 'gemini' })
    : (env.AI_API_BASE_URL && env.AI_API_KEY)
        ? new HealthAiClient({ baseUrl: env.AI_API_BASE_URL, apiKey: env.AI_API_KEY, provider: 'openai' })
        : undefined;
```

**Variable de entorno**: `HEALTH_GEMINI_API_KEY` en `apps/backend/.env` y en schema Zod.
Para Render: añadir en el dashboard de entorno antes del deploy — sin ella los 3 endpoints
devuelven 500.

**Rutas** en `packages/constants`: `HEALTH_MENUS`, `HEALTH_MEDITATION`, `HEALTH_STUDY_TECHNIQUE`.
Registradas en `healthRoutes.ts` con `authMiddleware`.

**`FatigueEngineScreen.js`**: exporta `FATIGUE_LEVEL_KEY = 'opox.health.fatigueLevel'` y persiste
el nivel (`'bajo'/'medio'/'alto'`) en AsyncStorage al terminar el análisis de fatiga.

**`MenusScreen.js`**: botón "✦ Generar menú con IA" → modal con objetivo + restricciones → llama
`healthApi.generateMenus`. Menú IA aparece al inicio de la lista con badge "AI" y borde verde.
Los menús estáticos "Dietista" permanecen como base curada — son complementarios.

**`MeditationListScreen.js`**: card "Sesión personalizada" con selector tipo + duración → llama
`healthApi.generateMeditation` → navega a `MeditationPlayer` con `phases: [{ nombre, texto, segundos }]`.

**`MeditationPlayerScreen.js`**: muestra `activePhase.nombre` + `activePhase.texto` debajo del
moonCircle cuando la sesión tiene fases IA (calculadas por tiempo transcurrido). Sin fases:
comportamiento original intacto. Moonircle reducido de 249→172px; layout `space-evenly` para que
los controles (play/pause, skip) queden siempre visibles.

**`StudyTipsScreen.js`**: carga `recommendStudyTechnique` al montar; muestra card morada
"TÉCNICA RECOMENDADA HOY" con `tecnica`, `porque`, `adaptacion`. Si falla: card sutil de error.
Las 4 técnicas estáticas permanecen debajo.

**Regla de arquitectura de contenido**: estático (siempre visible, funciona offline) + IA
(personalización diaria encima). No se persiste en DB el contenido generado — es efímero por diseño.

**Config mobile para APK**: `apps/mobile/.env` tiene `EXPO_PUBLIC_API_URL` comentado para dev
local (usa `hostUri` de Metro → IP LAN del PC). Para generar APK: descomentar y apuntar al
backend en Render + asegurarse de que Render tiene `HEALTH_GEMINI_API_KEY`.

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
- `SendClanChallengeNotificationUseCase` (revisión 2026-09-09) — push a todos los miembros
  del clan (excepto el retador) al crear un reto. `MotivationController.createClanChallenge`
  lo dispara fire-and-forget. Tipo `clan_challenge`, destino `screen: 'Challenges'`.
  `IMotivationRepository.getClanMemberIds(clanId)` — nuevo método de dominio implementado
  en `SupabaseMotivationRepository` con query a `clan_members`.
  `PushNotificationData.type` incluye `'clan_challenge'`. `InAppNotificationBanner` muestra
  icono `flag` naranja para este tipo.

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
**Auth doble**: `X-API-Key: MOTOR_API_KEY` (autenticación) + `X-OpenAI-Key: AI_API_KEY` (BYOK
— el Motor no lleva clave de OpenAI propia). **Sin `X-OpenAI-Key` cualquier endpoint de
generación (chat, flashcards, summary, podcast, tests) muere con `falta_openai_key`.**
`isMotorConfigured = Boolean(MOTOR_API_BASE_URL && MOTOR_API_KEY)`.

**Curso activo (revisión 2026-09-15)**: `ef7d941bea5f41d7` — Policía de Galicia completo
(40 temas, 4 bloques, 1784 páginas). Historial de IDs (cada re-ingesta del Motor genera uno nuevo,
por lo que los IDs anteriores devuelven `curso_no_encontrado` en cada llamada):
`0bed919120024e5f` (parcial, solo Tema 1, hasta 2026-09-09) →
`672e3a8bad0f45c8` (completo, 2026-09-09 → 2026-09-15) →
`ef7d941bea5f41d7` (completo, desde 2026-09-15).
El mapping vive en la tabla Supabase `training_courses`, no en el `.env`:
`GetCursoIdUseCase.execute(oposicion)` consulta la tabla; `MOTOR_DEFAULT_CURSO_ID` es solo
fallback. Actualizar el curso = ejecutar `training_courses.sql` en Supabase, sin tocar env vars.
**Auto-sync del cursoId — `CourseSyncService` (revisión 2026-09-15)**: cada re-ingesta
del Motor genera un `course_id` nuevo que invalida el anterior (`404 curso_no_encontrado`).
Para evitar tener que actualizar la BD manualmente cada vez, hay un servicio en
`infrastructure/scheduler/CourseSyncService.ts` que se ejecuta al arrancar el backend
y cada 30 min via cron:
1. Lee todas las filas de `training_courses` (esperando un `label` como "Policía de Galicia").
2. Consulta `GET /v1/courses` del Motor.
3. Filtra por `estado: "listo"` + match exacto de `titulo` (case-insensitive) contra el `label`.
4. Desempate: `creado` DESC (el más reciente gana), luego `n_temas` DESC.
5. Si el `motor_curso_id` en la tabla ≠ el ganador, hace `UPDATE` + refresca
   `training_topics` con los temas del curso nuevo (`GET /v1/courses/{id}` →
   `documentos[*].bloques[*].temas`, ordenados globalmente con `sort_order = 1..N`).
Log estructurado (`[course-sync] cambio detectado {oposicion, from, to}`,
`[course-sync] topics refrescados {count}`). El servicio nunca lanza — cualquier
fallo se degrada con `logger.warn` y conserva los valores previos de las tablas.

**Recovery manual** (solo si el auto-sync está deshabilitado o el Motor rechaza el
label): listar cursos con `GET https://ia.opox.ai/v1/courses` (headers `X-API-Key: opox-…`);
copiar el `id` con `estado: "listo"` a `training_courses` y a
`MOTOR_DEFAULT_CURSO_ID`/`MOTOR_BOE_CURSO_ID` en `.env` (local + Render).

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
  Respuesta tutor: `respuesta` → `content`. El campo `acciones` del Motor son trazas
  internas RAG (`{ tool, resumen, datos }`), NO botones UI — `chat()` devuelve
  `suggestedActions: undefined`; `SendMessageUseCase` aplica `DEFAULT_SUGGESTED_ACTIONS`.
  Flashcards: array directo `{front, back}`, no `{tarjetas:[{pregunta,respuesta}]}`.
  Summary: `{resumen:{titulo,ideas_clave,desarrollo}}` → `[{title,content}]`.
- `MotorFatigueClient`: mapeo request `hrv→hrv_ms`, `sueno_horas→horas_sueno`.
  Mapeo respuesta: `nivel:'verde'→'bajo'`, `'amarillo'→'medio'`, `'rojo'→'alto'`.
- `MotorAiClient`: `fail-fast` si TODAS las preguntas del job son `origen="generada"`
  sin `correcta_idx` y no están en el banco → `CompositeAiClient` cae a OpenAI.

**Scripts E2E**:
- `scripts/e2e_smoke_full.js` — **64/64 PASS** (2026-09-07). Cubre los 13 bloques de
  `FLUJO_NAVEGACION.md` + verificación explícita multi-curso. Usuario:
  `tester.contrax.2026@gmail.com`. Usar `ACCESS_TOKEN=xxx node scripts/e2e_smoke_full.js`.
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
| 3 | Salud | Frontend + backend completo. Fatiga: `HealthController.analyzeFatigue` → `MotorFatigueClient` `/v1/fatigue/biometrics`, try/catch → `buildFatigueLocally`. Siempre devuelve 200. IA directa (2026-09-09): `HealthAiClient` con Gemini (`gemini-3.6-flash`, 3 reintentos) para `POST /health/menus`, `/health/meditation`, `/health/study-technique`. Smoke test 3/3 PASS. Pendiente deploy a Render + `HEALTH_GEMINI_API_KEY` en env vars de Render. |
| 4 | Planificación | Frontend + backend completo (revisado y auditado post-testing: 10 bugs/gaps cerrados) |
| 5 | Motivación | Frontend + backend completo |
| 6 | Entrenamiento | Frontend + backend + IA completo. Motor RAG **activo** vía workaround banco (2026-09-04): job IDs coinciden con banco → `correcta_idx` resuelto por id-cruce → ~5.6 s, `articleRef` presente. INC-04 pendiente en el Motor (job result sin `correcta_idx` directo). Bloque 6.6 (2026-09-17): Banco de exámenes oficiales completo — upload PDF/DOCX + polling job + simulacro real desde el banco. Laboratorio rediseñado con tabs Débiles / Dominados (umbral 80%) y test quirúrgico dinámico (max 5 temas × 4 preguntas = 20). |
| 7 | Sesión de test activa | Frontend + backend + IA completo. Pista IA vía `/v1/modes/hint` del Motor (requiere `pregunta_id` real del banco). Fallback a OpenAI directo. |
| 8 | Aula Virtual / Tutor IA | Frontend + backend completo. Rediseño Figma (2026-08-26). Motor IA operativo (2026-09-04). Revisión 2026-09-09: (a) chat timeout 15→60s; (b) resúmenes/podcast fallback a `listTopics` cuando la caché está vacía; (c) podcast pipeline completo con `expo-audio` player Figma — `POST /v1/classroom/podcast` (Motor) + polling job + proxy `/tutor/podcast/audio/:filename` (Motor requiere `X-API-Key` que expo-audio no envía); (d) `X-OpenAI-Key` obligatorio en todos los endpoints Motor; (e) `TopicPicker` en flashcards y navegación desde chat; (f) mapeo `label='Tema N'` global. Curso activo `672e3a8bad0f45c8` (40 temas). |
| 9 | Factoría de Apuntes | Frontend + backend completo. Rediseño Figma completo (2026-08-26): 4 pantallas + 5 modales reestilizados. Upload end-to-end funcional en Android (PDF + galería + cámara). Pipeline OCR→tags→preguntas con AiApiClientStub. IA real esperando entrega del `BRIEF_IA_BLOQUE9.md` |
| 10 | Monitor BOE | Frontend + backend completo. Revisión 2026-09-05: mini-test con Motor real operativo — `GET /boe/changes/:id/mini-test` → sesión Motor idempotente, `POST /boe/changes/:id/mini-test/answer` → corrección + evidencia verbatim. Path stub (sesionId null) como fallback. 409 `mini_test_no_disponible` manejado. E2E 16/17 PASS. Fix API key `.env` (# como comentario). Revisión 2026-08-27: fallback catálogo, UPSERT idempotente, campo resumen, modal "Añadir norma", cross-bloque. |
| 11 | Tienda OPOX | Frontend + backend completo. Revisión 2026-08-28: motor earn automático por tests (1 O/acierto × multiplicador, cap 100 O/día), mini-test BOE hasta 5 O, `getTodayTestEarnings` en repo. Revisión 2026-08-27: puente earn→ledger, `POST /store/discounts/:id/redeem`, 8 pantallas sin mocks, canje por `redeemType`, fixes tabs UI. |
| 12 | Configuración | Frontend + backend completo. Revisión 2026-08-30 (3 pasadas): feedback real, tono IA multi-dispositivo, accesibilidad mapeada, stats reales con velocidad, subtextos API, PDF real (pdfkit+Supabase Storage URL firmada), racha caduca correctamente en lectura, botón envío TutorChat. Gaps pendientes: ThemeContext global, chat soporte (Intercom), RevenueCat (suscripción). |
| 13 | Notificaciones Push | Backend + mobile completo (3 fases: infraestructura base, hábito/retención, Supabase Realtime). Prueba end-to-end pendiente de EAS development build |

---

## Gaps-15-09-26 · notas clave

**Streak milestones ahora otorgan Opopoints (2026-09-15)** — fix crítico. Hasta
esta rama `SupabaseDashboardRepository.registerActivity` nunca daba los
+50/+100/+200/+300/+500/+1000 Opopoints que la app anunciaba en `MotivationHomeScreen`
como "Próximo hito: Racha de 7 días · +50 Opopoints". Ahora detecta el cruce
(`oldStreak < milestone.days <= newStreak`), suma `milestone.points` al `points`
del evento y persiste en `user_opopoints_ledger` con `reason:
'<original>+streak_milestone_<days>'`. Tabla `STREAK_MILESTONES` movida a
`packages/types/src/motivation.ts` como fuente de verdad; mobile lee desde
`apps/mobile/src/lib/streakMilestones.js` (misma tabla, duplicada para evitar
que mobile importe `@opox/types`).

**Helper `enrichTopicsWithLabels`** — `apps/backend/src/infrastructure/shared/topicLabels.ts`.
Antes `SupabaseTrainingRepository.listErrorPatterns` tenía el enriquecimiento
`topic_id → "Tema N"` en línea y `SupabaseConfigRepository.getProStats` no lo
aplicaba en absoluto (mostraba UUIDs hex crudos en Estadísticas Pro). Ahora
ambos usan el mismo helper + regex `HEX_ID_RE` para filtrar IDs sin resolver.

**Fases del plan macro — 5 fases fijas (2026-09-15)**: `MacroUseCase.PHASE_DEFS`
cambió de 4 pesos `[0.35, 0.30, 0.25, 0.10]` a 5 pesos `[0.20, 0.20, 0.20, 0.15,
0.25]`. `enrichMacroWithTopics` en `PlanningController` reparte los temas por
posición absoluta (chunks de `Math.ceil(N/4)`) y la fase `integral` recibe
TODOS los temas — no una división proporcional. Se elimina `PHASE_WEIGHTS`.

**Agenda con notificaciones locales (2026-09-15)** — `apps/mobile/src/lib/agendaNotifications.js`.
Programa 3 notificaciones locales (T-3d, T-2d, T-0 a las 09:00 hora local) al
crear una fecha; guarda los `identifier` en AsyncStorage `opox.agenda.notif.<id>`
para poder cancelarlos al borrar. Long-press sobre una fila abre confirmación
`Alert.alert` y llama `DELETE /planning/agenda/:id` (endpoint nuevo — ruta
constante `PLANNING.AGENDA_DELETE`).

**Barra de reto individual (2026-09-15)** — `ChallengesScreen.js`:
`percent = completedByMe ? max(clanPercent, myShare) : clanPercent`. Antes
retos completados por 1 de 2 miembros mostraban `myShare = 50%` — correcto —
pero un usuario que ya completó siempre veía "0 de 2 del clan" con barra vacía
hasta que el segundo miembro lo hiciera. La formula garantiza feedback visual
inmediato al usuario.

**Test quirúrgico dinámico (2026-09-15)** — `SurgicalTestPreviewScreen.js`:
consume `trainingApi.listErrorPatterns()` al montar, toma top-3 patrones y
distribuye `TOTAL_QUESTIONS=15` proporcionalmente al `failRate` de cada uno
(mínimo 1 pregunta por patrón, el último absorbe el redondeo). Antes hardcoded
`[{plazos:8}, {recursos:7}]` sin relación con el usuario, y solicitaba count=10
al backend — inconsistencia entre 15 anunciadas y 10 entregadas.

**Streaming de tests con job polling — Fase 2 (2026-09-15)**:
- 4 endpoints proxy nuevos: `POST /training/generate-stream`, `GET
  /training/job/:jobId`, `GET /training/session/:sessionId`, `POST
  /training/session/:sessionId/answer`. Rutas constantes en `packages/constants`:
  `TRAINING.GENERATE_STREAM`, `JOB_STATUS`, `SESSION_QUESTIONS`, `SESSION_ANSWER`.
- `MotorAiClient` añade 4 métodos: `startTestJob`, `getJobStatus`,
  `getSessionQuestions`, `postSessionAnswer`. Reutiliza el `questionBankCache`
  para resolver `correcta_idx` de preguntas incrementales (INC-04 workaround).
- Use cases en `application/training/StreamingTestUseCases.ts` — proxies
  delgados. Si `motorAiClient === undefined`, cada handler responde 503 y el
  mobile cae al flujo síncrono legacy (`trainingApi.generateQuestions`).
- Mobile: `useTestSession(jobId)` (`apps/mobile/src/hooks/useTestSession.js`)
  polling cada 2.5 s, timeout 90 s. `QuestionActiveScreen` acepta `jobId`
  opcional junto al `questions[]` legacy; renderiza loader con "N de M
  preguntas listas" hasta que llega la primera. `GeneratorConfigScreen` intenta
  streaming primero y solo cae al síncrono si el backend devuelve 503.

**Dark mode global — Fase 3 (2026-09-15)**:
- `theme.js` exporta `lightColors` y `darkColors` (paleta oscura pragmática:
  `#0F0F14` fondo, `#1A1A21` superficies, `#F0F0F2` textos). Alias
  `colors = lightColors` para no romper imports existentes.
- `useThemeColors()` hook en `apps/mobile/src/hooks/useThemeColors.js` retorna
  la paleta activa según `AccessibilityContext.isDark`.
- `AppText.js` aplica `darkColors.textDark` por defecto cuando el tema es oscuro
  y el estilo no declara `color` explícito. Textos con color naranja/verde/morado
  se respetan tal cual — mantienen el diseño.
- `ThemedSafeArea` reusable en `components/ThemedSafeArea.js` (patrón para
  pantallas nuevas).
- Pantallas migradas: `DashboardScreen`, `MotivationHomeScreen`, `SettingsScreen`,
  `ConfigAccessibilityScreen`, `StreakDetailScreen`. Patrón mínimo: `const
  themeColors = useThemeColors()` en el componente + `backgroundColor:
  themeColors.white/grayLight` en el SafeAreaView + `StatusBar` con
  `barStyle/backgroundColor` dinámicos.
- Pantallas NO migradas siguen viéndose en tema claro aunque el toggle esté ON
  — sin crashes ni comportamiento anómalo. Migración por pantalla en próximas
  iteraciones.

---

## Gaps-17-09-26 · notas clave

### Bloque 6.6 · Banco de Exámenes Oficiales (Motor IA) — funcionalidad nueva

Los usuarios pueden subir un examen en PDF/Word al banco compartido del curso;
las preguntas se extraen con OCR + LLM del Motor y quedan disponibles para
todos. Los simulacros del banco componen preguntas de un examen concreto
(`exam_id`) o del banco entero (`solo_oficiales`, `distribucion`).

**Rutas nuevas** en `packages/constants/src/routes.js`:
- `BANK_EXAMS: '/training/bank/exams'` — lista del banco del curso
- `BANK_EXAM_UPLOAD: '/training/bank/exams/upload'` — subir examen (JSON base64)
- `BANK_EXAM_JOB: '/training/bank/exams/jobs/:jobId'` — polling del OCR
- `BANK_MOCK_START: '/training/bank/mock-exams'` — arrancar simulacro
- `BANK_MOCK_RESULT: '/training/bank/mock-exams/:sessionId/result'` — resultado

**`MotorAiClient` — 5 métodos nuevos** para el Bloque 6.6:
- `listBankExams(cursoId, limit, offset)` → `GET /v1/bank/exams`.
- `uploadBankExam(input)` → `POST /v1/bank/exams` (multipart con `form-data`;
  requiere `X-OpenAI-Key` BYOK). Devuelve `202 + job_id`.
- `getBankExamJob(jobId)` → `GET /v1/jobs/{id}`. Enum de estados del Motor:
  `reserved | queued | running | done | error` (NO `pending | processing`).
  `cost_usd` viene en el ROOT del `JobOut`, no dentro de `resultado`.
- `startBankMock(input)` → `POST /v1/bank/mock-exams`. Acepta **`exam_id`**
  (en inglés, no `examen_id`) — verificado en `/openapi.json` 2026-09-17. El
  Motor devuelve `SesionOut` con preguntas SIN `correcta_idx` (vista pública).
- `getBankMockResult(sesionId)` → `GET /v1/tests/{id}/result`. Schema real
  `ResultadoSesionOut`: `{ sesion_id, respondidas, total, aciertos, nota_pct,
  tiempo_total_ms, por_tema[] }`. NO trae detalle pregunta-a-pregunta.

**Regla operativa crítica**: **la fuente autoritativa del Motor es
`https://ia.opox.ai/openapi.json`**, no la Postman collection. La Postman
`MotorIA_Motor_completo.postman_collection*.json` está desfasada al menos en:
(a) `SimulacroIn.exam_id` no listado; (b) enum de `JobOut.estado` distinto;
(c) `ResultadoSesionOut` con schema inventado. Ante un `422 extra_forbidden`
o `missing`, la respuesta del Motor te dice el nombre exacto — segunda fuente.

**Bugs pre-existentes descubiertos y corregidos**:
- `postSessionAnswer` enviaba `opcion_idx` cuando el Motor exige `elegida_idx`.
  Mapeo de respuesta leía `correctaIdx` (camelCase) — el schema `ResponderOut`
  es snake_case: `correcta_idx`. Ambos afectaban también al streaming Fase 2,
  pero en la práctica el streaming nunca llamaba a `postSessionAnswer` desde
  el mobile (`useTestSession.postAnswer` era código muerto).
- `mockExamId` en validador Zod era `.uuid()` — los IDs del Motor son hex de
  16 chars. Ampliado a `z.string().min(1).max(64).optional()`. Efecto cascada
  del bug: `saveAttempt` 400 → intento no persistido → tarjeta 0% completado,
  cero Opopoints y Laboratorio sin datos del examen.
- `training_attempts.mock_exam_id` y `mock_exam_progress.mock_exam_id` eran
  `uuid` con FK a `training_mock_exams`. Migrados a `text` sin FK vía
  `bloque6_bank_mock_ids.sql` y `bloque6_mock_progress_fix.sql`.
- `errorHandler` global aprendió a manejar `AxiosError`: 4xx del upstream se
  propagan con status real + `detail` del payload FastAPI extraído; 5xx como
  `502 upstream/<code>`. Antes cualquier fallo del Motor salía como `500
  common/internal-error` opaco.

**Mobile — flujo del banco**:
- `OfficialMocksScreen.js` consume `trainingApi.listBankExams()` (antes
  `listMocks` sobre Supabase). Enriquecido con `bestScore/completedAt/status/
  attemptCount` desde `ITrainingRepository.getBankExamStats({ userId,
  mockExamIds })` — nuevo método. Chips de filtro por procedencia (Todos /
  Oficiales / Profesor / Otros). FAB verde "＋ Subir examen".
- `ExamUploadScreen.js` (nuevo): formulario con `DocumentPicker` para PDF/DOCX
  + `FSFile.arrayBuffer()` + `bufferToBase64` en chunks. Fuentes disponibles al
  usuario: `profesor` u `otro` (el use case rechaza `oficial` con 403 salvo
  admin). Máximo 20 MB.
- `ExamUploadJobScreen.js` (nuevo): polling 3 s / timeout 5 min con card final
  contextual — éxito con métricas `extraidas/guardadas/duplicadas/sinTema`,
  aviso especial para `ya_incorporado` (dedupe por SHA-256) y `corte` (límite
  de coste alcanzado).
- `MockInstructionsScreen.startExam`: `trainingApi.startBankMock({ examId,
  nPreguntas, contrarrelojSeg })` → navega a `TrainingSession` con
  `mode: 'bank_mock' + sesionId`.
- `QuestionActiveScreen` — modo `bank_mock`: al confirmar respuesta,
  `postSessionAnswer(sesionId, { questionId, optionIndex })` → recibe
  `correcta / correcta_idx / explicacion / justificaciones / evidencia` → aplica
  corrección real a la pregunta ANTES de mostrar feedback. Spinner
  "Corrigiendo…" en el CTA mientras espera.

**Cleanup DB — única oposición operativa**:
`CourseSyncService` fallaba silencioso con `sin curso "listo" para label
"Justicia · Tramitación Procesal"` — el Motor no tenía un curso con ese título.
Los IDs hex del banco (curso `ef7d941bea5f41d7` de Policía de Galicia) no
matcheaban con `training_topics` de `justicia-tramitacion` (que tenía slugs
legacy `constitucion, ley-39`), y el Laboratorio descartaba los temas del
examen. Solución: cleanup full-stack `bloque6_dbclean_policia_galicia_only.sql`:
- Migra `raw_user_meta_data.oposicion` y `public.profiles.oposicion` de
  `justicia-tramitacion` → `policia-local-galicia` en TODOS los usuarios.
- Elimina la fila obsoleta de `training_courses`.
- Borra los `training_topics` viejos de `justicia-tramitacion` (los slugs
  legacy) para que el sync repueble desde el Motor.
- `training_courses.sql` deja solo `policia-local-galicia` como seed permanente.

**SQL a correr en orden en cualquier deploy nuevo** (todos idempotentes con
`RAISE NOTICE` para diagnóstico):
1. `bloque6_bank_mock_ids.sql` — `training_attempts.mock_exam_id` a text.
2. `bloque6_mock_progress_fix.sql` — `mock_exam_progress.mock_exam_id` a text.
3. `bloque6_dbclean_policia_galicia_only.sql` — cleanup completo.

### Laboratorio de errores rediseñado (2026-09-17)

`ErrorLabScreen` con tabs "Débiles · N / Dominados · N". Umbral
`MASTERY_THRESHOLD = 80`: temas con `domain >= 80%` pasan al tab "Dominados"
(verde), no aparecen como debilidades ni entran al test quirúrgico.

- `WeaknessItem` es contextual — misma card sirve para ambos tabs, cambia
  título (`Patrón de fallo detectado` vs `Tema dominado`), icono (X rojo vs
  check verde), copy ("Fallas el X%" vs "Aciertas el X%"), progress bar y
  porcentaje. La frase secundaria en dominados explica el mecanismo dinámico
  ("Si vuelves a bajar del 80%, aparecerá otra vez en tus debilidades").
- `SupabaseTrainingRepository.listErrorPatterns` bajó `total < 3 → total < 2`
  (mínimo estadístico para simulacros grandes con muchos temas).
- El filtro `HEX_ID_RE.test(topic)` ya no es necesario tras la limpieza de DB
  — con `training_topics` poblado correctamente por el sync, los hex se
  resuelven a "Tema N".
- Los items del tab "Dominados" se ordenan por `domain DESC` (los mejores
  primero — refuerzo positivo).

### Test quirúrgico dinámico (2026-09-17)

`SurgicalTestPreviewScreen`: cambio de fórmula.
- `MAX_SUBTOPICS = 5` (era 3), `QUESTIONS_PER_TOPIC = 4`, `MIN_TOTAL = 5`.
- Total dinámico: `max(5, patternsCount × 4)`, tope de 20 preguntas.
- Filtro previo `p.domain < 80` — los dominados nunca entran al quirúrgico.
- El `count` que envía al backend es dinámico (antes siempre 15).
- Distribución proporcional al `failRate` mantiene: 1 tema débil → 5 preguntas,
  3 → 12, 5+ → 20 (top-5 por fail_rate).

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
