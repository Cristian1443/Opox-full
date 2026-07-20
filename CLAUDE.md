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
│   │   │   ├── api/         # Clientes HTTP: auth, dashboard, planning, motivation, training
│   │   │   ├── components/  # Componentes compartidos (ScreenHeader, modales, etc.)
│   │   │   ├── hooks/       # Custom hooks de UI (useNetworkWatcher, …)
│   │   │   ├── navigation/  # OnboardingNavigator.js, navigationRef.js
│   │   │   ├── screens/     # Pantallas por bloque: access/, health/, training/, …
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
│   │       ├── auth.ts, dashboard.ts, planning.ts, motivation.ts, training.ts
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

## 4. APIs externas — contratos pendientes

Los contratos vacíos viven en `packages/types/src/contracts/`:

- **`ClientApiContract.ts`** — datos del cliente: usuarios, planes, historial.
- **`AiApiContract.ts`** — IA: generación de tests, OCR foto-test, tutor, legislación.

Flujo de integración: **mobile → nuestro backend → proveedor externo**.
La API key de IA nunca va al móvil; vive en `apps/backend/.env`.

Cuando se definan los contratos, actualizar esos archivos primero y propagar cambios.

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
| 6 | Entrenamiento | Frontend + backend completo (falta `TrainingSession`) |
| 8 | Aula Virtual / Tutor IA | Pendiente |

Ver `BITACORA.md` para el diario por fecha. Ver `AGENTS.md` para los roles de cada agente.
