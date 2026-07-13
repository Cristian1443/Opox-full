# BITÁCORA

Registro de avances por fecha. Notación en términos de producto — la parte
técnica queda en el código y en el historial de git.

---

## 2026-07-13 — Bloque 6 · Entrenamiento (frontend cerrado)

Rama de trabajo: `bloque-6-entrenamiento` (nacida de `main`).
Backend, integración de IA y pantalla de sesión activa de test quedan
explícitamente para la próxima sesión.

### Pantallas del bloque 6 · Entrenamiento

Se implementaron 9 pantallas cubriendo los cuatro modos de entrenamiento
del wireframe:

- **6.1 Hub de Entrenamiento** — cuatro cards con acento de color propio
  (naranja Generador, azul Foto-Test, verde Simulacros, morado Laboratorio
  de Errores). Entrada a cada modo desde un único punto.
- **6.2 Generador · Configuración** — slider de dificultad (fácil/media/difícil)
  con gradiente navy→rojo, slider de nº de preguntas (10/25/50/100) en naranja,
  toggle de modo contrarreloj y bottom-sheet picker de temario. Guarda el
  estado entre renders con PanResponder propio (sin librería externa). Modal
  "¿Salir sin guardar?" intercepta hardware-back y swipe-back en iOS antes de
  abandonar la pantalla con cambios.
- **6.3 Foto-Test · Cámara** — visor de cámara a pantalla completa con marco
  centrado de esquinas, botón obturador y acceso a galería. Usa `expo-camera`
  (`CameraView`) y `expo-image-picker`. La foto pasa como URI al flujo de
  análisis (6.4) en cuanto se captura o selecciona.
- **6.4 Foto-Test · Análisis IA** — pantalla inmersiva (fondo navy oscuro)
  con animación de pulso sobre el icono-cerebro morado y lista de pasos de
  procesamiento que se van activando uno a uno. Simula la espera mientras la
  IA extrae el concepto de la imagen. Al terminar navega a 6.5 con los datos
  del concepto detectado.
- **6.5 Foto-Test · Resultado** — muestra el concepto identificado, una
  flashcard interactiva (tap para girar, pregunta → respuesta) con animación
  rotateY, y dos CTAs: "Guardar" (bookmark) y "Añadir al plan". Botón
  "Generar test sobre este tema" abre `TestReadyModal` y luego navega al
  futuro `TrainingSession`.
- **6.6 Simulacros oficiales** — FlatList de exámenes reales por año con
  badge de estado (Pendiente / En curso con % de progreso / Completado con
  nota). Navega a instrucciones antes de arrancar.
- **6.7 Instrucciones de simulacro** — resumen de reglas (nº de preguntas,
  tiempo, sistema de penalización, sin pausa). Usa `NudgeModal` para
  confirmar antes de arrancar; navega al futuro `TrainingSession` con
  `source: 'official'`.
- **6.8 Laboratorio de Errores** — lista de patrones de error detectados
  (fail rate, % dominio, nivel de gravedad codificado por color). CTA
  "Atacar punto débil" navega a la vista previa del test quirúrgico (6.9).
- **6.9 Test Quirúrgico · Preview** — resumen generado por la IA del test
  que va a atacar el punto débil (tema, nº preguntas, distribución de
  subtemas con barra de porcentaje animada). CTA "Comenzar" navega al
  futuro `TrainingSession` con `source: 'surgical'`.

### Componentes nuevos

- `ConfirmExitModal` — modal reutilizable "¿Seguro que quieres salir? Los
  cambios se perderán" con "Quedarme" y "Salir". Usado en 6.2.
- `PhotoErrorModal` — modal de error al procesar la foto (reintentar / usar
  galería). Usado en 6.4.
- `TestReadyModal` — modal de confirmación "Test listo, ¿empezamos?" con
  resumen de parámetros. Usado en 6.5 y disponible para 6.7/6.9.

### Dependencias instaladas

- `expo-camera` — acceso a la cámara del dispositivo (6.3).
- `expo-image-picker` — selección desde galería (6.3).

### Wiring

- 9 rutas registradas en `OnboardingNavigator.js` bajo `// Bloque 6 · Entrenamiento`.
- El tab "Entrenamiento" del Dashboard navega a `TrainingHome` (6.1).
- Todos los flujos navegan sin crashes ni taps huérfanos con datos mock.

### Paleta y lenguaje visual del bloque

