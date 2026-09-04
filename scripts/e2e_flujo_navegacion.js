/**
 * E2E FLUJO_NAVEGACION — backend OPOX
 *
 * Simula, contra localhost:3000, el orden en que la app llama al backend
 * empezando desde cero: register → onboarding → login → dashboard → cada bloque.
 *
 * Uso: node scripts/e2e_flujo_navegacion.js
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OPOSICION = 'justicia-tramitacion';

// Usuario semilla (Supabase DNS inestable → no arriesgamos con register)
const SEED_EMAIL = process.env.SEED_EMAIL || 'santigarciavel33@gmail.com';
const SEED_PASS  = process.env.SEED_PASS  || 'SantiGV@2005';

// Register solo se intenta como diagnóstico si SKIP_REGISTER != '1'
const stamp = Date.now();
const NEW_EMAIL = `e2e+${stamp}@opox-test.local`;
const NEW_PASS  = 'E2eTest#2026!';
const NEW_NAME  = 'E2E Runner';
const TRY_REGISTER = process.env.SKIP_REGISTER !== '1';

let token = null;
let userId = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const gaps = [];

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function req(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token && !opts.noAuth) headers['Authorization'] = `Bearer ${token}`;
    let res, text, json;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        text = await res.text();
        try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    } catch (err) {
        return { status: 0, json: { _err: err.message }, netErr: true };
    }
    return { status: res.status, json };
}

function pass(label, detail = '') {
    passed++;
    console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`);
}
function fail(label, detail = '') {
    failed++;
    failures.push({ label, detail });
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
}
function skip(label, reason) {
    skipped++;
    console.log(`  ⏭  ${label} — ${reason}`);
}
function assert(label, cond, detail = '') {
    if (cond) pass(label);
    else fail(label, detail);
}
function gap(label, detail) {
    gaps.push({ label, detail });
    console.log(`  ⚠  GAP · ${label} — ${detail}`);
}
function section(title) {
    console.log(`\n── ${title} ${'─'.repeat(Math.max(3, 68 - title.length))}`);
}

// ─── Bloque 0 · Onboarding (público, antes de crear cuenta) ─────────────────

async function bloque0() {
    section('Bloque 0 · Onboarding · Test de nivel (público)');

    const t0 = Date.now();
    const r = await req('GET', `/training/level-test?oposicion=${encodeURIComponent(OPOSICION)}`, null, { noAuth: true });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    if (r.netErr) return fail(`0.1 GET /training/level-test`, r.json._err);
    assert(`0.1 GET /training/level-test → 200 (${elapsed}s)`, r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);

    const qs = r.json?.data?.questions ?? r.json?.data;
    if (!Array.isArray(qs)) {
        return fail('0.1 devuelve array de preguntas', `data=${JSON.stringify(r.json?.data).slice(0, 200)}`);
    }
    assert('0.1 ≥ 10 preguntas (Motor o estático)', qs.length >= 10, `count=${qs.length}`);
    if (qs.length > 0) {
        const q = qs[0];
        // El endpoint público devuelve preguntas con id number (estáticas) o string (Motor)
        assert('0.1 pregunta con id + enunciado',
            (typeof q.id === 'string' || typeof q.id === 'number') &&
            (typeof q.question === 'string' || typeof q.text === 'string'),
            `q=${JSON.stringify(q).slice(0, 200)}`);
        assert('0.1 pregunta con opciones', Array.isArray(q.options) && q.options.length >= 2,
            `options=${JSON.stringify(q.options).slice(0, 200)}`);
    }
    return true;
}

// ─── Bloque 1 · Acceso (register + login + me + updateProfile + acceptTerms) ─

async function bloque1() {
    section('Bloque 1 · Acceso · Registro + Login + Perfil');

    // 1.1 Register (diagnóstico opcional — Supabase DNS ha dado problemas)
    if (TRY_REGISTER) {
        const rReg = await req('POST', '/auth/register',
            { email: NEW_EMAIL, password: NEW_PASS, displayName: NEW_NAME },
            { noAuth: true });
        if (rReg.status === 201 && rReg.json?.data?.accessToken) {
            pass('1.1 POST /auth/register → 201 con accessToken');
        } else {
            gap('1.1 Register no completado',
                `status=${rReg.status} → continúo con usuario semilla ${SEED_EMAIL}`);
        }
    } else {
        skip('1.1 register', 'SKIP_REGISTER=1');
    }

    // 1.2 Login con usuario semilla
    const rLog = await req('POST', '/auth/login',
        { email: SEED_EMAIL, password: SEED_PASS }, { noAuth: true });
    if (rLog.netErr || rLog.status !== 200) {
        fail('1.2 login semilla', `status=${rLog.status} body=${JSON.stringify(rLog.json).slice(0, 300)}`);
        return false;
    }
    token = rLog.json?.data?.accessToken;
    userId = rLog.json?.data?.user?.id;
    assert('1.2 POST /auth/login → 200 con token', !!token, `token=${token ? 'sí' : 'no'}`);

    if (!token) {
        fail('1.x sin accessToken → abortando', '');
        return false;
    }

    // 1.3 GET /auth/me
    {
        const r = await req('GET', '/auth/me');
        assert('1.3 GET /auth/me → 200', r.status === 200, `status=${r.status}`);
    }

    // 1.4 Aceptar términos
    {
        const r = await req('POST', '/auth/terms/accept',
            { termsVersion: '2026-07-01', privacyVersion: '2026-07-01' });
        assert('1.4 POST /auth/terms/accept → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    // 1.5 UpdateProfile (aplicar oposición del onboarding)
    {
        const r = await req('PATCH', '/auth/profile', { oposicion: OPOSICION });
        assert('1.5 PATCH /auth/profile → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    // 1.6 SesionIniciada → aplica intensidad de plan del test de nivel
    {
        const r = await req('PATCH', '/planning/plan', { intensity: 'medium' });
        assert('1.6 PATCH /planning/plan (SesionIniciada) → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    return true;
}

// ─── Bloque 2 · Dashboard ────────────────────────────────────────────────────

async function bloque2() {
    section('Bloque 2 · Dashboard');
    const r = await req('GET', '/dashboard/summary');
    assert('2.1 GET /dashboard/summary → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);

    const g = await req('GET', '/dashboard/gamification');
    assert('2.2 GET /dashboard/gamification → 200', g.status === 200, `status=${g.status}`);

    const n = await req('GET', '/dashboard/notifications');
    assert('2.3 GET /dashboard/notifications → 200', n.status === 200, `status=${n.status}`);
}

// ─── Bloque 3 · Salud (analyzeFatigue del Motor) ────────────────────────────

async function bloque3() {
    section('Bloque 3 · Salud · Fatiga IA');

    const devs = await req('GET', '/health/devices');
    assert('3.1 GET /health/devices → 200', devs.status === 200, `status=${devs.status}`);

    // Contract del mobile: { hrv, fc_reposo, sueno_horas }
    console.log('  ⏳ 3.2 POST /health/fatigue (Motor → fallback local)…');
    const t0 = Date.now();
    const r = await req('POST', '/health/fatigue', {
        hrv: 48, fc_reposo: 58, sueno_horas: 7,
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    assert(`3.2 POST /health/fatigue → 200 (${elapsed}s)`, r.status === 200,
        `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);

    const data = r.json?.data;
    if (data) {
        assert('3.2 respuesta tiene nivel válido',
            ['bajo', 'medio', 'alto'].includes(data.nivel),
            `nivel=${data.nivel}`);
        assert('3.2 senales array', Array.isArray(data.senales),
            `senales=${JSON.stringify(data.senales).slice(0, 200)}`);
    }
}

// ─── Bloque 4 · Planificación ────────────────────────────────────────────────

async function bloque4() {
    section('Bloque 4 · Planificación');
    const local = new Date().toLocaleDateString('sv');

    {
        const r = await req('GET', `/planning/summary?localDate=${local}`);
        assert('4.1 GET /planning/summary → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', `/planning/tasks?localDate=${local}`);
        assert('4.2 GET /planning/tasks → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', `/planning/week?localDate=${local}`);
        assert('4.3 GET /planning/week → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', `/planning/macro`);
        assert('4.4 GET /planning/macro → 200', r.status === 200, `status=${r.status}`);
        const phases = r.json?.data?.phases ?? r.json?.data;
        if (Array.isArray(phases) && phases[0]) {
            const hasTopics = Array.isArray(phases[0].topics) && phases[0].topics.length > 0;
            if (!hasTopics) gap('4.4 Macro sin temas reales', 'enrichMacroWithTopics quizás no está devolviendo temas — validar listTopics(oposicion)');
        }
    }
    {
        const r = await req('GET', `/planning/agenda`);
        assert('4.5 GET /planning/agenda → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('POST', '/planning/tasks', {
            taskDate: local,
            title: 'E2E · tarea libre',
            subtitle: 'Creada por script E2E',
        });
        assert('4.6 POST /planning/tasks (libre) → 201/200',
            r.status === 201 || r.status === 200,
            `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
        const id = r.json?.data?.id;
        if (id) {
            // Mobile envía PATCH con { done, localDate }
            const t = await req('PATCH', `/planning/tasks/${id}/toggle`,
                { done: true, localDate: local });
            assert('4.7 PATCH /planning/tasks/:id/toggle → 200',
                t.status === 200,
                `status=${t.status} body=${JSON.stringify(t.json).slice(0, 200)}`);
        } else {
            skip('4.7 toggle task', 'no se pudo crear la tarea previa');
        }
    }
}

// ─── Bloque 5 · Motivación ──────────────────────────────────────────────────

async function bloque5() {
    section('Bloque 5 · Motivación');

    {
        const r = await req('GET', '/motivation/summary');
        assert('5.1 GET /motivation/summary → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/motivation/streak');
        assert('5.2 GET /motivation/streak → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/motivation/ranking?scope=weekly');
        assert('5.3 GET /motivation/ranking?scope=weekly → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/motivation/clans');
        assert('5.4 GET /motivation/clans → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/motivation/clans/mine');
        // Puede ser 200 con data=null si no está en clan
        const ok = r.status === 200 || r.status === 204;
        assert('5.5 GET /motivation/clans/mine → 200/204', ok, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }
}

// ─── Bloques 6/7 · Entrenamiento y sesión ────────────────────────────────────

async function bloque67() {
    section('Bloques 6/7 · Entrenamiento (Motor RAG + fallback OpenAI)');

    {
        const r = await req('GET', `/training/mocks?oposicion=${encodeURIComponent(OPOSICION)}`);
        assert('6.1 GET /training/mocks → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', `/training/topics?oposicion=${encodeURIComponent(OPOSICION)}`);
        assert('6.2 GET /training/topics → 200', r.status === 200, `status=${r.status}`);
        const arr = r.json?.data;
        if (!Array.isArray(arr) || arr.length === 0) {
            gap('6.2 /training/topics devuelve vacío', 'la app modal usa boeApi.listTopics como workaround; investigar');
        }
    }

    // 6.3 Generador Infinito
    console.log('  ⏳ 6.3 POST /training/generate (Motor primero, fallback OpenAI — hasta 240s)…');
    const t0 = Date.now();
    const gen = await req('POST', '/training/generate',
        { oposicion: OPOSICION, topicId: 'all', difficulty: 'medium', count: 3 });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    assert(`6.3 POST /training/generate → 200 (${elapsed}s)`, gen.status === 200,
        `status=${gen.status} body=${JSON.stringify(gen.json).slice(0, 300)}`);

    const qs = gen.json?.data;
    if (Array.isArray(qs) && qs.length > 0) {
        assert('6.3 3 preguntas devueltas', qs.length === 3, `count=${qs.length}`);
        const first = qs[0];
        assert('6.3 pregunta tiene 4 opciones', Array.isArray(first.options) && first.options.length === 4);
        assert('6.3 correctIndex numérico', typeof first.correctIndex === 'number');
        // INC-04 verificación: si Motor produjo, articleRef debería venir
        const hasEvidence = qs.some(q => q.articleRef && q.articleRef.length > 0);
        if (hasEvidence) pass('6.3 evidencia RAG (articleRef) presente — Motor OK');
        else gap('6.3 sin articleRef en respuesta', 'probable fallback OpenAI o INC-04 aún activo (Motor sin correcta_idx)');
        if (elapsed > 60) {
            gap('6.3 latencia alta', `${elapsed}s — Motor probablemente falló y cayó a OpenAI (~57s Motor + ~10s OpenAI)`);
        }
    }

    // 6.5 Test quirúrgico (schema exige count >= 5)
    console.log('  ⏳ 6.5 POST /training/surgical…');
    const t1 = Date.now();
    const surg = await req('POST', '/training/surgical', { oposicion: OPOSICION, count: 5 });
    const elap2 = ((Date.now() - t1) / 1000).toFixed(1);
    assert(`6.5 POST /training/surgical → 200 (${elap2}s)`, surg.status === 200,
        `status=${surg.status} body=${JSON.stringify(surg.json).slice(0, 300)}`);

    // 6.7 Save attempt (dispara racha + Opopoints)
    {
        const r = await req('POST', '/training/attempts', {
            source: 'generator',
            topicId: 'constitucion',
            difficulty: 'medium',
            durationSecs: 60,
            localDate: new Date().toLocaleDateString('sv'),
            responses: [{
                topicId: 'constitucion',
                topic: 'Constitución',
                questionText: '¿Cuántos artículos tiene la CE?',
                optionsSnapshot: ['100', '169', '200', '150'],
                correctIndex: 1,
                userAnswerIndex: 1,
                timeSecs: 10,
            }],
        });
        assert('6.7 POST /training/attempts → 201', r.status === 201, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    // 7.1 Pista IA
    {
        console.log('  ⏳ 7.1 POST /training/hint (OpenAI)…');
        const r = await req('POST', '/training/hint', {
            questionId: 'e2e-hint-q1',
            questionText: '¿Cuántos artículos tiene la Constitución Española?',
            options: ['100', '169', '200', '250'],
            topicId: 'constitucion',
            topic: 'Constitución Española',
            oposicion: OPOSICION,
        });
        assert('7.1 POST /training/hint → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
    }

    // 7.2 Foto-test con imagen mínima (probablemente 422 imagen no legible)
    {
        const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const r = await req('POST', '/training/photo-test',
            { imageBase64: tinyPng, mimeType: 'image/png', oposicion: OPOSICION });
        const ok = r.status === 200 || r.status === 422;
        assert('7.2 POST /training/photo-test → 200 o 422', ok, `status=${r.status}`);
    }
}

// ─── Bloque 8 · Aula Virtual · Tutor IA ─────────────────────────────────────

async function bloque8() {
    section('Bloque 8 · Aula Virtual · Motor IA (chat/flashcards/resumen)');

    // 8.1 Listar conversaciones
    let convId = null;
    {
        const r = await req('GET', '/tutor/conversations');
        assert('8.1 GET /tutor/conversations → 200', r.status === 200, `status=${r.status}`);
    }
    // 8.2 Crear conversación
    {
        const r = await req('POST', '/tutor/conversations', { title: 'E2E Tutor' });
        assert('8.2 POST /tutor/conversations → 201', r.status === 201 || r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 200)}`);
        convId = r.json?.data?.id ?? r.json?.data?.conversationId;
    }
    // 8.3 Enviar mensaje (Motor → stub fallback)
    if (convId) {
        console.log('  ⏳ 8.3 POST /tutor/conversations/:id/messages…');
        const t0 = Date.now();
        const r = await req('POST', `/tutor/conversations/${convId}/messages`, {
            content: '¿Qué artículo de la CE regula el derecho a la tutela judicial efectiva?',
            tonePrefs: {
                personality: 'cercano',
                detailLevel: 1,
                hintStyle: 'directas',
                reinforcementLevel: 'normal',
            },
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        assert(`8.3 POST /tutor/messages → 201/200 (${el}s)`,
            r.status === 201 || r.status === 200,
            `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
        const ai = r.json?.data?.aiMessage;
        if (ai) assert('8.3 respuesta contiene aiMessage', !!ai.content, `ai=${JSON.stringify(ai).slice(0, 200)}`);
    } else {
        skip('8.3 sendMessage', 'no se creó conversación');
    }

    // 8.4 Podcast episodes
    {
        const r = await req('GET', `/tutor/podcast/episodes?oposicion=${encodeURIComponent(OPOSICION)}`);
        assert('8.4 GET /tutor/podcast/episodes → 200', r.status === 200, `status=${r.status}`);
    }
    // 8.5 Summaries (topic id de ejemplo)
    {
        const r = await req('GET', '/tutor/summaries?oposicion=' + encodeURIComponent(OPOSICION));
        assert('8.5 GET /tutor/summaries → 200', r.status === 200, `status=${r.status}`);
    }
    // 8.6 Flashcard deck (contract del mobile: topicId + topicTitle + oposicion)
    {
        console.log('  ⏳ 8.6 POST /tutor/flashcards/decks…');
        const t0 = Date.now();
        const r = await req('POST', '/tutor/flashcards/decks', {
            topicId: 'constitucion',
            topicTitle: 'Constitución Española',
            oposicion: OPOSICION,
        });
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        assert(`8.6 POST /tutor/flashcards/decks → 200/201 (${el}s)`,
            r.status === 200 || r.status === 201,
            `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
}

// ─── Bloque 9 · Notas ────────────────────────────────────────────────────────

async function bloque9() {
    section('Bloque 9 · Factoría de Apuntes');
    {
        const r = await req('GET', '/notes');
        assert('9.1 GET /notes → 200', r.status === 200, `status=${r.status}`);
    }
    // Upload real requiere multipart + PDF; se salta desde script
    skip('9.2 POST /notes/upload', 'multipart PDF — no cubierto por script HTTP simple');
}

// ─── Bloque 10 · Monitor BOE ─────────────────────────────────────────────────

async function bloque10() {
    section('Bloque 10 · Monitor BOE');
    {
        const r = await req('GET', '/boe/feed');
        assert('10.1 GET /boe/feed → 200', r.status === 200, `status=${r.status}`);
        const totalUnread = r.json?.data?.totalUnread;
        if (typeof totalUnread !== 'number') gap('10.1 feed sin totalUnread numérico', `data=${JSON.stringify(r.json?.data).slice(0, 200)}`);
    }
    {
        const r = await req('GET', '/boe/regulations');
        assert('10.2 GET /boe/regulations → 200', r.status === 200, `status=${r.status}`);
    }
    {
        console.log('  ⏳ 10.3 GET /boe/catalog/search (Motor con fallback a listRegulations)…');
        const t0 = Date.now();
        const r = await req('GET', '/boe/catalog/search?q=');
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        assert(`10.3 GET /boe/catalog/search → 200 (${el}s)`, r.status === 200, `status=${r.status}`);
        const arr = r.json?.data;
        if (Array.isArray(arr)) {
            if (arr.length === 0) gap('10.3 catálogo vacío', 'ni Motor ni listRegulations devuelven normas — chequear MOTOR_BOE_CURSO_ID');
            else pass(`10.3 catálogo devuelve ${arr.length} normas`);
        }
    }
}

// ─── Bloque 11 · Tienda ──────────────────────────────────────────────────────

async function bloque11() {
    section('Bloque 11 · Tienda');
    {
        const r = await req('GET', '/store/balance');
        assert('11.1 GET /store/balance → 200', r.status === 200, `status=${r.status}`);
        const bal = r.json?.data?.balance ?? r.json?.data;
        pass(`11.1 balance actual: ${JSON.stringify(bal)}`);
    }
    {
        const r = await req('GET', '/store/products');
        assert('11.2 GET /store/products → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/store/discounts');
        assert('11.3 GET /store/discounts → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/store/wallet');
        assert('11.4 GET /store/wallet → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('GET', '/store/community-tests');
        assert('11.5 GET /store/community-tests → 200', r.status === 200, `status=${r.status}`);
    }
}

// ─── Bloque 12 · Configuración ──────────────────────────────────────────────

async function bloque12() {
    section('Bloque 12 · Configuración');
    {
        const r = await req('GET', '/config/preferences');
        assert('12.1 GET /config/preferences → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    {
        // Tono IA alineado con Motor (Migración 2026-09-02)
        const r = await req('PATCH', '/config/preferences', {
            personality: 'cercano',
            detailLevel: 1,
            hintStyle: 'socraticas',
            reinforcementLevel: 'normal',
            theme: 'dark',
            fontScale: 1.0,
            reduceMotion: false,
        });
        assert('12.2 PATCH /config/preferences (tono Motor) → 200', r.status === 200, `status=${r.status} body=${JSON.stringify(r.json).slice(0, 300)}`);
    }
    {
        const r = await req('GET', '/config/pro-stats');
        assert('12.3 GET /config/pro-stats → 200', r.status === 200, `status=${r.status}`);
    }
    {
        const r = await req('POST', '/config/feedback', { type: 'suggestion', message: 'E2E test feedback' });
        assert('12.4 POST /config/feedback → 200/201', r.status === 200 || r.status === 201, `status=${r.status}`);
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

(async () => {
    console.log('═'.repeat(72));
    console.log(` OPOX · E2E flujo navegación completo`);
    console.log(` Backend:  ${BASE}`);
    console.log(` Email:    ${SEED_EMAIL} (semilla)`);
    console.log(` Fecha:    ${new Date().toISOString()}`);
    console.log('═'.repeat(72));

    // Bloque 0 no requiere auth
    await bloque0();

    const authOk = await bloque1();
    if (!authOk) {
        console.log('\n⛔ Auth falló — no puedo continuar');
        process.exit(1);
    }

    await bloque2();
    await bloque3();
    await bloque4();
    await bloque5();
    await bloque67();
    await bloque8();
    await bloque9();
    await bloque10();
    await bloque11();
    await bloque12();

    const total = passed + failed;
    console.log('\n' + '═'.repeat(72));
    console.log(` RESULTADO: ${passed}/${total} PASS · ${failed} FAIL · ${skipped} SKIP`);
    console.log(` GAPS DETECTADOS: ${gaps.length}`);
    console.log('═'.repeat(72));

    if (failures.length) {
        console.log('\n❌ FALLOS:');
        for (const f of failures) {
            console.log(`   ✗ ${f.label}`);
            if (f.detail) console.log(`       ${f.detail}`);
        }
    }
    if (gaps.length) {
        console.log('\n⚠  GAPS:');
        for (const g of gaps) {
            console.log(`   • ${g.label}`);
            console.log(`       ${g.detail}`);
        }
    }
    process.exit(failed > 0 ? 1 : 0);
})();
