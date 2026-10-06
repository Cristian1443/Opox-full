import { Platform } from 'react-native';

// ─── Feature flags y URLs públicas de la app ─────────────────────────────────
// NOTA: no confundir con `src/api/config.js` (URL base del cliente HTTP).

// Suscripción Premium / afiliados: ocultos en iOS hasta que exista compra
// in-app real con RevenueCat/StoreKit. Vender contenido digital fuera de IAP
// o mostrar precios/compras simuladas provoca rechazo en App Store Review
// (Guidelines 3.1.1 — In-App Purchase y 2.1 — App Completeness).
// Las pantallas y rutas siguen existiendo; solo se ocultan sus entradas.
export const SUBSCRIPTIONS_ENABLED = Platform.OS !== 'ios';

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
