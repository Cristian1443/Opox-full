// Prueba de rendimiento del Generador Infinito — Motor IA (ia.opox.ai).
// Dispara barrido cantidad × dificultad y mide tiempos, deficit y errores.
//
// Uso:
//   node apps/backend/scripts/perf_generator_infinito.js
//
// Requiere apps/backend/.env con MOTOR_API_BASE_URL, MOTOR_API_KEY,
// AI_API_KEY (BYOK), MOTOR_DEFAULT_CURSO_ID.

const fs = require('node:fs');
const path = require('node:path');

// ── Config desde .env ─────────────────────────────────────────────────────────
function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let val = m[2];
        // strip surrounding double quotes si vienen escapadas para dotenv
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[m[1]] = val;
    }
    return env;
}

const ENV = loadEnv();
const MOTOR_URL = (ENV.MOTOR_API_BASE_URL || '').replace(/\/$/, '');
const MOTOR_KEY = ENV.MOTOR_API_KEY;
const OPENAI_KEY = ENV.AI_API_KEY;
const CURSO_ID = ENV.MOTOR_DEFAULT_CURSO_ID;
const USER_ID = process.env.PERF_USER_ID || 'perf-tester-santigarciavel33';

if (!MOTOR_URL || !MOTOR_KEY || !OPENAI_KEY || !CURSO_ID) {
    console.error('Faltan env vars: MOTOR_API_BASE_URL / MOTOR_API_KEY / AI_API_KEY / MOTOR_DEFAULT_CURSO_ID');
    process.exit(1);
}

const HEADERS = {
    'Content-Type': 'application/json',
    'X-API-Key': MOTOR_KEY,
    'X-OpenAI-Key': OPENAI_KEY,
};

// ── Combinaciones del barrido ─────────────────────────────────────────────────
// Cantidades típicas del selector del mobile + límite del Motor (50).
const CANTIDADES = [10, 20, 30, 50];
const DIFICULTADES = ['facil', 'media', 'dificil'];
// tema_ids: hoy el backend siempre envía null (TODO en MotorAiClient:188). Probamos
// null + arrays de temas específicos para comparar comportamiento del Motor.
const REPETICIONES = 1; // barrido inicial de amplitud, no de p95
const PAUSA_ENTRE_REQUESTS_MS = 2500;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000; // 3 min de techo por job

// ── Helpers HTTP ──────────────────────────────────────────────────────────────
async function fetchJson(url, opts = {}, timeoutMs = 60000) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const r = await fetch(url, { ...opts, signal: ac.signal });
        const text = await r.text();
        let body;
        try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 500) }; }
        return { status: r.status, body };
    } finally {
        clearTimeout(to);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Motor API ─────────────────────────────────────────────────────────────────
async function loadTemas() {
    // Cargamos el detalle del curso para obtener los tema_ids reales.
    const { status, body } = await fetchJson(`${MOTOR_URL}/v1/courses/${CURSO_ID}`, { headers: HEADERS });
    if (status !== 200) {
        console.warn('[warn] GET /v1/courses/{id} status=', status, JSON.stringify(body).slice(0, 200));
        return [];
    }
    const temas = [];
    for (const doc of body.documentos ?? []) {
        for (const bloque of doc.bloques ?? []) {
            for (const t of bloque.temas ?? []) temas.push({ id: t.id, titulo: t.titulo });
        }
    }
    if (Array.isArray(body.bloques)) {
        for (const bloque of body.bloques) {
            for (const t of bloque.temas ?? []) temas.push({ id: t.id, titulo: t.titulo });
        }
    }
    return temas;
}

async function startTestJob({ n, dificultad, temaIds }) {
    const body = {
        curso_id: CURSO_ID,
        user_id: USER_ID,
        tema_ids: temaIds ?? null,
        n_preguntas: n,
        dificultad,
    };
    return fetchJson(`${MOTOR_URL}/v1/tests/generate`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body),
    }, 60000);
}

async function pollJob(jobId) {
    const t0 = Date.now();
    while (Date.now() - t0 < POLL_TIMEOUT_MS) {
        const { status, body } = await fetchJson(`${MOTOR_URL}/v1/jobs/${jobId}`, { headers: HEADERS }, 20000);
        if (status !== 200) return { status, body, waited_ms: Date.now() - t0 };
        const estado = body.estado ?? body.status;
        if (estado === 'done' || estado === 'error') {
            return { status, body, waited_ms: Date.now() - t0, estado };
        }
        await sleep(POLL_INTERVAL_MS);
    }
    return { status: 0, body: { error: 'poll_timeout' }, waited_ms: Date.now() - t0, estado: 'timeout' };
}

async function getSession(sessionId) {
    return fetchJson(`${MOTOR_URL}/v1/tests/${sessionId}`, { headers: HEADERS }, 30000);
}

