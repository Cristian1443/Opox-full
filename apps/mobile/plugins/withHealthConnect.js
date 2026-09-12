/**
 * Config plugin custom para Health Connect en Android 14+.
 *
 * Hace tres cosas que el plugin oficial de react-native-health-connect NO hace:
 *
 * 1. Bloque <queries> para visibilidad del paquete com.google.android.apps.healthdata
 *    (Android 11+ package visibility — sin esto HC no reconoce la app).
 * 2. <uses-permission> de salud como red de seguridad si healthConnectPermissions
 *    del plugin oficial no se propaga por algún motivo.
 * 3. CORRECCIÓN del intent-filter ACTION_SHOW_PERMISSIONS_RATIONALE:
 *    El plugin oficial (app.plugin.js) usa activity[0] sin comprobar si esa
 *    activity es MainActivity — en builds de Expo SDK 57, activity[0] suele ser
 *    la splash activity. Esta función busca iterativamente la activity con
 *    android:name .MainActivity y mueve el intent-filter ahí. Sin este fix
 *    Health Connect no puede verificar el rationale → la app es invisible en sus
 *    ajustes de permisos → requestPermission() devuelve siempre vacío.
 *
 * Ver: https://developer.android.com/health-connect/develop/get-started
 * y https://developer.android.com/training/basics/intents/package-visibility
 */

const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const RATIONALE_ACTION = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';

const HEALTH_PERMISSIONS = [
    'android.permission.health.READ_HEART_RATE',
    'android.permission.health.READ_RESTING_HEART_RATE',
    'android.permission.health.READ_HEART_RATE_VARIABILITY',
    'android.permission.health.READ_OXYGEN_SATURATION',
    'android.permission.health.READ_SLEEP',
    'android.permission.health.READ_STEPS',
];

function ensureQueriesForHealthConnect(manifest) {
    if (!Array.isArray(manifest.queries)) {
        manifest.queries = [];
    }
    const alreadyDeclared = manifest.queries.some((q) =>
        Array.isArray(q.package) &&
        q.package.some((p) => p.$?.['android:name'] === HEALTH_CONNECT_PACKAGE),
    );
    if (alreadyDeclared) return;

    manifest.queries.push({
        package: [{ $: { 'android:name': HEALTH_CONNECT_PACKAGE } }],
    });
}

function ensureUsesPermissions(manifest) {
    if (!Array.isArray(manifest['uses-permission'])) {
        manifest['uses-permission'] = [];
    }
    for (const perm of HEALTH_PERMISSIONS) {
        const already = manifest['uses-permission'].some(
            (u) => u.$?.['android:name'] === perm,
        );
        if (!already) {
            manifest['uses-permission'].push({ $: { 'android:name': perm } });
        }
    }
}

/**
 * Asegura que el intent-filter ACTION_SHOW_PERMISSIONS_RATIONALE esté en
 * la Activity correcta (aquella cuyo android:name termina en .MainActivity),
 * NO en activity[0] como hace el plugin oficial incondicionalmente.
 *
 * Si el official plugin ya lo puso en la activity equivocada, lo elimina de
 * ahí y lo (re)crea en MainActivity.
 */
function fixRationaleIntentFilter(manifest) {
    const activities = manifest.application?.[0]?.activity ?? [];

    // Buscar MainActivity por nombre — no por índice
    const mainIdx = activities.findIndex((a) => {
        const name = a.$?.['android:name'] ?? '';
        return (
            name === '.MainActivity' ||
            name === 'MainActivity' ||
            name.endsWith('.MainActivity')
        );
    });

    if (mainIdx === -1) {
        // Manifest aún no tiene activities (ocurre en algunos prebuild parciales)
        return;
    }

    const mainActivity = activities[mainIdx];

    // Comprobar si MainActivity ya tiene el intent-filter correcto
    const existingFilters = mainActivity['intent-filter'] ?? [];
    const alreadyOnMain = existingFilters.some(
        (f) =>
            Array.isArray(f.action) &&
            f.action.some((a) => a.$?.['android:name'] === RATIONALE_ACTION),
    );

    if (alreadyOnMain) return;

    // El plugin oficial lo añadió a activity[0] — si es una activity diferente,
    // quitarlo de allí para evitar que quede en la splash activity.
    if (mainIdx !== 0) {
        const firstActivity = activities[0];
        if (Array.isArray(firstActivity['intent-filter'])) {
            firstActivity['intent-filter'] = firstActivity['intent-filter'].filter(
                (f) =>
                    !(
                        Array.isArray(f.action) &&
                        f.action.some((a) => a.$?.['android:name'] === RATIONALE_ACTION)
                    ),
            );
        }
    }

    // Añadir el intent-filter a MainActivity
    if (!Array.isArray(mainActivity['intent-filter'])) {
        mainActivity['intent-filter'] = [];
    }
    mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': RATIONALE_ACTION } }],
    });
}

const withHealthConnect = (config) => {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        ensureQueriesForHealthConnect(manifest);
        ensureUsesPermissions(manifest);
        fixRationaleIntentFilter(manifest);
        return config;
    });
};

module.exports = withHealthConnect;
