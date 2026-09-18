// Barrido QUIRÚRGICO del Generador Infinito — 11 casos representativos.
// Basado en perf_generator_infinito.js. Reduce el barrido de 48→11 para tener
// datos suficientes sin gastar 90 min (cada request tarda ~100 s en el Motor).

const fs = require('node:fs');
const path = require('node:path');

function loadEnv() {
    const raw = fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let val = m[2];
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[m[1]] = val;
    }
    return env;
}

const ENV = loadEnv();
const MOTOR_URL = (ENV.MOTOR_API_BASE_URL || '').replace(/\/$/, '');
const HEADERS = {
    'Content-Type': 'application/json',
    'X-API-Key': ENV.MOTOR_API_KEY,
    'X-OpenAI-Key': ENV.AI_API_KEY,
};
const CURSO_ID = ENV.MOTOR_DEFAULT_CURSO_ID;
const USER_ID = 'perf-tester-santigarciavel33';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 300000; // 5 min de techo por job (para n=50 y n=100)
const PAUSA_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function loadTemas() {
    const { body } = await fetchJson(`${MOTOR_URL}/v1/courses/${CURSO_ID}`, { headers: HEADERS });
    const temas = [];
    // El Motor puede exponer bloques anidados en `documentos[*].bloques` o
    // directamente en `bloques` a nivel raíz. Cubrimos ambos.
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

async function runCase(label, body) {
    process.stdout.write(`▶ ${label} ... `);
    const t0 = Date.now();
    const start = await fetchJson(`${MOTOR_URL}/v1/tests/generate`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body),
    }, 60000).catch((e) => ({ error: String(e) }));

    if (start.error) {
        console.log(`FAIL start: ${start.error}`);
        return { label, ok: false, phase: 'start', error: start.error };
    }
    if (start.status === 200) {
        const preguntas = start.body?.preguntas ?? start.body?.resultado?.preguntas ?? [];
        console.log(`OK cache ${Date.now() - t0}ms · ${preguntas.length}/${body.n_preguntas} preguntas`);
        return { label, ok: true, mode: 'cache', t_total: Date.now() - t0, preguntas: preguntas.length, expected: body.n_preguntas };
    }
    if (start.status !== 202) {
        console.log(`FAIL status=${start.status} · ${JSON.stringify(start.body).slice(0, 200)}`);
        return { label, ok: false, phase: 'start', status: start.status, body: start.body };
    }

    const jobId = start.body?.job_id;
    const pollStart = Date.now();
    while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
        const { body: job } = await fetchJson(`${MOTOR_URL}/v1/jobs/${jobId}`, { headers: HEADERS }, 20000);
        const estado = job?.estado ?? job?.status;
        if (estado === 'done' || estado === 'error') {
            const resultado = job?.resultado ?? {};
            const preguntas = resultado.preguntas ?? [];
            const deficit = resultado.deficit ?? null;
            const t_total = Date.now() - t0;
            console.log(`${estado === 'done' ? 'OK' : 'FAIL'} job ${t_total}ms · ${preguntas.length}/${body.n_preguntas} · deficit=${JSON.stringify(deficit)}`);
            return {
                label, ok: estado === 'done', mode: 'job',
                t_total, preguntas: preguntas.length, expected: body.n_preguntas,
                deficit,
                mensaje: job?.mensaje,
            };
        }
        await sleep(POLL_INTERVAL_MS);
    }
    console.log(`FAIL timeout ${POLL_TIMEOUT_MS}ms`);
    return { label, ok: false, phase: 'poll_timeout', t_total: Date.now() - t0 };
}

async function main() {
    const temas = await loadTemas();
    console.log(`▶ Motor ${MOTOR_URL} · curso ${CURSO_ID} · ${temas.length} temas\n`);

    const temaIds3 = temas.slice(0, 3).map((t) => t.id);
    const temaIds10 = temas.slice(0, 10).map((t) => t.id);

    // Barrido: cantidad × dificultad × temas · quirúrgico
    const CASES = [
        // Ya conocemos n=10 fácil null (113s) y n=10 media null (73s) del run anterior.
        // Añadimos:
        { label: 'n=10 dificil null    ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: null, n_preguntas: 10, dificultad: 'dificil' } },
        { label: 'n=10 media   3_temas ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: temaIds3, n_preguntas: 10, dificultad: 'media' } },
        { label: 'n=10 media   1_tema  ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: [temas[0].id], n_preguntas: 10, dificultad: 'media' } },
        { label: 'n=20 media   null    ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: null, n_preguntas: 20, dificultad: 'media' } },
        { label: 'n=30 media   null    ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: null, n_preguntas: 30, dificultad: 'media' } },
        { label: 'n=30 media   3_temas ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: temaIds3, n_preguntas: 30, dificultad: 'media' } },
        { label: 'n=50 media   null    ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: null, n_preguntas: 50, dificultad: 'media' } },
        { label: 'n=50 media   10_temas',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: temaIds10, n_preguntas: 50, dificultad: 'media' } },
        // Edge case: el backend acepta count.max(100) pero el Motor solo max(50).
        // Vemos qué devuelve el Motor con >50.
        { label: 'n=100 edge case      ',  body: { curso_id: CURSO_ID, user_id: USER_ID, tema_ids: null, n_preguntas: 100, dificultad: 'media' } },
    ];

    const results = [];
    for (const c of CASES) {
        results.push(await runCase(c.label, c.body));
        await sleep(PAUSA_MS);
    }

    // Añadir los 2 resultados conocidos del run anterior para el reporte completo.
    const knownResults = [
        { label: 'n=10 facil   null    ', ok: true, mode: 'job', t_total: 113086, preguntas: 10, expected: 10, deficit: { pedidas: 10, publicadas: 10, motivos_descarte: { l1_no_entailment: 2, enunciado_duplicado: 1, cita_encabezado: 1, enunciado_tautologico: 1, hecho_ya_preguntado: 4 } }, from_prev_run: true },
        { label: 'n=10 media   null    ', ok: true, mode: 'job', t_total: 73417,  preguntas: 10, expected: 10, deficit: { pedidas: 10, publicadas: 10, motivos_descarte: { hecho_ya_preguntado: 5 } }, from_prev_run: true },
    ];
    const combined = [...knownResults, ...results];

    const outPath = path.resolve(__dirname, 'perf_generator_infinito_results.json');
    fs.writeFileSync(outPath, JSON.stringify({
        meta: {
            timestamp: new Date().toISOString(),
            motor_url: MOTOR_URL,
            curso_id: CURSO_ID,
            user_id: USER_ID,
            note: 'Barrido quirúrgico. Los dos primeros resultados vienen de run previo abortado.',
        },
        results: combined,
    }, null, 2));

    console.log(`\n▶ Resultados guardados en ${outPath}`);
    console.log(`▶ Total: ${combined.length} (${results.length} nuevos + ${knownResults.length} del run anterior)`);
    console.log(`▶ OK: ${combined.filter((r) => r.ok).length}`);
    console.log(`▶ FAIL: ${combined.filter((r) => !r.ok).length}`);
    console.log('\n--- Resumen ---');
    for (const r of combined) {
        if (r.ok) console.log(`  ${r.label} → ${Math.round(r.t_total / 1000)}s (${r.preguntas}/${r.expected})`);
        else console.log(`  ${r.label} → FAIL ${r.phase ?? r.mode ?? ''}`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
