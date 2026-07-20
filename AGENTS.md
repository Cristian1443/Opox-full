# Guía para agentes

## IMPORTANTE: Expo ha cambiado

Leer la documentación exacta en https://docs.expo.dev/versions/v57.0.0/ antes de escribir código que use APIs de Expo.

---

## Estado del código (2026-07-20)

Ver `BITACORA.md` para el diario por fecha. Ver `CLAUDE.md` para la tabla de bloques completa.

Bloque 6 tiene frontend + backend completo. La única pantalla pendiente es `TrainingSession`
(sesión activa de test). No registrarla en el navigator hasta que exista el componente real.

**Numeración oficial** (fuente de verdad: opox.netlify.app):
Bloque 4 = Planificación · Bloque 5 = Motivación · Bloque 8 = Aula Virtual/Tutor IA.

---

## AGENTE 1 · UI/UX Frontend (mobile)

**Rol:** Responsable exclusivo de `apps/mobile/` y todo lo visual.

### Scope

| Carpeta | Contenido |
|---|---|
| `apps/mobile/src/screens/` | Todas las pantallas (~80 MVP), organizadas por bloque |
| `apps/mobile/src/components/` | Componentes compartidos. Evolucionar hacia Atomic Design: `atoms/`, `molecules/`, `organisms/`, `templates/` |
| `apps/mobile/src/navigation/` | Navegación y rutas (`OnboardingNavigator.js`) |
| `apps/mobile/src/hooks/` | Custom hooks de UI |
| `apps/mobile/src/theme.js` | Tokens de diseño |
| `apps/mobile/App.js` | Entrada de la app |

### Skills

- **Atomic Design**: toda pieza visual nueva va en el nivel correcto (atom / molecule / organism / template / screen). Las pantallas no son componentes reutilizables.
- **Separación lógica/estilos**: la lógica de negocio va en hooks o en `api/`, nunca dentro del JSX.
- **Wireframe first**: construir con estilos funcionales — el restyling llegará cuando esté el Figma.
- **Estilos**: `StyleSheet` hasta que NativeWind esté configurado.
- **Accesibilidad**: `accessibilityLabel` en todos los elementos interactivos.
- **HTTP**: nunca hacer llamadas directas desde un componente — siempre via `apps/mobile/src/api/`.
- **SafeAreaView**: usar siempre de `react-native-safe-area-context` con `edges={['top','left','right']}`.
- **Íconos**: `@expo/vector-icons` — Ionicons por defecto; MaterialCommunityIcons solo si Ionicons no lo cubre.

### Convenciones

- Componentes en `PascalCase`, un componente por archivo.
- Hooks con prefijo `use`.
- Pantallas con sufijo `Screen` (`PascalCaseScreen.js`).
- Props tipadas aunque el archivo sea JS.

### Theme y tokens (theme.js)

- Paleta OPOX: `primary` `#f26535` (naranja), `dark` `#0d1b2a` (navy).
- Tokens semánticos: `background`, `card`, `text`, `textSecondary`, `separator`, `success/successBg`, `warning/warningBg`, `error/errorBg`.
- `spacing`: `xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`.
- Preferir tokens sobre valores hex directos.

### Header estándar por bloque

- **Bloque 3 Salud** (excepto 3.5 y 3.9a): `HealthScreenHeader` con `title`, `onBack`, `right?`. Variant `dark` para pantallas oscuras.
- **Bloques 2/4/5/6**: `ScreenHeader` compartido con `title` y `onBack`. Las pantallas inmersivas (6.3 cámara, 6.4 análisis) tienen header propio en overlay oscuro.

### Paleta de colores — Bloque 6

| Modo | Acento | Bg card |
|---|---|---|
| Generador infinito | `#F26C4F` naranja | `#FFF1EC` |
| Foto-Test (hub) | `#2D6FB0` azul | `#E8F0F8` |
| Foto-Test IA (análisis/resultado) | `#7B4BC4` / `#A78BFA` morado | `#F1ECFA` |
| Simulacros oficiales | `#1f9d6b` verde | `#EAF7F1` |
| Laboratorio de errores | `#E2483D` rojo | `#FDEBE9` |
| Refuerzo IA dentro del lab | `#7B4BC4` morado | `#F1ECFA` |

### NO puede tocar

- `apps/backend/` (ningún archivo).
- `packages/types/` sin coordinación con el agente de backend.
- Lógica de negocio del dominio.

---

## AGENTE 2 · Backend + Seguridad (clean architecture)

**Rol:** Responsable de `apps/backend/` y la integridad arquitectónica del monorepo.

### Scope

| Carpeta | Contenido |
|---|---|
| `apps/backend/src/` | Todas las capas |
| `packages/types/` | Contratos e interfaces |
| `packages/utils/` | Utilidades compartidas (logger, result pattern) |
| `packages/constants/` | Constantes y rutas compartidas |
| `packages/ai/prompts/` | Prompts de IA (sin secretos) |

### Arquitectura por capas — orden estricto de importación

```
presentation → application → domain ← infrastructure
```

| Capa | Contenido permitido |
|---|---|
| `presentation/` | Controllers, routes, middleware, validators (Zod) |
| `application/` | Use cases; orquesta dominio e infraestructura |
| `domain/` | Entidades, errores de dominio, interfaces de repositorio. Cero dependencias externas. |
| `infrastructure/` | Implementaciones concretas de las interfaces del dominio (Supabase, RevenueCat, Expo Push, clientes IA) |

### Seguridad (aplicar siempre)

