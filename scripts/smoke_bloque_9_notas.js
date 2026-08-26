/**
 * Smoke test · Bloque 9 · Factoría de Apuntes
 * Sube un PDF real al backend y verifica el pipeline completo:
 * upload → análisis IA (stub) → status ready → preguntas generadas.
 *
 * Uso: node scripts/smoke_bloque_9_notas.js
 */

const fs   = require('fs');
const path = require('path');

const BASE      = process.env.TEST_BASE_URL   ?? 'http://localhost:3000';
const EMAIL     = process.env.TEST_EMAIL       ?? '';
const PASS      = process.env.TEST_PASSWORD    ?? '';
const PDF_PATH  = process.env.TEST_PDF_PATH
    ?? path.join(__dirname, '..', 'Guia_Pruebas_Bloques_0_6_7.pdf');

if (!EMAIL || !PASS) {
    console.error('Falta TEST_EMAIL o TEST_PASSWORD. Ejecuta con:');
    console.error('  TEST_EMAIL=tu@email.com TEST_PASSWORD=tu_pass node scripts/smoke_bloque_9_notas.js');
    process.exit(1);
}
const POLL_MS   = 1200;
const TIMEOUT_S = 30;

let token  = null;
let passed = 0;
let failed = 0;

async function req(method, urlPath, body, label) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res  = await fetch(`${BASE}${urlPath}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { _raw: text }; }
        return { status: res.status, json };
    } catch (err) {
        console.error(`  ✗  [${label}] fetch error:`, err.message);
        failed++;
        return null;
    }
}

function ok(label, detail = '') {
    passed++;
    console.log(`  ✓  ${label}${detail ? ' — ' + detail : ''}`);
}

function ko(label, detail = '') {
    failed++;
    console.error(`  ✗  ${label}${detail ? ' — ' + detail : ''}`);
}

async function login() {
    console.log('\n── Auth ──────────────────────────────────────────────────────');
    const r = await req('POST', '/auth/login', { email: EMAIL, password: PASS }, 'login');
    if (!r || r.status !== 200 || !r.json?.data?.accessToken) {
        ko('login', `status=${r?.status} body=${JSON.stringify(r?.json)}`);
        return false;
    }
    token = r.json.data.accessToken;
    ok('login', `token obtenido (${token.slice(0, 20)}...)`);
    return true;
}

async function uploadPdf() {
    console.log('\n── Upload ────────────────────────────────────────────────────');

    if (!fs.existsSync(PDF_PATH)) {
        ko('pdf existe', `no encontrado en ${PDF_PATH}`);
        return null;
    }
    const bytes    = fs.readFileSync(PDF_PATH);
    const base64   = bytes.toString('base64');
    const sizeKB   = Math.round(bytes.length / 1024);
    ok('pdf leído', `${sizeKB} KB → base64 ${Math.round(base64.length / 1024)} KB`);

    const r = await req('POST', '/notes/upload', {
        oposicion : 'justicia-tramitacion',
        kind      : 'pdf',
        fileName  : 'Guia_Pruebas_Bloques_0_6_7.pdf',
        files     : [{ base64, mimeType: 'application/pdf', sizeBytes: bytes.length }],
    }, 'upload');

    if (!r) return null;
    if (r.status !== 200 && r.status !== 201) {
        ko('POST /notes/upload', `status=${r.status} body=${JSON.stringify(r.json)}`);
        return null;
    }
    const noteId = r.json?.data?.noteId;
    if (!noteId) {
        ko('noteId en respuesta', JSON.stringify(r.json));
        return null;
    }
    ok('POST /notes/upload', `noteId=${noteId}`);
    return noteId;
}

async function pollStatus(noteId) {
    console.log('\n── Polling status ────────────────────────────────────────────');
    const deadline = Date.now() + TIMEOUT_S * 1000;

    while (Date.now() < deadline) {
        const r = await req('GET', `/notes/${noteId}/status`, null, 'getStatus');
        if (!r || r.status !== 200) {
            ko('GET /notes/:id/status', `status=${r?.status}`);
            return null;
        }
        const s = r.json?.data;
        if (!s) { ko('getStatus data', JSON.stringify(r.json)); return null; }

        console.log(`     status=${s.status} progress=${s.progress}% pagesDone=${s.pagesDone} topics=${s.topicsFound} questions=${s.questionsGenerated}`);

        if (s.status === 'ready') {
            ok('pipeline completado', `${s.questionsGenerated} preguntas generadas`);
            return s;
        }
        if (s.status === 'error') {
            ko('pipeline error', `code=${s.errorCode} msg=${s.errorMessage}`);
            return null;
        }
        await new Promise(r => setTimeout(r, POLL_MS));
    }
    ko('timeout', `no completó en ${TIMEOUT_S}s`);
    return null;
}

async function getDetail(noteId) {
    console.log('\n── Detalle ───────────────────────────────────────────────────');
    const r = await req('GET', `/notes/${noteId}`, null, 'getDetail');
    if (!r || r.status !== 200) {
        ko('GET /notes/:id', `status=${r?.status}`);
        return;
    }
    const note = r.json?.data;
    if (!note?.id) { ko('note en respuesta', JSON.stringify(r.json)); return; }
    ok('GET /notes/:id', `title="${note.title}" pages=${note.pages} questions=${note.questionsCount}`);
    ok('etiquetas', (note.tags ?? []).join(', ') || '(ninguna)');
    ok('páginas OCR', `${(note.pageThumbnails ?? []).length} páginas procesadas`);
}

async function generateTest(noteId) {
    console.log('\n── Generar test ──────────────────────────────────────────────');
    const r = await req('POST', `/notes/${noteId}/generate-test`, {
        questionCount: 5,
        topics: ['Constitución', 'Derechos fundamentales'],
    }, 'generateTest');
    if (!r || r.status !== 200) {
        ko('POST /notes/:id/generate-test', `status=${r?.status} body=${JSON.stringify(r?.json)}`);
        return;
    }
    const questions = r.json?.data?.questions ?? [];
    if (questions.length === 0) {
        ko('preguntas en respuesta', JSON.stringify(r.json));
        return;
    }
    ok('POST /notes/:id/generate-test', `${questions.length} preguntas`);
    console.log(`     Ejemplo: "${questions[0].text.slice(0, 70)}..."`);
}

async function listNotes() {
    console.log('\n── Lista ─────────────────────────────────────────────────────');
    const r = await req('GET', '/notes', null, 'listNotes');
    if (!r || r.status !== 200) {
        ko('GET /notes', `status=${r?.status}`);
        return;
    }
    const d = r.json?.data;
    ok('GET /notes', `totalNotes=${d?.stats?.totalNotes} totalQuestions=${d?.stats?.totalQuestions}`);
}

(async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Smoke test · Bloque 9 · Factoría de Apuntes');
    console.log('═══════════════════════════════════════════════════════════');

    if (!(await login())) {
        console.log('\n  Login falló — abortando.');
        process.exit(1);
    }

    const noteId = await uploadPdf();
    if (!noteId) {
        console.log('\n  Upload falló — abortando.');
        process.exit(1);
    }

    const status = await pollStatus(noteId);
    if (!status) {
        console.log('\n  Pipeline no completó — revisar logs del backend.');
        process.exit(1);
    }

    await getDetail(noteId);
    await generateTest(noteId);
    await listNotes();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  Resultado: ${passed} ✓  ${failed} ✗`);
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
})();
