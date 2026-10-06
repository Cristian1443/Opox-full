// ─── Feature flags y URLs públicas de la app ─────────────────────────────────
// NOTA: no confundir con `src/api/config.js` (URL base del cliente HTTP).

// Suscripción Premium / afiliados: ocultos en TODAS las plataformas hasta que
// exista compra in-app real con RevenueCat (StoreKit / Google Play Billing).
// Hoy la compra es simulada y los planes/tarjeta son datos de ejemplo; tanto
// App Store (Guidelines 3.1.1 y 2.1) como Google Play (Payments / Deceptive
// Behavior) lo rechazan. Las pantallas y rutas siguen existiendo; solo se
// ocultan sus entradas. Al integrar RevenueCat: poner a true (o volver a
// `Platform.OS !== 'ios'` si solo Android estuviera listo).
export const SUBSCRIPTIONS_ENABLED = false;

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
