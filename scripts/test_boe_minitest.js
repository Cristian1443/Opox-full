/**
 * TEST · Bloque 10.4 · Mini-test BOE — Motor real
 *
 * Verifica el flujo completo del nuevo mini-test contra el backend local:
 *   1. Login con usuario de prueba
 *   2. GET /boe/feed      → obtener un change_id real
 *   3. GET /boe/changes/:id/mini-test → sesión del Motor (sesionId + preguntas sin correctIdx)
 *   4. POST /boe/changes/:id/mini-test/answer × N → corrige cada pregunta, valida evidencia
 *   5. POST /boe/changes/:id/mini-test/complete → guarda resultado + Opopoints
 *   6. GET /boe/changes/:id → miniTestCompleted === true
 *
 * Uso:
 *   node scripts/test_boe_minitest.js
 *   BASE_URL=https://mi-backend.com node scripts/test_boe_minitest.js
 *
 * Si el Motor BOE no está configurado en el backend el test lo detecta y cubre
 * el path de fallback (stub) automáticamente.
 */

const BASE  = process.env.BASE_URL  || 'http://localhost:3000';
const EMAIL = process.env.SEED_EMAIL || 'tester.contrax.2026@gmail.com';
const PASS  = process.env.SEED_PASS  || 'Contrax#2026!';

let token  = null;
let userId = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function req(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token && !opts.noAuth) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { _raw: text }; }
        return { status: res.status, json };
    } catch (err) {
        return { status: 0, json: { _err: err.message }, netErr: true };
    }
}

function pass(label, detail = '') {
    passed++;
    console.log(`  ✓ ${label}${detail ? '  [' + detail + ']' : ''}`);
}
function fail(label, detail = '') {
    failed++;
    failures.push({ label, detail });
    console.log(`  ✗ ${label}${detail ? '  [' + detail + ']' : ''}`);
}
function skip(label, reason = '') {
    skipped++;
    console.log(`  ⏭  ${label}${reason ? '  — ' + reason : ''}`);
}
function assert(label, cond, detail = '') {
    cond ? pass(label, detail) : fail(label, detail);
    return cond;
}
function section(title) {
    console.log(`\n── ${title} ${'─'.repeat(Math.max(3, 68 - title.length))}`);
}

// ─── 1 · Login ────────────────────────────────────────────────────────────────

