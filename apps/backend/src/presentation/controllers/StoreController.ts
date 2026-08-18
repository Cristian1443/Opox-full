import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse } from '@opox/types';
import type {
    GetStoreBalanceUseCase,
    ListStoreProductsUseCase,
    GetStoreProductUseCase,
    RedeemProductUseCase,
    ListStoreDiscountsUseCase,
    GetWalletUseCase,
    GetWalletItemUseCase,
    ListCommunityTestsUseCase,
    GetCommunityTestUseCase,
    PublishCommunityTestUseCase,
    ObtainCommunityTestUseCase,
} from '../../application';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

export class StoreController {
    constructor(
        private readonly deps: {
            getBalance: GetStoreBalanceUseCase;
            listProducts: ListStoreProductsUseCase;
            getProduct: GetStoreProductUseCase;
            redeemProduct: RedeemProductUseCase;
            listDiscounts: ListStoreDiscountsUseCase;
            getWallet: GetWalletUseCase;
            getWalletItem: GetWalletItemUseCase;
            listCommunityTests: ListCommunityTestsUseCase;
            getCommunityTest: GetCommunityTestUseCase;
            publishCommunityTest: PublishCommunityTestUseCase;
            obtainCommunityTest: ObtainCommunityTestUseCase;
        },
    ) {}

    // GET /store/balance
    getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getBalance.execute(req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/products
    listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const category = req.query['category'] as string | undefined;
            const result = await this.deps.listProducts.execute(category);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/products/:id
    getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getProduct.execute(req.params['id'] as string);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // POST /store/products/:id/redeem
    redeemProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.redeemProduct.execute(
                req.authUser!.id,
                req.params['id'] as string,
            );
            ok(res, 201, result);
        } catch (e) { next(e); }
    };

    // GET /store/discounts
    listDiscounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const category = req.query['category'] as string | undefined;
            const result = await this.deps.listDiscounts.execute(category);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/wallet
    getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getWallet.execute(req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/wallet/:id
    getWalletItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getWalletItem.execute(
                req.params['id'] as string,
                req.authUser!.id,
            );
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/community-tests
    listCommunityTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const category = req.query['category'] as string | undefined;
            const isFreeRaw = req.query['isFree'] as string | undefined;
            const isFree = isFreeRaw === 'true' ? true : isFreeRaw === 'false' ? false : undefined;
            const result = await this.deps.listCommunityTests.execute({ category, isFree });
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /store/community-tests/:id
    getCommunityTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getCommunityTest.execute(req.params['id'] as string);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // POST /store/community-tests
    publishCommunityTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, description, category, tags, price, questionCount } = req.body;
            const result = await this.deps.publishCommunityTest.execute({
                authorId: req.authUser!.id,
                authorUsername: req.authUser!.email.split('@')[0] ?? req.authUser!.email,
                title,
                description: description ?? '',
                category: category ?? 'General',
                tags: tags ?? [],
                price: price ?? 0,
                questionCount: questionCount ?? 0,
            });
            ok(res, 201, result);
        } catch (e) { next(e); }
    };

    // POST /store/community-tests/:id/purchase
    obtainCommunityTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.obtainCommunityTest.execute(
                req.authUser!.id,
                req.params['id'] as string,
            );
            ok(res, 200, result);
        } catch (e) { next(e); }
    };
}
