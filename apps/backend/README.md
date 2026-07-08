# @opox/backend

Backend Node + Express + TypeScript de OPOX.

## Arquitectura por capas

Regla estricta: cada capa solo importa de la capa inmediatamente inferior.

```
presentation/     Express: rutas, controllers, middleware, validators
     ↓
application/      Use cases (una clase por operación de negocio)
     ↓
domain/           Entidades, errores tipados, interfaces (I*)
                  CERO dependencias externas
     ↑
infrastructure/   Implementaciones concretas: Supabase, HTTP clients, storage, push
```

- `domain/` no importa nunca de `application/`, `infrastructure/` ni de nada externo (ni Express, ni Supabase, ni Zod).
- `application/` depende de las **interfaces** de `domain/`, nunca de `infrastructure/`.
- `infrastructure/` implementa las interfaces de `domain/`.
- `presentation/` orquesta llamando use cases de `application/`.

## Estructura

```
src/
├── config/                          # env vars validadas con Zod
├── domain/
│   ├── entities/                    # User, Session, Notification, UserGamification, StudyPlan/Task, Clan...
│   ├── errors/                      # DomainError + AuthError/DashboardError/PlanningError/MotivationError
│   ├── repositories/                # IAuthRepository, IDashboardRepository, IPlanningRepository, IMotivationRepository
│   └── index.ts
├── application/
│   ├── auth/                        # RegisterUseCase, LoginUseCase, ..., UpdateProfileUseCase
│   ├── dashboard/                   # Notification/Gamification use cases, GetDashboardSummaryUseCase
│   ├── planning/                    # Plan/Task/Week/Macro/Agenda use cases, GetPlanningSummaryUseCase
│   └── motivation/                  # Ranking/Clan/Chat/Challenge use cases, GetMotivationSummaryUseCase
├── infrastructure/
│   ├── auth/                        # SupabaseAuthRepository
│   ├── dashboard/                   # SupabaseDashboardRepository
│   ├── planning/                    # SupabasePlanningRepository
│   ├── motivation/                  # SupabaseMotivationRepository
│   ├── clients/                     # ClientApiClient, AiApiClient (TODO contratos)
│   ├── storage/                     # SupabaseStorage (TODO Foto-Test)
│   ├── push/                        # ExpoPushService (TODO)
│   └── payments/                    # RevenueCatWebhookHandler (TODO)
├── presentation/
│   ├── controllers/                 # Auth/Dashboard/Planning/MotivationController
│   ├── routes/
│   ├── middleware/                  # errorHandler, authMiddleware, validate (validateBody + validateQuery)
│   └── validators/                  # Zod schemas
├── container.ts                     # DI manual — todo se cablea aquí
├── server.ts                        # Configuración Express
└── index.ts                         # Entry point

supabase/
├── bloque2_dashboard.sql            # notifications / user_gamification / opopoints_ledger
├── bloque4_planificacion.sql        # study_plans / study_tasks / plan_dates
└── bloque5_motivacion.sql           # profiles (+backfill) / clans / clan_members / clan_messages /
                                      # clan_challenges / vistas de ranking (requiere bloque2 antes)
```

## Rutas del bloque 1 · Acceso

| Método | Ruta | Auth | Uso |
|--------|------|------|-----|
| GET | `/health` | — | Healthcheck |
| POST | `/auth/register` | — | 1.2 Registro |
| POST | `/auth/login` | — | 1.3 Login |
| POST | `/auth/oauth` | — | 1.2/1.3 Google/Apple |
| POST | `/auth/otp/send` | — | 1.6 Reenviar código |
| POST | `/auth/otp/verify` | — | 1.6 Verificar OTP |
| POST | `/auth/password/reset-request` | — | 1.5a |
| POST | `/auth/password/reset-confirm` | — | 1.5c |
| POST | `/auth/biometric/challenge` | — | 1.4 (auth) |
| POST | `/auth/biometric/login` | — | 1.4 (auth) |
| POST | `/auth/biometric/link` | ✔ | 1.4 (setup) |
| POST | `/auth/refresh` | — | Renovar token |
| GET | `/auth/me` | ✔ | Usuario actual |
| PATCH | `/auth/profile` | ✔ | Oposición/especialidad (saludo del Bloque 2) |
| DELETE | `/auth/me` | ✔ | Elimina la cuenta (12.11) — cascada real vía ON DELETE en Supabase |
| POST | `/auth/logout` | ✔ | Cerrar sesión |
| POST | `/auth/terms/accept` | ✔ | 1.7 Aceptar términos |

