/**
 * Smoke test DIRECTO contra el Motor de IA (URL nueva Render).
 * Sigue el recorrido de Guia_Pruebas_Bloques_0_6_7.pdf paso a paso.
 *
 * Uso: node scripts/smoke_motor_directo.js
 */

const fs = require('fs');
const path = require('path');

// Lee credenciales del .env del backend (fallback a env vars directas).
// Nunca hardcodear claves en este script.
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', 'apps', 'backend', '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* .env opcional */ }
})();

const MOTOR = process.env.MOTOR_URL || process.env.MOTOR_API_BASE_URL || 'https://ingesta-demo.onrender.com';
const API_KEY = process.env.MOTOR_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_KEY || process.env.AI_API_KEY || process.env.MOTOR_BOE_OPENAI_KEY || '';

if (!OPENAI_KEY) {
  console.error('ERROR: falta OPENAI_KEY / AI_API_KEY. Exporta la variable o rellena apps/backend/.env');
  process.exit(2);
}

const PDF_PATH = process.env.PDF_PATH || path.join(__dirname, 'tmp', 'temario_real.pdf');
const USER_ID = 'smoke-test-user';

let passed = 0, failed = 0;
const failures = [];

// ─── helpers ────────────────────────────────────────────────────────────────

const baseHeaders = () => ({
  'X-API-Key': API_KEY,
  'X-OpenAI-Key': OPENAI_KEY,
});

async function req(method, url, { body, headers = {}, isMultipart = false } = {}) {
  const hdrs = { ...baseHeaders(), ...headers };
  if (!isMultipart && body !== undefined) hdrs['Content-Type'] = 'application/json';
  const t0 = Date.now();
  const res = await fetch(`${MOTOR}${url}`, {
    method,
    headers: hdrs,
    body: isMultipart ? body : (body ? JSON.stringify(body) : undefined),
  });
  const dt = Date.now() - t0;
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, json, dt };
}

function pass(l, d = '') { passed++; console.log(`  ✓  ${l}${d ? ' — ' + d : ''}`); }
function fail(l, d = '') { failed++; failures.push({ l, d }); console.log(`  ✗  ${l}${d ? ' — ' + d : ''}`); }
function check(l, cond, d = '') { cond ? pass(l, d) : fail(l, d); return cond; }
function warn(l, d = '') { console.log(`  ⚠️   ${l}${d ? ' — ' + d : ''}`); }

async function pollJob(jobId, { maxSec = 600, everyMs = 3000, label = 'job' } = {}) {
  const t0 = Date.now();
  let last = null;
  while ((Date.now() - t0) / 1000 < maxSec) {
    const r = await req('GET', `/v1/jobs/${jobId}`);
    if (r.status !== 200) return { error: `HTTP ${r.status}`, json: r.json };
    last = r.json;
    process.stdout.write(`    ${label}: ${last.estado} ${last.progreso ? JSON.stringify(last.progreso) : ''}\r`);
    if (last.estado === 'done' || last.estado === 'error') {
      console.log('');
      return { estado: last.estado, resultado: last.resultado, mensaje: last.mensaje, full: last };
    }
    await new Promise(r => setTimeout(r, everyMs));
  }
  console.log('');
  return { error: 'timeout', last };
}

// ─── FASE 0: Salud ──────────────────────────────────────────────────────────

async function testSalud() {
  console.log('\n── SALUD ────────────────────────────────────────────────────');
  const r = await req('GET', '/v1/health');
  check('GET /v1/health → 200', r.status === 200, `status=${r.status} (${r.dt}ms)`);
  // per INC-01: motor devuelve {ok:true} en lugar de {status:'ok'}
  const okShape = r.json?.ok === true || r.json?.status === 'ok';
  check('health payload OK', okShape, `body=${JSON.stringify(r.json).slice(0, 150)}`);
}

// ─── FASE 6: Bloque 6 — Cimiento ────────────────────────────────────────────

const state = { curso_id: null, documento_id: null, sesion_id: null, preguntas: [], job_id: null };

