// ─── Feature flags y URLs públicas de la app ─────────────────────────────────
// NOTA: no confundir con `src/api/config.js` (URL base del cliente HTTP).

// Suscripción Premium / afiliados: la compra es simulada y los planes/tarjeta
// son datos de ejemplo, así que SOLO se muestran en builds de QA
// (EXPO_PUBLIC_SHOW_SUBSCRIPTIONS=1 en los perfiles development/preview de
// eas.json, o en modo desarrollo). En el build de producción (tiendas) quedan
// ocultos: App Store (3.1.1 / 2.1) y Google Play (Payments / Deceptive
// Behavior) rechazan compras simuladas. Al integrar RevenueCat, poner el
// valor en true. Las pantallas y rutas siempre existen; solo se ocultan
// sus entradas.
export const SUBSCRIPTIONS_ENABLED =
    process.env.EXPO_PUBLIC_SHOW_SUBSCRIPTIONS === '1' || __DEV__;

// Páginas legales públicas servidas por el backend (presentation/legal). Son
// las URLs que hay que registrar también en App Store Connect (política de
// privacidad, Guideline 5.1.1) y en Google Play Console. Si en el futuro hay web
// corporativa, basta con cambiarlas aquí.
export const PRIVACY_POLICY_URL = 'https://api.opox.ai/legal/privacidad';
export const TERMS_URL = 'https://api.opox.ai/legal/terminos';

// Identificadores de tienda para el botón "Actualizar".
export const ANDROID_PACKAGE = 'com.opox.app';
// TODO(App Store): rellenar con el Apple ID numérico de la app (App Store
// Connect → App Information → Apple ID) en cuanto esté creada la ficha.
export const APP_STORE_ID = null;
