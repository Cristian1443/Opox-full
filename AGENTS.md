# Guía para agentes

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Estado del código (2026-07-13)

Ver `BITACORA.md` para el diario por fecha en términos de producto. Bloques
1 (Acceso), 3 (Salud) y 6 (Entrenamiento) cerrados a nivel frontend. Bloques
2 (Dashboard), 4 (Planificación) y 5 (Motivación) tienen frontend + backend
completos (Cristian). Bloque 6 tiene frontend + backend completo; la única
pantalla pendiente es `TrainingSession` (sesión activa de test).

**Ojo con la numeración**: el wireframe oficial (opox.netlify.app) es la
fuente de verdad — Bloque 4 = Planificación, Bloque 5 = Motivación, Bloque 8
= Aula Virtual/Tutor IA. Una nota anterior de este archivo llamaba "bloque 4"
al Tutor IA por error (numeración de trabajo, no la del wireframe); el CTA
`navigation.navigate('AITutor', { technique })` del bloque 3 sigue apuntando
correctamente a la pantalla placeholder — solo cambia el número de bloque
correcto para cuando se implemente de verdad (Bloque 8).

## Convenciones del bloque 3 · Salud

### Estructura de archivos
- Pantallas en `apps/mobile/src/screens/health/` (una pantalla por archivo,
  `PascalCaseScreen.js`).
- Componentes compartidos del bloque en `apps/mobile/src/components/`
  (`HealthScreenHeader`, `ConnectedSuccessModal`, `ConnectionErrorModal`).
- Rutas registradas en `apps/mobile/src/navigation/OnboardingNavigator.js`
  bajo la sección `// Bloque 3 · Salud`.

### Header estándar
Todas las pantallas de Salud (excepto 3.5 y 3.9a, que son inmersivas oscuras)
usan `HealthScreenHeader`:

```jsx
<HealthScreenHeader
    title="Salud"
    onBack={() => navigation.goBack()}
    right={<OptionalRightSlot />}
/>
```

Patrón: chevron naranja `colors.primary` + título bold `colors.text` grande
alineado a la izquierda. Sin barra de navegación con borde inferior. Variant
`dark` para pantallas oscuras.

