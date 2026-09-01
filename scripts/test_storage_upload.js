/**
 * Diagnóstico de Supabase Storage — Bloque 9
 * Sube el PDF de prueba directamente al bucket 'notes' sin pasar por el backend.
 * Uso: node scripts/test_storage_upload.js
 * (requiere que .env del backend esté cargado o las vars en el entorno)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../apps/backend/.env') });

const fs = require('fs');
const path = require('path');

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PDF_PATH          = path.join(__dirname, '..', 'Guia_Pruebas_Bloques_0_6_7.pdf');
const TEST_PATH         = `test-diag/test-upload-${Date.now()}.pdf`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en apps/backend/.env');
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
    console.log('\n── Supabase Storage diagnostic ─────────────────────────');
    console.log(`URL:    ${SUPABASE_URL}`);
    console.log(`Bucket: notes`);
    console.log(`Path:   ${TEST_PATH}`);

    const bytes = fs.readFileSync(PDF_PATH);
    console.log(`File:   ${PDF_PATH} (${Math.round(bytes.length/1024)} KB)`);

    // Intentar con Uint8Array (más compatible con node fetch)
    const uint8 = new Uint8Array(bytes);

    console.log('\nSubiendo con Uint8Array...');
    const { data, error } = await db.storage
        .from('notes')
        .upload(TEST_PATH, uint8, {
            contentType: 'application/pdf',
            upsert: true,
        });

    if (error) {
        console.error('\n✗ Upload falló:');
        console.error('  message:', error.message);
        console.error('  statusCode:', error.statusCode);
        console.error('  error:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    console.log('\n✓ Upload exitoso!');
    console.log('  path:', data?.path);
    console.log('  fullPath:', data?.fullPath);

    // Limpiar el archivo de prueba
    await db.storage.from('notes').remove([TEST_PATH]);
    console.log('  (archivo de prueba eliminado)');
})();
