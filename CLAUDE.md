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
│   │   │   ├── api/         # Clientes HTTP: auth, dashboard, planning, motivation, training, tutor, notes, boe
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
│   │       ├── auth.ts, dashboard.ts, planning.ts, motivation.ts, training.ts, tutor.ts, notes.ts, boe.ts
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

### Motor de IA del cliente (DESPLEGADO y activo)

Microservicio RAG del equipo IA, desplegado en producción:
`https://ingesta-demo-1097036487734.us-east1.run.app`

Ingesta PDFs de temario y genera tests con evidencia verbatim + página exacta.
Autentica con `X-API-Key` (no Bearer). Curso activo: `1357e871b542425b`.

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
| 11 | Tienda OPOX | Frontend + backend completo (recompensas reales, descuentos virtuales, cartera de códigos, marketplace comunidad, 20 requests / 65 assertions verde). Saldo Opopoints gestionado por ledger earn/spend en Supabase. |

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
