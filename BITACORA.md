# BITÁCORA

Registro de avances por fecha. Notación en términos de producto — la parte
técnica queda en el código y en el historial de git.

---

## 2026-07-05 — Cierre definitivo del bloque 1 · Acceso

### Biometría completada y validada en dispositivo físico Android

- **Huella dactilar en Android**: flujo completo validado en dispositivo físico
  con Expo Go. Registro de clave Ed25519, vínculo al backend y login biométrico
  challenge–response funcionando de extremo a extremo.
- **Face ID en iOS**: código listo y configuración completa. Se añadió el plugin
  `expo-local-authentication` con `faceIDPermission` en `app.json` para que
  `NSFaceIDUsageDescription` se inyecte en builds iOS. Requiere development
  build (EAS) para probarse — Expo Go no expone Face ID en iOS por diseño.
- **Reconocimiento facial Android excluido**: el face unlock de Android es
  biometría de clase 2 (débil) e incompatible con `SecureStore requireAuthentication`
  que exige clase 3 (fuerte). La app solo ofrece huella en Android y Face ID/
  Touch ID en iOS.
- **Ícono biométrico dinámico** en LoginScreen: `finger-print` para huella,
  `scan-outline` para Face ID, según lo que detecte el dispositivo.
- Se creó `apps/mobile/eas.json` con perfiles `development`, `preview` y
  `production` listos para el primer EAS Build.

### Correcciones de flujo y navegación

- **Dev Menu eliminado**: `initialRouteName` cambia de `DevMenu` a `Splash`.
  La app arranca ahora con el flujo natural completo sin bypass de desarrollo.
- **Logout limpia biometría**: `authApi.logout()` llama a `disableBiometric()`
  en paralelo con `clearSession()`. Antes, el estado biométrico quedaba en
  SecureStore indefinidamente y la pantalla de BioLink nunca volvía a aparecer.
- **DashboardPlaceholder**: el botón "Volver al Dev Menu" pasa a ser
  "Cerrar sesión" con logout real, para poder reiniciar el flujo desde cualquier
  sesión de prueba.
- **SecureStore en web**: `isBiometricLinked()` ahora retorna `false`
  inmediatamente en web, evitando el crash `getValueWithKeyAsync is not a function`
  al ejecutar el bundle web.

### Integración de ramas y dependencias

- Se creó la rama `release/bloque-1` fusionando `bloque-1-acceso` con `main`.
  Conflictos resueltos manteniendo la estructura de monorepo (pnpm/turbo).
  Archivos de la estructura antigua (`src/hooks/`, `src/navigation/`) reubicados
  a `apps/mobile/src/`.
- Instalada dependencia `@react-native-community/netinfo` que faltaba para
  el hook `useNetworkWatcher` aportado por `main`.

### Estado del bloque 1 · Acceso
Cerrado por completo desde la perspectiva de usuario y de código. Validado
en Android físico con Expo Go. La única limitación restante es de entorno de
prueba: Face ID en iOS necesita un EAS Build para poder probarse.

### Pendientes conocidos
- Verificar dominio propio en Resend para enviar OTPs a cualquier email
  (ahora sandbox: solo al email titular de la cuenta Resend).
- Deep link para consumir el enlace de recuperación de contraseña desde el
  correo (pantalla 1.5c).
- EAS Build iOS para validar Face ID en iPhone físico.
- Hosting definitivo del backend (ahora solo funciona en local).

---

## 2026-07-03 — Backend en marcha y biometría del bloque 1

### Infraestructura del backend
- El repositorio pasó a estructura de **monorepo** (código móvil, backend y
  paquetes compartidos separados). Facilita mantener tipos y constantes
  únicos en una fuente de verdad.
- Backend propio en **Node + Express** con arquitectura por capas
  (presentation → application → domain → infrastructure). Documentado en
  `apps/backend/README.md`.
- Base de datos y autenticación en **Supabase** (proyecto europeo, plan
  gratuito). Se eligió sobre Firebase por su modelo relacional (Postgres),
  costes previsibles y mejor encaje con el resto de bloques (chat de clanes,
  storage, RLS).
- Envío de emails vía **Resend** integrado con Supabase por SMTP. En modo
  sandbox durante desarrollo (solo envía al email del titular de Resend);
  cuando saltemos a beta cerrada hay que verificar el dominio.

### Bloque 1 · Acceso conectado al backend real
Todas las pantallas del bloque dejaron de operar con datos simulados y
consumen el backend:
- **Registro** por email y contraseña: crea el usuario y dispara el envío
  del código de verificación al email.
