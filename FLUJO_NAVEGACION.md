# OPOX — Flujo de Navegación Completo

> Documento de referencia para producto, diseño y desarrollo.  
> Fuente de verdad: código fuente en `apps/mobile/`. Última revisión: 2026-09-02.

---

## Arquitectura de navegación

- **Un único `NativeStackNavigator`** plano con ~80 pantallas registradas.
- **Sin tabs nativos**: la navegación entre bloques se hace desde el Dashboard y desde CTAs cruzados.
- **Toda la lógica de sesión y onboarding** vive en `SplashScreen.js` (árbol de decisión al arrancar).
- **Deep link**: `opox://reset-password` abre directamente `RecuperarPasswordNueva` para flujos de email.

---

## Fase 0 · Arranque de la app

```
App arranca
  └─ IconoScreen          (1.5 s · isotipo animado)
        └─ SplashScreen   (2.5 s · wordmark + badge MásCOP)
              │
              ├─ Sin conexión              ──► SplashNoConnection
              ├─ App desactualizada        ──► SplashUpdate
              ├─ Sesión válida en caché    ──► Dashboard
              ├─ Onboarding completado     ──► Entrada  (login directo)
              ├─ Test de nivel a mitad     ──► LevelTestInProgress  (reanudar)
              ├─ Oposición elegida         ──► LevelTestProposal
              └─ Usuario totalmente nuevo  ──► OnboardingSlider
```

> **Nota técnica**: "sesión válida" = `accessToken` en AsyncStorage + validación con `GET /auth/me`. Si expiró, se intenta refresh automático antes de pedir login.

---

## Bloque 0 · Onboarding *(solo usuarios nuevos)*

**Objetivo**: personalizar la app antes de crear cuenta.

```
OnboardingSlider
  └─► OppositionSelector
        (guarda oposición en AsyncStorage · no requiere cuenta aún)
        └─► LevelTestProposal
              ├─ "Ahora no"       ──► replace(Permissions)
              └─ "Hacer el test"  ──► LevelTestInProgress
                                          └─► LevelTestResult
                                                └─► replace(Permissions)
                                                        └─► [Bloque 1 · Acceso]
```

### Test de diagnóstico — detalles reales

| Atributo | Valor real |
|---|---|
| Generado por | Preguntas estáticas (no IA) |
| Total preguntas | 20 únicas |
| Distribución | 8 Constitución · 8 Ley 39/2015 · 2 Ley 40/2015 · 2 Org. del Estado |
| Cálculo de nivel | ≥75% → Avanzado/`high` · ≥50% → Intermedio/`medium` · <50% → Básico/`low` |
| Efecto en el plan | Inicializa la intensidad (`PATCH /planning/plan`) en el primer login |
| Resultado guardado | `AsyncStorage('opox.levelTestResult')` hasta que se aplica en login |

> ⚠️ **Corrección importante**: el test **no es generado por IA** ni tiene límite de 5 minutos. Es un cuestionario calibrado fijo con cronómetro que mide el tiempo total, pero no corta al usuario.

### `PermissionsScreen`

Solicita permisos de notificaciones push (`expo-notifications`). Si el usuario los deniega, aparece un estado "Denegado" con botón "Ir a Ajustes". Después de este paso (aceptados o denegados) el flujo continúa al Bloque 1.

---

## Bloque 1 · Acceso

**Objetivo**: autenticación y configuración de identidad.

### Flujo de registro (cuenta nueva)

```
Entrada
  └─► Registro
        ├─ Email ya registrado  ──► EmailAlreadyRegisteredModal
        │                               ├─ "Ir a Login"    ──► Login
        │                               └─ "Otro email"    ──► (mismo Registro)
        └─ Registro exitoso
              ├─ Confirm email ON  ──► Otp
              │                          └─► Terminos
              └─ Confirm email OFF ──► Terminos (accessToken ya disponible)

Terminos
  (acepta ToS + Privacy vía API)
  ├─ Dispositivo con biometría no vinculada  ──► BioLink  ──► SesionIniciada
  └─ Sin biometría / ya vinculada            ──► SesionIniciada
```