## Rutas del bloque 2 · Dashboard

Todas requieren sesión (`Authorization: Bearer <token>`).

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/dashboard/summary` | 2.1+2.2 — perfil, racha/Opopoints y notificaciones sin leer reales; `health`/`quickAccess` llegan como `{ available: false }` hasta que existan los Bloques 3/10. `plan` también queda así aquí — el widget "Plan" del Dashboard ya usa `/planning/summary` directamente (Bloque 4) |
| GET | `/dashboard/notifications` | 2.3 — lista paginada (`?category=boe\|social\|general&cursor=...&limit=...`) |
| POST | `/dashboard/notifications` | Crea una notificación o nudge (hoy: pruebas manuales; mañana: la llamarán los motores de salud/BOE/estadísticas) |
| GET | `/dashboard/notifications/next-nudge` | 2.4 — el nudge sin leer más antiguo, o `null` |
| POST | `/dashboard/notifications/:id/read` | Marca una notificación como leída |
| POST | `/dashboard/notifications/read-all` | Marca todas como leídas |
| GET | `/dashboard/gamification` | Racha actual + saldo de Opopoints |
| POST | `/dashboard/gamification/activity` | Registra actividad de hoy (`{ reason, points }`): actualiza racha y suma Opopoints |

Un nudge es una fila de `notifications` con `isNudge: true` y `nudgeKind`
(`fatigue` | `academic` | `boe`) — no hay tabla ni endpoint separado. El
mobile pide `next-nudge` y lo muestra como bottom-sheet en vez de en la
bandeja.

## Rutas del bloque 4 · Planificación

Todas requieren sesión.

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/planning/summary` | 4.1 — objetivo de hoy, estado de la semana, macro y alertas (`daysSinceLastActivity`, `examSoonDays`) |
| GET / PATCH | `/planning/plan` | 4.6 — ajustes: `testsPerDay`, `studyDays` (1-7 ISO), `intensity`, `examDate` |
| GET / POST | `/planning/tasks` | 4.2 — tareas del día (`?date=YYYY-MM-DD`, default hoy). POST para sembrar tareas (aún no hay motor de tests que las genere solo) |
| PATCH | `/planning/tasks/:id/toggle` | Marca una tarea hecha/pendiente. Si completa el objetivo diario, dispara `registerActivity` del Bloque 2 (+40 Opopoints) y devuelve `gamification` en la respuesta |
| GET | `/planning/week` | 4.3 — estado L-D + tareas del día seleccionado + `ritmoPercent` |
| GET | `/planning/macro` | 4.4 — cuenta atrás y fases (reparto proporcional fijo, sin IA — ver AGENTS.md); `null` si no hay `examDate` |
| GET / POST | `/planning/agenda` | 4.5 — fechas clave del opositor |

## Rutas del bloque 5 · Motivación

Todas requieren sesión.

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/motivation/summary` | 5.1 — racha/Opopoints (reutiliza el Bloque 2) + resumen de mi clan |
| GET | `/motivation/streak` | 5.2 — racha, récord, últimos 14 días de actividad, próximo hito |
| GET | `/motivation/ranking` | 5.3 — `?scope=weekly\|global\|oposicion`. "Por tema" no tiene endpoint (sin estadísticas por tema aún) |
| POST | `/motivation/profile/passed` | Autorreporte de aprobado — alimenta el Muro de la Gloria |
| GET | `/motivation/clans/mine` | Mi clan actual, o `null` |
| GET / POST | `/motivation/clans` | Explorar clanes / crear uno (un usuario solo puede estar en un clan) |
| POST | `/motivation/clans/:id/join` | Unirse a un clan |
| GET | `/motivation/clans/:id` | 5.6 — detalle, miembros con puntos, puesto en el ranking de clanes |
| GET / POST | `/motivation/clans/:id/messages` | 5.7 — chat por **polling** (`?after=<ISO>`), no hay websockets en el MVP |
| GET / POST | `/motivation/clans/:id/challenges` | 5.8 — retos del clan |
| POST | `/motivation/clans/:id/challenges/:challengeId/complete` | Autorreporta completado; otorga `rewardPoints` la primera vez (idempotente después) |
| GET | `/motivation/clans/:id/graduates` | 5.4 · Fase 2 — Muro de la Gloria, solo lectura real (sin flujo de aprobación todavía) |

Rankings y listas de miembros de clan leen de `public.profiles`, un espejo
de `auth.users.raw_user_meta_data` sincronizado por el backend en cada
registro/`updateProfile` (PostgREST no puede hacer JOIN contra el schema
`auth`). El Muro de la Gloria (5.4) y los Duelos en vivo 1vs1 (5.8b) son
Fase 2 explícita del wireframe; los Duelos son solo una pantalla estática
en el mobile — necesitan matchmaking en tiempo real que no existe aún.

## Contratos de respuesta

Todas las rutas devuelven `ApiResponse<T>`:

```ts
// Éxito
{ ok: true, data: T }

