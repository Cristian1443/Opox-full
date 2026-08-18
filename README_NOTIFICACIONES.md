# Notificaciones Push — OPOX (Bloque 13)

Documento de referencia local. No se sube al repositorio público.

---

## Cómo funciona el sistema

### Flujo general

```
Dispositivo (Expo)
  └─ registerForPushNotifications()
       └─ Expo SDK → solicita permiso al OS
       └─ obtiene ExponentPushToken[...]
       └─ POST /push/token → backend
            └─ guarda en user_push_tokens (Supabase)

Trigger (backend)
  ├─ Cron 01:00 UTC → SendStreakWarningUseCase
  ├─ ToggleTask cruza umbral → SendDailyGoalCompletedUseCase
  ├─ SyncBoeChanges detecta cambios → SendBoeAlertUseCase
  └─ Pipeline OCR termina → SendNoteReadyUseCase
       └─ ExpoPushService → POST exp.host/--/api/v2/push/send
            └─ Expo Push API → APNs (iOS) / FCM (Android)
                 └─ notificación llega al dispositivo
```

### Visualización en la app

| Situación | Comportamiento |
|---|---|
| App en **segundo plano** o **cerrada** | El OS muestra la notificación nativa del sistema |
| App **abierta** (primer plano) | `InAppNotificationBanner` aparece arriba, auto-dismiss 4 s |
| Usuario **toca** la notificación | Navega a la pantalla indicada en `data.screen` |
| BOE cambia con app abierta | `BoeRealtimeWatcher` (Supabase Realtime) muestra el banner sin necesidad de push externo |
| Chat de clanes abierto | Los mensajes nuevos llegan en tiempo real vía Supabase Realtime (sin polling) |

---

## Pantallas que utilizan notificaciones

### Registro del token (punto de entrada)
| Pantalla | Archivo | Qué hace |
|---|---|---|
| Sesión iniciada | `screens/access/SesionIniciadaScreen.js` | Llama `registerForPushNotifications()` inmediatamente después del login, antes de navegar al Dashboard |

### Destinos de navegación al tocar una notificación
| Tipo | `data.screen` | Descripción |
|---|---|---|
| `boe_alert` | `BoeHome` | Feed de cambios legislativos |
| `note_ready` | `NoteDetail` | Detalle del apunte analizado (con `params.noteId`) |
| `streak_warning` | `MotivationHome` | Pantalla de motivación y racha |
| `daily_reminder` | `PlanningHome` | Planificación del día |

### Banner in-app
| Componente | Archivo | Dónde se monta |
|---|---|---|
| `InAppNotificationBanner` | `components/InAppNotificationBanner.js` | `App.js` (raíz de la app, sobre todo el contenido) |

### Realtime (sin push externo)
| Pantalla | Canal Supabase | Evento |
|---|---|---|
| `ClanChatScreen.js` | `clan-messages-{clanId}` | INSERT en `clan_messages` filtrado por `clan_id` |
| `App.js` (global) | `boe-realtime-alerts` | INSERT en `boe_changes` — muestra banner in-app |

---

## Triggers de backend

| Use Case | Cuándo se dispara | Destinatarios |
|---|---|---|
| `SendStreakWarningUseCase` | Cron `0 1 * * *` UTC (20:00h Colombia) | Todos los tokens registrados |
| `SendDailyGoalCompletedUseCase` | `ToggleTaskUseCase` al cruzar `plan.testsPerDay` | Solo el usuario que completó la meta |
| `SendBoeAlertUseCase` | `SyncBoeChangesUseCase` cuando `synced > 0` | Todos los tokens registrados |
| `SendNoteReadyUseCase` | Pipeline `UploadNoteUseCase` al pasar a `status: 'ready'` | Solo el propietario del apunte |

---

## Paso a paso: prueba con EAS development build

> Requisito previo: tener instalado EAS CLI (`npm install -g eas-cli`) y estar logueado (`eas login`).

### 1. Preparar variables de entorno del mobile

