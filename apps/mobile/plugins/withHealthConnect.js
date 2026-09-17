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
 *    activity es MainActivity; además, la fase async de ese plugin corre DESPUÉS
 *    de la fase async de este plugin (Expo aplica los mods en orden LIFO dentro de
 *    cada fase). La deduplicación se hace por tanto con withDangerousMod, que corre
 *    en una fase completamente posterior a todos los withAndroidManifest (sync y async).
 *    withDangerousMod modifica directamente el AndroidManifest.xml ya generado,
 *    garantizando que sin importar cuántas veces lo añadan los plugins previos,
 *    el fichero final siempre contendrá exactamente UNA copia del filtro en MainActivity.
 *
 * Ver: https://developer.android.com/health-connect/develop/get-started
 * y https://developer.android.com/training/basics/intents/package-visibility
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const RATIONALE_ACTION = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';
const VIEW_PERMISSION_USAGE_ACTION = 'android.intent.action.VIEW_PERMISSION_USAGE';
const HEALTH_PERMISSIONS_CATEGORY = 'android.intent.category.HEALTH_PERMISSIONS';

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
 * Android 14+ exige que la app declare un <activity-alias> que responda a
 * VIEW_PERMISSION_USAGE + categoría HEALTH_PERMISSIONS. Sin él, Health Connect
 * considera la app inválida y requestPermission() devuelve un array vacío sin
 * abrir ningún diálogo (se queda "concediendo permisos" y termina en denegado).
 * Ver: https://developer.android.com/health-and-fitness/guides/health-connect/develop/get-started#restrict-data-access
 */
function ensureViewPermissionUsageAlias(manifest) {
    const application = manifest.application?.[0];
    if (!application) return;

    if (!Array.isArray(application['activity-alias'])) {
        application['activity-alias'] = [];
    }

    const already = application['activity-alias'].some(
        (a) => a.$?.['android:name'] === '.ViewPermissionUsageActivity',
    );
    if (already) return;

    application['activity-alias'].push({
        $: {
            'android:name': '.ViewPermissionUsageActivity',
            'android:exported': 'true',
            'android:targetActivity': '.MainActivity',
            'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [
            {
                action: [{ $: { 'android:name': VIEW_PERMISSION_USAGE_ACTION } }],
                category: [{ $: { 'android:name': HEALTH_PERMISSIONS_CATEGORY } }],
            },
        ],
    });
}

/**
 * Post-procesa el AndroidManifest.xml ya escrito en disco para garantizar
 * exactamente UNA copia de ACTION_SHOW_PERMISSIONS_RATIONALE en MainActivity.
 *
 * Usa withDangerousMod (no withAndroidManifest) porque la fase "dangerous" corre
 * DESPUÉS de que todos los withAndroidManifest (sync y async) han terminado.
 * Esto evita el problema de orden entre plugins: no importa cuántas veces los
 * plugins oficiales de react-native-health-connect añadan el filtro — este paso
 * los deduplica todos antes de que Gradle lo compile.
 */
function withRationaleDedup(config) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const manifestPath = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'src',
                'main',
                'AndroidManifest.xml',
            );

            if (!fs.existsSync(manifestPath)) return config;

            let xml = fs.readFileSync(manifestPath, 'utf-8');

            // Cuenta cuántas veces aparece el filtro de rationale
            const rationalePattern =
                /<intent-filter>\s*<action android:name="androidx\.health\.ACTION_SHOW_PERMISSIONS_RATIONALE"\/>\s*<\/intent-filter>/g;

            const matches = xml.match(rationalePattern);
            if (!matches || matches.length <= 1) return config; // 0 o 1 — nada que hacer

            // Elimina TODAS las copias, luego reinserta UNA sola
            xml = xml.replace(rationalePattern, '');

            // Buscar la etiqueta de cierre de MainActivity para insertar el filtro justo antes
            // Buscamos el <activity android:name=".MainActivity"...>...</activity> y añadimos
            // el intent-filter antes del </activity> de esa activity.
            // Estrategia: reemplazar el primer bloque </activity> que venga después de ".MainActivity"
            xml = xml.replace(
                /(android:name="\.MainActivity"[\s\S]*?)([ \t]*<\/activity>)/,
                (_, before, closingTag) =>
                    `${before}      <intent-filter>\n        <action android:name="${RATIONALE_ACTION}"/>\n      </intent-filter>\n${closingTag}`,
            );

            fs.writeFileSync(manifestPath, xml, 'utf-8');
            return config;
        },
    ]);
}

const withHealthConnect = (config) => {
    // Paso 1: añadir <queries> y <uses-permission> vía withAndroidManifest (sync)
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        ensureQueriesForHealthConnect(manifest);
        ensureUsesPermissions(manifest);
        ensureViewPermissionUsageAlias(manifest);
        return config;
    });

    // Paso 2: deduplicar el intent-filter de rationale en una fase posterior
    // (withDangerousMod) para garantizar exactamente 1 copia en MainActivity,
    // independientemente del orden en que los plugins async previos lo hayan añadido.
    config = withRationaleDedup(config);

    return config;
};

module.exports = withHealthConnect;