// Error
{ ok: false, error: { code: string, message: string, fields?: {...} } }
```

Los `code` estables (`auth/invalid-credentials`, `auth/otp-expired`, etc.)
están en `packages/types/src/api.ts` y son los que el mobile mapea a UI.

## Arrancar

```bash
# desde la raíz del monorepo
pnpm install
cp apps/backend/.env.example apps/backend/.env
# rellenar SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

pnpm backend dev
# → http://localhost:3000/health
```

Para las rutas de `/dashboard/*`, `/planning/*` y `/motivation/*`, pega el
contenido de `apps/backend/supabase/bloque2_dashboard.sql`,
`bloque4_planificacion.sql` y `bloque5_motivacion.sql` (en ese orden — el 5
depende de tablas del 2) en Supabase Dashboard → SQL Editor → Run. Los
tres scripts son idempotentes.

### Configuración manual requerida: recuperación de contraseña (1.5)

El código de `/auth/password/reset-request` y `/auth/password/reset-confirm`
está completo y verificado (canjea el `token_hash` del email por una sesión
vía `verifyOtp({type:'recovery'})`), pero **Supabase necesita dos ajustes
manuales en el Dashboard** para que el email real lleve al deep link de la
app en vez de a la página de redirect por defecto de Supabase:

1. **Authentication → URL Configuration → Redirect URLs**: añadir
   `opox://reset-password` a la allowlist (si no está, `resetPasswordForEmail`
   funciona pero Supabase rechaza el `redirectTo` al enviar el email).
2. **Authentication → Email Templates → Reset Password**: cambiar el enlace
   de la plantilla de `{{ .ConfirmationURL }}` (por defecto) a:
   ```
   {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
   ```
   Esto hace que el email abra directamente `opox://reset-password?token_hash=...`,
   que React Navigation enruta a `RecuperarPasswordNuevaScreen` (ver
   `apps/mobile/App.js`, prop `linking`).

`PASSWORD_RESET_REDIRECT_URL` en `.env` (default `opox://reset-password`) debe
coincidir con el `scheme` de `apps/mobile/app.json` y con la URL del punto 1.

## Añadir un nuevo use case

Ejemplo: crear `SendMagicLinkUseCase`.

1. **Domain** — añade el método a `IAuthRepository` si no existe.
2. **Application** — crea `application/auth/SendMagicLinkUseCase.ts` con una clase que recibe `IAuthRepository` en el constructor.
3. **Infrastructure** — implementa el método en `SupabaseAuthRepository`.
4. **Presentation** — validator Zod, handler en `AuthController`, ruta en `authRoutes.ts`.
5. **Container** — instancia el use case y pásalo al controller.

## Testing

TODO: setup con Vitest + supertest. La capa de dominio permite tests unitarios rápidos usando stubs en memoria de `IAuthRepository`.

## Cambiar de proveedor de Auth

Todo el acoplamiento con Supabase está en `infrastructure/auth/`. Para migrar a Clerk:

1. Crear `ClerkAuthRepository implements IAuthRepository`.
2. Cambiar el `if (isSupabaseConfigured)` en `container.ts`.
3. No tocar `application/`, `domain/`, `presentation/`.
