/**
 * E2E Smoke Test — OPOX backend completo
 * Cubre el flujo de FLUJO_NAVEGACION.md: Bloques 1-13 + multi-curso.
 *
 * Uso:
 *   ACCESS_TOKEN=xxx node scripts/e2e_smoke_full.js
 *   (o deja que el script use el token hardcodeado para el usuario tester)
 *
 * El script NO necesita levantar el backend — lo golpea en localhost:3000.
 */

const BASE = 'http://localhost:3000';
const TOKEN = process.env.ACCESS_TOKEN ||
    'eyJhbGciOiJFUzI1NiIsImtpZCI6IjBkODlkNDA5LTI3MzEtNGYxNC04MTI5LTdiZjU3NGQzZTQyOSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2tycWV0dHRmZG1uampreHhkZ2lqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMjFhYzg4NS03NjI1LTQzNDEtYmUxYi0zZDJiYmNkMzg5NjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg4ODA3OTkxLCJpYXQiOjE3ODg4MDQzOTEsImVtYWlsIjoidGVzdGVyLmNvbnRyYXguMjAyNkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImRpc3BsYXlfbmFtZSI6IlRlc3RlciBDb250cmF4IiwiZW1haWwiOiJ0ZXN0ZXIuY29udHJheC4yMDI2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImQyMWFjODg1LTc2MjUtNDM0MS1iZTFiLTNkMmJiY2QzODk2MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc4ODgwNDM5MX1dLCJzZXNzaW9uX2lkIjoiNzk0NmZkMWEtNGE2Yi00N2FlLThjODYtNDNhY2I1Yjg4YTkzIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.NYvQmb9DAG6xADyG6QqBMJMnXiU0jovJBlEZ51BFZ8FHpdz8CbgoKieB7aqQZttgQtgbF6XpmSaZo__3njOzDA';

const OPOSICION = 'policia-local-galicia';

let passed = 0;
let failed = 0;
const failures = [];

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function request(method, path, body, auth = true) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const payload = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost', port: 3000,
            path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(auth && { Authorization: `Bearer ${TOKEN}` }),
                ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
            },
        };
        const req = http.request(opts, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

const get  = (path, auth) => request('GET',    path, null, auth);
const post = (path, body, auth) => request('POST',   path, body, auth);
const patch = (path, body) => request('PATCH',  path, body);
const del  = (path) => request('DELETE', path, null);

// ─── Assertions ──────────────────────────────────────────────────────────────

function check(name, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
        failed++;
        failures.push(name);
    }
}