### Flujo de login (cuenta existente)

```
Entrada
  └─► Login
        ├─ Login exitoso             ──► replace(SesionIniciada)
        ├─ Error de credenciales     ──► error inline (hasta 3 intentos)
        ├─ 3 intentos fallidos       ──► modal "Cuenta bloqueada" (15 min)
        │                                   └─ "Restablecer contraseña" ──► RecuperarPassword
        ├─ Biometría vinculada       ──► botón Face ID / Huella ──► SesionIniciada
        └─ "Olvidé contraseña"       ──► RecuperarPassword
```

### Flujo de recuperación de contraseña

```
RecuperarPassword
  └─► RecuperarPasswordEnviado
        └─► (email con deep link opox://reset-password)
              └─► RecuperarPasswordNueva   (nueva contraseña)
                    └─► [vuelve a Login]
```

### `SesionIniciadaScreen` — pantalla de transición (2 s)

Ejecuta en paralelo antes de navegar al Dashboard:
1. Aplica la oposición elegida en onboarding (`updateProfile`)
2. Aplica la intensidad del plan calculada en el test (`updatePlan`)
3. Marca el onboarding como completado (`AsyncStorage`)
4. Registra el token push en el backend (fire-and-forget)

```
SesionIniciada  ──► replace(Dashboard)
```

### Estado de login social

| Proveedor | Estado |
|---|---|
| Email / contraseña | ✅ Funcional |
| Google | 🔲 Visual únicamente (`TODO(bloque1)`) |
| Meta (Facebook) | 🔲 Visual únicamente |
| Apple | 🔲 Visual únicamente |
| Biometría (Face ID / Huella) | ✅ Funcional (si el usuario la vinculó en `BioLink`) |

---

## Bloque 2 · Dashboard

**Objetivo**: centro de mando personalizado. Hub principal de la app.

```
Dashboard
  ├─► Notifications   (campana — historial de alertas)
  ├─► Settings        (engranaje — hub de configuración Bloque 12)
  │
  ├─► HomeHealth      (Bloque 3 · Salud)
  ├─► PlanningHome    (Bloque 4 · Planificación)
  ├─► MotivationHome  (Bloque 5 · Motivación)
  ├─► TrainingHome    (Bloque 6 · Entrenamiento)
  ├─► AITutor         (Bloque 8 · Aula Virtual)
  ├─► NotesHome       (Bloque 9 · Factoría de Apuntes)
  ├─► BoeHome         (Bloque 10 · Monitor BOE)
  └─► StoreHome       (Bloque 11 · Tienda)
```

**Tarjetas de resumen** (cargadas con `useFocusEffect`):
- Racha actual + Opopoints (motivación)
- Progreso del plan diario: `X de N tareas completadas`
- Alerta BOE si hay cambios legislativos no leídos (datos reales de `totalUnread`)
- Notificación nudge puntual de la app

> El Bloque 0 (Onboarding) **no aparece de nuevo** una vez `ONBOARDING_COMPLETED_KEY` está escrito en AsyncStorage.

---

## Bloque 3 · Salud Inteligente

**Objetivo**: monitorización biométrica, diagnóstico personalizado por IA y bienestar para el estudio.

```
Dashboard
  └─► HomeHealth         (hub · tarjeta de energía IA · métricas cardiovasculares)
        ├─► ConnectDevice
        │     └─► Pairing     (solicita permisos Apple Health / Health Connect)
        │           ├─ Concedidos   ──► (vuelve a HomeHealth con datos reales)
        │           ├─ Denegados    ──► botón "Ir a Ajustes" + "Continuar igualmente"
        │           └─ Expo Go      ──► pantalla informativa (requiere EAS build)
        │
        ├─► MetricDetail      (detalle de cualquier métrica: HR, HRV, SpO2, sueño, pasos)
        │
        ├─► FatigueEngine     (diagnóstico IA de fatiga · señales personalizadas vs línea base)
        │     └─► BreathingExercise  (pausa guiada · cronómetro inhalar/exhalar)
        │
        └─► AdviceHome        (biblioteca de consejos)
              ├─► StudyTips         (técnica de estudio recomendada por IA según contexto)
              ├─► FoodHome          (alimentación para la memoria)
              │     └─► Menus       (menús generados por IA · filtros: Concentración/Energía/Examen)
              │           └─► MenuDetail   (receta completa + lista de compra generada por IA)
              └─► MeditationList    (sesiones de meditación)
                    └─► MeditationPlayer   (guion de meditación personalizado por IA)
```