async function login() {
    section('1 · Login con usuario de prueba');

    const r = await req('POST', '/auth/login', { email: EMAIL, password: PASS }, { noAuth: true });
    if (r.netErr || r.status !== 200) {
        fail('1.1 POST /auth/login', `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
        return false;
    }

    token  = r.json?.data?.accessToken;
    userId = r.json?.data?.user?.id;

    if (!assert('1.1 login → 200 con token', !!token)) return false;
    assert('1.1 user.id presente', !!userId, `id=${userId}`);
    console.log(`     usuario: ${EMAIL}  id: ${userId}`);
    return true;
}

// ─── 2 · Obtener un change_id real del feed ───────────────────────────────────

async function getChangeId() {
    section('2 · GET /boe/feed → obtener change_id');

    const r = await req('GET', '/boe/feed');
    if (r.netErr || r.status !== 200) {
        fail('2.1 GET /boe/feed', `status=${r.status}`);
        return null;
    }
    assert('2.1 GET /boe/feed → 200', r.status === 200);

    const sections = r.json?.data?.sections ?? [];
    const allChanges = sections.flatMap(s => s.data ?? []);

    if (allChanges.length === 0) {
        skip('2.2 sin cambios en el feed', 'el Motor BOE no ha sincronizado aún — ejecuta POST /boe/sync primero');
        return null;
    }

    const change = allChanges[0];
    assert('2.2 change con id', !!change.id, `id=${change.id}`);
    console.log(`     change_id: ${change.id}  regulación: ${(change.regulationTitle ?? '').slice(0, 60)}`);
    return change.id;
}

// ─── 3 · GET mini-test (sesión del Motor) ────────────────────────────────────

async function getMiniTest(changeId) {
    section('3 · GET /boe/changes/:id/mini-test');

    const t0 = Date.now();
    const r  = await req('GET', `/boe/changes/${changeId}/mini-test`);
    const ms = Date.now() - t0;

    if (r.status === 409) {
        const code = r.json?.error?.code ?? r.json?.detail ?? '';
        if (code === 'boe/mini-test-not-available' || JSON.stringify(r.json).includes('mini_test_no_disponible')) {
            skip('3.1 mini-test → 409 mini_test_no_disponible',
                'el cambio aún no fue regenerado — ejecuta POST /boe/changes/:id/regenerate y espera');
            return null;
        }
    }

    if (!assert('3.1 GET /boe/changes/:id/mini-test → 200', r.status === 200,
        `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`)) return null;

    const data = r.json?.data ?? {};
    const sesionId  = data.sesionId;
    const questions = data.questions ?? [];

    console.log(`     tiempo: ${ms}ms  sesionId: ${sesionId ?? 'null (stub)'}  preguntas: ${questions.length}`);

    assert('3.2 questions.length ≥ 1', questions.length >= 1, `len=${questions.length}`);
    assert('3.3 sesionId presente o null', sesionId === null || typeof sesionId === 'string',
        `sesionId=${sesionId}`);

    if (questions.length > 0) {
        const q = questions[0];
        assert('3.4 pregunta tiene id', typeof q.id === 'string' && q.id.length > 0, `id=${q.id}`);
        assert('3.5 pregunta tiene question', typeof q.question === 'string' && q.question.length > 0);
        assert('3.6 pregunta tiene options array', Array.isArray(q.options) && q.options.length >= 2,
            `options=${JSON.stringify(q.options).slice(0, 100)}`);

        if (sesionId !== null) {
            // Motor activo — NO debe venir correctIndex
            const sinCorrectIdx = !('correctIndex' in q) || q.correctIndex === undefined;
            assert('3.7 Motor activo → sin correctIndex en pregunta', sinCorrectIdx,
                `correctIndex=${q.correctIndex}`);
        } else {
            // Stub — SÍ debe venir correctIndex para resolución local
            assert('3.7 Stub → correctIndex presente', typeof q.correctIndex === 'number',
                `correctIndex=${q.correctIndex}`);
        }
    }

    return { sesionId, questions, changeId };
}

// ─── 4 · POST answer por cada pregunta ───────────────────────────────────────

async function answerQuestions({ sesionId, questions, changeId }) {
    section('4 · POST /boe/changes/:id/mini-test/answer × pregunta');

    if (sesionId === null) {
        skip('4.x endpoint /answer', 'sesionId=null → path stub, resolución local — no hay endpoint que probar');
        return { score: 0, total: questions.length };
    }

    let score = 0;

    for (let i = 0; i < questions.length; i++) {
        const q         = questions[i];
        const elegidaIdx = 0; // siempre elegimos la opción 0 (puede ser correcta o no)
        const t0         = Date.now();

        const r = await req('POST', `/boe/changes/${changeId}/mini-test/answer`, {
            sesionId,
            preguntaId: q.id,
            elegidaIdx,
            tiempoMs: 3000,
        });

        const ms = Date.now() - t0;

        if (!assert(`4.${i + 1} answer pregunta ${i + 1}/${questions.length} → 200`,
            r.status === 200,
            `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`)) continue;

        const d = r.json?.data ?? {};

        assert(`4.${i + 1} respuesta tiene correcta (boolean)`, typeof d.correcta === 'boolean',
            `correcta=${d.correcta}`);
        assert(`4.${i + 1} respuesta tiene correctaIdx (number)`, typeof d.correctaIdx === 'number',
            `correctaIdx=${d.correctaIdx}`);
        assert(`4.${i + 1} respuesta tiene explicacion`, typeof d.explicacion === 'string',
            `explicacion="${(d.explicacion ?? '').slice(0, 80)}"`);
        assert(`4.${i + 1} justificaciones es array`, Array.isArray(d.justificaciones));

        if (d.correcta) score++;

        // Mostrar evidencia si la hay
        const ev = d.evidencia;
        if (ev?.cita) {
            console.log(`     evidencia — pág. ${ev.pagina}: "${ev.cita.slice(0, 100)}…"  (${ms}ms)`);
        } else {
            console.log(`     ${d.correcta ? 'correcta ✓' : 'incorrecta ✗'}  correctaIdx=${d.correctaIdx}  (${ms}ms)`);
        }
    }

    console.log(`\n     Resultado: ${score}/${questions.length} correctas`);
    return { score, total: questions.length };
}

// ─── 5 · POST complete (Opopoints) ───────────────────────────────────────────

async function completeMiniTest({ changeId, score, total }) {
    section('5 · POST /boe/changes/:id/mini-test/complete');

    const r = await req('POST', `/boe/changes/${changeId}/mini-test/complete`, { score, total });

    assert('5.1 complete → 204', r.status === 204,
        `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);

    if (r.status === 204) {
        const puntos = total > 0 ? Math.round((score / total) * 5) : 0;
        console.log(`     Opopoints ganados: ${puntos} (${score}/${total} × 5)`);
    }
}

// ─── 6 · GET detalle del cambio → miniTestCompleted ──────────────────────────

async function verifyCompleted(changeId) {
    section('6 · GET /boe/changes/:id → miniTestCompleted=true');

    const r = await req('GET', `/boe/changes/${changeId}`);
    if (!assert('6.1 GET /boe/changes/:id → 200', r.status === 200,
        `status=${r.status}`)) return;

    const d = r.json?.data ?? {};
    assert('6.2 miniTestCompleted = true', d.miniTestCompleted === true,
        `miniTestCompleted=${d.miniTestCompleted}`);
    assert('6.3 miniTestScore presente', typeof d.miniTestScore === 'number',
        `miniTestScore=${d.miniTestScore}`);
    assert('6.4 miniTestTotal presente', typeof d.miniTestTotal === 'number',
        `miniTestTotal=${d.miniTestTotal}`);
}

// ─── Extra: idempotencia (segunda llamada al mini-test devuelve misma sesión) ─

async function verifyIdempotency({ sesionId, changeId }) {
    if (!sesionId) return; // solo aplica con Motor activo

    section('Extra · Idempotencia de sesión');

    const r = await req('GET', `/boe/changes/${changeId}/mini-test`);
    if (!assert('E.1 segunda llamada → 200', r.status === 200)) return;

    const sesionId2 = r.json?.data?.sesionId;
    assert('E.2 misma sesionId devuelta', sesionId2 === sesionId,
        `original=${sesionId}  nueva=${sesionId2}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

async function main() {
    console.log('═'.repeat(72));
    console.log('  TEST · Bloque 10.4 · Mini-test BOE — Motor real');
    console.log(`  Backend: ${BASE}`);
    console.log(`  Usuario: ${EMAIL}`);
    console.log('═'.repeat(72));

    const ok1 = await login();
    if (!ok1) return printSummary();

    const changeId = await getChangeId();
    if (!changeId) return printSummary();

    const session = await getMiniTest(changeId);
    if (!session) return printSummary();

    const { score, total } = await answerQuestions(session);
    await completeMiniTest({ changeId, score, total });
    await verifyCompleted(changeId);
    await verifyIdempotency(session);

    printSummary();
}

function printSummary() {
    console.log('\n' + '═'.repeat(72));
    const total = passed + failed + skipped;
    console.log(`  RESULTADO: ${passed} PASS · ${failed} FAIL · ${skipped} SKIP  (${total} checks)`);
    if (failures.length > 0) {
        console.log('\n  Fallos:');
        failures.forEach(f => console.log(`    ✗ ${f.label}${f.detail ? ' — ' + f.detail : ''}`));
    }
    console.log('═'.repeat(72));
}

main().catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
});
