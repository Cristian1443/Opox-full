import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { StoreController } from '../controllers/StoreController';
import { validateBody } from '../middleware/validate';
import { publishCommunityTestBody } from '../validators/storeValidators';

export function createStoreRouter(
    controller: StoreController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const S = API_ROUTES.STORE;

    // Saldo de Opopoints
    r.get(S.BALANCE, authMiddleware, controller.getBalance);

    // Catálogo de recompensas reales
    r.get(S.PRODUCTS, authMiddleware, controller.listProducts);
    r.get(S.PRODUCT, authMiddleware, controller.getProduct);
    r.post(S.REDEEM, authMiddleware, controller.redeemProduct);

    // Catálogo de descuentos virtuales
    r.get(S.DISCOUNTS, authMiddleware, controller.listDiscounts);
    r.post(S.DISCOUNT_REDEEM, authMiddleware, controller.redeemDiscount);

    // Cartera del usuario
    r.get(S.WALLET, authMiddleware, controller.getWallet);
    r.get(S.WALLET_ITEM, authMiddleware, controller.getWalletItem);

    // Marketplace de tests de la comunidad
    r.get(S.COMMUNITY_TESTS, authMiddleware, controller.listCommunityTests);
    r.post(S.COMMUNITY_TESTS, authMiddleware, validateBody(publishCommunityTestBody), controller.publishCommunityTest);
    r.get(S.COMMUNITY_TEST, authMiddleware, controller.getCommunityTest);
    r.post(S.COMMUNITY_TEST_PURCHASE, authMiddleware, controller.obtainCommunityTest);

    return r;
}