**Métricas leídas** (últimas 24 h): Ritmo cardíaco · Frecuencia cardíaca en reposo · HRV · SpO₂ · Horas de sueño · Pasos.

### IA en el Bloque 3 — 4 tareas (ver `BRIEF_IA_BLOQUE3.md`)

| Tarea IA | Pantalla | Qué reemplaza | Estado |
|---|---|---|---|
| `analyzeFatigueState` | `HomeHealth` + `FatigueEngine` | Heurística fija + reglas hardcodeadas | ⏳ Pendiente prompt |
| `generateDailyMenus` | `Menus` + `MenuDetail` | JSON estático `healthContent.js` | ⏳ Pendiente prompt |
| `suggestStudyTechnique` | `StudyTips` | Lista fija sin contexto | ⏳ Pendiente prompt |
| `generateMeditationScript` | `MeditationPlayer` | Guiones estáticos fijos | ⏳ Pendiente prompt |

**`analyzeFatigueState`** — qué cambia en la UX:
- `HomeHealth`: la tarjeta de energía muestra `energyScore` (0–100) y `headline` generados por IA, no la heurística fija.
- `FatigueEngine`: cada señal tiene `status` y `value` personalizados vs la **línea base del usuario** (no vs un umbral médico genérico). El mensaje `explanation` cita los valores reales del usuario.
- Nudge en `Dashboard`: si `level: "high"`, aparece tarjeta "Tu cuerpo necesita un descanso" → `FatigueEngine`.

**`generateDailyMenus`** — qué cambia en la UX:
- Los menús se cargan del backend (no del JSON local). Si `fatigueLevel: "high"`, se priorizan menús de recuperación.
- `MenuDetail` muestra receta paso a paso + lista de compra con cantidades exactas.
- El badge `"AI"` en las tarjetas es real (no solo visual).

**`suggestStudyTechnique`** — qué cambia en la UX:
- Una tarjeta destacada aparece al inicio de `StudyTips` con la técnica recomendada para **hoy**, citando el estado de fatiga y el examen próximo.
- Si `fatigueType: "acute_stress"` + examen próximo: recomienda podcast → enlaza a `TutorPodcast` (Bloque 8).

**`generateMeditationScript`** — qué cambia en la UX:
- El `MeditationPlayer` recibe fases con texto y duraciones reales. El texto se muestra centrado en pantalla mientras transcurre cada fase.
- La duración total coincide exactamente con la sesión elegida (3, 5, 7 u 8 min).
- El guion menciona el examen si `examDaysAway ≤ 7`.

**Línea base personal** (implementación backend):
- El backend agrega y guarda el historial de métricas por usuario en `user_health_baselines`.
- Los primeros 7 días: usa valores médicos estándar (`HRV_BASE=50, HR_BASE=61`).
- A partir de 7 días: calcula la media rolling real del usuario.

**Cross-bloque**:
- `fatigueLevel` + `fatigueType` → `TutorChat` (Bloque 8): ajusta tono del tutor.
- `fatigueType: "acute_stress"` + `examDaysAway ≤ 7` → sugiere `TutorPodcast`.
- Nudge en `Dashboard` cuando IA detecta fatiga alta.

