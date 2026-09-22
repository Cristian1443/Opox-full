/**
 * Test manual: ¿el endpoint POST /v1/tests/from-cache del Motor rota preguntas
 * por user_id, o devuelve siempre las mismas para el mismo combo?
 *
 * Uso: node scripts/test_from_cache_variety.js
 * Requiere en .env: MOTOR_API_BASE_URL, MOTOR_API_KEY, AI_API_KEY, MOTOR_DEFAULT_CURSO_ID
 *
 * Estrategia: 3 llamadas con MISMO user_id + 2 llamadas con OTROS user_ids.
 * Si el Motor rota por user_id, las 3 primeras deberían tener IDs distintos
 * entre sí (o al menos overlap parcial). Si NO rota, las 3 devolverán los
 * mismos IDs en el mismo orden.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASE_URL = process.env.MOTOR_API_BASE_URL;
const API_KEY = process.env.MOTOR_API_KEY;
const OPENAI_KEY = process.env.AI_API_KEY;
const CURSO_ID = process.env.MOTOR_DEFAULT_CURSO_ID;

const USER_ID = '5c4f377c-a6dc-4158-acd0-7310efda78c7';
const OTHER_USER_A = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_B = '22222222-2222-2222-2222-222222222222';

async function fromCache(userId, label) {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/v1/tests/from-cache`, {
        method: 'POST',
        headers: {
            'X-API-Key': API_KEY,
            'X-OpenAI-Key': OPENAI_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            curso_id: CURSO_ID,
            user_id: userId,
            n_preguntas: 3,
        }),
    });
    const ms = Date.now() - t0;
    const data = await res.json();

    if (!res.ok) {
        console.log(`\n[${label}] ${res.status} FAIL en ${ms}ms`);
        console.log(JSON.stringify(data, null, 2));
        return null;
    }

    const ids = (data.preguntas ?? []).map((p) => p.id);
    const temaIds = (data.preguntas ?? []).map((p) => p.tema_id ?? '');
    const deficit = data.deficit ?? null;
    console.log(`\n[${label}] user=${userId.slice(0, 8)}… ${ms}ms sesion=${data.sesion_id?.slice(0, 8)}…`);
    console.log(`  ids: ${ids.map((id) => id.slice(0, 8)).join(', ')}`);
    console.log(`  tema_ids: ${JSON.stringify(temaIds)}`);
    if (deficit) console.log(`  deficit: pedidas=${deficit.pedidas} publicadas=${deficit.publicadas}`);
    return { ids, temaIds, sesionId: data.sesion_id, deficit };
}

function jaccard(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const inter = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : inter / union;
}

(async () => {
    console.log('===== TEST from-cache rotación por user_id =====');
    console.log(`Motor: ${BASE_URL}`);
    console.log(`Curso: ${CURSO_ID}`);
    console.log(`n_preguntas: 3\n`);

    // 3 llamadas seguidas con el mismo usuario
    const a1 = await fromCache(USER_ID, 'MISMO-USER · llamada 1');
    const a2 = await fromCache(USER_ID, 'MISMO-USER · llamada 2');
    const a3 = await fromCache(USER_ID, 'MISMO-USER · llamada 3');

    // 2 llamadas con otros usuarios (para ver si el pool cambia por user)
    const b1 = await fromCache(OTHER_USER_A, 'OTHER-A');
    const b2 = await fromCache(OTHER_USER_B, 'OTHER-B');

    console.log('\n===== ANÁLISIS =====');
    if (a1 && a2) {
        const same12 = JSON.stringify(a1.ids) === JSON.stringify(a2.ids);
        console.log(`Same-user llamada 1 vs 2: ${same12 ? 'IDÉNTICAS (no rota)' : 'DISTINTAS'} · Jaccard=${jaccard(a1.ids, a2.ids).toFixed(2)}`);
    }
    if (a1 && a3) {
        const same13 = JSON.stringify(a1.ids) === JSON.stringify(a3.ids);
        console.log(`Same-user llamada 1 vs 3: ${same13 ? 'IDÉNTICAS (no rota)' : 'DISTINTAS'} · Jaccard=${jaccard(a1.ids, a3.ids).toFixed(2)}`);
    }
    if (a1 && b1) {
        console.log(`User real vs OTHER-A     : Jaccard=${jaccard(a1.ids, b1.ids).toFixed(2)} (1.0 = mismas preguntas)`);
    }
    if (b1 && b2) {
        console.log(`OTHER-A vs OTHER-B       : Jaccard=${jaccard(b1.ids, b2.ids).toFixed(2)}`);
    }

    console.log('\nInterpretación:');
    console.log('  · IDÉNTICAS en mismo user → Motor NO rota → implementar Opción B (filtrar en OPOX)');
    console.log('  · DISTINTAS en mismo user → Motor SÍ rota → ok, no tocar nada');
    console.log('  · Jaccard=1.0 entre users → el pool es el mismo para todos');
    console.log('  · Jaccard<1.0 entre users → hay algo de personalización cross-user');
})();