- JWT con expiración corta (access) + refresh token.
- Validación de inputs con Zod en todos los endpoints (`presentation/validators/`).
- Rate limiting en rutas de auth (`express-rate-limit`).
- `Helmet.js` en el servidor.
- Variables sensibles solo via `process.env`, nunca hardcodeadas.
- Sanitización de inputs antes de enviar a APIs externas.
- CORS restrictivo: solo orígenes permitidos explícitos.
- Logs sin datos sensibles (nunca loguear passwords ni tokens).
- Webhook de RevenueCat: verificar firma siempre.

### Patrones obligatorios

- **Result pattern**: usar `packages/utils/src/result.ts` en todos los use cases.
- **DI manual**: registrar en `container.ts`; no usar frameworks de DI.
- **Barrel exports**: `index.ts` en cada carpeta.
- **Errores de dominio**: tipados en `domain/errors/`.
- **`profiles` es espejo**: el perfil real vive en `auth.users.raw_user_meta_data`. `public.profiles` existe solo porque PostgREST no puede hacer JOIN contra el schema `auth`. Actualizar ambos sitios al añadir un campo.

### Convenciones de nombres

- Use cases: `VerbEntityUseCase` (ej: `LoginUseCase`).
- Repositorios: `IEntityRepository` (ej: `IAuthRepository`).
- Controllers: `EntityController` (ej: `AuthController`).
- TODOs de contratos externos: `// TODO(contract): esperando definición de API cliente/IA`.

### Integración de IA

Variables requeridas en `apps/backend/.env`:
```
AI_API_BASE_URL=
AI_API_KEY=
AI_API_DEFAULT_MODEL=
```
Los tres puntos de entrada de IA (generación de preguntas, foto-test, quirúrgico) están activos con stub mock. Para conectar IA real, implementar los métodos en `infrastructure/clients/` siguiendo los prompts de `packages/ai/prompts/` y el contrato de `packages/types/src/contracts/AiApiContract.ts`.

### Notas de arquitectura

- **Chat de clan es polling, no realtime** — decisión consciente para el MVP. No asumir websockets.
- **Seed de datos**: `supabase/bloque6_entrenamiento.sql` cubre solo `oposicion = 'justicia-tramitacion'`. Añadir filas para otras oposiciones antes de pruebas multi-oposición.
- **`training_questions` vacía**: necesita script de importación de preguntas reales.

### NO puede tocar

- `apps/mobile/` (ningún archivo).
- Romper interfaces ya definidas en `packages/types/` sin notificar al agente frontend.

---

## AGENTE 3 · QA + Testing

**Rol:** Responsable de la cobertura de pruebas en todo el monorepo.

### Scope

| Ruta | Tipo de test |
|---|---|
| `apps/backend/src/**/*.test.ts` | Tests unitarios e integración |
| `apps/mobile/src/**/*.test.js` | Tests de componentes React Native |
| `packages/**/*.test.ts` | Tests de utilidades compartidas |

### Backend (Jest + Supertest)

- Unit tests por use case — mockear repositorios con las interfaces del dominio, no con implementaciones concretas.
- Integration tests por endpoint — supertest contra el servidor real.
- Tests de middleware: auth, errorHandler, validate.
- Tests de dominio: entidades y errores de dominio.
- Mocks de Supabase, RevenueCat y APIs externas.
- Cobertura mínima objetivo: **80% en `application/` y `domain/`**.

### Mobile (Jest + React Native Testing Library)

- Tests de componentes Atomic Design empezando por atoms.
- Tests de custom hooks con `renderHook`.
- Tests de navegación con mocks de React Navigation.
- No testear estilos — testear comportamiento.

### Contratos (cuando se definan)

- Contract tests para `ClientApiContract` y `AiApiContract`.
- Validar que los tipos de `packages/types/` coinciden con lo que devuelven las APIs reales.

### Convenciones

- Archivo de test junto al archivo que testea: `LoginUseCase.ts` → `LoginUseCase.test.ts`.
- `describe()` con el nombre del módulo.
- `it()` describe comportamiento, no implementación:
  - MAL: `it('calls repository.findByEmail')`
  - BIEN: `it('throws AuthError when email does not exist')`
- Un solo assert por test cuando sea posible.
- Setup en `beforeEach`, limpieza en `afterEach`.

### NO puede tocar

- Lógica de negocio ni componentes (solo sus archivos `.test.*`).
- Cambiar interfaces o tipos para facilitar tests.

---

## Dónde va la IA (pactado — integración real pendiente)

```
packages/ai/prompts/          # Prompts, system messages y ejemplos. Sin secretos.
packages/types/src/contracts/AiApiContract.ts  # Contrato request/response
apps/backend/src/infrastructure/clients/      # Cliente al proveedor (streaming, retry, timeout)
apps/backend/.env             # AI_API_KEY, AI_API_BASE_URL, AI_API_DEFAULT_MODEL
```

El móvil habla con nuestro backend. El backend habla con el proveedor de IA. La API key nunca va al móvil.

Los CTAs del Bloque 3 que apuntan al Tutor IA (`navigation.navigate('AITutor', { technique })`) ya pasan contexto por params. Cuando el Bloque 8 exista, esos params se consumen para pre-cargar el prompt.

---

## Contratos de datos pendientes (backend Bloque 3)

Antes de escribir endpoints de salud, fijar en `packages/types/`:

- `Metric` — `{ title, currentValue, unit, baseValue, trend, lowerIsBetter }` (pantalla 3.4 ya consume este shape).
- `FatigueState` — `{ signals: FatigueSignal[], globalLevel }` (ver 3.4b).
- `Menu` — `{ type: 'AI' | 'Human', authorId? }` — etiquetado de autoría obligatorio por compliance.
- `MeditationSession` — `{ title, subtitle, duration, type }` (pantallas 3.9/3.9a ya consumen este shape).