> ⚠️ **Requiere EAS development build** para leer datos reales de HealthKit / Health Connect. En Expo Go los datos aparecen como `—` y la IA recibe métricas `null`.  
> ⚠️ **El audio de meditaciones no es tarea de IA**: la app muestra el texto por fases. TTS es una fase posterior con el mismo contrato JSON.

---

## Bloque 4 · Planificación

**Objetivo**: gestión del plan de estudio diario, semanal y macro.

```
Dashboard (tarjeta Plan)
  └─► PlanningHome
        ├─► PlanningToday    (HOY · lista de tareas del día)
        │     ├─ Modal añadir tarea: tab "Test de práctica" / tab "Tarea libre"
        │     │     └─ "Empezar" ──► GeneratorConfig  (Bloque 6)
        │     └─ tarea completada ──► actualiza racha + Opopoints
        │
        ├─► PlanningWeek     (SEMANA · vista calendario)
        │
        ├─► PlanningMacro    (HORIZONTE · fases con temas reales distribuidos)
        │     └─ "Estudiar esta fase" ──► GeneratorConfig  (Bloque 6)
        │
        ├─► PlanningAgenda   (AGENDA · vista lista multi-día)
        │
        └─► PlanningEdit     (AJUSTAR PLAN)
              └─ Guardar ──► (vuelve a PlanningHome)
```

**`PlanningEdit`** — lo que configura el usuario:
- Intensidad: Baja / Media / Alta (multiplica el objetivo diario: ×0.75 / ×1 / ×1.25)
- Fecha de examen objetivo (activa el modo "recta final")
- Tests por día base

**`PlanningHome`** — alertas de sesión (aparecen una sola vez por arranque de app):
- Pop-up "Examen próximo" si la fecha está cerca
- Pop-up "Días sin estudiar" si la racha está en peligro
- CTA "Activar recta final" → cambia intensidad a `high` y navega a `PlanningToday`

---

## Bloque 5 · Motivación y Gamificación

**Objetivo**: racha, ranking, clanes y recompensas.

```
Dashboard (tarjeta Racha / Opopoints)
  └─► MotivationHome
        ├─► StreakDetail      (detalle de racha · historial · próximo hito)
        │
        ├─► Rankings          (top semanal · global · por oposición · por tema)
        │
        ├─► GloryWall         (muro de logros y hitos)
        │
        ├─► DuelsPlaceholder  (duelos · próximamente)
        │
        └─► ClansList         (explorar / unirse / crear clan)
              └─► ClanDetail
                    ├─► ClanChat       (chat en tiempo real con Supabase Realtime)
                    └─► Challenges     (retos del clan)
                          ├─ Wizard paso 1: selector de tema
                          ├─ Wizard paso 2: nombre + preguntas (5–100) + Opopoints (10–500)
                          └─ "Iniciar" ──► GeneratorConfig  (Bloque 6)
                                              └─► TrainingSession ──► TrainingResult
                                                    └─ completa reto si score ≥60%
```

**Cómo se gana Opopoints (Opopoints)**:
| Evento | Puntos |
|---|---|
| Completar el plan diario | 40 O |
| Completar un test (Bloques 6/7/9) | 1 O por acierto × multiplicador (≥80%→×1.5, ≥60%→×1.2, resto×1.0) |
| Mini-test BOE (Bloque 10) | hasta 5 O por mini-test |
| Cap diario por tests | 100 O/día |

**`RachaPeligroModal`** (aparece cuando la racha está en riesgo):
- "Hacer test rápido" → `GeneratorConfig`
- "Ver mis tareas" → `PlanningToday`
- "En otro momento" → dismiss

---

## Bloques 6 & 7 · Entrenamiento y Sesión de Test

**Objetivo**: práctica intensiva de preguntas.