| Modo               | Color acento | Bg card    |
|--------------------|--------------|------------|
| Generador infinito | `#F26C4F`    | `#FFF1EC`  |
| Foto-Test (hub)    | `#2D6FB0`    | `#E8F0F8`  |
| Foto-Test IA (flujo interno) | `#7B4BC4` / `#A78BFA` | `#F1ECFA` |
| Simulacros oficiales | `#1f9d6b`  | `#EAF7F1`  |
| Laboratorio errores | `#E2483D`  | `#FDEBE9`  |
| Refuerzo IA (lab)  | `#7B4BC4`    | `#F1ECFA`  |

### Estado del bloque 6 · Entrenamiento

Cerrado en frontend. Los cuatro modos de entrenamiento navegan de punta a
punta con datos mock. Pendiente de la próxima sesión:

- **`TrainingSession`** — pantalla de sesión activa (preguntas una a una,
  temporizador, penalización, resultado final). Es el corazón del bloque;
  los tres modos (generador, simulacro, quirúrgico) navegan a ella con
  params distintos.
- **Backend del bloque 6**: endpoints de generación de preguntas
  (`/training/generate`), histórico de intentos, patrones de error
  (`/training/error-patterns`) y listado de simulacros oficiales
  (`/training/mocks`).
- **Integración de IA**: análisis de imagen (Foto-Test 6.3–6.5), generación
  inteligente de preguntas (Generador 6.2) y detección de patrones de error
  (Lab 6.8–6.9). El contrato con el responsable IA es el mismo que el de
  los otros bloques: prompts en `packages/ai/prompts/`, contratos en
  `packages/types/src/ai.ts`, cliente en `apps/backend/src/infrastructure/ai/`.
- **expo-camera en Android físico**: `CameraView` de la versión v57 requiere
  permisos en tiempo de ejecución — pendiente de validar en dispositivo real
  con Expo Go o EAS Build.

---

## 2026-07-13 (tarde) — Bloque 6 · Entrenamiento (backend + wiring completo)

Misma rama: `bloque-6-entrenamiento`.
Continúa la sesión de la mañana. Se cierra el backend del bloque y se conecta
el mobile a los endpoints reales. Queda pendiente solo `TrainingSession`.

### Contrato IA (Paso 1)

Se definió la estrategia de handoff para el responsable de IA:

- `packages/types/src/contracts/AiApiContract.ts` — interfaz TypeScript con
  tres métodos: `generateQuestions`, `analyzePhoto`, `generateSurgicalTest`.
- `apps/backend/src/infrastructure/clients/AiApiClientStub.ts` — stub con
  datos mock realistas (preguntas en español de Justicia/Admin General, flash-
  card de procedimiento administrativo). Permite que el backend funcione
  completo sin IA real conectada.
- `apps/backend/src/infrastructure/clients/AiApiClient.ts` — esqueleto del
  cliente real; cada método lanza `Error('[AiApiClient] X no implementado')`
  hasta que el responsable de IA lo rellene.
- `packages/ai/prompts/` — tres ficheros Markdown con el prompt, formato de
  entrada/salida y ejemplos para cada llamada IA.
- La IA se activa automáticamente en cuanto se rellenen `AI_API_BASE_URL`,
  `AI_API_KEY` y `AI_API_DEFAULT_MODEL` en `.env`.

### SQL Supabase (Paso 2)

`apps/backend/supabase/bloque6_entrenamiento.sql` (ejecutar en Supabase SQL
Editor antes de usar el bloque):

- `training_mock_exams` — catálogo de exámenes oficiales (solo lectura).
- `training_questions` — banco de preguntas por simulacro (solo lectura).
- `training_attempts` — historial de intentos del usuario (RLS por propietario).
- `training_attempt_responses` — respuesta a respuesta de cada intento.
- `training_bookmarks` — flashcards guardadas (RLS por propietario).
- Vista `training_error_patterns` — agrega fallos por tema para el Lab.
- Seed: 4 simulacros de Justicia · Tramitación (2019, 2021, 2022, 2023).

### Backend por capas (Paso 3)

Arquitectura limpia domain → application → infrastructure → presentation:

**Domain:** `MockExam`, `TrainingAttempt`, `TrainingBookmark`, `ErrorPattern`,
`MockExamNotFoundError`, `BookmarkNotFoundError`, `PhotoAnalysisError`,
`ITrainingRepository`.

**Application:** 10 use cases — `ListMockExamsUseCase`, `GetMockExamUseCase`,
`GenerateQuestionsUseCase`, `AnalyzePhotoUseCase`, `GenerateSurgicalTestUseCase`,
`SaveAttemptUseCase`, `ListErrorPatternsUseCase`, `ListBookmarksUseCase`,
`SaveBookmarkUseCase`, `DeleteBookmarkUseCase`.

