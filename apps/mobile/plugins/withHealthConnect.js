/**
 * Config plugin custom para Health Connect en Android 14+.
 *
 * El plugin oficial de `react-native-health-connect` (app.plugin.js) SOLO
 * añade el `intent-filter` de `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`
 * — y lo hace incondicionalmente, sin comprobar si ya existe. Este plugin
 * custom se limita a lo que el oficial NO hace: el bloque `<queries>` que
 * declara la visibilidad del paquete `com.google.android.apps.healthdata`
 * (Android 11+ package visibility, sin esto Health Connect no reconoce la
 * app) y los `<uses-permission>` de salud como red de seguridad si
 * `healthConnectPermissions` no se propaga por algún motivo.
 *
 * NO se toca aquí el intent-filter de la rationale — el plugin oficial ya
 * lo añade siempre; duplicarlo (aunque con des-duplicación propia) termina
 * generando dos <intent-filter> idénticos en el manifest final porque el
 * oficial nunca comprueba si el nuestro ya lo puso.
 *
 * Ver: https://developer.android.com/health-connect/develop/get-started#declare-permissions
 * y https://developer.android.com/training/basics/intents/package-visibility
 */

const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

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

const withHealthConnect = (config) => {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        ensureQueriesForHealthConnect(manifest);
        ensureUsesPermissions(manifest);
        return config;
    });
};

module.exports = withHealthConnect;