async function testBloque6() {
  console.log('\n── BLOQUE 6 · Cimiento ──────────────────────────────────────');

  // 6.1 · Crear curso con primer PDF
  const pdfBuf = fs.readFileSync(PDF_PATH);
  const form = new FormData();
  form.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'temario_prueba.pdf');
  form.append('titulo', 'Auxiliar Administrativo — Smoke Test');

  const r1 = await req('POST', '/v1/courses', { body: form, isMultipart: true });
  check('6.1 POST /v1/courses → 200/201', [200, 201].includes(r1.status),
    `status=${r1.status} body=${JSON.stringify(r1.json).slice(0, 200)}`);
  state.curso_id = r1.json?.curso_id;
  state.job_id = r1.json?.job_id;
  check('6.1 curso_id presente', !!state.curso_id, state.curso_id || '(vacío)');
  check('6.1 job_id presente', !!state.job_id, state.job_id || '(vacío)');
  if (r1.json?.reused) console.log(`    ⓘ  reused=true → curso ya existía: ${state.curso_id}`);

  // 6.2 · Esperar ingesta
  if (state.job_id) {
    const j = await pollJob(state.job_id, { maxSec: 300, label: 'ingesta' });
    check('6.2 ingesta terminó en done', j.estado === 'done',
      j.estado === 'error' ? `mensaje: ${j.mensaje}` : (j.error || ''));
    if (j.estado === 'error') return;  // sin ingesta el resto no tiene sentido
  }

  // 6.4 · Ver árbol del curso
  const r4 = await req('GET', `/v1/courses/${state.curso_id}`);
  check('6.4 GET /v1/courses/{id} → 200', r4.status === 200);
  const documentos = r4.json?.documentos || [];
  const bloques = r4.json?.bloques || [];
  check('6.4 al menos 1 documento en el árbol', documentos.length >= 1, `docs=${documentos.length}`);
  check('6.4 al menos 1 bloque en el árbol', bloques.length >= 1, `bloques=${bloques.length}`);
  if (documentos[0]) state.documento_id = documentos[0].id;

  // 6.5 · Búsqueda RAG
  const r5 = await req('POST', `/v1/courses/${state.curso_id}/search`, {
    body: { query: 'procedimiento administrativo', limit: 5 }
  });
  check('6.5 POST /search → 200', r5.status === 200, `status=${r5.status}`);
  const hits = r5.json?.pasajes || r5.json?.resultados || r5.json?.hits || r5.json?.chunks || [];
  check('6.5 RAG devolvió pasajes', Array.isArray(hits) && hits.length > 0, `n=${hits.length}`);

  // 6.6 · Generar test
  const r6 = await req('POST', '/v1/tests/generate', {
    body: { curso_id: state.curso_id, user_id: USER_ID, n_preguntas: 5 }
  });
  check('6.6 POST /v1/tests/generate → 200/202', [200, 202].includes(r6.status), `status=${r6.status}`);
  const genJobId = r6.json?.job_id;

  if (genJobId) {
    const j = await pollJob(genJobId, { maxSec: 300, label: 'generate' });
    check('6.6 generate terminó en done', j.estado === 'done',
      j.estado === 'error' ? `mensaje: ${j.mensaje}` : (j.error || ''));
    if (j.resultado?.sesion_id) state.sesion_id = j.resultado.sesion_id;
    if (j.resultado?.preguntas) state.preguntas = j.resultado.preguntas;
  } else if (r6.json?.sesion_id) {
    // 200 síncrono
    state.sesion_id = r6.json.sesion_id;
    state.preguntas = r6.json.preguntas || [];
  }

  check('6.6 sesion_id presente', !!state.sesion_id, state.sesion_id || '(vacío)');
  check('6.6 al menos 1 pregunta generada', state.preguntas.length > 0, `n=${state.preguntas.length}`);

  // 6.7 · Verificar campos de calidad de las preguntas (guía p.5)
  // INC-04: el job result NO trae evidencia.cita/pagina/correcta_idx — se enriquece via banco.
  if (state.preguntas.length > 0) {
    const p = state.preguntas[0];
    const opciones = p.opciones || p.options || [];
    const enun = p.enunciado || p.texto || '';
    check('6.7 pregunta tiene 4 opciones', opciones.length === 4, `n_opciones=${opciones.length}`);
    check('6.7 enunciado presente', !!enun, `enunciado="${String(enun).slice(0,80)}"`);

    // Enriquecer con banco del curso (workaround INC-04, activo en MotorAiClient.ts)
    const rBank = await req('GET', `/v1/courses/${state.curso_id}/questions?limit=200`);
    const bank = Array.isArray(rBank.json) ? rBank.json : (rBank.json?.preguntas || []);
    const byId = Object.fromEntries(bank.map(x => [x.id, x]));
    const enriched = byId[p.id];
    // El banco puede tardar en indexar la pregunta recién generada — chequeo la primera del banco como referencia de forma
    const sample = enriched || bank[0];
    if (!enriched) warn('6.7 pregunta recién generada aún no indexada en banco (uso otra como referencia)', `id=${p.id}, banco tiene ${bank.length}`);
    const cita = sample?.evidencia?.cita || '';
    const pagina = sample?.evidencia?.pagina;
    const correctaIdx = sample?.correcta_idx;
    check('6.7 banco tiene preguntas con evidencia.cita literal', !!cita, `cita="${String(cita).slice(0,80)}"`);
    check('6.7 banco tiene preguntas con evidencia.pagina numérica', typeof pagina === 'number', `pagina=${pagina}`);
    check('6.7 banco tiene preguntas con correcta_idx', typeof correctaIdx === 'number', `correcta_idx=${correctaIdx}`);
    // INC-04: job result no expone evidencia/correcta_idx; el enriquecimiento via banco es el workaround activo
    if (!p.evidencia?.cita && !p.evidencia_cita) {
      warn('6.7 INC-04 confirmado: job result no expone evidencia — usar banco (ya implementado en MotorAiClient)');
    }
    check('6.7 enunciado NO contiene la cita',
      !cita || !enun.toLowerCase().includes(String(cita).toLowerCase().slice(0, 30)),
      'sería regalar la respuesta');
  }

  // 6.8 · Responder todas y ver resultado
  if (state.sesion_id && state.preguntas.length > 0) {
    let allAnswered = true;
    for (const p of state.preguntas) {
      const pid = p.id || p.pregunta_id;
      const ans = await req('POST', `/v1/tests/${state.sesion_id}/answer`, {
        body: { user_id: USER_ID, pregunta_id: pid, elegida_idx: 0, tiempo_ms: 1500 }
      });
      if (ans.status !== 200) allAnswered = false;
    }
    check('6.8 todas las preguntas respondidas OK', allAnswered);

    const rRes = await req('GET', `/v1/tests/${state.sesion_id}/result`);
    check('6.8 GET /result → 200', rRes.status === 200, `status=${rRes.status}`);
  }
}