Cálculo de score en `SaveAttemptUseCase`:
`score = max(0, (correctas − incorrectas × penalización) / total) × 10`.
Penalización 0.33 para simulacros oficiales, 0 para generador y quirúrgico.

**Infrastructure:** `SupabaseTrainingRepository` — los patrones de error se
agregan en memoria (no usando la vista SQL) porque el cliente admin bypassa RLS.
`listMockExams` hace dos queries en paralelo y une el mejor intento por examen.

**Presentation:** `TrainingController` (10 handlers), `trainingRoutes.ts`,
`trainingValidators.ts` (Zod). Todos los endpoints requieren sesión.
Límite del body subido a 5 MB para soportar base64 del Foto-Test.

**Rutas registradas:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/training/mocks` | Lista simulacros por oposición |
| GET | `/training/mocks/:id` | Detalle + preguntas |
| GET | `/training/mocks/:id/questions` | Solo preguntas |
| POST | `/training/generate` | Genera preguntas con IA |
| POST | `/training/photo-test` | Analiza foto con IA |
| POST | `/training/surgical` | Genera test quirúrgico |
| POST | `/training/attempts` | Guarda intento |
| GET | `/training/error-patterns` | Patrones de fallo del usuario |
| GET/POST | `/training/bookmarks` | Lista / crea bookmark |
| DELETE | `/training/bookmarks/:id` | Elimina bookmark |

### Wiring mobile → backend (Paso 4)

- `apps/mobile/src/api/training.js` — cliente HTTP con los 11 métodos.
- `OfficialMocksScreen.js` — carga desde `/training/mocks` con spinner de
  carga y empty state de error. Mapea `MockExamWithStatus` al formato de card
  (`bestScore × 10` → %).
- `ErrorLabScreen.js` — carga desde `/training/error-patterns`; el primer
  elemento (mayor failRate) es el patrón principal; los demás son debilidades.
- `PhotoTestCaptureScreen.js` — añadido `base64: true` a `takePictureAsync`
  y `launchImageLibraryAsync`; pasa `imageBase64` + `mimeType` a la pantalla
  de análisis.
- `PhotoTestAnalysisScreen.js` — la navegación ya no la manejan los timers;
  la API real determina el resultado. Los timers siguen para la animación
  cosmética. El path `mockError` de dev se preserva intacto.
- `PhotoTestResultScreen.js` — `saveDeck` llama a `trainingApi.saveBookmark`.

### Pruebas de endpoints (automatizadas)

Todos los endpoints probados con curl contra `localhost:3000` con token real
de Supabase (usuario `santigarciavel33@gmail.com`, sesión generada vía admin
magic link porque la contraseña en Supabase no coincide con la proporcionada).

| Endpoint | Resultado |
|----------|-----------|
| GET `/training/mocks` | ✅ 4 simulacros del seed |
| GET `/training/mocks/:id` | ✅ exam + questions[] |
| GET `/training/mocks/:id/questions` | ✅ (bug corregido: ruta no estaba registrada) |
| POST `/training/generate` | ✅ stub devuelve preguntas |
| POST `/training/photo-test` | ✅ stub devuelve concept/question/answer |
| POST `/training/surgical` | ✅ preguntas + distribution |
| POST `/training/attempts` | ✅ score calculado correctamente |
| GET `/training/error-patterns` | ✅ aggregación en memoria funciona |
| POST `/training/bookmarks` | ✅ guardado en Supabase |
| GET `/training/bookmarks` | ✅ listado |
| DELETE `/training/bookmarks/:id` | ✅ 204 |
| Sin token | ✅ 401 en todos los endpoints protegidos |

### Bugs encontrados y corregidos en esta sesión

1. **`GET /training/mocks/:id/questions` → 404** — ruta definida en
   `API_ROUTES` pero no registrada en el router ni implementada en el
   controller. Añadido `getMockQuestions` handler y registrado antes de
   `MOCK_DETAIL`.
2. **`PhotoTestAnalysisScreen` accedía a `data.flashcards[0]`** — el contrato
   `PhotoTestResult` tiene `question` y `answer` en el objeto raíz, no en un
   subarray. Corregido a `data.question` / `data.answer`.

### Pendientes del bloque 6

- **`TrainingSession`** — pantalla de sesión activa (preguntas, timer, score
  final). Todos los CTAs "Empezar test" / "Generar test" navegan a ella y
  actualmente terminan en un error de navegación. Es el único bloqueante para
  que el bloque 6 sea funcional de punta a punta.
- **Pruebas manuales en la app** — documentadas en el reporte de sesión;
  pendientes de ejecución por el usuario.
- **Seed de simulacros para "Administración General"** — el seed SQL actual
  solo tiene mocks para `justicia-tramitacion`. El usuario `santigarciavel33`
  tiene `oposicion = "Administración General"` en su perfil, por lo que
  Simulacros Oficiales muestra lista vacía hasta que se añadan datos.
- **expo-camera en Android físico** — validar `CameraView` y permisos con
  Expo Go o EAS Build.
- **Contraseña del usuario** — la contraseña `SantiGV2005` no coincide con
  la guardada en Supabase para `santigarciavel33@gmail.com`. Usar "Olvidé mi
  contraseña" en la app para resetearla.

---

## 2026-07-08 (noche) — Recuperación de contraseña (1.5) implementada de punta a punta

Cierra el pendiente dejado en la entrada de la tarde: `confirmPasswordReset`
ya no lanza el error de "pendiente de wiring", y ahora hay deep link real
para que el email de recuperación abra la app en la pantalla correcta.

- Backend: `confirmPasswordReset` canjea el `token_hash` del email por una
  sesión real (`verifyOtp({type:'recovery'})`) y actualiza la contraseña vía
  Supabase Admin. `requestPasswordReset` ahora manda `redirectTo` hacia el
  deep link de la app.
- Móvil: `app.json` tiene `scheme: "opox"`, y `App.js` registra un `linking`
  de React Navigation que enruta `opox://reset-password?token_hash=...` a
  `RecuperarPasswordNuevaScreen` (que ya sabía leer ese param, estaba
  construida para esto desde antes).
