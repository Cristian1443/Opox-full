// Replay del escenario reportado por Santi (2026-09-18):
// "5 temas, ~30 preguntas, se quedó en blanco en la 20 y se cortó a los 23".
// Verifica cuánto tarda el Motor y si dispara el deficit `tope_minado` con
// esa combinación. Usa user_id aleatorio para no arrastrar `hecho_ya_preguntado`
// de runs anteriores.

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

async function fetchJson(url, opts = {}, timeoutMs = 60000, retries = 4) {
    let lastErr;
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
        } catch (e) {
            lastErr = e;
            const isNet = e?.cause?.code === 'ENOTFOUND' || e?.cause?.code === 'ECONNRESET' || e?.cause?.code === 'ETIMEDOUT';
            if (!isNet || i === retries - 1) throw e;
            const delay = 3000 * (i + 1);
            console.log(`  ⟳ retry ${i + 1}/${retries - 1} en ${delay}ms tras ${e.cause?.code ?? e.message}`);
            await sleep(delay);
        }
    }
    throw lastErr;
}

async function loadTemas() {
    const { body } = await fetchJson(`${MOTOR_URL}/v1/courses/${CURSO_ID}`, { headers: HEADERS });
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

async function runCase(label, body) {
    body.user_id = `perf-replay-${Math.random().toString(36).slice(2, 10)}`;
    process.stdout.write(`▶ ${label} · user=${body.user_id} · temas=${body.tema_ids?.length ?? 'null'} · n=${body.n_preguntas} · ${body.dificultad}\n`);
    const t0 = Date.now();
    const start = await fetchJson(`${MOTOR_URL}/v1/tests/generate`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(body),
    }, 60000);

    if (start.status === 200) {
        const preguntas = start.body?.preguntas ?? start.body?.resultado?.preguntas ?? [];
        console.log(`  · OK cache ${Date.now() - t0}ms · ${preguntas.length}/${body.n_preguntas}`);
        return { label, ok: true, t_total: Date.now() - t0, preguntas: preguntas.length, expected: body.n_preguntas };
    }
    if (start.status !== 202) {
        console.log(`  · FAIL status=${start.status}: ${JSON.stringify(start.body).slice(0, 200)}`);
        return { label, ok: false, status: start.status, body: start.body };
    }

    const jobId = start.body?.job_id;
    console.log(`  · job=${jobId} arrancado, poleando...`);
    const pollStart = Date.now();
    const POLL_TIMEOUT = 360000; // 6 min · mismo techo que useTestSession
    let firstProgressMs = null;
    let previousPublicadas = 0;

    while (Date.now() - pollStart < POLL_TIMEOUT) {
        const { body: job } = await fetchJson(`${MOTOR_URL}/v1/jobs/${jobId}`, { headers: HEADERS }, 20000);
        const estado = job?.estado ?? job?.status;
        const publicadas = job?.resultado?.preguntas?.length ?? job?.progreso?.done ?? 0;

        if (publicadas > previousPublicadas) {
            const elapsed = Math.round((Date.now() - t0) / 1000);
            if (firstProgressMs === null && publicadas >= 1) firstProgressMs = Date.now() - t0;
            console.log(`  · +${publicadas - previousPublicadas} preguntas @ ${elapsed}s (total: ${publicadas})`);
            previousPublicadas = publicadas;
        }

        if (estado === 'done' || estado === 'error') {
            const resultado = job?.resultado ?? {};
            const preguntas = resultado.preguntas ?? [];
            const deficit = resultado.deficit ?? null;
            const t_total = Date.now() - t0;
            console.log(`  · ${estado === 'done' ? 'OK' : 'FAIL'} ${t_total}ms · ${preguntas.length}/${body.n_preguntas} · deficit=${JSON.stringify(deficit)}`);
            return {
                label, ok: estado === 'done', t_total, preguntas: preguntas.length,
                expected: body.n_preguntas, deficit, first_progress_ms: firstProgressMs,
            };
        }
        await sleep(2500);
    }
    console.log(`  · FAIL timeout tras ${Date.now() - t0}ms`);
    return { label, ok: false, phase: 'timeout', t_total: Date.now() - t0 };
}

async function main() {
    console.log(`▶ Motor ${MOTOR_URL} · curso ${CURSO_ID}\n`);
    const temas = await loadTemas();
    console.log(`▶ ${temas.length} temas cargados\n`);

    const temaIds5 = temas.slice(0, 5).map((t) => t.id);

    // Replica exacta del caso reportado + comparativa.
    const cases = [
        { label: 'REPLAY · 5 temas × 30 preguntas', body: { curso_id: CURSO_ID, tema_ids: temaIds5, n_preguntas: 30, dificultad: 'media' } },
        { label: 'REPLAY · 5 temas × 20 preguntas', body: { curso_id: CURSO_ID, tema_ids: temaIds5, n_preguntas: 20, dificultad: 'media' } },
        { label: 'CTRL · null × 30 preguntas',      body: { curso_id: CURSO_ID, tema_ids: null,     n_preguntas: 30, dificultad: 'media' } },
    ];

    const results = [];
    for (const c of cases) {
        console.log('---');
        results.push(await runCase(c.label, c.body));
        await sleep(3000);
    }

    console.log('\n=== Resumen ===');
    for (const r of results) {
        if (r.ok) {
            console.log(`  ${r.label}: ${Math.round(r.t_total / 1000)}s · ${r.preguntas}/${r.expected} · 1ra pregunta @ ${r.first_progress_ms ? Math.round(r.first_progress_ms / 1000) + 's' : 'nunca'}`);
        } else {
            console.log(`  ${r.label}: FAIL (${r.phase ?? r.status ?? 'error'})`);
        }
    }

    fs.writeFileSync(
        path.resolve(__dirname, 'perf_generator_infinito_replay.json'),
        JSON.stringify(results, null, 2),
    );
}

main().catch(console.error);
