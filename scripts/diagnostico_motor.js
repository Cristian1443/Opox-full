/**
 * Diagnóstico del Motor de IA — verifica si correcta_idx ya viene en el job result.
 *
 * Uso: node scripts/diagnostico_motor.js
 *
 * Qué prueba:
 *   1. GET /v1/health — el Motor está vivo
 *   2. POST /v1/tests/generate — lanza un job con 3 preguntas
 *   3. Polling GET /v1/jobs/{id} hasta done
 *   4. Muestra los campos de cada pregunta — especialmente si incluye correcta_idx
 *   5. GET /v1/courses/{curso_id}/questions — banco de preguntas, verifica correcta_idx
 */

// Las claves se leen del .env. Ejecutar desde la raíz del monorepo con:
//   node -e "require('dotenv').config({path:'apps/backend/.env'})" scripts/diagnostico_motor.js
// O exportar las vars antes de correr el script.
const MOTOR_BASE = process.env.MOTOR_API_BASE_URL || 'https://ingesta-demo.onrender.com';
const MOTOR_KEY  = process.env.MOTOR_API_KEY || '';
const OPENAI_KEY = process.env.AI_API_KEY || '';
const CURSO_ID   = process.env.MOTOR_DEFAULT_CURSO_ID || '1357e871b542425b';

