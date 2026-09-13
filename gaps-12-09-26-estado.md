# Estado de gaps — revisión 2026-09-12

> Rama: `fix/gaps-12-09-26` · Actualizado tras sesión de testing 2026-09-12

---

## Bloque 0 — Test de nivel

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Test de nivel siempre igual (mismas preguntas) | ✅ Cerrado | `OppositionSelectorScreen`: solo `policia-local-galicia` activa; el Motor genera preguntas distintas por oposición. Las demás oposiciones muestran badge "Próximamente". |
| 2 | Test de nivel debería ser 10 preguntas, no 20 | ✅ Cerrado | `LevelTestInProgressScreen`: preguntas estáticas reducidas a 10; UI muestra "Pregunta X de 10"; fetch al Motor usa la oposición guardada en AsyncStorage. |

---

## Bloque 1 — Acceso / Auth

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Biometría no disponible (Face ID iOS) | ⏸️ Diferido | Decisión cliente. Huella Android ya funciona; Face ID iOS pendiente de validación con device real. |
| 2 | OAuth redes sociales no disponible | ⏸️ Diferido | Pendiente de credenciales de producción del cliente. |
| 3 | Enlace reset de contraseña no accesible | ✅ Cerrado (rama anterior) | Corregido en `fix/gaps-acceso-perfil-biometria`: template Supabase + deep link `opox://reset-password`. Requiere APK real (no funciona en Expo Go). |
| 3.1 | "Abrir app de correo" abre redactando un nuevo correo | ✅ Cerrado (rama anterior) | `RecuperarPasswordEnviadoScreen` ahora prueba `message://`, `googlegmail://`, `ms-outlook://` y fallback web según dominio del email. |

---

## Bloque 2 — Salud / Meditación

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Botones shuffle y repeat sin funcionalidad | ✅ Cerrado | `MeditationPlayerScreen`: eliminados `TouchableOpacity` de shuffle y repeat. Quedan solo los 3 controles funcionales: skip−15s, play/pause, skip+15s. |

---

## Bloque 4 — Planificación

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Objetivo diario no llega al 100% sin completar todas las tareas (confusión UX) | ✅ Cerrado | `PlanningTodayScreen`: añadido texto contextual "Te falta(n) X test(s) (de N programados)" bajo el `ProgressRing`. |

---

## Bloque 6 — Entrenamiento

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Foto-test anuncia 15 preguntas pero solo hay 10 | ✅ Cerrado | `PhotoTestResultScreen`: antes mostraba "15 preguntas generadas" hardcodeado; ahora muestra el conteo real que devuelve el backend (`questions.length`). |
| 2 | Sliders se van a los extremos al arrastrar | ✅ Cerrado | `GeneratorConfigScreen`: `onPanResponderGrant` ahora inicializa `startX.current` desde la posición actual del thumb (no del toque). Aplica a `StepSlider` y `RangeSlider`. |
| 3 | IA falla con muchos temas, no hay indicador de carga | ✅ Cerrado | Timeout reducido 240 s → 90 s. Mensaje dinámico bajo el botón: "La IA está pensando…" a los 15 s, aviso de espera a los 30 s. |
| 4 | Foto-test no se guarda (Gateway Timeout en `saveAttempt`) | ✅ Cerrado | `SupabaseTrainingRepository.saveAttempt`: reintento único tras 2 s si el error es timeout; si el reintento falla con PK conflict (23505) se recupera la fila ya insertada. |
| 5 | Test quirúrgico aparece en ErrorLab como "Tema 2" en vez de global | ✅ Cerrado | **Causa A — `MotorAiClient.generateSurgicalTest`** calculaba `distribution` por temas débiles pero ignoraba ese dato y pedía `topicId: 'all'` al Motor; las preguntas devueltas eran aleatorias del curso entero, no de los temas débiles del usuario. **Fix**: llamadas paralelas al Motor por cada tema débil (≥3 preguntas c/u, proporcional a `failRate`); fallback a `'all'` si el Motor no responde. **Causa B — `listErrorPatterns`** requería ≥5 respuestas por tema antes de mostrarlo, así que solo aparecía "Tema 2" (el más fallado) aunque el test cubriera 5 temas. **Fix**: umbral bajado 5→3. |

---

## Bloque 8 — Aula Virtual / Tutor

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Podcast: temas aparecen a veces, "aún no hay temas" otras veces | ✅ Cerrado | `TutorPodcastScreen (EpisodePicker)`: `setLoading(true)` al inicio del efecto; fallback a `policia-local-galicia` si la oposición del usuario devuelve vacío. |
| 1b | Podcast: error interno del servidor al generar | ⚠️ Pendiente investigación | Puede ser inestabilidad del Motor en `/v1/classroom/podcast`. No es un bug de código nuestro; depende del equipo IA. Verificar con `adb logcat` / logs de Render. |
| 2 | Resúmenes/flashcards pierden temas al volver de la otra pantalla | ✅ Cerrado | `TutorSummariesScreen` y `TutorFlashcardsScreen`: `setLoading(true)` al inicio del efecto + fallback a `policia-local-galicia`. Estaban usando `useEffect` con deps que no re-ejecutaban al ganar foco. |

---

