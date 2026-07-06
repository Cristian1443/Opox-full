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
│   ├── entities/                    # User, Session
│   ├── errors/                      # DomainError + AuthError concretos
│   ├── repositories/                # IAuthRepository
│   └── index.ts
├── application/
│   └── auth/                        # RegisterUseCase, LoginUseCase, ...
├── infrastructure/
│   ├── auth/                        # SupabaseAuthRepository
│   ├── clients/                     # ClientApiClient, AiApiClient (TODO contratos)
│   ├── storage/                     # SupabaseStorage (TODO Foto-Test)
│   ├── push/                        # ExpoPushService (TODO)
│   └── payments/                    # RevenueCatWebhookHandler (TODO)
├── presentation/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/                  # errorHandler, authMiddleware, validate
│   └── validators/                  # Zod schemas
├── container.ts                     # DI manual — todo se cablea aquí
├── server.ts                        # Configuración Express
└── index.ts                         # Entry point
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
| POST | `/auth/logout` | ✔ | Cerrar sesión |
| POST | `/auth/terms/accept` | ✔ | 1.7 Aceptar términos |

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