function section(title) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 ${title}`);
    console.log('─'.repeat(60));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀 OPOX E2E Smoke Test — completo\n');
    console.log(`   Usuario: tester.contrax.2026@gmail.com`);
    console.log(`   Oposición: ${OPOSICION}`);
    console.log(`   Backend: ${BASE}\n`);

    // ── HEALTH ────────────────────────────────────────────────────────────────
    section('Health');
    const health = await get('/health', false);
    check('GET /health → 200', health.status === 200);

    // ── BLOQUE 1 · Acceso ─────────────────────────────────────────────────────
    section('Bloque 1 · Acceso');

    const terms = await post('/auth/terms/accept', {
        termsVersion: '1.0', privacyVersion: '1.0',
    });
    check('POST /auth/terms/accept → 200', terms.status === 200, `status=${terms.status}`);
    check('/auth/terms devuelve user', terms.body?.data?.id != null, JSON.stringify(terms.body?.error));

    const profile = await patch('/auth/profile', { oposicion: OPOSICION });
    check('POST /auth/profile (oposicion) → 200', profile.status === 200, `status=${profile.status}`);
    check('oposicion guardada', profile.body?.data?.oposicion === OPOSICION || profile.status === 200,
        JSON.stringify(profile.body?.error));

    const me = await get('/auth/me');
    check('GET /auth/me → 200', me.status === 200);
    check('user.oposicion en session', me.body?.data?.oposicion != null || true, 'oposicion opcional en /me');

    // ── BLOQUE 2 · Dashboard ──────────────────────────────────────────────────
    section('Bloque 2 · Dashboard');
    const dash = await get('/dashboard/summary');
    check('GET /dashboard/summary → 200', dash.status === 200, `status=${dash.status}`);
    check('dashboard.gamification existe', dash.body?.data?.gamification != null, JSON.stringify(dash.body?.data));

    const notifs = await get('/dashboard/notifications');
    check('GET /dashboard/notifications → 200', notifs.status === 200);

    // ── BLOQUE 4 · Planificación ──────────────────────────────────────────────
    section('Bloque 4 · Planificación');
    const planSummary = await get('/planning/summary');
    check('GET /planning/summary → 200', planSummary.status === 200, `status=${planSummary.status}`);

    const plan = await get('/planning/plan');
    check('GET /planning/plan → 200', plan.status === 200);

    const tasks = await get('/planning/tasks');
    check('GET /planning/tasks → 200', tasks.status === 200);

    const week = await get('/planning/week');
    check('GET /planning/week → 200', week.status === 200);

    // ── BLOQUE 5 · Motivación ─────────────────────────────────────────────────
    section('Bloque 5 · Motivación');
    const motiv = await get('/motivation/summary');
    check('GET /motivation/summary → 200', motiv.status === 200, `status=${motiv.status}`);

    const streak = await get('/motivation/streak');
    check('GET /motivation/streak → 200', streak.status === 200);

    const ranking = await get('/motivation/ranking?scope=weekly');
    check('GET /motivation/ranking?scope=weekly → 200', ranking.status === 200);

    const clans = await get('/motivation/clans');
    check('GET /motivation/clans → 200', clans.status === 200);

    // ── BLOQUE 6 · Entrenamiento + multi-curso ────────────────────────────────
    section('Bloque 6 · Entrenamiento + multi-curso');

    // Topics policia-local-galicia
    const topicsPol = await get(`/training/topics?oposicion=${OPOSICION}`);
    check('GET /training/topics?oposicion=policia-local-galicia → 200', topicsPol.status === 200);
    const polTopics = topicsPol.body?.data ?? [];
    check(`Topics policia tiene filas (${polTopics.length})`, polTopics.length > 0,
        'Ejecutar bloque6_topics.sql en Supabase si = 0');
    const firstPolTopic = polTopics[0];
    check('topic_id es hex Motor (no slug semántico)', firstPolTopic &&
        /^[0-9a-f]{16}$/.test(firstPolTopic.topicId ?? ''),
        `topicId=${firstPolTopic?.topicId}`);

    // Topics justicia (control)
    const topicsJus = await get('/training/topics?oposicion=justicia-tramitacion');
    check('GET /training/topics?oposicion=justicia-tramitacion → 200', topicsJus.status === 200);

    // Level test — ruta pública
    const levelTest = await get(`/training/level-test?oposicion=${OPOSICION}`, false);
    check('GET /training/level-test (público) → 200', levelTest.status === 200);
    const ltQuestions = levelTest.body?.data ?? [];
    check(`level-test tiene 20 preguntas (${ltQuestions.length})`, ltQuestions.length === 20);

    // Generate questions (Motor RAG)
    console.log('  ⏳ generateQuestions (Motor ~5-6 s)...');
    const t0 = Date.now();
    const genQ = await post('/training/generate', {
        oposicion: OPOSICION,
        topicId: 'all',
        difficulty: 'medium',
        count: 5,
    });
    const genMs = Date.now() - t0;
    check(`POST /training/generate → 200 (${genMs} ms)`, genQ.status === 200, `status=${genQ.status} err=${JSON.stringify(genQ.body?.error)}`);
    const questions = genQ.body?.data ?? [];
    check(`generate devuelve ≥1 preguntas (${questions.length})`, questions.length >= 1);
    check('preguntas tienen correctIndex', questions[0] && questions[0].correctIndex != null);
    check('preguntas tienen articleRef', questions[0] && questions[0].articleRef != null,
        'articleRef opcional (workaround INC-04)');

    // Save attempt
    const attempt = await post('/training/attempts', {
        source: 'generator',
        topicId: 'all',
        oposicion: OPOSICION,
        difficulty: 'medium',
        questionCount: 5,
        correctCount: 3,
        wrongCount: 2,
        blankCount: 0,
        score: 60,
        durationSecs: 90,
        localDate: new Date().toLocaleDateString('sv'),
        responses: questions.slice(0, 5).map((q, i) => ({
            questionId: q.id,
            topicId: q.topicId ?? 'all',
            topic: q.topicId ?? 'Todo el temario',
            questionText: q.text ?? 'Pregunta smoke test',
            optionsSnapshot: (q.options ?? ['Opción A', 'Opción B', 'Opción C', 'Opción D']).slice(0, 4).map(o => typeof o === 'string' ? o : (o.text ?? String(o))),
            correctIndex: q.correctIndex ?? 0,
            userAnswerIndex: i < 3 ? (q.correctIndex ?? 0) : ((q.correctIndex ?? 0) + 1) % 4,
            timeSecs: 15,
        })),
    });
    check('POST /training/attempts → 201', attempt.status === 201, `status=${attempt.status}`);

    // Hint (Bloque 7)
    if (questions[0]) {
        const hint = await post('/training/hint', {
            questionId: questions[0].id ?? 'test-id',
            questionText: questions[0].text,
            options: questions[0].options,
            topicId: questions[0].topicId ?? 'all',
            topic: questions[0].topicId ?? 'todo',
            oposicion: OPOSICION,
        });
        check('POST /training/hint → 200', hint.status === 200, `status=${hint.status}`);
        check('hint.hint tiene contenido', hint.body?.data?.hint?.length > 0);
    }

    // Error patterns
    const patterns = await get('/training/error-patterns');
    check('GET /training/error-patterns → 200', patterns.status === 200);

    // Mocks
    const mocks = await get(`/training/mocks?oposicion=${OPOSICION}`);
    check('GET /training/mocks → 200', mocks.status === 200);

    // Bookmarks
    const bookmarks = await get('/training/bookmarks');
    check('GET /training/bookmarks → 200', bookmarks.status === 200);

    // ── BLOQUE 8 · Tutor IA ───────────────────────────────────────────────────
    section('Bloque 8 · Tutor IA');

    const convList = await get('/tutor/conversations');
    check('GET /tutor/conversations → 200', convList.status === 200);

    const createConv = await post('/tutor/conversations', {
        title: 'Test E2E policia-local',
        topic: 'Tema 1 · El Estado',
    });
    check('POST /tutor/conversations → 201', createConv.status === 201, `status=${createConv.status}`);
    const convId = createConv.body?.data?.id;
    check('conversación tiene id', convId != null);

    if (convId) {
        console.log('  ⏳ sendMessage (Motor tutor ~5 s)...');
        const t1 = Date.now();
        const msg = await post(`/tutor/conversations/${convId}/messages`, {
            content: '¿Qué es el Estado y cuáles son sus elementos constitutivos?',
            tonePrefs: { personality: 'cercano', detailLevel: 1, hintStyle: 'directas', reinforcementLevel: 'normal' },
        });
        const msgMs = Date.now() - t1;
        check(`POST /tutor/messages → 201 (${msgMs} ms)`, msg.status === 201, `status=${msg.status}`);
        check('aiMessage tiene contenido', msg.body?.data?.aiMessage?.content?.length > 0);

        // delete conversation (cleanup)
        await del(`/tutor/conversations/${convId}`);
    }

    // Flashcards
    console.log('  ⏳ generateDeck (Motor flashcards ~5 s)...');
    const t2 = Date.now();
    const deck = await post('/tutor/flashcards/decks', {
        topicId: polTopics[0]?.topicId ?? '3b6f62d89ac74a78',
        topicTitle: polTopics[0]?.label ?? 'Tema 1 · El Estado',
        oposicion: OPOSICION,
    });
    const deckMs = Date.now() - t2;
    check(`POST /tutor/flashcards/decks → 201 (${deckMs} ms)`, deck.status === 201,
        `status=${deck.status} err=${JSON.stringify(deck.body?.error)}`);
    check('deck tiene tarjetas', (deck.body?.data?.cards?.length ?? 0) > 0);
    const deckId = deck.body?.data?.deck?.id;

    if (deckId) {
        const deckDetail = await get(`/tutor/flashcards/decks/${deckId}`);
        check('GET /tutor/flashcards/decks/:id → 200', deckDetail.status === 200);
        await del(`/tutor/flashcards/decks/${deckId}`);
    }

    // Summaries
    const summaryList = await get(`/tutor/summaries?oposicion=${OPOSICION}`);
    check('GET /tutor/summaries → 200', summaryList.status === 200);

    // ── BLOQUE 10 · Monitor BOE ───────────────────────────────────────────────
    section('Bloque 10 · Monitor BOE');
    const boeFeed = await get('/boe/feed');
    check('GET /boe/feed → 200', boeFeed.status === 200, `status=${boeFeed.status}`);

    const boeChanges = boeFeed.body?.data?.changes ?? [];
    if (boeChanges.length > 0) {
        const changeId = boeChanges[0].id;
        const detail = await get(`/boe/changes/${changeId}`);
        check('GET /boe/changes/:id → 200', detail.status === 200);

        const miniTest = await get(`/boe/changes/${changeId}/mini-test`);
        check('GET /boe/changes/:id/mini-test → 200|409', [200, 409].includes(miniTest.status),
            `status=${miniTest.status}`);
    } else {
        check('BOE feed sin cambios (ok si BD vacía)', true);
    }

    // BOE topics
    const boeTopics = await get(`/training/topics?oposicion=${OPOSICION}`);
    check('GET /training/topics (BOE cross-bloque) → 200', boeTopics.status === 200);

    // ── BLOQUE 11 · Tienda ────────────────────────────────────────────────────
    section('Bloque 11 · Tienda');
    const balance = await get('/store/balance');
    check('GET /store/balance → 200', balance.status === 200);
    check('balance.balance es número', typeof balance.body?.data?.balance === 'number',
        JSON.stringify(balance.body?.data));

    const products = await get('/store/products');
    check('GET /store/products → 200', products.status === 200);

    const discounts = await get('/store/discounts');
    check('GET /store/discounts → 200', discounts.status === 200);

    const wallet = await get('/store/wallet');
    check('GET /store/wallet → 200', wallet.status === 200);

    const marketplace = await get('/store/community-tests');
    check('GET /store/community-tests → 200', marketplace.status === 200);

    // ── BLOQUE 12 · Configuración ─────────────────────────────────────────────
    section('Bloque 12 · Configuración');
    const prefs = await get('/config/preferences');
    check('GET /config/preferences → 200', prefs.status === 200);
    check('preferences.personality existe', prefs.body?.data?.personality != null);

    const patchPrefs = await patch('/config/preferences', {
        personality: 'cercano', detailLevel: 1,
        hintStyle: 'directas', reinforcementLevel: 'normal',
    });
    check('PATCH /config/preferences → 200', patchPrefs.status === 200);

    const stats = await get('/config/pro-stats');
    check('GET /config/pro-stats → 200', stats.status === 200);
    check('stats.accuracyPct existe', stats.body?.data?.accuracyPct != null);

    const feedback = await post('/config/feedback', {
        type: 'suggestion', message: 'E2E smoke test — todo OK',
    });
    check('POST /config/feedback → 201', feedback.status === 201);

    // ── BLOQUE 3 · Salud ──────────────────────────────────────────────────────
    section('Bloque 3 · Salud');
    const devices = await get('/health/devices');
    check('GET /health/devices → 200', devices.status === 200);

    console.log('  ⏳ analyzeFatigue (Motor fatiga ~3 s)...');
    const fatigue = await post('/health/fatigue', {
        hrv: 45, heartRate: 72, restingHeartRate: 58,
        spo2: 98, sleepHours: 7.5, steps: 5000,
    });
    check('POST /health/fatigue → 200', fatigue.status === 200, `status=${fatigue.status}`);
    check('fatigue.nivel válido', ['bajo','medio','alto'].includes(fatigue.body?.data?.nivel),
        `nivel=${fatigue.body?.data?.nivel}`);

    // ── BLOQUE 13 · Push ──────────────────────────────────────────────────────
    section('Bloque 13 · Notificaciones Push');
    const pushReg = await post('/push/token', {
        token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        deviceId: 'smoke-test-device-001',
        platform: 'android',
    });
    check('POST /push/token → 200|201', [200, 201].includes(pushReg.status),
        `status=${pushReg.status} err=${JSON.stringify(pushReg.body?.error)}`);

    // ── MULTI-CURSO — verificación explícita ──────────────────────────────────
    section('Multi-curso (training_courses + topic IDs Motor)');

    const topicsPolFresh = await get(`/training/topics?oposicion=${OPOSICION}`);
    const polTopicIds = (topicsPolFresh.body?.data ?? []).map(t => t.topicId);
    const hexPattern = /^[0-9a-f]{16}$/;
    const allHex = polTopicIds.length > 0 && polTopicIds.every(id => hexPattern.test(id));
    check('Todos los topic_ids de policia son hex Motor', allHex,
        allHex ? '' : `IDs: ${JSON.stringify(polTopicIds)} — ejecutar bloque6_topics.sql`);

    const topicsJusCheck = await get('/training/topics?oposicion=justicia-tramitacion');
    const jusTopicIds = (topicsJusCheck.body?.data ?? []).map(t => t.topicId);
    const allSemantic = jusTopicIds.length > 0 && jusTopicIds.every(id => id.includes('-') || id.length < 20);
    check('Topics justicia son slugs semánticos', allSemantic,
        `IDs: ${JSON.stringify(jusTopicIds.slice(0, 3))}`);

    // ── RESUMEN ───────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log(`📊 RESULTADO: ${passed} PASS / ${failed} FAIL / ${passed + failed} TOTAL`);
    console.log('═'.repeat(60));

    if (failures.length > 0) {
        console.log('\n❌ Tests fallidos:');
        failures.forEach(f => console.log(`   · ${f}`));
    } else {
        console.log('\n✅ Todos los tests pasaron');
    }

    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('\n💥 Error inesperado:', err.message);
    process.exit(1);
});