Crea el archivo `apps/mobile/.env` (no se commitea) con:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Los valores son los mismos que `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `apps/backend/.env`.

### 2. Ejecutar el SQL de Bloque 13 en Supabase

Si no lo has hecho: abre Supabase → SQL Editor → pega y ejecuta el contenido de:
```
apps/backend/supabase/bloque13_notifications.sql
```
Verifica que aparece la tabla `user_push_tokens` en Table Editor.

### 3. Levantar el backend

```bash
pnpm dev --filter=backend
```

Confirma en los logs que ves:
```
[scheduler] streak-warning registrado — cron: 0 1 * * * UTC (20:00 Colombia)
```

### 4. Crear el EAS development build

```bash
cd apps/mobile
eas build --profile development --platform android   # o --platform ios
```

Esto tarda ~5-10 minutos. Al terminar te da un enlace de descarga del APK/IPA.
Instala el build en el dispositivo físico (no emulador — los emuladores no tienen token push real).

### 5. Abrir la app con el development build

Abre la app instalada y conéctala al servidor Metro de tu máquina:
```bash
pnpm dev --filter=mobile
```
En el build de desarrollo verás la pantalla de conexión del dev client. Introduce la IP de tu máquina.

### 6. Hacer login

Usa las credenciales de prueba. La pantalla `SesionIniciadaScreen` ejecutará:
1. `registerForPushNotifications()` → solicita permiso al OS
2. **Acepta el permiso cuando el OS pregunte**
3. La app llama `POST /push/token` con el token Expo

Verifica en Supabase → Table Editor → `user_push_tokens` que aparece una fila nueva con tu `user_id` y el token.

### 7. Probar notificación manual (push externo)

Con el backend corriendo, usa Postman o `curl`:

```bash
# Primero haz login para obtener un token JWT
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'

# Luego dispara la racha (simula el cron)
# En un endpoint de test si lo añades, o espera las 01:00 UTC
```

Alternativa rápida — disparar el streak warning directamente desde el código:
Añade temporalmente a `server.ts` una ruta de test:
```typescript
app.post('/push/test-streak', async (_req, res) => {
  await container.useCases.sendStreakWarning.execute();
  res.json({ ok: true });
});
```
Luego: `curl -X POST http://localhost:3000/push/test-streak`

Deberías recibir la notificación push en el dispositivo.

### 8. Probar banner in-app (notificación en primer plano)

Con la app abierta en primer plano, dispara cualquier notificación del paso 7.
En lugar de la notificación del sistema, verás el `InAppNotificationBanner` deslizarse desde arriba y desaparecer a los 4 segundos. Al tocarlo navega a la pantalla correcta.

### 9. Probar Realtime del chat de clanes

1. Abre el chat de un clan en un dispositivo
2. Desde otro dispositivo (o directamente desde Supabase → Table Editor → INSERT manual en `clan_messages`), envía un mensaje
3. El mensaje debe aparecer en tiempo real sin recargar

### 10. Probar Realtime de alertas BOE

Con la app abierta:
```bash
# Insertar un cambio BOE manualmente en Supabase (SQL Editor)
INSERT INTO boe_changes (id, boe_identifier, detected_at, article_title, summary, affected_topics)
VALUES (gen_random_uuid(), 'BOE-TEST-001', now(), 'Artículo de prueba Realtime', 'Resumen de prueba', '{}');
```
El banner in-app debería aparecer en menos de 1 segundo sin que el backend haga nada.

---

## Arquitectura de archivos — referencia rápida

```
apps/
├── backend/
│   ├── supabase/bloque13_notifications.sql       # tabla user_push_tokens
│   └── src/
│       ├── domain/
│       │   ├── entities/PushToken.ts
│       │   ├── repositories/IPushRepository.ts
│       │   └── errors/NotificationsError.ts
│       ├── application/notifications/
│       │   └── NotificationUseCases.ts           # 4 use cases de envío + Register
│       ├── infrastructure/
│       │   ├── push/
│       │   │   ├── SupabasePushRepository.ts
│       │   │   └── ExpoPushService.ts
│       │   └── scheduler/NotificationScheduler.ts
│       └── presentation/
│           ├── controllers/PushTokenController.ts
│           ├── routes/pushTokenRoutes.ts
│           └── validators/pushTokenValidators.ts
└── mobile/
    ├── .env.example                              # EXPO_PUBLIC_SUPABASE_* vars
    ├── App.js                                    # InAppNotificationBanner + BoeRealtimeWatcher
    └── src/
        ├── api/push.js                           # pushApi.registerToken()
        ├── lib/supabase.js                       # cliente Supabase Realtime
        ├── components/InAppNotificationBanner.js
        └── screens/
            ├── access/SesionIniciadaScreen.js    # registra token tras login
            └── motivation/ClanChatScreen.js      # Realtime chat

packages/
├── types/src/notifications.ts                    # contratos compartidos
└── constants/src/routes.js                       # PUSH.REGISTER_TOKEN
```
