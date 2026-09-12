const { withMainActivity, withAndroidManifest, CodeGenerator } = require('@expo/config-plugins');

const HEALTHDATA_PACKAGE = 'com.google.android.apps.healthdata';

// Tags únicos por inyección — CodeGenerator los usa para idempotencia:
// si el prebuild corre de nuevo, reemplaza el bloque en lugar de duplicarlo.
const TAG_IMPORT = 'opox-health-connect-permission-delegate-import';
const TAG_RATIONALE = 'opox-health-connect-rationale-redirect';
const TAG_ONCREATE = 'opox-health-connect-permission-delegate-oncreate';

// react-native-health-connect (dev.matinzd) exige registrar su
// ActivityResultLauncher ANTES de que la Activity llegue a STARTED
// (contrato de androidx.activity.result.ActivityResultRegistry). El config
// plugin oficial SOLO toca AndroidManifest — nunca inyecta esta llamada en
// MainActivity — así que HealthConnectPermissionDelegate.requestPermission
// (lateinit var) nunca se inicializa. Al llamar requestPermission() desde JS
// la lateinit var lanza kotlin.UninitializedPropertyAccessException sin
// capturar → el proceso Android muere (no hay promise rejection en JS).
// Ver: react-native-health-connect README sección "React Native CLI".
//
// Además, cuando Health Connect lanza el intent ACTION_SHOW_PERMISSIONS_RATIONALE
// (para que la app muestre su política de privacidad), MainActivity lo recibe
// pero React Navigation no sabe qué hacer con él. Esta inyección convierte ese
// intent en el deep-link opox://health-rationale ANTES de que super.onCreate()
// lo procese, de modo que React Navigation navega a HealthConnectRationaleScreen.
// Sin esta conversión HC marca la app como inválida y es invisible en sus ajustes.
function withHealthConnectPermissionDelegate(config) {
    config = withMainActivity(config, (config) => {
        const isKotlin = config.modResults.language === 'kt';
        let contents = config.modResults.contents;

        // ── Inyección 1: import del delegate ─────────────────────────────────
        // Ancla al bloque de imports existente (primera línea que empiece por
        // "import "). offset: 0 inserta ANTES de esa línea.
        const importLine = isKotlin
            ? 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate'
            : 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate;';

        contents = CodeGenerator.mergeContents({
            src: contents,
            newSrc: importLine,
            tag: TAG_IMPORT,
            anchor: /^import /m,
            offset: 0,
            comment: '//',
        }).contents;

        // ── Inyección 2: redirect de rationale ANTES de super.onCreate() ─────
        // offset: 0 coloca el bloque justo encima de la línea super.onCreate(...).
        // Mutamos el intent para que React Native lo procese como deep-link
        // opox://health-rationale cuando HC lanza la pantalla de privacidad.
        // Se usan nombres completamente cualificados (android.net.Uri, etc.) para
        // no depender de imports adicionales en MainActivity.
        const rationaleBlock = isKotlin
            ? [
                '    // HC rationale: convertir el intent a deep-link antes de que RN lo lea',
                '    if (intent?.action == "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE") {',
                '      intent.setData(android.net.Uri.parse("opox://health-rationale"))',
                '      intent.setAction(android.content.Intent.ACTION_VIEW)',
                '    }',
              ].join('\n')
            : [
                '    // HC rationale: convertir el intent a deep-link antes de que RN lo lea',
                '    if ("androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE".equals(intent != null ? intent.getAction() : null)) {',
                '      intent.setData(android.net.Uri.parse("opox://health-rationale"));',
                '      intent.setAction(android.content.Intent.ACTION_VIEW);',
                '    }',
              ].join('\n');

        contents = CodeGenerator.mergeContents({
            src: contents,
            newSrc: rationaleBlock,
            tag: TAG_RATIONALE,
            anchor: /super\.onCreate\s*\([^)]*\)/,
            offset: 0,
            comment: '//',
        }).contents;

        // ── Inyección 3: delegate después de super.onCreate() ─────────────────
        // offset: 1 coloca la línea justo debajo de super.onCreate(...).
        // Esto satisface el contrato de ActivityResultRegistry: el launcher debe
        // quedar registrado antes de que la Activity alcance STARTED.
        const callLine = isKotlin
            ? '    HealthConnectPermissionDelegate.setPermissionDelegate(this)'
            : '    HealthConnectPermissionDelegate.setPermissionDelegate(this);';

        contents = CodeGenerator.mergeContents({
            src: contents,
            newSrc: callLine,
            tag: TAG_ONCREATE,
            anchor: /super\.onCreate\s*\([^)]*\)/,
            offset: 1,
            comment: '//',
        }).contents;

        config.modResults.contents = contents;
        return config;
    });

    // Defensivo: visibilidad de paquete en Android 11+ para que PackageManager
    // pueda encontrar la app de Health Connect al consultar si está instalada.
    // withHealthConnect.js ya lo añade; este bloque garantiza que si ese plugin
    // falla por cualquier razón, el paquete queda declarado de todas formas.
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;

        if (!Array.isArray(manifest.queries)) {
            manifest.queries = [];
        }
        // Reusar el primer elemento <queries> existente o crear uno nuevo
        let queriesEntry = manifest.queries.find(
            (q) =>
                Array.isArray(q.package) &&
                q.package.some((p) => p.$?.['android:name'] === HEALTHDATA_PACKAGE),
        );
        if (!queriesEntry) {
            queriesEntry = manifest.queries[0];
            if (!queriesEntry) {
                queriesEntry = {};
                manifest.queries.push(queriesEntry);
            }
            queriesEntry.package = queriesEntry.package ?? [];
            queriesEntry.package.push({ $: { 'android:name': HEALTHDATA_PACKAGE } });
        }

        return config;
    });

    return config;
}

module.exports = withHealthConnectPermissionDelegate;
