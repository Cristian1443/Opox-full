// Diagnóstico de la racha del usuario Santi.
// Lee user_gamification + últimos opopoints_ledger + últimos training_attempts.
// Uso: node scripts/diag_streak.js [email]

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL = process.argv[2] ?? 'santigarciavel33@gmail.com';

function todayMadrid() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}
function previousDayIso(iso) {
    const d = new Date(`${iso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

async function main() {
    console.log(`▶ Diagnóstico racha para ${EMAIL}`);
    console.log(`▶ Hoy (Madrid): ${todayMadrid()}, ayer: ${previousDayIso(todayMadrid())}`);
    console.log(`▶ Hoy (Colombia UTC-5): ${new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date())}`);
    console.log(`▶ Hoy (UTC): ${new Date().toISOString().slice(0, 10)}`);
    console.log('');

    // 1. Buscar user_id por email
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (userErr) { console.error('listUsers error:', userErr); process.exit(1); }
    const user = users.users.find(u => u.email === EMAIL);
    if (!user) { console.error(`Usuario ${EMAIL} no encontrado`); process.exit(1); }
    console.log(`Usuario: ${user.id}\n`);

    // 2. user_gamification
    const { data: gamif, error: gamifErr } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
    if (gamifErr) { console.error('gamification error:', gamifErr); process.exit(1); }
    console.log('=== user_gamification ===');
    console.log(JSON.stringify(gamif, null, 2));
    if (gamif) {
        const last = gamif.last_activity_date;
        const today = todayMadrid();
        const yest = previousDayIso(today);
        const effective = (last === today || last === yest) ? gamif.current_streak : 0;
        console.log(`\n  → effectiveStreak que devuelve el backend AL LEER: ${effective}`);
        console.log(`  → last === today ('${today}')? ${last === today}`);
        console.log(`  → last === yesterday ('${yest}')? ${last === yest}`);
    }

    // 3. Últimos 10 opopoints_ledger
    const { data: ledger } = await supabase
        .from('opopoints_ledger')
        .select('created_at, amount, reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
    console.log('\n=== opopoints_ledger (últimos 10) ===');
    (ledger ?? []).forEach(r => {
        const madrid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(r.created_at));
        console.log(`  ${madrid} · ${r.amount > 0 ? '+' : ''}${r.amount} · ${r.reason}`);
    });

    // 4. Últimos 10 training_attempts
    const { data: attempts } = await supabase
        .from('training_attempts')
        .select('created_at, source, correct_count, question_count, score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
    console.log('\n=== training_attempts (últimos 10) ===');
    (attempts ?? []).forEach(r => {
        const madrid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(r.created_at));
        console.log(`  ${madrid} · ${r.source} · ${r.correct_count}/${r.question_count} (nota ${r.score})`);
    });
}

main().catch(e => { console.error(e); process.exit(1); });