```
Dashboard (tab Entreno)
  └─► TrainingHome
        ├─► GeneratorConfig          (Generador Infinito)
        │     (configura dificultad · nº preguntas · uno o varios temas)
        │     └─► TrainingSession    (sesión activa de test)
        │           └─► TrainingResult
        │                 ├─ "Revisar errores"  ──► ErrorLab
        │                 ├─ hint BOE si hay no leídos ──► BoeHome
        │                 └─ [completar tarea / reto si corresponde]
        │
        ├─► OfficialMocks            (Simulacros Oficiales)
        │     (lista de exámenes reales por año · estado: pendiente/en progreso/completado)
        │     └─► MockInstructions ──► TrainingSession ──► TrainingResult
        │     └─ banner "Test quirúrgico" ──► ErrorLab
        │
        ├─► ErrorLab                 (Laboratorio de Errores)
        │     └─► SurgicalTestPreview   (previsualización del test quirúrgico)
        │           └─► TrainingSession ──► TrainingResult
        │
        └─► PhotoTestCapture         (Módulo Foto-Test)
              └─► PhotoTestAnalysis  (IA procesa la imagen)
                    └─► PhotoTestResult
                          └─ "Practicar errores" ──► ErrorLab
```

### `TrainingSession` — interacciones por pregunta

| Acción | Destino / efecto |
|---|---|
| Pedir pista | `TutorChat` con contexto de la pregunta |
| Ver referencia legislativa | Panel desplegable inline |
| Guardar pregunta | marcada en el perfil |
| Reportar pregunta | envía reporte al backend |
| Confirmar respuesta | avanza a siguiente pregunta |
| Tiempo agotado | pasa automáticamente |

### `TrainingResult` — acciones post-test

| Acción | Destino |
|---|---|
| Revisar errores | `ErrorLab` |
| Repetir test | `GeneratorConfig` |
| Volver al inicio | `Dashboard` |
| Hint BOE (si hay no leídos) | `BoeHome` |
| Marcar tarea como completada | automático si venía de `PlanningToday` |
| Completar reto de clan | automático si `percentage ≥ 60%` |

### Simulacros Oficiales — detalles

- Lista cargada de `GET /training/mocks?oposicion=X` (solo la oposición del usuario)
- Estado por simulacro: `pending` / `ongoing` / `completed`
- Muestra: año, nº preguntas, duración en minutos, porcentaje de progreso
- Si no hay simulacros disponibles para la oposición → estado vacío con mensaje

### Generador Infinito — detalles técnicos

- IA: OpenAI `gpt-4o-mini` (directo). Motor RAG desactivado hasta que equipo IA resuelva INC-04.
- TTL: aviso visual a 15 s · cancelación automática a 240 s.
- Multi-selección de temas: "Todos los temas" o checkboxes individuales acumulables.
- TTL configurado para soportar 10+ preguntas sin cancelar.

---

## Bloque 8 · Aula Virtual (Tutor IA)

**Objetivo**: aprendizaje asistido por IA.

```
Dashboard (sección Repaso)
  └─► TutorHome           (hub del Aula Virtual)
        ├─► TutorChat     (chat con IA · OpenAI gpt-4o-mini · tono personalizable)
        │     └─ puede lanzar test ──► GeneratorConfig (Bloque 6)
        │
        ├─► TutorPodcast  (podcast IA por episodio · EpisodePicker si no hay episodioId)
        │     └─ velocidades: 0.5x / 1x / 1.5x / 2x · guarda progreso cada 10 s
        │
        ├─► TutorSummaries (resúmenes inteligentes por tema · TopicPicker si no hay topicId)
        │     └─ puede generar flashcards o podcast del resumen
        │
        └─► TutorFlashcardsLoading  (genera flashcards · stub IA pendiente)
              └─► TutorFlashcards   (práctica libre · girar carta · sin puntaje)
                    └─ empty state si la IA no devuelve tarjetas
```

**Tono del Tutor**: configurable en Bloque 12 → `ConfigTone`. Opciones: `cercano / equilibrado / exigente`. Se propaga a cada llamada a `POST /tutor/message`.

**Estado IA**:
- Chat: ✅ OpenAI real
- Podcast y Resúmenes: datos de Supabase (seed)
- Flashcards: stub IA (`TODO(ia-bloque8)`)

---

## Bloque 9 · Factoría de Apuntes

