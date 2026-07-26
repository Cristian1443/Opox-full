/**
 * Smoke test del AiApiClient contra OpenAI real.
 *
 * Uso: pnpm --filter=backend exec tsx scripts/smoke-ai.ts
 *
 * Sólo llama a los 2 métodos más baratos (generateQuestions con count=2 y
 * generateHint) para verificar que las env vars y la implementación funcionan.
 * Coste esperado: menos de $0.001.
 */
import { config as loadDotenv } from 'dotenv';
loadDotenv();

import { AiApiClient } from '../src/infrastructure/clients/AiApiClient';

async function main() {
    const baseUrl = process.env.AI_API_BASE_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_API_DEFAULT_MODEL;
    const timeoutMs = Number(process.env.AI_API_TIMEOUT_MS ?? 60000);

    if (!baseUrl || !apiKey || !model) {
        console.error('Falta AI_API_BASE_URL, AI_API_KEY o AI_API_DEFAULT_MODEL en .env');
        process.exit(1);
    }

    const client = new AiApiClient({ baseUrl, apiKey, defaultModel: model, timeoutMs });

    console.log('\n─── generateQuestions (count=2, ley-39, medium) ───');
    const t1 = Date.now();
    const questions = await client.generateQuestions({
        oposicion: 'justicia-tramitacion',
        topicId: 'ley-39',
        difficulty: 'medium',
        count: 2,
    });
    console.log(`OK — ${questions.length} preguntas en ${Date.now() - t1}ms`);
    for (const q of questions) {
        console.log(`\n  · ${q.text}`);
        q.options.forEach((o, i) => console.log(`    ${String.fromCharCode(65 + i)}) ${o}${i === q.correctIndex ? '  ✓' : ''}`));
        console.log(`    → ${q.explanation.slice(0, 120)}${q.explanation.length > 120 ? '...' : ''}`);
    }

    console.log('\n─── generateHint ───');
    const t2 = Date.now();
    const hint = await client.generateHint({
        questionText: '¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?',
        options: ['1 mes', '2 meses', '3 meses', '6 meses'],
        topicId: 'ley-39',
        topic: 'Ley 39/2015',
        oposicion: 'justicia-tramitacion',
    });
    console.log(`OK en ${Date.now() - t2}ms`);
    console.log(`  hint (${hint.hint.length} chars): ${hint.hint}`);
    if (hint.articleRef) console.log(`  ref: ${hint.articleRef}`);

    console.log('\n─── generateSurgicalTest (5 preguntas, 2 patterns) ───');
    const t3 = Date.now();
    const surgical = await client.generateSurgicalTest({
        oposicion: 'justicia-tramitacion',
        count: 5,
        errorPatterns: [
            { topicId: 'ley-39', topic: 'Ley 39/2015', failRate: 60, domain: 40 },
            { topicId: 'ley-40', topic: 'Ley 40/2015', failRate: 40, domain: 60 },
        ],
    });
    console.log(`OK — ${surgical.questions.length} preguntas en ${Date.now() - t3}ms`);
    console.log('  distribución:');
    for (const d of surgical.distribution) console.log(`    · ${d.count} sobre ${d.topic} (${d.percentage}%)`);

    console.log('\n✅ Smoke OK. No probamos analyzePhoto porque necesita imagen real y gpt-4o (más caro). Prueba manual desde la app.\n');
}

main().catch((err) => {
    console.error('\n❌ Falló el smoke:', err.message);
    console.error(err.stack);
    process.exit(1);
});
