# PENDIENTES EXTERNOS — OPOX

Registro de lo que necesitamos de terceros para avanzar a producción.
Fecha de corte: **2026-09-07**.

---

## 1. Equipo IA

El Motor IA de OPOX vive en **`https://ia.opox.ai`**. Todos los pendientes que
siguen hacen referencia a ese dominio de producción.

---

### 1.1 La respuesta del generador no incluye la respuesta correcta directamente

**Contexto:** Cuando un usuario pide un test en la app, el backend de OPOX llama
al Motor (`/v1/tests/generate`) para que genere las preguntas. El Motor devuelve
las preguntas pero **no incluye cuál es la respuesta correcta** en ese mismo
paquete. Actualmente tenemos un parche que descarga todo el banco de preguntas
del Motor (~200 preguntas) y busca la respuesta correcta por ID — funciona, pero
es una llamada extra que añade tiempo innecesario a cada test.

**Lo que necesitamos:**
- Que el Motor incluya el campo `correcta_idx` (índice de la opción correcta) y
  `explicacion` directamente en la respuesta de `/v1/tests/generate`.
- Lo mismo aplica para el endpoint de test de nivel de acceso (`/v1/onboarding/placement-test`).
- **No requiere ningún cambio en OPOX** cuando se haga — el código ya está preparado
  para leerlo si viene.

---

### 1.2 Falta la IA de la Factoría de Apuntes (Bloque 9)

**Contexto:** Los usuarios pueden subir sus apuntes en foto o PDF para que OPOX
los analice y genere tests personalizados. La pantalla, la subida de archivos y
el pipeline están completos — lo único que falta es la inteligencia artificial
que analiza el contenido.

Hay tres tareas pendientes que el equipo IA documentó en `packages/ai/BRIEF_IA_BLOQUE9.md`:

| Qué hace | Cuándo se usa |
|---|---|
| Leer el documento y extraer su estructura | Al subir el apunte |
| Identificar a qué temas del temario corresponde | Tras el OCR |
| Generar preguntas de test desde el apunte | Al pulsar "Generar test" |

**Estado actual:** Todo el flujo corre con datos de ejemplo (stub). Los apuntes
se suben correctamente a la base de datos, pero las etiquetas y preguntas generadas
son ficticias.

**Lo que necesitamos:**
- Implementación real de las tres tareas descritas en el brief.
- El contrato de entrada/salida ya está definido — solo hay que conectar los prompts.

---

### 1.3 IA del bloque de Salud (Bloque 3) — 3 tareas pendientes de prompts

**Contexto:** El bloque de Salud conecta el wearable del usuario (Apple Watch,
Fitbit, Garmin…) con su plan de estudio. Las pantallas están construidas y los datos
del wearable llegan en tiempo real.

**Estado actual de la integración con el Motor:**
La conexión básica con el Motor (`POST /v1/fatigue/biometrics` en `ia.opox.ai`)
está implementada y operativa — el Motor recibe HRV, FC reposo, SpO₂ y horas de
sueño del usuario real y devuelve un nivel de fatiga (verde/amarillo/rojo) con
señales. El fallback local funciona si el Motor no responde.

**Lo que sigue pendiente** son los prompts/endpoints para 3 capacidades adicionales
que el Motor aún no ofrece. El brief completo está en `packages/ai/BRIEF_IA_BLOQUE3.md`.

---

**Tarea 1 — Análisis de fatiga enriquecido** *(prioritaria)*