**Objetivo**: convertir apuntes propios (PDF/foto) en tests personalizados.

```
Dashboard (sección Mis apuntes)
  └─► NotesHome          (lista de apuntes subidos)
        ├─► NotesUpload  (subir PDF o foto · cámara o galería)
        │     └─► NotesAnalysis  (pipeline en background: OCR → etiquetas → preguntas)
        │           └─► NoteDetail   (detalle: páginas, etiquetas automáticas, estado)
        │                 └─► NotesTestConfig  (configurar test del apunte)
        │                           (dificultad · temas etiquetados · nº preguntas)
        │                       └─► TrainingSession (Bloque 7)
        │                             └─► TrainingResult
        └─► NoteDetail   (acceso directo si el apunte ya existe)
```

**Pipeline de análisis** (ejecuta en background tras upload):
1. OCR → extrae texto de páginas
2. Detección de temas → etiquetas automáticas
3. Generación de preguntas → banco de preguntas del apunte

> **Estado IA**: pipeline ejecutable con datos mock realistas (stub). IA real esperando prompts del equipo (`BRIEF_IA_BLOQUE9.md`).

**`NotesTestConfigScreen`** — controles disponibles:
- Slider de dificultad: Fácil / Medio / Difícil
- Toggle "Solo temas etiquetados"
- Número de preguntas

**Notificación push**: cuando el análisis termina, el backend envía una notificación push al dispositivo (Bloque 13).

---

## Bloque 10 · Monitor BOE

**Objetivo**: seguimiento de cambios legislativos en tiempo real.

```
Dashboard (sección Monitor BOE)
  └─► BoeHome           (feed de cambios · normas seguidas · añadir norma)
        ├─► BoeDetail   (detalle del cambio legislativo)
        │     ├─► BoeComparison    (comparativa Antes / Después · diff word-by-word)
        │     ├─► BoeMiniTest      (mini-test sobre los puntos afectados · 3 preguntas)
        │     │     └─► BoeUpdateSuccess
        │     └─ CTA "Practicar" (si hay preguntas afectadas) ──► GeneratorConfig
        │
        └─ Modal "Añadir norma"
              (carga sugerencias del Motor BOE · muestra badge "Siguiendo" si ya se sigue)
```

**Fuentes de actualización**:
- `POST /boe/sync` → Motor BOE en `https://ingesta-demo.onrender.com`
- Supabase Realtime: cuando el backend inserta en `boe_changes`, la app muestra banner in-app inmediato
- Notificación push: si el usuario tiene la app cerrada (Bloque 13)

**`BoeComparison`**: diff calculado en backend con el paquete `diff` (word-by-word). El mobile solo renderiza los segmentos, sin cálculo en cliente. Tipos de segmento: `normal / deleted / added`.

**Mini-test BOE**: 3 preguntas (no 4 como el Generador). IA pendiente (`BRIEF_IA_BLOQUE10.md`). Hasta 5 Opopoints al completarlo.

**Cross-bloque**:
- `DashboardScreen`: alerta de leyes obsoletas con datos reales de `totalUnread`
- `TrainingResultScreen`: si hay cambios BOE no leídos, muestra hint card "Revisar →"

---

## Bloque 11 · Tienda OPOX

**Objetivo**: canje de Opopoints por recompensas y acceso a contenido de comunidad.

```
Dashboard / MotivationHome
  └─► StoreHome           (balance · tabs: Descuentos · Recompensas · Suscripción)
        │
        ├─► StoreHowToEarn        (guía de cómo ganar Opopoints)
        │
        ├─► StoreDiscounts        (códigos de descuento · canjear con Opopoints)
        │     └─► StoreConfirmRedeem (redeemType: 'discount')
        │           └─► RedeemSuccessModal ──► StoreWallet
        │
        ├─► StoreRealRewards       (recompensas físicas/virtuales)
        │     └─► StoreRealRewardDetail
        │           └─► StoreRealRedeemConfirm
        │                 └─► StoreRealRewardSuccess
        │
        ├─► StoreMarketplace       (tests de la comunidad)
        │     ├─ Gratis: `obtainCommunityTest` directo
        │     └─► StoreTestDetail
        │           └─► StoreConfirmRedeem (redeemType: 'community_test')
        │                 └─► RedeemSuccessModal ──► StoreMarketplace
        │
        ├─► StoreSubscription      (planes de suscripción)
        │     └─► StoreSubscriptionSuccess
        │
        ├─► StoreAffiliate         (programa de afiliados)
        │
        └─► StoreWallet            (mis compras activas)
              └─► StoreCodeDetail  (detalle de un código o artículo)
```