- **Verificación por código OTP** de 6 dígitos.
- **Login** con credenciales validadas contra el backend.
- **Recuperación de contraseña**: pide el email → envía enlace de
  recuperación (el flujo del *deep link* para consumirlo desde el correo
  queda pendiente para siguiente sprint).
- **Aceptación de términos y política**: guarda momento y versión aceptada
  en el perfil del usuario.
- **Cierre de sesión** con revocación real en el backend.

### Estados de error del bloque 1 alineados con mockups
- Email ya registrado → modal con "Ir a iniciar sesión" y "Usar otro email".
- Credenciales incorrectas → borde rojo en inputs + mensaje inline.
- Cuenta bloqueada tras varios intentos fallidos → modal con countdown y
  botón "Restablecer contraseña".
- Sin conexión → toast rojo abajo sin bloquear la interacción.
- Face ID / huella no reconocido → pantalla oscura con opciones
  "Reintentar" o "Usar contraseña".

### Biometría (Face ID / huella)
- Detecta las capacidades del dispositivo y ofrece la pantalla de vínculo
  solo cuando aplica.
- El usuario puede activar la biometría después del primer login. En
  accesos siguientes aparece el botón "Entrar con Face ID/huella" en la
  pantalla de Login.
- Cada intento de acceso biométrico usa un desafío único emitido por el
  backend y firmado en el dispositivo (nadie puede reutilizar una firma).
- La credencial biométrica solo vive en el llavero del propio dispositivo
  (Keychain iOS / Keystore Android). El backend no la almacena.

### Validación con pruebas
- 17 pruebas manuales contra el backend cubriendo: healthcheck,
  validaciones de formato de datos, credenciales incorrectas, códigos
  inválidos, tokens caducados y flujo completo autenticado
  (perfil → aceptar términos → cerrar sesión).
- 16 de 17 pasan. La restante (biometría end-to-end) requiere dispositivo
  físico o emulador con biometría configurada — pendiente de ejecutar en
  Android real.

### Estado del bloque 1 · Acceso
Cerrado desde la perspectiva de usuario. Falta el hosting definitivo del
backend para poder usarse desde cualquier dispositivo sin depender de una
máquina de desarrollo.

### Pendientes conocidos
- Verificar dominio propio en Resend para poder enviar OTPs a cualquier
  email (ahora sandbox: solo al titular de Resend).
- Deep link para consumir el enlace de recuperación de contraseña desde el
  correo (pantalla 1.5c).
- Prueba de biometría en dispositivo físico (bloqueada por versión de Expo
  Go en Play Store, en resolución).

---

## 2026-07-02 — Bloque 1 · Acceso frontend completo

### Pantallas del bloque 1 · Acceso
Se implementaron las 10 pantallas del wireframe, con foco en fidelidad
visual al mockup y usabilidad:

- 1.1 Pantalla de entrada (bienvenida + botones "Crear cuenta" / "Ya tengo
  cuenta").
- 1.2 Registro con email/contraseña, botones sociales (Google/Meta/Apple),
  indicador de fuerza de contraseña.
- 1.3 Login con email/contraseña y atajo biométrico.
- 1.4 Bio-Link (activación de Face ID / huella tras el primer login).
- 1.5a Recuperar contraseña — solicitud del email.
- 1.5b Recuperar contraseña — confirmación de envío del enlace.
- 1.5c Recuperar contraseña — nueva contraseña con barra de fuerza
  segmentada.
- 1.6 Verificación por OTP de 6 dígitos.
- 1.7 Términos y privacidad con aceptación explícita del usuario.
- 1.x ok · Estado "Sesión iniciada" (transición al Dashboard).

### Estados de error del bloque 1
Todas las variantes definidas en el wireframe:
1.2 err (email ya registrado), 1.3 err (credenciales), 1.3 err (cuenta
bloqueada), 1.4 err (biometría no reconocida), 1.5 err (email inválido),
1.x err (sin conexión).

### Iteraciones de diseño
- Primera pasada con paleta genérica; corregida contra los pantallazos del
  mockup entregados por el cliente.
- Ajuste de bordes de botones, radios, jerarquía tipográfica y estados
  activos/deshabilitados para casar al 100 % con el mockup.
- Errores repensados: los transitorios como toast/inline; los que exigen
  acción (email duplicado, cuenta bloqueada) como modal centrado.

### Herramientas de trabajo interno
- Menú de desarrollo (Dev Menu) accesible al arrancar la app, con acceso
  directo a cualquier pantalla o al flujo natural completo. Facilita la
  validación visual contra el mockup sin necesidad de recorrer todo el
  flujo cada vez.
- Pantalla temporal de "Dashboard placeholder" al final del flujo del
  bloque 1 para cerrar la navegación mientras el bloque 2 se aborda.
