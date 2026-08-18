import type { IStoreRepository } from '../../domain';
import {
    StoreProductNotFoundError,
    StoreProductOutOfStockError,
    StoreInsufficientBalanceError,
    WalletItemNotFoundError,
    CommunityTestNotFoundError,
    StoreAlreadyPurchasedError,
} from '../../domain';
import type {
    StoreBalanceDTO,
    StoreProductDTO,
    StoreDiscountDTO,
    WalletItemDTO,
    PurchaseResultDTO,
    CommunityTestDTO,
    CommunityTestDetailDTO,
    CommunityTestActionResultDTO,
} from '@opox/types';

// Generador de códigos único para recompensas canjeadas
const generateCode = (partner: string): string => {
    const prefix = partner
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
        .substring(0, 3);
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${suffix}`;
};

// ─── Saldo ───────────────────────────────────────────────────────────────────

export class GetStoreBalanceUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(userId: string): Promise<StoreBalanceDTO> {
        const balance = await this.repo.getBalance(userId);
        return { balance };
    }
}

// ─── Catálogo de recompensas reales ──────────────────────────────────────────

export class ListStoreProductsUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(category?: string): Promise<StoreProductDTO[]> {
        const products = await this.repo.listProducts(category);
        return products.map((p) => ({
            id: p.id,
            partner: p.partner,
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            cost: p.cost,
            stock: p.stock,
            icon: p.icon,
            color: p.color,
            category: p.category,
            tag: p.tag,
            isAvailable: p.isAvailable && p.stock > 0,
            conditions: p.conditions,
            expiry: p.expiry,
        }));
    }
}

export class GetStoreProductUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(id: string): Promise<StoreProductDTO> {
        const p = await this.repo.getProduct(id);
        if (!p) throw new StoreProductNotFoundError();
        return {
            id: p.id,
            partner: p.partner,
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            cost: p.cost,
            stock: p.stock,
            icon: p.icon,
            color: p.color,
            category: p.category,
            tag: p.tag,
            isAvailable: p.isAvailable && p.stock > 0,
            conditions: p.conditions,
            expiry: p.expiry,
        };
    }
}

export class RedeemProductUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(userId: string, productId: string): Promise<PurchaseResultDTO> {
        const product = await this.repo.getProduct(productId);
        if (!product) throw new StoreProductNotFoundError();
        if (!product.isAvailable || product.stock <= 0) throw new StoreProductOutOfStockError();

        const balance = await this.repo.getBalance(userId);
        if (balance < product.cost) throw new StoreInsufficientBalanceError();

        // Deduce puntos del ledger
        await this.repo.addLedgerEntry({
            userId,
            type: 'spend',
            amount: product.cost,
            reason: `Canje: ${product.partner} · ${product.title}`,
            refId: productId,
        });

        // Descontar stock
        await this.repo.decrementStock(productId);

        // Generar código y crear item en cartera
        const code = generateCode(product.partner);
        const expiryDays = 30; // default; could be parsed from product.expiry later
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        const expiryStr = expiryDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        const walletItem = await this.repo.createWalletItem({
            userId,
            productId,
            partner: product.partner,
            title: product.title,
            code,
            status: 'active',
            expiryDate: expiryStr,
            usedDate: null,
            color: product.color,
            icon: product.icon,
            actionUrl: null,
        });

        const newBalance = balance - product.cost;
        return { walletItemId: walletItem.id, code, newBalance };
    }
}

// ─── Catálogo de descuentos virtuales ────────────────────────────────────────

export class ListStoreDiscountsUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(category?: string): Promise<StoreDiscountDTO[]> {
        const discounts = await this.repo.listDiscounts(category);
        return discounts.map((d) => ({
            id: d.id,
            partner: d.partner,
            title: d.title,
            subtitle: d.subtitle,
            discount: d.discount,
            originalPrice: d.originalPrice,
            category: d.category,
            color: d.color,
            icon: d.icon,
            isNew: d.isNew,
            expiryDate: d.expiryDate,
            conditions: d.conditions,
            deepLink: d.deepLink,
        }));
    }
}

// ─── Cartera del usuario ──────────────────────────────────────────────────────

export class GetWalletUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(userId: string): Promise<WalletItemDTO[]> {
        const items = await this.repo.listWalletItems(userId);
        return items.map(toWalletItemDTO);
    }
}

export class GetWalletItemUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(id: string, userId: string): Promise<WalletItemDTO> {
        const item = await this.repo.getWalletItem(id, userId);
        if (!item) throw new WalletItemNotFoundError();
        return toWalletItemDTO(item);
    }
}

function toWalletItemDTO(item: import('../../domain').WalletItem): WalletItemDTO {
    return {
        id: item.id,
        partner: item.partner,
        title: item.title,
        code: item.code,
        status: item.status,
        expiryDate: item.expiryDate,
        usedDate: item.usedDate,
        color: item.color,
        icon: item.icon,
        actionUrl: item.actionUrl,
    };
}

// ─── Marketplace de la comunidad ─────────────────────────────────────────────

export class ListCommunityTestsUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(filters: { category?: string; isFree?: boolean }): Promise<CommunityTestDTO[]> {
        const tests = await this.repo.listCommunityTests(filters);
        return tests.map(toCommunityTestDTO);
    }
}

export class GetCommunityTestUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(id: string): Promise<CommunityTestDetailDTO> {
        const test = await this.repo.getCommunityTest(id);
        if (!test) throw new CommunityTestNotFoundError();
        return {
            ...toCommunityTestDTO(test),
            description: test.description,
            tags: test.tags,
        };
    }
}

export class PublishCommunityTestUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(input: {
        authorId: string;
        authorUsername: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
        price: number;
        questionCount: number;
    }): Promise<CommunityTestActionResultDTO> {
        const test = await this.repo.publishCommunityTest({
            ...input,
            isFree: input.price === 0,
            isPublished: true,
        });
        return { id: test.id, newBalance: 0 };
    }
}

export class ObtainCommunityTestUseCase {
    constructor(private readonly repo: IStoreRepository) {}

    async execute(userId: string, testId: string): Promise<CommunityTestActionResultDTO> {
        const test = await this.repo.getCommunityTest(testId);
        if (!test) throw new CommunityTestNotFoundError();

        const alreadyOwned = await this.repo.hasPurchasedTest(userId, testId);
        if (alreadyOwned) throw new StoreAlreadyPurchasedError();

        if (!test.isFree) {
            const balance = await this.repo.getBalance(userId);
            if (balance < test.price) throw new StoreInsufficientBalanceError();
            await this.repo.addLedgerEntry({
                userId,
                type: 'spend',
                amount: test.price,
                reason: `Test comunidad: ${test.title}`,
                refId: testId,
            });
        }

        await this.repo.recordTestPurchase(userId, testId);
        await this.repo.incrementTestTotalMade(testId);

        const newBalance = test.isFree ? await this.repo.getBalance(userId) : (await this.repo.getBalance(userId));
        return { id: testId, newBalance };
    }
}

function toCommunityTestDTO(test: import('../../domain').CommunityTest): CommunityTestDTO {
    return {
        id: test.id,
        title: test.title,
        author: test.authorUsername,
        avatar: test.authorUsername.substring(0, 1).toUpperCase(),
        rating: test.rating,
        totalMade: test.totalMade,
        price: test.price,
        isFree: test.isFree,
        category: test.category,
        questionCount: test.questionCount,
        createdAt: test.createdAt.toISOString(),
    };
}
