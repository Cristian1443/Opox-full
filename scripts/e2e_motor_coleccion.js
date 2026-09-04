/**
 * E2E Motor IA — ejecuta la colección Postman "Motor de IA — colección completa"
 * contra el Motor real (`MOTOR_API_BASE_URL` del .env).
 *
 * Excluye la carpeta "Datos del alumno · Supresión RGPD" (irreversible).
 *
 * Uso:
 *   MOTOR_BASE=https://ia.opox.jaeverba.com \
 *   MOTOR_API_KEY=xxx \
 *   OPENAI_KEY=sk-... \
 *   node scripts/e2e_motor_coleccion.js
 *
 * O simplemente `node scripts/e2e_motor_coleccion.js` (lee del .env vía backend).
 */

const fs = require('fs');
const path = require('path');

function loadEnv(file) {
    const raw = fs.readFileSync(file, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const m = /^\s*([A-Z_][A-Z_0-9]*)\s*=\s*(.*)$/.exec(line);
        if (!m) continue;
        if (!process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
}
try { loadEnv(path.join(__dirname, '..', 'apps', 'backend', '.env')); } catch { }

const BASE = process.env.MOTOR_BASE || process.env.MOTOR_API_BASE_URL || 'https://ingesta-demo.onrender.com';
const API_KEY = process.env.MOTOR_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_KEY || process.env.AI_API_KEY || '';
const CURSO_ID = process.env.MOTOR_DEFAULT_CURSO_ID || process.env.MOTOR_BOE_CURSO_ID || '';
const USER_ID = process.env.MOTOR_USER_ID || 'opositor-e2e-' + Date.now();

let passed = 0, failed = 0, skipped = 0;
const failures = [];
const gaps = [];

async function req(method, path_, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['X-API-Key'] = API_KEY;
    if (OPENAI_KEY) headers['X-OpenAI-Key'] = OPENAI_KEY;
    let res, text, json;
    try {
        res = await fetch(`${BASE}${path_}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        text = await res.text();
        try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 300) }; }
    } catch (err) {
        return { status: 0, json: { _err: err.message }, netErr: true };
    }
    return { status: res.status, json, text };
}

async function pollJob(jobId, timeoutSec = 240, intervalMs = 3000) {
    const t0 = Date.now();
    while ((Date.now() - t0) / 1000 < timeoutSec) {
        const r = await req('GET', `/v1/jobs/${jobId}`);
        if (r.status !== 200) return { err: `job GET ${r.status}` };
        const estado = r.json?.estado;
        if (estado === 'done') return { done: true, resultado: r.json.resultado, elapsed: (Date.now() - t0) / 1000, job: r.json };
        if (estado === 'error') return { err: r.json?.mensaje || 'job error', elapsed: (Date.now() - t0) / 1000, job: r.json };
        await new Promise(r => setTimeout(r, intervalMs));
    }
    return { err: `timeout ${timeoutSec}s`, elapsed: timeoutSec };
}

const P = (l, d = '') => { passed++; console.log(`  ✓ ${l}${d ? ' — ' + d : ''}`); };
const F = (l, d = '') => { failed++; failures.push({ l, d }); console.log(`  ✗ ${l}${d ? ' — ' + d : ''}`); };
const S = (l, r) => { skipped++; console.log(`  ⏭  ${l} — ${r}`); };
const G = (l, d) => { gaps.push({ l, d }); console.log(`  ⚠  GAP · ${l} — ${d}`); };
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(3, 70 - t.length))}`);

// ═══════════════════════════════════════════════════════════════════════════

async function salud() {
    section('Salud');
    const r = await req('GET', '/v1/health');
    if (r.status === 200) P('GET /v1/health → 200');
    else F('GET /v1/health', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
}

// Bloque 0 · Onboarding — placement test
async function onboarding() {
    section('Bloque 0 · Onboarding · placement-test');
    if (!CURSO_ID) return S('placement-test', 'sin curso_id');
    const r = await req('POST', '/v1/onboarding/placement-test', {
        user_id: USER_ID, curso_id: CURSO_ID, n_preguntas: 5,
    });
    if (r.status !== 202) {
        F('POST /v1/onboarding/placement-test → 202', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
        return null;
    }
    P('POST /v1/onboarding/placement-test → 202');
    const jobId = r.json?.job_id;
    if (!jobId) { F('placement-test devuelve job_id', JSON.stringify(r.json).slice(0, 200)); return null; }

    console.log('  ⏳ Esperando job de placement-test…');
    const j = await pollJob(jobId, 180);
    if (j.err) { F(`placement-test job (${j.elapsed}s)`, j.err); return null; }
    P(`placement-test job → done (${j.elapsed.toFixed(1)}s)`);
    const sesion = j.resultado?.sesion_id;
    const preguntas = j.resultado?.preguntas;
    if (!sesion || !Array.isArray(preguntas) || !preguntas.length) {
        G('placement-test resultado incompleto', `sesion=${sesion} preguntas=${preguntas?.length}`);
        return null;
    }
    P(`placement-test devuelve ${preguntas.length} preguntas (sesion ${sesion.slice(0, 8)}…)`);

    // Ojo: alineación campos (documentado en la BITÁCORA: correcta_idx faltaba — comprobar)
    const q0 = preguntas[0];
    const hasCorrecta = 'correcta_idx' in q0 && typeof q0.correcta_idx === 'number';
    if (hasCorrecta) P('preguntas incluyen correcta_idx (INC-04 resuelto ✅)');
    else G('preguntas SIN correcta_idx (INC-04 aún activo)', `campos: ${Object.keys(q0).join(', ')}`);

    // Responder una pregunta
    const pregId = q0.id;
    const r2 = await req('POST', `/v1/tests/${sesion}/answer`, {
        user_id: USER_ID, pregunta_id: pregId, elegida_idx: 0, tiempo_ms: 3000,
    });
    if (r2.status === 200) P('POST /v1/tests/:sesion_id/answer → 200');
    else F('POST /v1/tests/:sesion_id/answer', `status=${r2.status} body=${JSON.stringify(r2.json).slice(0, 300)}`);

    return { sesionId: sesion, preguntas };
}

// Bloque 6 · Cursos y RAG
async function bloque6Cursos() {
    section('Bloque 6 · Cimiento — cursos y temario');
    {
        const r = await req('GET', '/v1/courses');
        if (r.status === 200) P(`GET /v1/courses → 200 (${Array.isArray(r.json) ? r.json.length : '?'} cursos)`);
        else F('GET /v1/courses', `status=${r.status}`);
    }
    if (!CURSO_ID) return S('detalle curso', 'sin curso_id');
    {
        const r = await req('GET', `/v1/courses/${CURSO_ID}`);
        if (r.status === 200) P('GET /v1/courses/:id → 200');
        else F('GET /v1/courses/:id', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }
    {
        const r = await req('GET', `/v1/courses/${CURSO_ID}/documents`);
        if (r.status === 200) P(`GET /v1/courses/:id/documents → 200`);
        else F('GET documents', `status=${r.status}`);
    }
    // RAG search
    {
        const r = await req('POST', `/v1/courses/${CURSO_ID}/search`, {
            query: 'tutela judicial efectiva', k: 5,
        });
        if (r.status === 200) {
            P('POST /v1/courses/:id/search (RAG) → 200');
            // Motor devuelve {query, pasajes: [...]} o {chunks: [...]}
            const arr = r.json?.pasajes ?? r.json?.chunks ?? r.json?.resultados ?? (Array.isArray(r.json) ? r.json : []);
            if (Array.isArray(arr) && arr.length > 0) P(`  ${arr.length} pasajes RAG devueltos`);
            else G('RAG search sin pasajes', `keys=${Object.keys(r.json||{}).join(',')}`);
        } else F('POST /v1/courses/:id/search', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }
}

// Bloque 6 · Generador de tests
async function bloque6Generador() {
    section('Bloque 6 · Generador de tests');
    if (!CURSO_ID) return S('generador', 'sin curso_id');

    const r = await req('POST', '/v1/tests/generate', {
        user_id: USER_ID, curso_id: CURSO_ID, n_preguntas: 3,
    });
    if (r.status !== 202) {
        F('POST /v1/tests/generate → 202', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
        return;
    }
    P('POST /v1/tests/generate → 202');
    const jobId = r.json?.job_id;
    if (!jobId) return F('generate sin job_id', JSON.stringify(r.json).slice(0, 200));

    console.log('  ⏳ Esperando job del generador…');
    const j = await pollJob(jobId, 240);
    if (j.err) return F(`generate job (${j.elapsed}s)`, j.err);
    P(`generate job → done (${j.elapsed.toFixed(1)}s)`);
    const sesion = j.resultado?.sesion_id;
    const preguntas = j.resultado?.preguntas;
    if (sesion) P(`sesion_id: ${sesion.slice(0, 8)}…`);
    if (Array.isArray(preguntas) && preguntas.length) {
        P(`${preguntas.length} preguntas generadas`);
        const q0 = preguntas[0];
        if ('correcta_idx' in q0) P('preguntas del generador con correcta_idx ✅');
        else G('generador sin correcta_idx (INC-04)', `campos: ${Object.keys(q0).join(', ')}`);
    }

    // Traer sesión
    if (sesion) {
        const r2 = await req('GET', `/v1/tests/${sesion}`);
        if (r2.status === 200) P('GET /v1/tests/:sesion_id → 200');
        else F('GET /v1/tests/:sesion_id', `status=${r2.status}`);

        // Resultado
        const r3 = await req('GET', `/v1/tests/${sesion}/result`);
        if (r3.status === 200 || r3.status === 409) P(`GET /v1/tests/:sesion_id/result → ${r3.status}`);
        else F('GET /v1/tests/:sesion_id/result', `status=${r3.status}`);
    }
}

// Bloque 6.6 · Banco de exámenes oficiales
async function bloque66() {
    section('Bloque 6.6 · Banco de exámenes oficiales');
    if (!CURSO_ID) return S('banco', 'sin curso_id');
    // Ruta real: /v1/bank/exams?course_id=
    const r = await req('GET', `/v1/bank/exams?course_id=${CURSO_ID}`);
    if (r.status === 200) {
        const arr = Array.isArray(r.json) ? r.json : (r.json?.examenes ?? []);
        P(`GET /v1/bank/exams → 200 (${arr.length} exámenes)`);
    } else F('GET /v1/bank/exams', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
}

// Bloque 7 · Dominio, pistas, etc.
async function bloque7() {
    section('Bloque 7 · Entrenamiento y Pista IA');
    if (!CURSO_ID) return S('bloque7', 'sin curso_id');

    // Dominio
    {
        const r = await req('GET', `/v1/users/${USER_ID}/mastery?curso_id=${CURSO_ID}`);
        if (r.status === 200 || r.status === 404) P(`GET mastery → ${r.status}`);
        else F('GET mastery', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    // Pista IA — ruta real: /v1/modes/hint (requiere pregunta_id real del banco)
    console.log('  ⏳ POST /v1/modes/hint — obteniendo pregunta real del banco…');
    const t0 = Date.now();
    let hintPregId = null;
    {
        // Obtener una pregunta real del banco para usarla en el hint
        const bankR = await req('GET', `/v1/courses/${CURSO_ID}/questions?limit=1`);
        if (bankR.status === 200 && Array.isArray(bankR.json) && bankR.json[0]) {
            hintPregId = bankR.json[0].id;
        }
    }
    if (!hintPregId) {
        S('POST /v1/modes/hint', 'no se pudo obtener pregunta_id real del banco');
    } else {
        const r = await req('POST', '/v1/modes/hint', {
            user_id: USER_ID,
            pregunta_id: hintPregId,
            questionText: '¿Cuántos artículos tiene la Constitución Española de 1978?',
            options: ['100', '150', '169', '200'],
            topicId: 'constitucion',
            topic: 'Constitución Española',
            oposicion: 'justicia-tramitacion',
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        if (r.status === 200) P(`POST /v1/modes/hint → 200 (${el}s)`);
        else F(`POST /v1/modes/hint (${el}s)`, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
}

// Bloque 8 · Aula, tono, fatiga
async function bloque8() {
    section('Bloque 8 · Aula Virtual, tono y fatiga');
    if (!CURSO_ID) return S('bloque8', 'sin curso_id');

    // Perfil tono — ruta real: /v1/tone/{user_id}
    {
        const r = await req('GET', `/v1/tone/${USER_ID}`);
        if (r.status === 200 || r.status === 404) P(`GET /v1/tone/:id → ${r.status}`);
        else F('GET /v1/tone/:id', `status=${r.status}`);
    }
    // Ajustar tono — nivel_detalle: 'breve'|'medio'|'profundo', motivacion: 'alta'|'media'|'baja'
    {
        const r = await req('PUT', `/v1/tone/${USER_ID}`, {
            personalidad: 'cercano', nivel_detalle: 'medio', pistas_directas: true, motivacion: 'media',
        });
        if (r.status === 200) P('PUT /v1/tone/:id → 200');
        else F('PUT /v1/tone/:id', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    // Fatiga — ruta real: /v1/fatigue/biometrics
    {
        const r = await req('POST', '/v1/fatigue/biometrics', {
            user_id: USER_ID, hrv_ms: 48, fc_reposo: 62, horas_sueno: 7, ts: new Date().toISOString().split('T')[0],
        });
        if (r.status === 200) P('POST /v1/fatigue/biometrics → 200');
        else F('POST /v1/fatigue/biometrics', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    // Chat aula — ruta real: /v1/classroom/tutor
    {
        console.log('  ⏳ POST /v1/classroom/tutor…');
        const t0 = Date.now();
        const r = await req('POST', '/v1/classroom/tutor', {
            user_id: USER_ID,
            curso_id: CURSO_ID,
            mensaje: 'Explícame el artículo 24 de la Constitución',
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        if (r.status === 200) P(`POST /v1/classroom/tutor → 200 (${el}s)`);
        else F(`POST /v1/classroom/tutor (${el}s)`, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    // Resumen tema — ruta real: /v1/classroom/summary
    {
        console.log('  ⏳ POST /v1/classroom/summary…');
        const t0 = Date.now();
        // Usar un tema_id real del curso
        const r = await req('POST', '/v1/classroom/summary', {
            curso_id: CURSO_ID, tema_id: '3b6f62d89ac74a78', nivel: 'medio',
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        if (r.status === 200) P(`POST /v1/classroom/summary → 200 (${el}s)`);
        else F(`POST /v1/classroom/summary (${el}s)`, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    // Flashcards — ruta real: /v1/classroom/flashcards/generate
    {
        console.log('  ⏳ POST /v1/classroom/flashcards/generate…');
        const t0 = Date.now();
        const r = await req('POST', '/v1/classroom/flashcards/generate', {
            curso_id: CURSO_ID, tema_id: '3b6f62d89ac74a78', n: 5,
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        if (r.status === 200) P(`POST /v1/classroom/flashcards/generate → 200 (${el}s)`);
        else F(`POST /v1/classroom/flashcards/generate (${el}s)`, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
}

// Bloque 10 · BOE
async function bloque10() {
    section('Bloque 10 · Monitor del BOE');
    if (!CURSO_ID) return S('bloque10', 'sin curso_id');

    {
        const r = await req('GET', '/v1/boe/catalog?q=constitucion');
        if (r.status === 200) P('GET /v1/boe/catalog → 200');
        else F('GET /v1/boe/catalog', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    {
        const r = await req('GET', `/v1/boe/regulations?course_id=${CURSO_ID}`);
        if (r.status === 200) P(`GET /v1/boe/regulations → 200`);
        else F('GET /v1/boe/regulations', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════

(async () => {
    console.log('═'.repeat(72));
    console.log(' Motor IA — colección completa · E2E');
    console.log(` BASE:     ${BASE}`);
    console.log(` API_KEY:  ${API_KEY ? '[SET ' + API_KEY.length + ' chars]' : '[EMPTY]'}`);
    console.log(` OpenAI:   ${OPENAI_KEY ? '[SET ' + OPENAI_KEY.length + ' chars]' : '[EMPTY]'}`);
    console.log(` CURSO_ID: ${CURSO_ID || '[EMPTY]'}`);
    console.log(` USER_ID:  ${USER_ID}`);
    console.log('═'.repeat(72));

    if (!API_KEY) F('X-API-Key ausente', 'sin clave el Motor devuelve 401 en todas las rutas /v1');
    if (!OPENAI_KEY) F('X-OpenAI-Key ausente', 'sin ella fallan las rutas que llaman al modelo');
    if (!CURSO_ID) G('MOTOR_DEFAULT_CURSO_ID vacío', 'muchos endpoints requieren curso_id');

    await salud();
    await onboarding();
    await bloque6Cursos();
    await bloque6Generador();
    await bloque66();
    await bloque7();
    await bloque8();
    await bloque10();

    const total = passed + failed;
    console.log('\n' + '═'.repeat(72));
    console.log(` RESULTADO Motor: ${passed}/${total} PASS · ${failed} FAIL · ${skipped} SKIP`);
    console.log(` GAPS: ${gaps.length}`);
    console.log('═'.repeat(72));

    if (failures.length) {
        console.log('\n❌ FALLOS:');
        for (const f of failures) {
            console.log(`   ✗ ${f.l}`);
            if (f.d) console.log(`       ${f.d}`);
        }
    }
    if (gaps.length) {
        console.log('\n⚠  GAPS:');
        for (const g of gaps) {
            console.log(`   • ${g.l}`);
            console.log(`       ${g.d}`);
        }
    }
    process.exit(failed > 0 ? 1 : 0);
})();