const headers = {
    'X-API-Key': MOTOR_KEY,
    'X-OpenAI-Key': OPENAI_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

async function motorGet(path) {
    const res = await fetch(`${MOTOR_BASE}${path}`, { headers });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

async function motorPost(path, body) {
    const res = await fetch(`${MOTOR_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

function section(title) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('─'.repeat(60));
}

async function main() {
    console.log('\n🔍  DIAGNÓSTICO MOTOR DE IA — OPOX');
    console.log(`   URL: ${MOTOR_BASE}`);
    console.log(`   Curso: ${CURSO_ID}`);
    console.log(`   Fecha: ${new Date().toISOString()}\n`);

    // ── 1. Health check ───────────────────────────────────────────────────────
    section('1. Health check');
    console.log('  GET /v1/health ...');
    const t0 = Date.now();
    const health = await motorGet('/v1/health');
    console.log(`  Status: ${health.status}  (${Date.now() - t0}ms)`);
    console.log('  Body:', JSON.stringify(health.json, null, 2));
    if (health.status !== 200) {
        console.error('\n  ⚠️  Motor no responde en /v1/health. Puede estar en standby (Render free).');
        console.error('     Vuelve a ejecutar este script en 30s o espera que despierte.\n');
        return;
    }
    console.log('  ✓ Motor activo');

    // ── 2. Lanzar generación de test ─────────────────────────────────────────
    section('2. POST /v1/tests/generate (3 preguntas)');
    const genBody = {
        curso_id: CURSO_ID,
        user_id: 'opox-diag',
        n_preguntas: 3,
        dificultad: 'media',
    };
    console.log('  Body:', JSON.stringify(genBody));
    const t1 = Date.now();
    const gen = await motorPost('/v1/tests/generate', genBody);
    console.log(`  Status: ${gen.status}  (${Date.now() - t1}ms)`);
    console.log('  Response:', JSON.stringify(gen.json, null, 2));

    if (gen.status !== 200 && gen.status !== 202) {
        console.error('  ✗ Error al lanzar la generación');
        return;
    }

    let preguntas = null;

    if (gen.status === 200) {
        // Respuesta sincrónica (from-cache)
        console.log('  → Respuesta sincrónica (from-cache o fast path)');
        preguntas = gen.json.preguntas ?? gen.json.questions ?? null;
    } else {
        // 202 — job asíncrono
        const jobId = gen.json.job_id;
        if (!jobId) {
            console.error('  ✗ job_id no encontrado en la respuesta 202');
            return;
        }
        console.log(`  → job_id: ${jobId}  — comenzando polling...`);

        // ── 3. Polling del job ────────────────────────────────────────────────
        section('3. Polling GET /v1/jobs/' + jobId);
        const POLL_INTERVAL_MS = 3000;
        const MAX_WAIT_MS = 240_000;
        const deadline = Date.now() + MAX_WAIT_MS;
        let iter = 0;

        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            iter++;

            const t = Date.now();
            const job = await motorGet(`/v1/jobs/${jobId}`);
            const elapsed = Date.now() - t1;
            const { estado, resultado, error } = job.json;

            if (iter % 5 === 0 || estado === 'done' || estado === 'error') {
                console.log(`  [${elapsed}ms] iter=${iter} estado=${estado}`);
            }

            if (estado === 'done') {
                preguntas = resultado?.preguntas ?? resultado?.questions ?? null;
                console.log(`\n  ✓ Job completado en ${elapsed}ms`);
                console.log(`  sesion_id: ${resultado?.sesion_id}`);
                break;
            }

            if (estado === 'error') {
                console.error(`  ✗ Job falló: ${error}`);
                return;
            }
        }

        if (!preguntas) {
            console.error('  ✗ Timeout esperando el job o preguntas vacías');
            return;
        }
    }

    // ── 4. Inspección de campos del job result ───────────────────────────────
    section('4. Campos de preguntas del job result');
    console.log(`  Total preguntas: ${preguntas.length}`);

    let conCorrectaIdx = 0;
    let sinCorrectaIdx = 0;

    preguntas.forEach((p, i) => {
        const keys = Object.keys(p);
        const tieneCorrectaIdx = 'correcta_idx' in p && p.correcta_idx !== null && p.correcta_idx !== undefined;
        if (tieneCorrectaIdx) conCorrectaIdx++;
        else sinCorrectaIdx++;

        console.log(`\n  Pregunta ${i + 1}:`);
        console.log(`    Campos: [${keys.join(', ')}]`);
        console.log(`    correcta_idx: ${tieneCorrectaIdx ? p.correcta_idx + ' ✓' : 'AUSENTE ✗'}`);
        console.log(`    id: ${p.id}`);
        console.log(`    enunciado (primeros 80 chars): ${String(p.enunciado || p.texto || '').slice(0, 80)}`);
        console.log(`    opciones.length: ${(p.opciones || p.options || []).length}`);
        if ('explicacion' in p) console.log(`    explicacion: ${String(p.explicacion || '').slice(0, 60)}`);
        if ('origen' in p) console.log(`    origen: ${p.origen}`);
    });

    console.log(`\n  📊 Resumen correcta_idx:`);
    console.log(`     Con correcta_idx: ${conCorrectaIdx}/${preguntas.length}`);
    console.log(`     Sin correcta_idx: ${sinCorrectaIdx}/${preguntas.length}`);

    if (conCorrectaIdx === preguntas.length) {
        console.log('\n  ✅ INC-04 RESUELTO — correcta_idx viene en TODAS las preguntas del job result.');
        console.log('     → Podemos simplificar MotorAiClient para NO necesitar el banco de preguntas.');
    } else if (conCorrectaIdx > 0) {
        console.log('\n  ⚠️  correcta_idx viene en ALGUNAS preguntas (mixto).');
        console.log('     → Necesitamos manejar ambos casos en MotorAiClient.');
    } else {
        console.log('\n  ❌ INC-04 SIN RESOLVER — correcta_idx NO viene en el job result.');
        console.log('     → MotorAiClient debe seguir usando el banco de preguntas como workaround.');
    }

    // ── 5. Banco de preguntas (GET /v1/courses/{id}/questions) ───────────────
    section('5. Banco de preguntas GET /v1/courses/' + CURSO_ID + '/questions?limit=3');
    console.log('  Cargando muestra de 3 preguntas del banco...');
    const t5 = Date.now();
    const banco = await motorGet(`/v1/courses/${CURSO_ID}/questions?limit=3&offset=0`);
    console.log(`  Status: ${banco.status}  (${Date.now() - t5}ms)`);

    if (banco.status === 200 && Array.isArray(banco.json)) {
        const sample = banco.json.slice(0, 3);
        console.log(`  Preguntas en banco (muestra de ${sample.length}):`);
        sample.forEach((p, i) => {
            const keys = Object.keys(p);
            console.log(`\n  Pregunta banco ${i + 1}:`);
            console.log(`    Campos: [${keys.join(', ')}]`);
            console.log(`    correcta_idx: ${'correcta_idx' in p ? p.correcta_idx : 'AUSENTE'}`);
            console.log(`    id: ${p.id}`);
        });
    } else {
        console.log('  Respuesta:', JSON.stringify(banco.json, null, 2).slice(0, 500));
    }

    // ── Resumen final ────────────────────────────────────────────────────────
    section('RESUMEN DIAGNÓSTICO');

    const jobFix = conCorrectaIdx === preguntas.length;
    const bancoOk = banco.status === 200 && Array.isArray(banco.json) && banco.json.length > 0;

    console.log(`  Motor activo:              ✓`);
    console.log(`  correcta_idx en job:       ${jobFix ? '✅ SÍ (INC-04 RESUELTO)' : '❌ NO (workaround del banco necesario)'}`);
    console.log(`  Banco de preguntas accesible: ${bancoOk ? '✓' : '✗'}`);

    if (jobFix) {
        console.log('\n  📋 ACCIÓN RECOMENDADA:');
        console.log('     Actualizar MotorAiClient.ts para leer correcta_idx del job result');
        console.log('     y eliminar la dependencia del banco de preguntas (ensureQuestionBank).');
    } else {
        console.log('\n  📋 ESTADO ACTUAL:');
        console.log('     MotorAiClient sigue necesitando el banco (workaround INC-04).');
        console.log('     CompositeAiClient tiene fallback a OpenAI si el Motor descarta preguntas.');
    }

    console.log('\n' + '─'.repeat(60) + '\n');
}

main().catch(err => {
    console.error('\n💥 Error inesperado:', err.message);
    process.exit(1);
});
