/**
 * Config plugin custom para Health Connect en Android 14+.
 *
 * El plugin oficial de `react-native-health-connect` solo añade el
 * `intent-filter` de `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`.
 * Pero eso NO es suficiente para que la app aparezca en el listado de
 * Health Connect: se necesita también un bloque `<queries>` en el manifest
 * que declara la visibilidad del paquete `com.google.android.apps.healthdata`
 * (Android 11+ package visibility). Sin `<queries>`, Health Connect esconde
 * la app aunque tenga los permisos declarados.
 *
 * Ver: https://developer.android.com/health-connect/develop/get-started#declare-permissions
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
    // Buscamos si ya existe un <queries> que declare Health Connect.
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

function ensureRationaleIntentFilter(manifest) {
    const activity = manifest.application?.[0]?.activity?.[0];
    if (!activity) return;
    if (!Array.isArray(activity['intent-filter'])) {
        activity['intent-filter'] = [];
    }

    // Ya existe? (el plugin de react-native-health-connect puede haberlo puesto)
    const already = activity['intent-filter'].some((f) =>
        Array.isArray(f.action) &&
        f.action.some((a) => a.$?.['android:name'] === RATIONALE_ACTION),
    );
    if (already) return;

    activity['intent-filter'].push({
        action: [{ $: { 'android:name': RATIONALE_ACTION } }],
    });
}

const withHealthConnect = (config) => {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        ensureQueriesForHealthConnect(manifest);
        ensureUsesPermissions(manifest);
        ensureRationaleIntentFilter(manifest);
        return config;
    });
};

module.exports = withHealthConnect;
