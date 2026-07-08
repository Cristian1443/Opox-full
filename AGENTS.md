# Guía para agentes

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Estado del código (2026-07-07)

Ver `BITACORA.md` para el diario por fecha en términos de producto. Los bloques
1 (Acceso) y 3 (Salud) están cerrados a nivel frontend. El bloque 2 (Dashboard)
lo hizo Cristian. El bloque 4 (Tutor IA) no existe todavía y hay una pantalla
temporal `AITutorPlaceholder` para no romper los CTAs del bloque 3.

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
{ technique })`) ya pasan contexto por params. Cuando el bloque 4 exista,
esos params se consumen para pre-cargar el prompt.

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

## Convenciones generales

- Nombres en inglés para el código; comentarios explicativos en español.
- Barrel files (`index.ts`/`index.js`) en cada carpeta.
- Respuestas del backend siempre `ApiResponse<T>` discriminado.
- Códigos de error estables (definidos en `packages/types/src/api.ts`).
- Backend por capas estrictas: `presentation` → `application` → `domain` ←
  `infrastructure`. La capa `domain/` no importa nada externo.