- Probado en real con usuario desechable: link de recovery → cambio de
  contraseña → login con la nueva funciona → login con la antigua se
  rechaza → reusar el mismo link una segunda vez se rechaza.
- **Pendiente manual del usuario, no se puede hacer desde el código**: en
  el Dashboard de Supabase hay que (1) añadir `opox://reset-password` a
  Authentication → URL Configuration → Redirect URLs, y (2) cambiar la
  plantilla de email "Reset Password" para que enlace a
  `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` en vez del
  `{{ .ConfirmationURL }}` por defecto. Sin esto, el código está listo pero
  el email real seguiría llevando a la página de Supabase, no a la app.
  Detalle técnico completo en `apps/backend/README.md`.

---

## 2026-07-08 (tarde) — Auditoría senior y cierre de huecos en Bloques 0-5

Se leyó el wireframe del Bloque 12 · Configuración (menú completo: perfil,
suscripción, dispositivos, tono IA, accesibilidad, estadísticas Pro,
ayuda, feedback, cerrar sesión/eliminar cuenta) para extraer solo lo que
cierra huecos reales de los Bloques 0-5 sin inventar dependencias de
bloques que no existen (11 Tienda, 3 Salud backend, 8 Tutor IA, 6/7/9/10
estadísticas — esos se dejan fuera, documentados como pendientes).

### Hueco crítico cerrado: la oposición del Bloque 0 nunca se guardaba
`OppositionSelectorScreen` corre ANTES de que exista sesión (Bloque 0 va
antes que el Bloque 1 · Acceso en el flujo), así que nunca pudo llamar a
`PATCH /auth/profile`. Se guarda la elección en AsyncStorage y
`SesionIniciadaScreen` la aplica de verdad en cuanto hay token real, justo
antes de entrar al Dashboard.

### Nueva pantalla de Ajustes (versión real del Bloque 12, no el wireframe completo)
- Perfil (nombre, email, oposición/especialidad editable).
- Cerrar sesión.
- Eliminar cuenta — requirió un endpoint nuevo, `DELETE /auth/me`, que no
  existía. Probado en real: borra el usuario de Supabase Auth y confirma
  por vídeo que las tablas de los Bloques 2/4/5 (notifications,
  study_plans, profiles...) se limpian solas vía `ON DELETE CASCADE`.
- El tab "Ajustes" de la barra inferior del Dashboard estaba muerto
  (ni siquiera era tocable) — ahora navega aquí.

### Otros huecos cerrados
- Planificación (4.2 Hoy): no había forma de crear una tarea desde la
  app, solo por API directa. Se añadió un "+" con formulario simple.
- Motivación (Muro de la Gloria, 5.4): el endpoint para autorreportar
  "aprobé mi examen" existía desde que se construyó el bloque pero nada
  lo llamaba. Ahora hay un botón real en la pantalla.

### Pendiente identificado (no abordado hoy, fuera de alcance)
- ~~`confirmPasswordReset` del Bloque 1 sigue sin implementar...~~ — resuelto
  esa misma noche, ver entrada de arriba.
