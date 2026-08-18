import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Cliente HTTP del Bloque 11 · Tienda OPOX.
// Todas las respuestas siguen el patrón { data, error } del api client.

const S = API_ROUTES.STORE;

export const storeApi = {
    // ── Saldo de Opopoints ────────────────────────────────────────────────────
    getBalance: () => api.get(S.BALANCE, { auth: true }),

    // ── Catálogo de recompensas reales ────────────────────────────────────────
    listProducts: (category) => {
        const url = category && category !== 'all'
            ? `${S.PRODUCTS}?category=${encodeURIComponent(category)}`
            : S.PRODUCTS;
        return api.get(url, { auth: true });
    },

    getProduct: (id) => api.get(S.PRODUCT.replace(':id', id), { auth: true }),

    redeemProduct: (id) => api.post(S.REDEEM.replace(':id', id), {}, { auth: true }),

    // ── Catálogo de descuentos virtuales ──────────────────────────────────────
    listDiscounts: (category) => {
        const url = category && category !== 'all'
            ? `${S.DISCOUNTS}?category=${encodeURIComponent(category)}`
            : S.DISCOUNTS;
        return api.get(url, { auth: true });
    },

    // ── Cartera del usuario ───────────────────────────────────────────────────
    getWallet: () => api.get(S.WALLET, { auth: true }),

    getWalletItem: (id) => api.get(S.WALLET_ITEM.replace(':id', id), { auth: true }),

    // ── Marketplace de la comunidad ───────────────────────────────────────────
    listCommunityTests: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.category && filters.category !== 'all') params.set('category', filters.category);
        if (typeof filters.isFree === 'boolean') params.set('isFree', String(filters.isFree));
        const qs = params.toString();
        return api.get(qs ? `${S.COMMUNITY_TESTS}?${qs}` : S.COMMUNITY_TESTS, { auth: true });
    },

    getCommunityTest: (id) => api.get(S.COMMUNITY_TEST.replace(':id', id), { auth: true }),

    publishCommunityTest: (body) => api.post(S.COMMUNITY_TESTS, body, { auth: true }),

    obtainCommunityTest: (id) =>
        api.post(S.COMMUNITY_TEST_PURCHASE.replace(':id', id), {}, { auth: true }),
};