El Motor actual devuelve solo el nivel de color (verde/amarillo/rojo) sin
personalización. Lo que necesitamos adicionalmente: comparar las métricas de hoy
con la media personal de los últimos 14 días del mismo usuario, devolver una
explicación que cite los valores reales del usuario ("tu HRV está 14 ms por debajo
de tu base"), distinguir entre fatiga física (sueño + HRV bajos) y estrés agudo
(HRV bajo con sueño normal), y ofrecer una recomendación de acción concreta
(`break`, `light_study`, `full_study`).

*Pendiente de infraestructura en OPOX* (lo hacemos nosotros cuando llegue el prompt):
la tabla `user_health_baselines` para guardar la media rolling de 14 días por usuario.

---

**Tarea 2 — Generación de menús para estudiar**

Hoy la pantalla de Menús muestra 4 opciones fijas sacadas de un JSON local. No
cambian según el estado del usuario ni tienen en cuenta si ese día tiene fatiga alta
o examen próximo.

*Lo que necesitamos:* Un prompt que reciba el objetivo nutricional del usuario
(`concentracion`, `energia`, `examen`, `recuperacion`), su nivel de fatiga del día,
sus restricciones dietéticas (vegetariano, sin gluten, etc.) y cuántos menús quiere
generar (1–3). Que devuelva menús completos (desayuno, comida, cena) con kcal
realistas, macros, el beneficio cognitivo de cada plato, y una lista de la compra
lista para imprimir.

*Regla clave:* Si ese día hay fatiga alta, los menús deben priorizar recuperación
aunque el objetivo elegido sea "concentración".

---

**Tarea 3 — Guiones de meditación dinámicos**

Hoy hay 4 sesiones de meditación fijas pregrabadas. No varían según si el usuario
está estresado, si tiene el examen en dos días, o si viene de una sesión de estudio
larga.

*Lo que necesitamos:* Un prompt que reciba el tipo de sesión (`pre_exam`,
`post_study`, `break`, `focus`), la duración elegida (3, 5, 7 u 8 minutos), el nivel
de fatiga del día y los días hasta el examen. Que devuelva el guion dividido en fases
(introducción, ejercicio principal, cierre), con el texto que aparece en pantalla
durante cada fase y los segundos exactos que dura cada una.

*Nota:* La lectura en voz alta no es tarea de IA — la app muestra el texto en
pantalla. El campo de texto ya está preparado para añadir TTS en el futuro sin
cambiar el contrato.

---

**Tarea 4 — Técnica de estudio recomendada según el estado del día**

Hoy la pantalla "Técnicas de estudio" muestra una lista genérica igual para todos.
No sabe si hoy el usuario está agotado, si tiene el examen en 3 días, o en qué tema
del temario está trabajando.

*Lo que necesitamos:* Un prompt que reciba el nivel y tipo de fatiga del día, los
días hasta el examen, el último tema trabajado (del plan de planificación) y el
tiempo disponible. Que devuelva qué técnica recomendar (de las 7 que ya tiene la
app: Pomodoro, Repetición Espaciada, Lectura activa, etc.), por qué esa técnica hoy
concretamente (citando el dato que lo justifica), cómo adaptarla al estado del
usuario, y qué parte concreta del temario conviene trabajar hoy.

*Regla clave:* Si fatiga alta + examen en ≤3 días → recomendar siempre Práctica de
preguntas cortas (máxima eficiencia, mínimo desgaste). Si fatiga alta + estrés agudo
+ examen en ≤7 días → recomendar repaso en audio y enlazar con el Podcast del
Aula Virtual (Bloque 8).

---

**Estado actual del código:**
- Las 4 pantallas existen y están conectadas al wearable.
- Los datos del wearable llegan en tiempo real en EAS build.
- Ningún endpoint de backend existe aún para estas 4 tareas.
- El contrato de entrada/salida de cada tarea está documentado en detalle en
  `packages/ai/BRIEF_IA_BLOQUE3.md` — incluyendo ejemplos de input/output concretos.

**Pendiente adicional de infraestructura** (lo hacemos nosotros cuando lleguen los
prompts): crear la tabla `user_health_baselines` en Supabase para guardar la media
rolling de 7–14 días de métricas por usuario. Sin esa tabla la Tarea 1 funciona con
los valores médicos genéricos como base, no con la base personal del usuario.

---

### 1.4 El Motor necesita el temario oficial cargado en producción

**Contexto:** El ID del curso activo (`MOTOR_DEFAULT_CURSO_ID`) que usa OPOX
corresponde al entorno de pruebas. Cuando el Motor responde preguntas, busca en
el contenido de ese curso — si el curso no tiene el temario real, las preguntas
y los resúmenes no tendrán base legislativa concreta.

**Lo que necesitamos:**
1. Subir el temario oficial completo de la oposición de Justicia — Tramitación
   Procesal al Motor de producción (`ia.opox.ai`).
2. Comunicarnos el nuevo ID de curso de producción para actualizarlo en la configuración.
3. Lo mismo para el Motor BOE (el curso del que saca las regulaciones a monitorizar).

**Impacto si no se hace:** La app funciona igual de bien (tiene fallback a OpenAI
directo), pero las preguntas y el chat del Aula Virtual no tienen acceso al texto
real del temario oficial.

---

## 2. Cliente / Dueño del producto

---

### 2.1 Correo con dominio propio

**Por qué es urgente:** Ahora mismo los correos de confirmación de registro,
recuperación de contraseña y alertas que reciben los usuarios salen desde la
dirección genérica de Supabase. En producción deben llegar desde `@opox.es`
(o el dominio elegido) para que el usuario reconozca la marca y no marque como
spam.

**Lo que necesitamos:**
- Un dominio registrado (p.ej. `opox.es`).
- Una dirección `noreply@opox.es` con credenciales SMTP, o una cuenta en
  **Resend** o **SendGrid** (son gratuitos hasta cierto volumen de emails).
  Con eso lo configuramos en Supabase en menos de una hora.

---

### 2.2 Base de datos de producción (Supabase)

**Por qué es urgente:** El proyecto Supabase que usamos ahora es el de desarrollo.
El plan gratuito tiene límites de conexiones y almacenamiento que no aguantarán
usuarios reales. Además, la base de datos de desarrollo tiene datos de prueba
mezclados.

**Lo que necesitamos:**
- Un proyecto Supabase nuevo, con **plan Pro** (~$25/mes), propiedad del cliente.
- Una vez creado, nos comparte tres claves (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_ANON_KEY`) y nosotros montamos toda la estructura de la base de datos
  y los datos iniciales.

---

### 2.3 Login con Google, Apple y Meta

**Contexto:** Hoy el registro es solo con email y contraseña. Agregar login social
reduce la fricción de registro y mejora la conversión de nuevos usuarios.

**Importante antes de decidir:**
- Si la app ofrece cualquier login social (Google o Meta), **Apple obliga a incluir
  también "Iniciar sesión con Apple"** — es requisito de la App Store.
- La cuenta Apple Developer ($99/año) hace falta de todas formas para publicar
  en iPhone, así que conviene tenerla activa lo antes posible.

**Lo que necesitamos por proveedor:**

**Google:**
- Un proyecto en Google Cloud Console con OAuth activado.
- Nos dan el Client ID y el Client Secret — lo configuramos en Supabase.

**Apple:**
- Cuenta Apple Developer activa con "Sign In with Apple" habilitado en el App ID.
- Service ID + Key ID + Team ID — lo configuramos en Supabase.

**Meta (Facebook):**
- App registrada en Meta for Developers.
- App ID y App Secret — lo configuramos en Supabase.
- Meta exige que el dominio de la app esté verificado (necesita el dominio del punto 2.1)
  y una URL de política de privacidad pública (ver punto 2.5).

**Lo que necesitamos del cliente:**
- Confirmar qué proveedores se van a ofrecer en el lanzamiento.
- Crear las apps/credenciales de cada uno y compartírnoslas.

---

### 2.4 Canal de soporte vía WhatsApp Business

**Contexto:** La pantalla de ayuda de la app tiene un botón "Contactar con soporte"
que ya abre WhatsApp. Para que funcione en producción con un número fijo de empresa
(no un teléfono personal), hace falta una cuenta de WhatsApp Business.

**Lo que necesitamos:**
- Una cuenta de **WhatsApp Business** registrada con el número de atención al
  cliente de OPOX.
- El número de teléfono de esa cuenta para configurarlo en la app (es un cambio
  de una línea).
- Opcional pero recomendado: activar la **API de WhatsApp Business** (Meta)
  para poder gestionar los mensajes desde una herramienta de soporte en lugar
  del teléfono directamente — si el volumen de consultas crece, se agradece.

---

### 2.5 Política de privacidad y Términos de uso

**Por qué es bloqueante:** Sin estas dos páginas públicas no se puede publicar en
App Store ni en Google Play, y Meta también las exige para activar el login con
Facebook.

**Lo que necesitamos:**
- Los textos redactados (idealmente revisados por un abogado, dado que la app
  maneja datos de salud y biométricos de los usuarios).
- Publicarlos en una URL del dominio de OPOX (p.ej. `opox.es/privacidad` y
  `opox.es/terminos`).
- Compartirnos las URLs para ponerlas en la app y en las fichas de las stores.

---

### 2.6 Contenido real para la Tienda OPOX

**Contexto:** La tienda donde los usuarios canjean sus Opopoints por recompensas
tiene productos y descuentos de ejemplo (Uber Eats, Decathlon, FNAC…). Para el
lanzamiento real hacen falta los partners confirmados.

**Lo que necesitamos:**
- Lista de recompensas reales con partner, precio en Opopoints y stock inicial.
- Códigos de descuento reales de los partners para cargarlos en la base de datos.
- Si hay acuerdos con academias u otros servicios del sector oposiciones, también
  se pueden cargar como recompensas virtuales.

---

## 3. Resumen — qué está bloqueando qué

| Prioridad | Quién lo da | Qué es | Desbloquea |
|---|---|---|---|
| URGENTE | Cliente | Correo con dominio propio | Emails de registro y recuperación de contraseña reales |
| URGENTE | Cliente | Cuenta Supabase Pro | Base de datos de producción lista para usuarios reales |
| URGENTE | Cliente | Cuenta Apple Developer | Publicar en App Store + login con Apple |
| URGENTE | Cliente | Cuenta Google Play Console | Publicar en Android |
| ALTA | Equipo IA | Temario oficial en Motor de prod | Preguntas y chat con base en el temario real |
| ALTA | Cliente | Login social (Google + Apple mínimo) | Registro sin fricción |
| ALTA | Cliente | Política de privacidad + Términos | Requisito de Apple, Google y Meta |
| ALTA | Equipo IA | IA de Factoría de Apuntes (Bloque 9) | Etiquetas y tests reales desde apuntes del usuario |
| ALTA | Equipo IA | IA Salud — análisis de fatiga enriquecido (Bloque 3, tarea 1) | Comparación vs base personal del usuario + explicación con valores reales |
| ALTA | Equipo IA | IA Salud — menús para estudiar (Bloque 3, tarea 2) | Menús adaptados al estado del día y restricciones dietéticas |
| ALTA | Equipo IA | IA Salud — técnica de estudio del día (Bloque 3, tarea 4) | Recomendación contextual en lugar de lista genérica |
| MEDIA | Equipo IA | IA Salud — guiones de meditación (Bloque 3, tarea 3) | Sesiones adaptadas al estado y proximidad del examen |
| MEDIA | Cliente | WhatsApp Business registrado | Soporte real desde la pantalla de ayuda |
| MEDIA | Equipo IA | `correcta_idx` en job result | Reducir tiempo de generación de tests (~1 s menos) |
| BAJA | Cliente | Contenido real de la Tienda OPOX | Recompensas y descuentos reales en producción |