- Bloque 3 (Salud) sigue sin backend — sus datos en el Dashboard y las
  tareas tipo `tutor`/`simulacro` de Planificación siguen siendo mock.
- Todo lo demás del Bloque 12 (suscripción/pagos, dispositivos wearables,
  tono de la IA, accesibilidad, Estadísticas Pro, ayuda, feedback) depende
  de bloques que no existen todavía (11, 3, 8, 6/7/9/10) — no se construyó
  a propósito, para no simular funcionalidad que no puede ser real.

---

## 2026-07-08 — Bloque 4 · Planificación y Bloque 5 · Motivación (frontend + backend)

Ambos bloques quedan funcionales de punta a punta (Cristian): pantallas
reales conectadas a un backend real en Supabase, no mock.

### Bloque 4 · Planificación
- 4.1 Home con los tres horizontes (Hoy/Semana/Oposición) de un vistazo.
- 4.2 Hoy: checklist de tareas del día con objetivo diario; al completarlo
  suma racha y Opopoints a través del mismo sistema del Bloque 2.
- 4.3 Semana: estado L-D (completado/parcial/hoy/próximo) y detalle del día
  seleccionado con bloques de estudio por franja horaria.
- 4.4 Macro: cuenta atrás al examen y ruta por 4 fases con reparto
  proporcional fijo (sin IA — pendiente para cuando exista el Bloque 8).
- 4.5 Agenda: fechas clave (plazos, exámenes, propias).
- 4.6 Editar plan: tests/día, días de estudio, intensidad y fecha de examen.
- Pop-ups: objetivo cumplido (con racha/Opopoints reales), días saltados,
  examen próximo — las dos últimas se calculan en `/planning/summary` y se
  muestran una vez por sesión desde la Home.

### Bloque 5 · Motivación
- 5.1 Home: racha, saldo de Opopoints y accesos a rankings/clanes/retos.
- 5.2 Detalle de racha: calendario de últimos 14 días y próximo hito.
- 5.3 Rankings semanal/global/por-oposición (vistas SQL para evitar joins
  manuales); "por tema" queda sin datos hasta que existan estadísticas por
  tema (Bloque 6/7).
- 5.5/5.6/5.7 Clanes: crear/unirse (uno por usuario), detalle con miembros y
  puesto en el ranking de clanes, chat por **polling** (no realtime).
- 5.8 Retos de clan: autorreportados, otorgan Opopoints una sola vez.
- Fase 2 (marcada así en el propio wireframe): Muro de la Gloria ya lee
  datos reales (autorreporte de aprobados) aunque hoy esté vacío para todos;
  Duelos en vivo 1vs1 es solo una pantalla visual — necesitan matchmaking en
  tiempo real que no existe.

### Decisión: tabla `profiles`
Como PostgREST no permite JOIN contra el schema `auth`, se creó
`public.profiles` como espejo de `auth.users.raw_user_meta_data`,
sincronizado desde `SupabaseAuthRepository` en registro/`updateProfile`
(con backfill SQL para cuentas ya existentes). La necesitaban tanto los
rankings como las listas de miembros de clan.

### Pendiente conocido
- Backend del Bloque 3 (Salud) sigue sin construir — sus widgets en el
  Dashboard y las tareas de tipo `tutor`/`simulacro` del Bloque 4 siguen sin
  fuente de datos real hasta entonces.
- Sin tests automatizados todavía (mismo estado que bloques anteriores).

---

## 2026-07-07 — Bloque 3 · Salud (frontend) cerrado

Rama de trabajo: `bloque-3-salud` (nacida de `main`, ya con el dashboard de
Cristian). Backend y contratos de IA quedan explícitamente para próxima sesión.

### Pantallas del bloque 3 · Salud
Se implementaron las 13 pantallas del wireframe con dos rondas de iteración
(primera pasada + alineación con mockups entregados por el cliente en
`Lista de observaciones y mejoras bloque 3.docx`):

- **3.1 Home de Salud** — resumen del wearable (energía, cardio, estrés y
  recuperación, respiración y sueño). Entrada al motor de fatiga y a Consejos.
- **3.2 Conexión de dispositivo** — lista de wearables compatibles (Apple
  Watch, Garmin, Fitbit/Pixel, Samsung, Solo smartphone) con estado conectado /
  disponible.
- **3.2 · ok · Pop-up "Conectado correctamente"** — modal de éxito reutilizable
  (parqueado para escenarios de reconexión rápida).
- **3.2 · err · Pop-up "Error de conexión"** — modal con reintentar naranja y
  cancelar como link.