## Bloque 10 — Monitor BOE

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Modal "Añadir norma" muestra mensaje de debug de env vars | ✅ Cerrado | `BoeHomeScreen`: sustituido el string técnico de env vars por "Las normas para tu oposición estarán disponibles próximamente." |
| 2 | Búsqueda tarda 60 s con host caído (ENOTFOUND DNS) | ✅ Cerrado | `MotorBoeClient.searchCatalog`: `AbortController` + `setTimeout(abort, 5000)` como `signal` de Axios. Cancela en ≤ 5 s independientemente del estado DNS. |
| 3 | Modal muestra 12 000+ leyes genéricas del BOE al buscar | ✅ Cerrado | `SearchBoeRegulationsUseCase`: sin query → devuelve `listRegulations(cursoId)` directamente (normas del curso activo). Con query → busca catálogo, fallback a listRegulations filtrado. |
| 4 | "Datos inválidos" al pulsar "Seguir" en resultado del catálogo | ✅ Cerrado | `MotorBoeClient.searchCatalog`: normaliza `identificador → identificador_boe` y `vigente → activa`. El campo llegaba `undefined` porque el Motor usa nombre distinto al de nuestro tipo. |
| 5 | `getLastLawView` Gateway Timeout rompe el Dashboard entero | ✅ Cerrado | `GetDashboardSummaryUseCase`: `.catch(() => null)` en `getLastLawView` dentro del `Promise.all`. |
| 6 | `followRegulation` y `searchCatalog` usaban `MOTOR_BOE_CURSO_ID` obsoleto | ✅ Cerrado | `FollowRegulationUseCase` y `SearchBoeRegulationsUseCase` migrados a `GetCursoIdUseCase` (resuelve desde DB → `672e3a8bad0f45c8`). `BoeController` pasa `oposicion` del usuario autenticado. |

---

## Bloque 11 — Tienda

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | No hay productos ni descuentos; flash de "No hay productos" sin spinner | ✅ Cerrado | `StoreHomeScreen`, `StoreDiscountsScreen`, `StoreRealRewardsScreen`: `ActivityIndicator` mientras carga con `Promise.allSettled`. SQL seed en `bloque11_tienda_seed.sql` con 2 productos + 1 descuento de prueba. **Acción pendiente:** ejecutar el SQL en Supabase. |

---

## Bloque 12 — Configuración

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Accesibilidad (modo noche, tamaño de fuente) no aplica a la app | ✅ Cerrado (minimal viable) | `AccessibilityContext` expone `isDark`/`setTheme`; `ThemeStatusBar` en `App.js` aplica `barStyle` + `backgroundColor` globalmente. `ConfigAccessibilityScreen` llama `applyThemeGlobally` en tiempo real. **Nota:** cambio de colores completo en todas las pantallas (ThemeContext global) queda para fase posterior. |
| 2 | Estadísticas pro no aparecen; PDF falla | ✅ Cerrado | `ConfigStatsScreen`: mensaje de error explícito si el backend devuelve 401/403. `ExportProStatsUseCase`: try/catch en `storePdfReport` — si Supabase Storage falla, devuelve el PDF como data URL base64 que el mobile puede abrir igualmente. |
| 3 | Tu Opinión no permite enviar al inicio de la sesión | ✅ Cerrado | `ConfigFeedbackScreen`: `useFocusEffect` verifica sesión activa al entrar; si no hay sesión, muestra Alert y vuelve atrás. |
| 4 | Conectar Tu Opinión con WhatsApp | ✅ Cerrado | `WhatsAppNotificationClient` (nuevo) envía mensaje fire-and-forget a WhatsApp Business Cloud API tras cada feedback exitoso. Credenciales en `.env` (gitignored). **Acción pendiente:** añadir las 3 vars (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID=1343116205549202`, `WHATSAPP_RECIPIENT_NUMBER=573016443734`) en Render. |

---

## Otros

| # | Gap | Estado | Notas |
|---|-----|--------|-------|
| 1 | Registro con Hotmail llega a spam | ⚠️ Pendiente | Causa: sin dominio propio ni DKIM/SPF configurados, los emails pasan por el SMTP de Supabase/Gmail con poca reputación. Solución: (1) configurar registros SPF/DKIM/DMARC cuando haya dominio propio, (2) migrar a Resend o SendGrid para mejor deliverability. No es un bug de código. |
| 2 | Al volver a iniciar sesión después de tiempo tarda mucho | ⚠️ Pendiente investigación | Probable causa: el token de Supabase expiró y hay que hacer refresh silencioso. Revisar si `api.loadSession()` llama a `supabase.auth.getSession()` con refresh automático. No investigado en esta rama. |
| 3 | Test de nivel igual en cualquier oposición | ✅ Cerrado | Mismo que Bloque 0 gap #1 y #3 (Otros). Badge "Próximamente" en todas las oposiciones excepto `policia-local-galicia`. |

---

## Resumen

| Estado | Count |
|--------|-------|
| ✅ Cerrado | 20 |
| ⏸️ Diferido (decisión cliente) | 2 |
| ⚠️ Pendiente (requiere más info o acción externa) | 3 |

### Acciones manuales requeridas antes de siguiente deploy

1. **Supabase SQL Editor** → ejecutar `apps/backend/supabase/bloque11_tienda_seed.sql`
2. **Render env vars** → `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID=1343116205549202`, `WHATSAPP_RECIPIENT_NUMBER=573016443734`
3. **EAS build** → rebuild Android necesario para que los cambios de Health Connect (manifest / MainActivity) tengan efecto
