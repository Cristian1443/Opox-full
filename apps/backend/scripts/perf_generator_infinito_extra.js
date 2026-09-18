// Casos extra que faltaron por caída de DNS. Con retry tolerante.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url, opts = {}, timeoutMs = 60000, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const ac = new AbortController();
            const to = setTimeout(() => ac.abort(), timeoutMs);
            const r = await fetch(url, { ...opts, signal: ac.signal });
            clearTimeout(to);
            const text = await r.text();
            let body;
            try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 500) }; }
            return { status: r.status, body };
        } catch (err) {
            if (i < retries - 1) {
                console.log(`  ⟳ retry ${i + 1} tras ${err.message}`);
                await sleep(3000);
            } else {
                throw err;
            }
        }
    }
}

async function runCase(label, body) {
    // Usa userId aleatorio para evitar el hecho_ya_preguntado acumulado del run anterior.
    body.user_id = `perf-fresh-${Math.random().toString(36).slice(2, 10)}`;
    process.stdout.write(`▶ ${label} ... `);
    const t0 = Date.now();
    const start = await fetchJsonWithRetry(`${MOTOR_URL}/v1/tests/generate`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body),
    }, 60000);

    if (start.status === 200) {
        const preguntas = start.body?.preguntas ?? start.body?.resultado?.preguntas ?? [];
        console.log(`OK cache ${Date.now() - t0}ms · ${preguntas.length}/${body.n_preguntas}`);
        return { label, ok: true, mode: 'cache', t_total: Date.now() - t0, preguntas: preguntas.length, expected: body.n_preguntas };
    }
    if (start.status !== 202) {
        console.log(`FAIL status=${start.status}: ${JSON.stringify(start.body).slice(0, 200)}`);
        return { label, ok: false, phase: 'start', status: start.status, body: start.body };
    }

    const jobId = start.body?.job_id;
    const pollStart = Date.now();
    const POLL_TIMEOUT = 300000; // 5 min
    while (Date.now() - pollStart < POLL_TIMEOUT) {
        const { body: job } = await fetchJsonWithRetry(`${MOTOR_URL}/v1/jobs/${jobId}`, { headers: HEADERS }, 20000);
        const estado = job?.estado ?? job?.status;
        if (estado === 'done' || estado === 'error') {
            const resultado = job?.resultado ?? {};
            const preguntas = resultado.preguntas ?? [];
            const deficit = resultado.deficit ?? null;
            const t_total = Date.now() - t0;
            console.log(`${estado === 'done' ? 'OK' : 'FAIL'} ${t_total}ms · ${preguntas.length}/${body.n_preguntas} · deficit=${JSON.stringify(deficit)}`);
            return { label, ok: estado === 'done', mode: 'job', t_total, preguntas: preguntas.length, expected: body.n_preguntas, deficit, mensaje: job?.mensaje };
        }
        await sleep(2000);
    }
    console.log('FAIL timeout');
    return { label, ok: false, phase: 'poll_timeout', t_total: Date.now() - t0 };
}

async function main() {
    console.log(`▶ Motor ${MOTOR_URL}\n`);

    const CASES = [
        { label: 'n=20 media null    ', body: { curso_id: CURSO_ID, tema_ids: null, n_preguntas: 20, dificultad: 'media' } },
        { label: 'n=30 media null    ', body: { curso_id: CURSO_ID, tema_ids: null, n_preguntas: 30, dificultad: 'media' } },
        { label: 'n=50 media null    ', body: { curso_id: CURSO_ID, tema_ids: null, n_preguntas: 50, dificultad: 'media' } },
        { label: 'n=100 edge case    ', body: { curso_id: CURSO_ID, tema_ids: null, n_preguntas: 100, dificultad: 'media' } },
    ];

    const results = [];
    for (const c of CASES) {
        try {
            results.push(await runCase(c.label, c.body));
        } catch (err) {
            console.log(`FAIL error irrecuperable: ${err.message}`);
            results.push({ label: c.label, ok: false, error: err.message });
        }
        await sleep(2000);
    }

    fs.writeFileSync(
        path.resolve(__dirname, 'perf_generator_infinito_extra.json'),
        JSON.stringify(results, null, 2),
    );
    console.log('\n--- Extras ---');
    for (const r of results) {
        if (r.ok) console.log(`  ${r.label} → ${Math.round(r.t_total / 1000)}s (${r.preguntas}/${r.expected})`);
        else console.log(`  ${r.label} → FAIL`);
    }
}

main().catch(console.error);