- **3.3 Flujo de emparejamiento** — anillo giratorio con icono del wearable
  centrado y lista de pasos que se van tickando.
- **3.4 Detalle de métrica (genérico)** — reutilizable para HRV, ritmo,
  FC reposo, SpO₂, sueño. Soporta métricas donde "menos = mejor" (FC reposo).
- **3.4b Motor de fatiga** — desglose de las 5 señales que cruza la app para
  calcular el estado ("ningún reloj mide fatiga directa").
- **3.5 Aviso de descanso · Respiración guiada** — círculos concéntricos verdes
  con animación 4-4, tap sobre el círculo para pausar/reanudar.
- **3.6 Home de Consejos** — 3 categorías con fondos pastel (estudio azul,
  alimentación verde, meditación morado).
- **3.7 Cómo estudiar mejor** — 4 técnicas (Pomodoro, repetición espaciada,
  active recall, curva del olvido) + CTA navy al Tutor IA.
- **3.8 Alimentación (home)** — tab Alimentos con alimentos que potencian la
  memoria; el tab Menús navega al listado completo.
- **3.8b Menús equilibrados** — listado filtrable con badge de autoría
  (IA vs Dietista colegiada).
- **3.8c Detalle de menú / receta** — desglose por comida con ingredientes,
  preparación, "añadir a lista de la compra" y "añadir al plan".
- **3.9 Meditación (listado)** — card recomendada del día grande en morado +
  sesiones estándar.
- **3.9a Reproductor de sesión** — fondo morado oscuro, barra de progreso
  lineal, controles de play/pause y skip ±15 s.

### Iteraciones de diseño contra mockup del cliente
Primera pasada con paleta iOS por defecto; corregida a la paleta OPOX
(naranja marca) y luego alineada al mockup:
- Header estandarizado en todo el bloque: chevron naranja + título bold
  grande, sin barra ni divider. Componente compartido `HealthScreenHeader`.
- Tarjeta de energía en 3.1 rediseñada a fondo navy oscuro con anillo circular
  de porcentaje.
- Layout de métricas de 3.1 pasado a grid de 2 y 3 columnas para casar con
  el mockup.
- Botones de acción (Reintentar, Tutor IA, Comenzar a usar) unificados al
  naranja de marca en pill.
- CTA "Tutor IA" en 3.7 restilado a card navy + botón pill naranja según el
  mockup.
- 3.6 con fondos pastel por categoría (más amigable que el diseño previo).
- 3.9 y 3.9a rediseñadas al lenguaje morado del mockup (meditación).
- 3.5 rediseñada con círculos concéntricos verdes sobre navy.

### Placeholder para el Tutor IA
Se creó una pantalla temporal `AITutorPlaceholder` a la que apuntan todos los
CTAs "Tutor IA" del bloque. Evita crashes en el flujo mientras el bloque 4 no
existe. Preserva el `technique` como param para pre-cargar contexto cuando
llegue la integración real.

### Wiring del bloque
- Dashboard (bloque 2 de Cristian) → widget "Salud" → 3.1 Home de Salud.
- 3.1 → gestor del wearable en el header, motor de fatiga en la card de
  energía, consejos al final.
- Consejos → cada categoría lleva a su pantalla dedicada.
- Menús → detalle de menú/receta (con `addedMeals` per-meal, no global).

### Estado del bloque 3 · Salud
Cerrado en frontend. Todos los flujos navegan sin crashes ni taps huérfanos.
Datos mock; no hay backend ni IA aún.

### Pendientes conocidos (próxima sesión)
- **Backend del bloque 3**: contratos de datos (`Metric`, `FatigueState`,
  `Menu`, `MeditationSession`), endpoints REST y adaptador para datos del
  wearable (probablemente HealthKit iOS + Health Connect Android en fases
  posteriores).
