import { Platform } from 'react-native';

// ─── Feature flags y URLs públicas de la app ─────────────────────────────────
// NOTA: no confundir con `src/api/config.js` (URL base del cliente HTTP).

// Suscripción Premium / afiliados: ocultos en iOS hasta que exista compra
// in-app real con RevenueCat/StoreKit. Vender contenido digital fuera de IAP
// o mostrar precios/compras simuladas provoca rechazo en App Store Review
// (Guidelines 3.1.1 — In-App Purchase y 2.1 — App Completeness).
// Las pantallas y rutas siguen existiendo; solo se ocultan sus entradas.
export const SUBSCRIPTIONS_ENABLED = Platform.OS !== 'ios';

// TODO(App Store): estas URLs DEBEN existir y estar publicadas antes de enviar
// la app a revisión (Guideline 5.1.1 exige política de privacidad accesible
// dentro de la app y en App Store Connect). No se encontró ninguna URL real en
// el repo — se usan estas como placeholder.
export const PRIVACY_POLICY_URL = 'https://opox.ai/privacidad';
export const TERMS_URL = 'https://opox.ai/terminos';

// Identificadores de tienda para el botón "Actualizar".
export const ANDROID_PACKAGE = 'com.opox.app';
// TODO(App Store): rellenar con el Apple ID numérico de la app (App Store
// Connect → App Information → Apple ID) en cuanto esté creada la ficha.
export const APP_STORE_ID = null;
