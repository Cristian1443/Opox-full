const { withMainActivity, withAndroidManifest, CodeGenerator } = require('@expo/config-plugins');

const HEALTHDATA_PACKAGE = 'com.google.android.apps.healthdata';
const TAG_IMPORT = 'opox-health-connect-permission-delegate-import';
const TAG_ONCREATE = 'opox-health-connect-permission-delegate-oncreate';

// react-native-health-connect (dev.matinzd) exige registrar su
// ActivityResultLauncher ANTES de que la Activity llegue a STARTED
// (contrato de androidx.activity.result.ActivityResultRegistry). El config
// plugin que trae la propia librería (app.plugin.js) SOLO toca el
// AndroidManifest — nunca inyecta esta llamada en MainActivity — así que
// `HealthConnectPermissionDelegate.requestPermission` (lateinit var) nunca
// se inicializa. Al llamar requestPermission() desde JS, el módulo nativo
// accede a esa lateinit var dentro de una coroutine sin try/catch →
// kotlin.UninitializedPropertyAccessException sin capturar → el proceso
// Android muere (no es un error JS, no hay promise rejection que capturar).
// Ver: node_modules/react-native-health-connect/README.md (sección
// "React Native CLI") y HealthConnectPermissionDelegate.kt.
function withHealthConnectPermissionDelegate(config) {
    config = withMainActivity(config, (config) => {
        const isKotlin = config.modResults.language === 'kt';
        let contents = config.modResults.contents;

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

        const callLine = isKotlin
            ? '    HealthConnectPermissionDelegate.setPermissionDelegate(this)'
            : '    HealthConnectPermissionDelegate.setPermissionDelegate(this);';

        contents = CodeGenerator.mergeContents({
            src: contents,
            newSrc: callLine,
            tag: TAG_ONCREATE,
            anchor: /super\.onCreate\([^)]*\)/,
            offset: 1,
            comment: '//',
        }).contents;

        config.modResults.contents = contents;
        return config;
    });

    // Defensivo: visibilidad de paquete en Android 11+ para que
    // PackageManager pueda encontrar la app de Health Connect al
    // consultar si está instalada.
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        const existing = Array.isArray(manifest.queries) ? manifest.queries[0] : manifest.queries;
        const queries = existing ?? {};
        queries.package = queries.package ?? [];

        const alreadyDeclared = queries.package.some(
            (pkg) => pkg?.$?.['android:name'] === HEALTHDATA_PACKAGE,
        );
        if (!alreadyDeclared) {
            queries.package.push({ $: { 'android:name': HEALTHDATA_PACKAGE } });
        }
        manifest.queries = [queries];
        return config;
    });

    return config;
}

module.exports = withHealthConnectPermissionDelegate;