**Saldo Opopoints**: calculado en tiempo real como suma neta del ledger `user_opopoints_ledger` (earn − spend). No hay columna precalculada.

**Flujo de canje** (centralizado en `StoreConfirmRedeemScreen`):
1. Verificar saldo ≥ coste
2. Insertar fila `spend` en ledger
3. Para productos físicos: decrementar stock + generar código único + crear item en wallet
4. Para descuentos: devolver código precargado (sin crear wallet item)
5. Para tests: compra idempotente por constraint `(user_id, test_id)`

---

## Bloque 12 · Configuración y Analítica

**Objetivo**: control total de la cuenta, preferencias y estadísticas.

```
Settings (engranaje desde Dashboard)
  └─► SettingsScreen      (menú maestro con subtextos reales del backend)
        ├─► ConfigPerfil          (12.1 · nombre · biometría · cambio de contraseña)
        │
        ├─► ConfigSubscription    (12.2 · estado · Linking.openURL a tiendas del SO)
        │
        ├─► ConfigDevices         (12.3 · wearables conectados · eliminar dispositivo)
        │     └─► [Pairing en Bloque 3]
        │
        ├─► ConfigTone            (12.5 · tono IA: cercano/equilibrado/exigente)
        │     (se propaga a TutorChat en tiempo real)
        │
        ├─► ConfigAccessibility   (12.4 · tema: auto/claro/oscuro · fuente · animaciones)
        │
        ├─► ConfigStats           (12.7 · estadísticas Pro con datos reales)
        │     └─► ConfigExport    (12.8 · generar PDF de rendimiento)
        │           └─► ReportSuccessModal ("Abrir PDF" vía Linking.openURL)
        │
        ├─► ConfigHelp            (12.9 · FAQ buscable · botón chat soporte)
        │
        ├─► ConfigFeedback        (12.10 · sugerencia / bug / otro · max 500 chars)
        │     └─► FeedbackSuccessModal
        │
        └─► ConfigDeleteAccount   (12.11 · confirmación · logout + borrado de datos)
```

**`ConfigStats` — métricas calculadas en tiempo real**:
- `accuracyPct`: porcentaje de acierto global
- `passedProbabilityPct`: heurística `accuracy×0.85 + streak×0.5`
- `topicsStrong`: temas con ≥80% acierto
- `topicsWeak`: temas con <50% acierto
- `avgSecsPerQuestion`: velocidad media (null si no hay datos)
- Radar de soft skills: Conocimientos · Resistencia · Memoria · Concentración · Velocidad

**`ConfigExport`** — PDF real generado con `pdfkit`:
- Cabecera morada + tabla de desglose por temas (verde/naranja/rojo según rendimiento)
- Sube a Supabase Storage (`pro-stats-exports`) y devuelve URL firmada (1 h de validez)

**Accesibilidad — mapeos importantes**:
| Mobile | API |
|---|---|
| `'claro'` | `'light'` |
| `'oscuro'` | `'dark'` |
| `'pequeno'` | `fontScale: 0.85` |
| `'medio'` | `fontScale: 1.0` |
| `'grande'` | `fontScale: 1.15` |
| `reduceAnimations` | `reduceMotion` |

---

## Bloque 13 · Notificaciones Push

**Objetivo**: alertas en tiempo real fuera de la app.

### Registro