### Theme y tokens
`apps/mobile/src/theme.js` expone:
- Paleta OPOX: `primary` (#f26535 naranja), `dark` (#0d1b2a navy).
- Tokens semánticos: `background`, `card`, `text`, `textSecondary`,
  `separator`, `success/successBg`, `warning/warningBg`, `error/errorBg`.
- `spacing`: `xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`.

Prefiere tokens sobre valores hex directos. Colores de acento por categoría
(azul consejos, verde salud, morado meditación) pueden ser inline en la
pantalla que los usa.

### SafeAreaView
Usar siempre `SafeAreaView` de `react-native-safe-area-context` con
`edges={['top', 'left', 'right']}`. El de `react-native` está deprecado en
RN 0.86.

### Íconos
`@expo/vector-icons` — usar Ionicons por defecto en el bloque 3. Verifica que
el nombre existe en la librería (no todos los `-outline` de un pack están en
otro). MaterialCommunityIcons solo cuando Ionicons no cubra el caso.

## Dónde va la IA (pactado, aún no implementado)

Cuando el responsable de IA entregue prompts/contratos:
- `packages/ai/prompts/` — prompts, system messages y ejemplos. Versionado.
  Sin secretos.
- `packages/types/src/ai.ts` — contratos request/response compartidos entre
  mobile y backend.
- `apps/backend/src/infrastructure/ai/` — cliente al proveedor con streaming,
  retry, timeout. **Nunca desde el móvil** — la API key vive en el backend.
- `apps/backend/.env` — `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.

El móvil habla con nuestro backend, el backend habla con el proveedor de IA.

Los CTAs del bloque 3 que apuntan a Tutor IA (`navigation.navigate('AITutor',
{ technique })`) ya pasan contexto por params. Cuando el Bloque 8 exista,
esos params se consumen para pre-cargar el prompt. El Bloque 4 (`intensity`
de `study_plans`) también deja el terreno listo: hoy solo se guarda el
ajuste, sin lógica de reparto real (ver sección de Planificación abajo).

## Contratos de datos pendientes (backend del bloque 3)

Antes de escribir endpoints, fijar en `packages/types/`:
- `Metric` (health metric con `title`, `currentValue`, `unit`, `baseValue`,
  `trend`, `lowerIsBetter`) — la pantalla 3.4 ya consume ese shape.
- `FatigueState` con `signals: FatigueSignal[]` (5 señales) + nivel global —
  ver 3.4b para el shape esperado.
- `Menu` con `type: 'AI' | 'Human'` y `authorId?` — importante por compliance
  (etiquetado obligatorio de autoría).
- `MeditationSession` con `title`, `subtitle`, `duration`, `type` — la
  3.9/3.9a ya consumen ese shape.

## Convenciones del bloque 6 · Entrenamiento

### Estructura de archivos
- Pantallas en `apps/mobile/src/screens/training/` (una pantalla por archivo,
  `PascalCaseScreen.js`).
- Rutas registradas en `apps/mobile/src/navigation/OnboardingNavigator.js`
  bajo la sección `// Bloque 6 · Entrenamiento`.
- Componentes nuevos del bloque en `apps/mobile/src/components/`:
  `ConfirmExitModal`, `PhotoErrorModal`, `TestReadyModal`.

### Pantallas implementadas (frontend solo, datos mock)
| Ruta (Stack)          | Archivo                       | Descripción                            |
|-----------------------|-------------------------------|----------------------------------------|
| `TrainingHome`        | `TrainingHomeScreen.js`       | 6.1 Hub — 4 modos de entrenamiento     |
| `GeneratorConfig`     | `GeneratorConfigScreen.js`    | 6.2 Configurar generador infinito      |
| `PhotoTestCapture`    | `PhotoTestCaptureScreen.js`   | 6.3 Cámara / galería                   |
| `PhotoTestAnalysis`   | `PhotoTestAnalysisScreen.js`  | 6.4 Análisis IA (pantalla inmersiva)   |
| `PhotoTestResult`     | `PhotoTestResultScreen.js`    | 6.5 Resultado + flashcard              |
| `OfficialMocks`       | `OfficialMocksScreen.js`      | 6.6 Listado de simulacros oficiales    |
| `MockInstructions`    | `MockInstructionsScreen.js`   | 6.7 Instrucciones antes del simulacro  |
| `ErrorLab`            | `ErrorLabScreen.js`           | 6.8 Laboratorio de errores             |
| `SurgicalTestPreview` | `SurgicalTestPreviewScreen.js`| 6.9 Preview del test quirúrgico IA     |

### Ruta pendiente
`TrainingSession` — sesión activa de test (preguntas una a una, timer,
resultado final). Todos los flujos terminales navegan a ella con params:
- Generador: `{ source: 'generator', difficulty, questionCount, timedMode, topicId }`
- Simulacro: `{ source: 'official', mockId, year }`
- Quirúrgico: `{ source: 'surgical', errorPatternId, topic }`
- Foto-Test: `{ source: 'photo', concept, questionsCount }`

No registrar `TrainingSession` hasta que exista la pantalla real — si se
registra un componente vacío romperá el flujo de test de los tres modos.

### Header estándar
Todas las pantallas del bloque 6 usan `ScreenHeader` compartido (mismo que
Bloques 2/4/5), con `title` y `onBack`. Las pantallas inmersivas (6.3
cámara y 6.4 análisis) tienen header propio en overlay oscuro — no usan
`ScreenHeader`.

### Paleta de colores
Cada modo tiene su acento propio; el flujo IA interno (6.4–6.5 y 6.9) usa
morado aunque la card de entrada sea de otro color:
- Generador infinito: `#F26C4F` (naranja); bg card `#FFF1EC`
- Foto-Test (hub): `#2D6FB0` (azul); bg `#E8F0F8`
- Foto-Test IA (análisis/resultado): `#7B4BC4` / `#A78BFA` (morado); bg `#F1ECFA`
- Simulacros oficiales: `#1f9d6b` (verde); bg `#EAF7F1`
- Laboratorio de errores: `#E2483D` (rojo); bg `#FDEBE9`
- Refuerzo IA dentro del lab: `#7B4BC4` (morado); bg `#F1ECFA`

### Dependencias del bloque
- `expo-camera` (`CameraView`, `useCameraPermissions`) — pantalla 6.3.
- `expo-image-picker` — selección desde galería en pantalla 6.3.
- Permisos de cámara ya declarados en `app.json`; validar en dispositivo
  físico con Expo Go o EAS Build antes de considerar 6.3 cerrado en hardware.

### API mobile → backend (implementado)
`apps/mobile/src/api/training.js` — 11 métodos siguiendo el mismo patrón
`{ data, error }` que `planningApi` / `motivationApi`:
- `listMocks(oposicion)` → GET `/training/mocks?oposicion=X`
- `getMock(id)` / `getMockQuestions(id)` → detalle y preguntas
- `generateQuestions(body)` → POST `/training/generate`
- `analyzePhoto(imageBase64, mimeType, oposicion)` → POST `/training/photo-test`
- `generateSurgical(oposicion, count)` → POST `/training/surgical`
- `saveAttempt(body)` → POST `/training/attempts`
- `listErrorPatterns()` → GET `/training/error-patterns`
- `listBookmarks()` / `saveBookmark(body)` / `deleteBookmark(id)` → bookmarks

La oposición del usuario se lee de la sesión guardada:
`session?.user?.oposicion ?? session?.user?.user_metadata?.oposicion ?? 'justicia-tramitacion'`.

### Contratos de datos (implementados en `packages/types/src/training.ts`)
`GeneratedQuestion`, `PhotoTestResult`, `SurgicalTestResult`, `MockExamDTO`,
`ErrorPatternDTO`, `TrainingAttemptDTO`, `TrainingBookmarkDTO` + tipos de
request (`GenerateQuestionsRequest`, `AnalyzePhotoRequest`, etc.).

### Integración de IA (stub activo, real pendiente)
Los tres puntos de entrada de IA están cableados en el backend con un stub
que devuelve datos mock realistas. Para conectar IA real:
1. Rellenar `AI_API_BASE_URL`, `AI_API_KEY`, `AI_API_DEFAULT_MODEL` en `.env`.
2. Implementar los 3 métodos en `AiApiClient.ts` siguiendo los prompts de
   `packages/ai/prompts/` y el contrato de `AiApiContract.ts`.
**La API key nunca va al móvil** — el mobile habla con nuestro backend, el
backend habla con el proveedor de IA.

### Seed de datos pendiente
El SQL seed (`bloque6_entrenamiento.sql`) incluye 4 simulacros solo para
`oposicion = 'justicia-tramitacion'`. Añadir filas para otras oposiciones
antes de probar con usuarios con distinta oposición. La tabla
`training_questions` está vacía — necesita un script de importación de las
preguntas reales de cada examen oficial.

---

## Convenciones del bloque 4 · Planificación y bloque 5 · Motivación

Ambos siguen exactamente el patrón de capas del backend descrito en
`apps/backend/README.md` (domain → application → infrastructure/presentation,
DI manual en `container.ts`) y el mismo estilo de pantalla que el Bloque 2
(header con `ScreenHeader` compartido en `apps/mobile/src/components/`,
`NudgeModal` reutilizado para los pop-ups de ambos bloques).

- Pantallas en `apps/mobile/src/screens/planning/` y `.../motivation/`.
- Clientes HTTP en `apps/mobile/src/api/planning.js` y `.../motivation.js`,
  mismo patrón `{ data, error }` que `authApi`/`dashboardApi`.
- Tablas nuevas en `apps/backend/supabase/bloque4_planificacion.sql` y
  `bloque5_motivacion.sql` — pégalas en Supabase SQL Editor antes de probar
  esas rutas (ver README del backend para el orden).
- **Sin IA todavía**: el reparto de fases del horizonte macro (4.4) y la
  "intensidad" del plan (4.6) son heurísticas fijas, no llamadas a IA. No
  añadas lógica de IA aquí hasta que el Bloque 8 exista y defina el contrato.
- **`profiles` es un espejo, no la fuente de verdad**: el perfil real vive en
  `auth.users.raw_user_meta_data` (Bloque 1). `public.profiles` solo existe
  porque PostgREST no puede hacer JOIN contra el schema `auth` — se
  sincroniza desde `SupabaseAuthRepository` en registro y `updateProfile`.
  Si añades un campo de perfil nuevo, actualízalo en los dos sitios.
- **Chat de clan es polling, no realtime** — decisión consciente para el MVP
  (ver `ClanChatScreen.js` y `listClanMessages`). No asumas websockets.
- **Fase 2 del Bloque 5** (Muro de la Gloria, Duelos en vivo 1vs1): el propio
  wireframe las marca como posteriores. Muro de la Gloria ya tiene backend
  real de solo lectura (`listGraduates`); Duelos es una pantalla puramente
  visual sin datos (`DuelsPlaceholderScreen.js`) — necesita matchmaking en
  tiempo real que no existe.

## Convenciones generales

- Nombres en inglés para el código; comentarios explicativos en español.
- Barrel files (`index.ts`/`index.js`) en cada carpeta.
- Respuestas del backend siempre `ApiResponse<T>` discriminado.
- Códigos de error estables (definidos en `packages/types/src/api.ts`).
- Backend por capas estrictas: `presentation` → `application` → `domain` ←
  `infrastructure`. La capa `domain/` no importa nada externo.