// ─── FASE 0: Bloque 0 — Onboarding ──────────────────────────────────────────

async function testBloque0() {
  console.log('\n── BLOQUE 0 · Onboarding ────────────────────────────────────');
  if (!state.curso_id) { fail('B0 skip: sin curso_id'); return; }

  // 0.1 · Placement test
  const r1 = await req('POST', '/v1/onboarding/placement-test', {
    body: { user_id: USER_ID, curso_id: state.curso_id, n_preguntas: 5 }
  });
  check('0.1 POST /placement-test → 200/202', [200, 202].includes(r1.status),
    `status=${r1.status} body=${JSON.stringify(r1.json).slice(0, 200)}`);
  const jobId = r1.json?.job_id;
  if (!jobId) { fail('0.1 sin job_id'); return; }

  const j = await pollJob(jobId, { maxSec: 180, label: 'placement' });
  check('0.1 placement terminó en done', j.estado === 'done',
    j.estado === 'error' ? `mensaje: ${j.mensaje}` : (j.error || ''));
  const sesionId = j.resultado?.sesion_id;
  const preguntas = j.resultado?.preguntas || [];
  check('0.1 sesion_id presente', !!sesionId);
  check('0.1 preguntas generadas', preguntas.length > 0, `n=${preguntas.length}`);
  if (!sesionId || !preguntas.length) return;

  // 0.2 · Responder todas
  let ok = true;
  for (const p of preguntas) {
    const pid = p.id || p.pregunta_id;
    const ans = await req('POST', `/v1/tests/${sesionId}/answer`, {
      body: { user_id: USER_ID, pregunta_id: pid, elegida_idx: 0, tiempo_ms: 1200 }
    });
    if (ans.status !== 200) { ok = false; console.log(`     answer HTTP ${ans.status} ${JSON.stringify(ans.json).slice(0,120)}`); }
  }
  check('0.2 todas respondidas', ok);

  // 0.3 · Cerrar y ver perfil
  const rFin = await req('POST', `/v1/onboarding/placement-test/${sesionId}/finish`, {
    body: { user_id: USER_ID }
  });
  check('0.3 POST /finish → 200', rFin.status === 200, `status=${rFin.status}`);
  const perfil = rFin.json;
  const nivel = perfil?.nivel_global;
  const dominio = perfil?.dominio_por_bloque || [];
  check('0.3 nivel_global válido', ['inicial', 'medio', 'avanzado'].includes(nivel), `nivel=${nivel}`);
  check('0.3 dominio_por_bloque no vacío', dominio.length > 0, `n=${dominio.length}`);
  check('0.3 recomendación presente', !!perfil?.recomendacion, JSON.stringify(perfil?.recomendacion || '').slice(0, 100));

  // 0.4 · Idempotencia (cerrar 2 veces)
  const rFin2 = await req('POST', `/v1/onboarding/placement-test/${sesionId}/finish`, {
    body: { user_id: USER_ID }
  });
  check('0.4 finish 2× → 200 (idempotente)', rFin2.status === 200);
  check('0.4 mismo nivel_global', rFin2.json?.nivel_global === nivel,
    `1º=${nivel} 2º=${rFin2.json?.nivel_global}`);
}

