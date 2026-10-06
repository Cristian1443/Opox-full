// Páginas legales públicas de OPOX (política de privacidad y términos de uso).
//
// Se sirven como HTML estático desde el propio backend (`/legal/privacidad` y
// `/legal/terminos`) para que la app tenga URLs públicas válidas para App Store
// Connect / Google Play sin depender de la web. Cuando exista web corporativa
// basta con apuntar `PRIVACY_POLICY_URL` / `TERMS_URL` (mobile) allí.
//
// ⚠️ BORRADOR: el texto describe el tratamiento de datos que hace HOY el
// código, pero debe ser revisado por el responsable legal del cliente antes
// de publicar la app. Los datos del responsable se configuran por entorno
// (LEGAL_ENTITY_NAME, LEGAL_TAX_ID, LEGAL_ADDRESS, LEGAL_CONTACT_EMAIL).

const LAST_UPDATE = '6 de octubre de 2026';

function entity() {
    return {
        name: process.env.LEGAL_ENTITY_NAME || 'OPOX',
        taxId: process.env.LEGAL_TAX_ID || '',
        address: process.env.LEGAL_ADDRESS || '',
        email: process.env.LEGAL_CONTACT_EMAIL || 'soporte@opox.ai',
    };
}

function layout(title: string, body: string): string {
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<title>${title} · OPOX</title>
<style>
  :root { --ink:#412950; --muted:#6b5a75; --accent:#F69624; --bg:#ffffff; --card:#f7f4f9; }
  @media (prefers-color-scheme: dark) {
    :root { --ink:#f0eaf4; --muted:#b9aac4; --bg:#17131b; --card:#221c28; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { max-width:760px; margin:0 auto; padding:32px 20px 64px; }
  h1 { font-size:1.8rem; line-height:1.25; margin:0 0 4px; }
  h2 { font-size:1.2rem; margin:2.2rem 0 .5rem; color:var(--ink); }
  p, li { color:var(--ink); }
  .meta { color:var(--muted); font-size:.9rem; margin-bottom:1.5rem; }
  .brand { color:var(--accent); font-weight:700; letter-spacing:.04em; font-size:.85rem; }
  ul { padding-left:1.2rem; }
  li { margin:.25rem 0; }
  table { width:100%; border-collapse:collapse; margin:.8rem 0; font-size:.93rem; }
  th, td { text-align:left; vertical-align:top; padding:.55rem .6rem; border-bottom:1px solid rgba(127,127,127,.25); }
  th { background:var(--card); }
  .note { background:var(--card); border-left:4px solid var(--accent); padding:.8rem 1rem; border-radius:6px; }
  a { color:var(--accent); }
  nav { margin-top:2.5rem; font-size:.9rem; }
</style>
</head>
<body>
<main>
<div class="brand">OPOX</div>
${body}
<nav><a href="/legal/privacidad">Política de privacidad</a> · <a href="/legal/terminos">Términos de uso</a></nav>
</main>
</body>
</html>`;
}

function controllerBlock(): string {
    const e = entity();
    return `<p><strong>Responsable del tratamiento:</strong> ${e.name}${e.taxId ? ` (NIF/CIF ${e.taxId})` : ''}${e.address ? `, ${e.address}` : ''}.<br>
<strong>Contacto para privacidad y ejercicio de derechos:</strong> <a href="mailto:${e.email}">${e.email}</a></p>`;
}

export function privacyPolicyHtml(): string {
    const e = entity();
    return layout('Política de privacidad', `
<h1>Política de privacidad</h1>
<p class="meta">Última actualización: ${LAST_UPDATE}</p>

<p>En OPOX, una aplicación para preparar oposiciones, tratamos tus datos personales con transparencia y solo para ofrecerte el servicio. Esta política explica qué datos recogemos, para qué los usamos, con quién los compartimos y qué derechos tienes, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>

<h2>1. Quién es el responsable</h2>
${controllerBlock()}

<h2>2. Qué datos tratamos y para qué</h2>
<table>
<tr><th>Datos</th><th>Finalidad</th><th>Base jurídica</th></tr>
<tr><td>Correo electrónico, nombre, contraseña (almacenada cifrada por nuestro proveedor de autenticación) y oposición elegida</td><td>Crear y gestionar tu cuenta y adaptar el contenido a tu oposición.</td><td>Ejecución del contrato (art. 6.1.b RGPD).</td></tr>
<tr><td>Identificador de inicio de sesión con Google, Apple o Facebook (si eliges esa opción)</td><td>Autenticarte sin contraseña propia.</td><td>Ejecución del contrato.</td></tr>
<tr><td>Resultados de tests, errores, plan de estudio, objetivos, racha, Opopoints, pertenencia a clanes y mensajes del chat de clan</td><td>Prestar el servicio: estadísticas, planificación, retos, rankings y tienda de recompensas.</td><td>Ejecución del contrato.</td></tr>
<tr><td>Apuntes que subas (fotos o PDF) y las preguntas generadas a partir de ellos</td><td>Digitalizarlos y generar tests personalizados mediante inteligencia artificial.</td><td>Ejecución del contrato.</td></tr>
<tr><td>Mensajes que escribas al Tutor IA</td><td>Responderte y mantener el historial de tus conversaciones.</td><td>Ejecución del contrato.</td></tr>
<tr><td><strong>Datos de salud</strong> (opcional): frecuencia cardiaca, frecuencia en reposo, variabilidad cardiaca, saturación de oxígeno, sueño, pasos y frecuencia respiratoria leídos de Apple Salud (iOS) o Health Connect (Android); y tu «Estado del día» (ánimo, horas de sueño, energía, factores)</td><td>Calcular tu nivel de fatiga y darte recomendaciones de descanso, alimentación, meditación y técnica de estudio. OPOX <strong>solo lee</strong> estos datos: nunca los escribe ni los modifica en tu app de salud.</td><td><strong>Consentimiento explícito</strong> (art. 9.2.a RGPD), que das al conceder el permiso en tu dispositivo y que puedes retirar en cualquier momento.</td></tr>
<tr><td>Token de notificaciones push e identificador del dispositivo</td><td>Enviarte avisos (racha, recordatorios, cambios del BOE, apuntes listos).</td><td>Consentimiento / permiso del sistema.</td></tr>
<tr><td>Clave pública de tu huella o rostro (si activas la biometría)</td><td>Iniciar sesión de forma rápida. <strong>Tu huella o rostro nunca salen del dispositivo</strong>: los gestiona el sistema operativo; nosotros solo guardamos una clave pública.</td><td>Consentimiento.</td></tr>
<tr><td>Mensajes de sugerencias, errores o ayuda que nos envíes</td><td>Atender tu comunicación y mejorar la app.</td><td>Interés legítimo / consentimiento.</td></tr>
<tr><td>Datos técnicos mínimos (registros de errores del servidor, dirección IP, versión de la app)</td><td>Seguridad, prevención de abusos y diagnóstico.</td><td>Interés legítimo (art. 6.1.f RGPD).</td></tr>
</table>
<p>No usamos tus datos para publicidad, no los vendemos y no elaboramos perfiles con efectos jurídicos sobre ti. Los datos de salud <strong>no</strong> se usan con fines publicitarios ni se comparten con terceros distintos de los encargados del tratamiento descritos más abajo.</p>

<h2>3. Con quién compartimos tus datos (encargados del tratamiento)</h2>
<p>Para prestar el servicio utilizamos proveedores que tratan datos por nuestra cuenta y bajo contrato:</p>
<ul>
<li><strong>Supabase</strong>: base de datos, autenticación y almacenamiento de archivos.</li>
<li><strong>Proveedor de alojamiento del servidor</strong> de OPOX (infraestructura donde se ejecuta nuestra API).</li>
<li><strong>Servicios de inteligencia artificial</strong> (OpenAI y Google Gemini, además del motor de IA de OPOX): reciben el contenido necesario para generar preguntas, resúmenes, respuestas del tutor, podcast, menús y sesiones de meditación. En las recomendaciones de salud enviamos únicamente datos mínimos y sin tu identidad (objetivo del día, nivel de fatiga y restricciones alimentarias indicadas por ti). Estos proveedores pueden tratar datos fuera del Espacio Económico Europeo; en ese caso se apoyan en las garantías del art. 46 RGPD (cláusulas contractuales tipo) o en el Marco de Privacidad de Datos UE–EE. UU.</li>
<li><strong>Expo (notificaciones push)</strong>: entrega de notificaciones a tu dispositivo.</li>
<li><strong>Google, Apple y Meta (Facebook)</strong>: solo si eliges iniciar sesión con ellos.</li>
<li><strong>Proveedor de correo electrónico y de mensajería</strong> para enviarte códigos de verificación, recuperación de contraseña y para recibir tus comentarios.</li>
</ul>
<p>No cedemos tus datos a otros terceros salvo obligación legal.</p>

<h2>4. Cuánto tiempo conservamos tus datos</h2>
<p>Mientras mantengas tu cuenta activa. Si la eliminas, borramos tus datos personales de nuestros sistemas, salvo los que debamos conservar bloqueados durante los plazos legales para atender posibles responsabilidades. Los archivos temporales (por ejemplo, informes exportados) caducan automáticamente.</p>

<h2>5. Tus derechos</h2>
<p>Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del consentimiento escribiendo a <a href="mailto:${e.email}">${e.email}</a>. Responderemos en el plazo máximo de un mes.</p>
<ul>
<li><strong>Eliminar tu cuenta y tus datos:</strong> desde la app en <em>Ajustes → Eliminar cuenta</em>.</li>
<li><strong>Retirar el permiso de salud:</strong> en Apple Salud (<em>Perfil → Apps → OPOX</em>) o en Health Connect, y desde los ajustes del sistema.</li>
<li><strong>Desactivar notificaciones o biometría:</strong> desde la app y desde los ajustes del dispositivo.</li>
</ul>
<p>Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>

<h2>6. Seguridad</h2>
<p>Aplicamos medidas técnicas y organizativas razonables: comunicaciones cifradas (HTTPS), control de acceso por usuario a nivel de base de datos, secretos fuera de la aplicación móvil y almacenamiento seguro de credenciales en el dispositivo. Ningún sistema es infalible, pero trabajamos para proteger tu información.</p>

<h2>7. Menores</h2>
<p>OPOX está dirigida a personas mayores de 16 años. Si detectamos una cuenta de una persona menor sin el consentimiento exigido, la eliminaremos.</p>

<h2>8. Cambios en esta política</h2>
<p>Si introducimos cambios relevantes te lo comunicaremos en la app. La fecha de la última actualización figura al principio de este documento.</p>

<p class="note">Los consejos de salud, alimentación, descanso y meditación de OPOX tienen carácter informativo y de apoyo al estudio; no sustituyen el consejo médico profesional.</p>
`);
}

export function termsHtml(): string {
    const e = entity();
    return layout('Términos de uso', `
<h1>Términos de uso</h1>
<p class="meta">Última actualización: ${LAST_UPDATE}</p>

<p>Estos términos regulan el uso de la aplicación OPOX (la «App»). Al crear una cuenta o usar la App aceptas estas condiciones. Si no estás de acuerdo, no la utilices.</p>

<h2>1. Titular del servicio</h2>
${controllerBlock()}

<h2>2. Qué es OPOX</h2>
<p>OPOX es una herramienta de apoyo a la preparación de oposiciones: tests, planificación de estudio, tutor con inteligencia artificial, apuntes, seguimiento de cambios legislativos del BOE, motivación y bienestar. Es un complemento de estudio y <strong>no garantiza</strong> aprobar ningún examen ni plaza.</p>

<h2>3. Tu cuenta</h2>
<ul>
<li>Debes tener al menos 16 años y facilitar datos veraces.</li>
<li>Eres responsable de custodiar tus credenciales y de la actividad realizada desde tu cuenta.</li>
<li>Puedes eliminar tu cuenta en cualquier momento desde <em>Ajustes → Eliminar cuenta</em>.</li>
</ul>

<h2>4. Contenido generado por inteligencia artificial</h2>
<p>Las preguntas, explicaciones, resúmenes, respuestas del tutor, podcasts y demás contenidos generados con IA pueden contener errores o estar desactualizados. <strong>Contrasta siempre la información con las fuentes oficiales</strong> (BOE y convocatorias). OPOX no se responsabiliza de las decisiones de estudio o de examen basadas únicamente en estos contenidos.</p>

<h2>5. Salud y bienestar</h2>
<p>Los datos y recomendaciones del bloque de Salud (fatiga, alimentación, meditación, técnicas de estudio) son orientativos. No constituyen diagnóstico ni tratamiento médico. Ante cualquier síntoma o duda consulta con un profesional sanitario.</p>

<h2>6. Contenido que subes y comunidad</h2>
<ul>
<li>Declaras que tienes derecho a usar los apuntes, fotos y archivos que subas, y que no vulneran derechos de autor ni de terceros. Sube únicamente material propio o que puedas utilizar legalmente.</li>
<li>Nos concedes una licencia limitada, no exclusiva y solo para operar el servicio (por ejemplo, digitalizarlos y generar tests para ti).</li>
<li>En clanes, chats y rankings debes respetar a los demás. Está prohibido el contenido ilegal, ofensivo, discriminatorio, spam o que suplante la identidad de otra persona. Podemos retirar contenido y suspender cuentas que incumplan estas normas.</li>
</ul>

<h2>7. Opopoints y recompensas</h2>
<p>Los Opopoints son puntos virtuales de la App que se obtienen estudiando y se canjean por recompensas o contenidos dentro de OPOX. No tienen valor monetario, no son canjeables por dinero y no son transferibles. Podemos modificar el catálogo, los costes y las reglas de obtención, así como anular puntos obtenidos de forma fraudulenta.</p>

<h2>8. Usos prohibidos</h2>
<ul>
<li>Acceder a cuentas o datos ajenos, o intentar vulnerar la seguridad del servicio.</li>
<li>Usar bots, scripts o métodos automáticos para obtener puntos, rankings o contenido.</li>
<li>Copiar, revender o distribuir los contenidos de la App sin autorización.</li>
<li>Utilizar la App para fines ilegales.</li>
</ul>

<h2>9. Propiedad intelectual</h2>
<p>La App, su diseño, marca y contenidos propios pertenecen a sus titulares y están protegidos por la legislación aplicable. Estos términos no te transfieren ningún derecho salvo el de uso personal de la App conforme a lo aquí indicado.</p>

<h2>10. Disponibilidad y cambios</h2>
<p>Procuramos que el servicio esté disponible, pero puede haber interrupciones por mantenimiento o causas ajenas a nuestro control. Podemos modificar o retirar funcionalidades y actualizar estos términos; si los cambios son relevantes te lo comunicaremos en la App. El uso continuado tras el aviso implica su aceptación.</p>

<h2>11. Responsabilidad</h2>
<p>En la medida permitida por la ley, OPOX no responde de daños indirectos derivados del uso de la App ni del resultado de ninguna oposición. Esto no limita los derechos que la normativa de consumidores te reconoce como usuario.</p>

<h2>12. Privacidad</h2>
<p>El tratamiento de tus datos personales se describe en nuestra <a href="/legal/privacidad">Política de privacidad</a>.</p>

<h2>13. Legislación y jurisdicción</h2>
<p>Estos términos se rigen por la legislación española. Si eres consumidor, podrás acudir a los juzgados y tribunales de tu domicilio. Para cualquier consulta escribe a <a href="mailto:${e.email}">${e.email}</a>.</p>
`);
}