Automático en `SesionIniciadaScreen` tras login (fire-and-forget). Guarda el token Expo en `user_push_tokens`. No-op en Expo Go.

### Triggers de notificación

| Evento | Tipo | Destinatario |
|---|---|---|
| Cambio BOE detectado | `boe_alert` | Broadcast a todos los usuarios |
| Análisis de apunte terminado | `note_ready` | Solo el propietario del apunte |
| Racha en peligro (01:00 UTC diario) | `streak_warning` | Broadcast |
| Plan diario completado | `daily_reminder` | Solo el usuario |

### Visualización en app abierta

- `InAppNotificationBanner`: banner animado, auto-dismiss 4 s, icono por tipo
- Tap en banner → navega a `data.screen` con los `params` incluidos

### Supabase Realtime (BOE en vivo)

`BoeRealtimeWatcher` en `App.js` escucha INSERT en `boe_changes`. Muestra el banner sin necesidad de push externo cuando la app está abierta. Navega a `BoeDetail` (si hay `id` en el payload) o a `BoeHome` (fallback).

> ⚠️ **Push remotos requieren EAS development build**. En Expo Go el registro de token no funciona (SDK 53+).

---

## Conexiones cross-bloque

| Desde | Acción | Destino |
|---|---|---|
| `PlanningToday` | "Empezar" tarea test | `GeneratorConfig` |
| `Challenges` (clan) | "Iniciar" reto | `GeneratorConfig` → `TrainingSession` → `TrainingResult` → `completeChallenge` |
| `BoeDetail` | "Practicar" | `GeneratorConfig` |
| `NotesTestConfig` | "Empezar test" | `TrainingSession` |
| `ErrorLab` | cualquier test quirúrgico | `SurgicalTestPreview` → `TrainingSession` |
| `TrainingResult` | hint BOE | `BoeHome` |
| `MotivationHome` | "Ver tienda" | `StoreHome` |
| `RachaPeligroModal` | "Hacer test rápido" | `GeneratorConfig` |
| `HealthScreen` | CTA tutor | `AITutor` (TutorHome) |
| `TutorChat` | "Lanzar test" | `GeneratorConfig` |
| `OfficialMocks` | banner quirúrgico | `ErrorLab` |

---

## Estado de implementación por bloque

| Bloque | Frontend | Backend | IA | Notas pendientes |
|---|---|---|---|---|
| 0 · Onboarding | ✅ | — | — | — |
| 1 · Acceso | ✅ | ✅ | — | Login social (Google/Meta/Apple) pendiente de SDK nativo |
| 2 · Dashboard | ✅ | ✅ | — | — |
| 3 · Salud | ✅ | ⏳ endpoints pendientes | ⏳ 4 tareas (ver `BRIEF_IA_BLOQUE3.md`) | Requiere EAS build · Línea base personal por implementar |
| 4 · Planificación | ✅ | ✅ | — | — |
| 5 · Motivación | ✅ | ✅ | — | Duelos (placeholder) y clanes privados (Fase 2) |
| 6 · Entrenamiento | ✅ | ✅ | ✅ OpenAI | Motor RAG desactivado (INC-04 pendiente equipo IA) |
| 7 · Sesión de Test | ✅ | ✅ | ✅ OpenAI | — |
| 8 · Aula Virtual | ✅ | ✅ | Parcial | Flashcards IA pendiente (`TODO(ia-bloque8)`) |
| 9 · Factoría | ✅ | ✅ | Stub | IA real esperando prompts (`BRIEF_IA_BLOQUE9.md`) |
| 10 · Monitor BOE | ✅ | ✅ | Stub | Mini-test IA pendiente (`BRIEF_IA_BLOQUE10.md`) |
| 11 · Tienda | ✅ | ✅ | — | RevenueCat para suscripción real (pendiente) |
| 12 · Configuración | ✅ | ✅ | — | ThemeContext global · Chat soporte (Intercom) · RevenueCat |
| 13 · Notificaciones | ✅ | ✅ | — | Prueba E2E pendiente de EAS development build |