// ─── FASE 7: Bloque 7 — Entrenamiento + Pista IA ─────────────────────────────

async function testBloque7() {
  console.log('\n── BLOQUE 7 · Entrenamiento + Pista IA ──────────────────────');
  if (!state.curso_id) { fail('B7 skip: sin curso_id'); return; }

  // 7.1a · Modo surgical (informativo: sin historial de errores devuelve vacío)
  const rS = await req('POST', '/v1/modes/surgical', {
    body: { user_id: USER_ID, curso_id: state.curso_id, n_preguntas: 5 }
  });
  check('7.1a POST /modes/surgical → 200/202', [200, 202].includes(rS.status), `status=${rS.status}`);
  const nQ = rS.json?.preguntas?.length ?? 0;
  const motivo = rS.json?.deficit?.motivos_descarte ? Object.keys(rS.json.deficit.motivos_descarte)[0] : '';
  console.log(`    ⓘ  surgical devolvió ${nQ} preguntas — motivo=${motivo || 'ok'} (esperable con user nuevo)`);

  // 7.1b · Errors mode — dominio del usuario
  const rE = await req('GET', `/v1/modes/errors/${USER_ID}?course_id=${state.curso_id}`);
  check('7.1b GET /modes/errors/{user} → 200', rE.status === 200, `status=${rE.status}`);

  // 7.2 · Pistas — usamos las preguntas del Bloque 6 (state.preguntas / state.sesion_id)
  if (!state.sesion_id || !state.preguntas.length) {
    fail('7.2 skip: sin sesion_id/preguntas del Bloque 6');
    return;
  }
  const sesionId7 = state.sesion_id;
  const preguntas7 = state.preguntas;
  const q = preguntas7[0];
  const questionText = q.enunciado || q.texto || 'Pregunta genérica de prueba';
  const opciones = (q.opciones || q.options || []).map(o => o.texto || o.text || o);

  const hintBody = {
    user_id: USER_ID,
    sessionId: sesionId7,
    questionText,
    options: opciones.length ? opciones : ['A', 'B', 'C', 'D'],
    topic: 'temario',
  };

  // Reintenta hasta 3 pistas exitosas — 422 pista_revela_respuesta NO gasta cupo (guía p.7-8)
  let hintsPrev = null, ok3 = 0, descartadas = 0, maxTries = 8;
  for (let t = 0; t < maxTries && ok3 < 3; t++) {
    const rh = await req('POST', '/v1/modes/hint', { body: hintBody });
    if (rh.status === 422 && String(rh.json?.detail || '').startsWith('pista_')) {
      descartadas++;
      warn(`7.2 pista descartada #${descartadas} → ${rh.json.detail} (el sistema funcionando, no consume cupo)`);
      continue;
    }
    const iOk = ok3 + 1;
    const ok = rh.status === 200;
    check(`7.2 pista útil #${iOk} → 200`, ok, `status=${rh.status} body=${JSON.stringify(rh.json).slice(0,150)}`);
    if (!ok) continue;

    const hint = String(rh.json?.hint || '');
    const remaining = rh.json?.hintsRemaining;
    check(`7.2 pista #${iOk} ≤300 chars`, hint.length <= 300, `len=${hint.length}`);
    const nombraLetra = /\b(la opción|opción|marca)\s*[a-d]\b/i.test(hint) || /\b[a-d]\)/i.test(hint);
    check(`7.2 pista #${iOk} no nombra letra`, !nombraLetra, hint.slice(0, 100));
    const copiaOpcion = opciones.some(o => o && hint.toLowerCase().includes(String(o).toLowerCase()));
    check(`7.2 pista #${iOk} no copia opción literalmente`, !copiaOpcion);
    if (hintsPrev != null && typeof remaining === 'number') {
      check(`7.2 pista #${iOk} hintsRemaining decrece`, remaining < hintsPrev, `${hintsPrev}→${remaining}`);
    }
    if (typeof remaining === 'number') hintsPrev = remaining;
    ok3++;
  }
  check('7.2 se lograron 3 pistas útiles', ok3 === 3, `útiles=${ok3}, descartadas=${descartadas}`);
  if (descartadas > 0) console.log(`    ⓘ  ${descartadas} pistas descartadas no consumieron cupo (regla del sistema)`);

  // 7.3 · 4ª pista → 429 (solo si tuvimos 3 útiles)
  if (ok3 === 3) {
    const rh4 = await req('POST', '/v1/modes/hint', { body: hintBody });
    check('7.3 4ª pista → 429 limite_de_pistas_alcanzado',
      rh4.status === 429,
      `status=${rh4.status} body=${JSON.stringify(rh4.json).slice(0, 150)}`);
  }

  // 7.4 · Referencia legislativa
  const pid = q.id || q.pregunta_id;
  if (pid) {
    const rRef = await req('GET', `/v1/modes/reference/${pid}`);
    check('7.4 GET /modes/reference/{pid} → 200 o 422',
      [200, 422].includes(rRef.status),
      `status=${rRef.status} (422 = sin cita concreta, es OK)`);
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Motor: ${MOTOR}`);
  console.log(`PDF:   ${PDF_PATH}`);
  const T0 = Date.now();

  await testSalud();
  await testBloque6();
  await testBloque0();
  await testBloque7();

  const total = passed + failed;
  console.log(`\n═══ RESULTADO ═══`);
  console.log(`${passed}/${total} PASS · ${failed} FAIL · ${((Date.now() - T0)/1000).toFixed(1)}s`);
  if (failures.length) {
    console.log('\nFallos:');
    failures.forEach(f => console.log(`  ✗ ${f.l}${f.d ? ' — ' + f.d : ''}`));
  }
  process.exit(failed ? 1 : 0);
})();