- **Integración de IA**: el responsable IA proporcionará prompts y contratos.
  Estructura pactada:
  - `packages/ai/prompts/` — prompts, system messages y ejemplos (versionado,
    sin secretos).
  - `packages/types/src/ai.ts` — contratos request/response IA compartidos.
  - `apps/backend/src/infrastructure/ai/` — cliente/adaptador al proveedor
    (streaming, retry, etc.). Nunca desde el móvil, para no exponer la key.
  - `apps/backend/.env` — `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.
- La lista de menús de Alimentación distingue autoría IA vs dietista humano;
  el contrato de datos debe fijar `type: 'AI' | 'Human'` y `authorId?` desde
  el primer diseño (implicaciones de compliance/etiquetado).
- El motor de fatiga cruza 5 señales — la salida de la IA debe respetar ese
  shape (`FatigueSignal[]` + nivel global).

---

## 2026-07-05 — Cierre definitivo del bloque 1 · Acceso

### Biometría completada y validada en dispositivo físico Android

- **Huella dactilar en Android**: flujo completo validado en dispositivo físico
  con Expo Go. Registro de clave Ed25519, vínculo al backend y login biométrico
  challenge–response funcionando de extremo a extremo.
- **Face ID en iOS**: código listo y configuración completa. Se añadió el plugin
  `expo-local-authentication` con `faceIDPermission` en `app.json` para que
  `NSFaceIDUsageDescription` se inyecte en builds iOS. Requiere development
  build (EAS) para probarse — Expo Go no expone Face ID en iOS por diseño.
- **Reconocimiento facial Android excluido**: el face unlock de Android es
  biometría de clase 2 (débil) e incompatible con `SecureStore requireAuthentication`
  que exige clase 3 (fuerte). La app solo ofrece huella en Android y Face ID/
  Touch ID en iOS.
- **Ícono biométrico dinámico** en LoginScreen: `finger-print` para huella,
  `scan-outline` para Face ID, según lo que detecte el dispositivo.
- Se creó `apps/mobile/eas.json` con perfiles `development`, `preview` y
  `production` listos para el primer EAS Build.

### Correcciones de flujo y navegación

- **Dev Menu eliminado**: `initialRouteName` cambia de `DevMenu` a `Splash`.
  La app arranca ahora con el flujo natural completo sin bypass de desarrollo.
- **Logout limpia biometría**: `authApi.logout()` llama a `disableBiometric()`
  en paralelo con `clearSession()`. Antes, el estado biométrico quedaba en
  SecureStore indefinidamente y la pantalla de BioLink nunca volvía a aparecer.
- **DashboardPlaceholder**: el botón "Volver al Dev Menu" pasa a ser
  "Cerrar sesión" con logout real, para poder reiniciar el flujo desde cualquier
  sesión de prueba.
- **SecureStore en web**: `isBiometricLinked()` ahora retorna `false`
  inmediatamente en web, evitando el crash `getValueWithKeyAsync is not a function`
  al ejecutar el bundle web.

### Integración de ramas y dependencias

- Se creó la rama `release/bloque-1` fusionando `bloque-1-acceso` con `main`.
  Conflictos resueltos manteniendo la estructura de monorepo (pnpm/turbo).
  Archivos de la estructura antigua (`src/hooks/`, `src/navigation/`) reubicados
  a `apps/mobile/src/`.
- Instalada dependencia `@react-native-community/netinfo` que faltaba para
  el hook `useNetworkWatcher` aportado por `main`.

### Estado del bloque 1 · Acceso
Cerrado por completo desde la perspectiva de usuario y de código. Validado
en Android físico con Expo Go. La única limitación restante es de entorno de
prueba: Face ID en iOS necesita un EAS Build para poder probarse.

### Pendientes conocidos
- Verificar dominio propio en Resend para enviar OTPs a cualquier email
  (ahora sandbox: solo al email titular de la cuenta Resend).
- Deep link para consumir el enlace de recuperación de contraseña desde el
  correo (pantalla 1.5c).
- EAS Build iOS para validar Face ID en iPhone físico.
- Hosting definitivo del backend (ahora solo funciona en local).

---

## 2026-07-03 — Backend en marcha y biometría del bloque 1

### Infraestructura del backend
- El repositorio pasó a estructura de **monorepo** (código móvil, backend y
  paquetes compartidos separados). Facilita mantener tipos y constantes
  únicos en una fuente de verdad.
- Backend propio en **Node + Express** con arquitectura por capas
  (presentation → application → domain → infrastructure). Documentado en
  `apps/backend/README.md`.
- Base de datos y autenticación en **Supabase** (proyecto europeo, plan
  gratuito). Se eligió sobre Firebase por su modelo relacional (Postgres),
  costes previsibles y mejor encaje con el resto de bloques (chat de clanes,
  storage, RLS).
- Envío de emails vía **Resend** integrado con Supabase por SMTP. En modo
  sandbox durante desarrollo (solo envía al email del titular de Resend);
  cuando saltemos a beta cerrada hay que verificar el dominio.

### Bloque 1 · Acceso conectado al backend real
Todas las pantallas del bloque dejaron de operar con datos simulados y
consumen el backend:
- **Registro** por email y contraseña: crea el usuario y dispara el envío
  del código de verificación al email.
- **Verificación por código OTP** de 6 dígitos.
- **Login** con credenciales validadas contra el backend.
- **Recuperación de contraseña**: pide el email → envía enlace de
  recuperación (el flujo del *deep link* para consumirlo desde el correo
  queda pendiente para siguiente sprint).
- **Aceptación de términos y política**: guarda momento y versión aceptada
  en el perfil del usuario.
- **Cierre de sesión** con revocación real en el backend.

### Estados de error del bloque 1 alineados con mockups
- Email ya registrado → modal con "Ir a iniciar sesión" y "Usar otro email".
- Credenciales incorrectas → borde rojo en inputs + mensaje inline.
- Cuenta bloqueada tras varios intentos fallidos → modal con countdown y
  botón "Restablecer contraseña".
- Sin conexión → toast rojo abajo sin bloquear la interacción.
- Face ID / huella no reconocido → pantalla oscura con opciones
  "Reintentar" o "Usar contraseña".

### Biometría (Face ID / huella)
- Detecta las capacidades del dispositivo y ofrece la pantalla de vínculo
  solo cuando aplica.
- El usuario puede activar la biometría después del primer login. En
  accesos siguientes aparece el botón "Entrar con Face ID/huella" en la
  pantalla de Login.
- Cada intento de acceso biométrico usa un desafío único emitido por el
  backend y firmado en el dispositivo (nadie puede reutilizar una firma).
- La credencial biométrica solo vive en el llavero del propio dispositivo
  (Keychain iOS / Keystore Android). El backend no la almacena.

### Validación con pruebas
- 17 pruebas manuales contra el backend cubriendo: healthcheck,
  validaciones de formato de datos, credenciales incorrectas, códigos
  inválidos, tokens caducados y flujo completo autenticado
  (perfil → aceptar términos → cerrar sesión).
- 16 de 17 pasan. La restante (biometría end-to-end) requiere dispositivo
  físico o emulador con biometría configurada — pendiente de ejecutar en
  Android real.

### Estado del bloque 1 · Acceso
Cerrado desde la perspectiva de usuario. Falta el hosting definitivo del
backend para poder usarse desde cualquier dispositivo sin depender de una
máquina de desarrollo.

### Pendientes conocidos
- Verificar dominio propio en Resend para poder enviar OTPs a cualquier
  email (ahora sandbox: solo al titular de Resend).
- Deep link para consumir el enlace de recuperación de contraseña desde el
  correo (pantalla 1.5c).
- Prueba de biometría en dispositivo físico (bloqueada por versión de Expo
  Go en Play Store, en resolución).

---

## 2026-07-02 — Bloque 1 · Acceso frontend completo

### Pantallas del bloque 1 · Acceso
Se implementaron las 10 pantallas del wireframe, con foco en fidelidad
visual al mockup y usabilidad:

- 1.1 Pantalla de entrada (bienvenida + botones "Crear cuenta" / "Ya tengo
  cuenta").
- 1.2 Registro con email/contraseña, botones sociales (Google/Meta/Apple),
  indicador de fuerza de contraseña.
- 1.3 Login con email/contraseña y atajo biométrico.
- 1.4 Bio-Link (activación de Face ID / huella tras el primer login).
- 1.5a Recuperar contraseña — solicitud del email.
- 1.5b Recuperar contraseña — confirmación de envío del enlace.
- 1.5c Recuperar contraseña — nueva contraseña con barra de fuerza
  segmentada.
- 1.6 Verificación por OTP de 6 dígitos.
- 1.7 Términos y privacidad con aceptación explícita del usuario.
- 1.x ok · Estado "Sesión iniciada" (transición al Dashboard).

### Estados de error del bloque 1
Todas las variantes definidas en el wireframe:
1.2 err (email ya registrado), 1.3 err (credenciales), 1.3 err (cuenta
bloqueada), 1.4 err (biometría no reconocida), 1.5 err (email inválido),
1.x err (sin conexión).

### Iteraciones de diseño
- Primera pasada con paleta genérica; corregida contra los pantallazos del
  mockup entregados por el cliente.
- Ajuste de bordes de botones, radios, jerarquía tipográfica y estados
  activos/deshabilitados para casar al 100 % con el mockup.
- Errores repensados: los transitorios como toast/inline; los que exigen
  acción (email duplicado, cuenta bloqueada) como modal centrado.

### Herramientas de trabajo interno
- Menú de desarrollo (Dev Menu) accesible al arrancar la app, con acceso
  directo a cualquier pantalla o al flujo natural completo. Facilita la
  validación visual contra el mockup sin necesidad de recorrer todo el
  flujo cada vez.
- Pantalla temporal de "Dashboard placeholder" al final del flujo del
  bloque 1 para cerrar la navegación mientras el bloque 2 se aborda.