// ── Prueba individual ─────────────────────────────────────────────────────────
async function runOne({ n, dificultad, temaIds, temasLabel, rep }) {
    const label = `n=${n.toString().padStart(2)} d=${dificultad.padEnd(7)} temas=${temasLabel.padEnd(12)} rep=${rep}`;
    process.stdout.write(`▶ ${label} ... `);
    const t0 = Date.now();

    const startRes = await startTestJob({ n, dificultad, temaIds }).catch((e) => ({ error: String(e) }));
    const t_start = Date.now() - t0;

    if (startRes.error) {
        console.log(`FAIL start (${startRes.error}, ${t_start}ms)`);
        return { label, ok: false, phase: 'start', error: startRes.error, t_start };
    }

    // 200 = desde caché con resultado inmediato. 202 = job async.
    if (startRes.status === 200) {
        const preguntas = startRes.body?.preguntas ?? startRes.body?.resultado?.preguntas ?? [];
        const sessionId = startRes.body?.resultado?.sesion_id ?? startRes.body?.progreso?.sesion_id ?? null;
        console.log(`OK cache (${t_start}ms, ${preguntas.length} preguntas)`);
        return {
            label, ok: true, mode: 'cache',
            t_start, t_total: t_start,
            preguntas_count: preguntas.length,
            expected: n,
            deficit: n - preguntas.length,
            session_id: sessionId,
            rep,
        };
    }

    if (startRes.status !== 202) {
        console.log(`FAIL start status=${startRes.status} (${t_start}ms)`);
        return { label, ok: false, phase: 'start', status: startRes.status, body: startRes.body, t_start };
    }

    const jobId = startRes.body?.job_id;
    if (!jobId) {
        console.log(`FAIL sin job_id (${t_start}ms)`);
        return { label, ok: false, phase: 'no_job_id', body: startRes.body, t_start };
    }

    const pollRes = await pollJob(jobId);
    const t_poll = pollRes.waited_ms;

    if (pollRes.estado !== 'done') {
        console.log(`FAIL job estado=${pollRes.estado} (${t_start + t_poll}ms)`);
        return {
            label, ok: false, phase: 'poll', mode: 'job',
            estado: pollRes.estado, body: pollRes.body,
            t_start, t_poll, t_total: t_start + t_poll,
        };
    }

    const resultado = pollRes.body?.resultado ?? {};
    const sessionId = resultado.sesion_id ?? pollRes.body?.progreso?.sesion_id ?? null;
    const preguntasJob = resultado.preguntas ?? [];
    const deficit = resultado.deficit ?? null;
    let preguntasFinal = preguntasJob.length;
    let sesionFetch = null;

    // Si el job trae menos preguntas de las esperadas, consulta la sesión completa.
    if (sessionId && preguntasFinal < n) {
        sesionFetch = await getSession(sessionId).catch((e) => ({ error: String(e) }));
        const sess = sesionFetch?.body?.preguntas ?? [];
        preguntasFinal = Math.max(preguntasFinal, sess.length);
    }

    const t_total = Date.now() - t0;
    const ok = preguntasFinal > 0;
    console.log(
        `${ok ? 'OK' : 'FAIL'} job ${t_total}ms — pedidas=${n} obtenidas=${preguntasFinal} deficit=${JSON.stringify(deficit)}`,
    );
    return {
        label, ok, mode: 'job',
        t_start, t_poll, t_total,
        preguntas_count: preguntasFinal,
        preguntas_job: preguntasJob.length,
        expected: n,
        deficit_reported: deficit,
        session_id: sessionId,
        rep,
    };
}

// ── Barrido ───────────────────────────────────────────────────────────────────
async function main() {
    console.log(`▶ Motor: ${MOTOR_URL}`);
    console.log(`▶ Curso: ${CURSO_ID}`);
    console.log('');

    const temas = await loadTemas();
    console.log(`▶ Temas cargados: ${temas.length}\n`);
    // Escenarios de temas: `null` (comportamiento actual del backend), 1 tema, 3 temas, 5 temas
    const escenariosTemas = temas.length > 0
        ? [
            { label: 'null(todos)', ids: null },
            { label: '1_tema',      ids: [temas[0].id] },
            { label: '3_temas',     ids: temas.slice(0, 3).map((t) => t.id) },
            { label: '5_temas',     ids: temas.slice(0, 5).map((t) => t.id) },
        ]
        : [{ label: 'null(todos)', ids: null }];

    const results = [];
    for (const esc of escenariosTemas) {
        for (const n of CANTIDADES) {
            for (const dificultad of DIFICULTADES) {
                for (let rep = 1; rep <= REPETICIONES; rep++) {
                    const r = await runOne({
                        n, dificultad,
                        temaIds: esc.ids,
                        temasLabel: esc.label,
                        rep,
                    });
                    results.push(r);
                    await sleep(PAUSA_ENTRE_REQUESTS_MS);
                }
            }
        }
    }

    const outPath = path.resolve(__dirname, 'perf_generator_infinito_results.json');
    fs.writeFileSync(outPath, JSON.stringify({
        meta: {
            timestamp: new Date().toISOString(),
            motor_url: MOTOR_URL,
            curso_id: CURSO_ID,
            user_id: USER_ID,
            cantidades: CANTIDADES,
            dificultades: DIFICULTADES,
            escenarios_temas: escenariosTemas.map((e) => ({ label: e.label, count: e.ids?.length ?? null })),
            repeticiones: REPETICIONES,
            pausa_ms: PAUSA_ENTRE_REQUESTS_MS,
        },
        results,
    }, null, 2));
    console.log(`\n▶ Resultados guardados en ${outPath}`);
    console.log(`▶ Total requests: ${results.length}`);
    console.log(`▶ OK: ${results.filter((r) => r.ok).length}`);
    console.log(`▶ FAIL: ${results.filter((r) => !r.ok).length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
