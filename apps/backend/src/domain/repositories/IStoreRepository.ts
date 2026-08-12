import type {
    StoreProduct,
    StoreDiscount,
    WalletItem,
    OpoLedgerEntry,
    CommunityTest,
} from '../entities';

/**
 * Contrato del repositorio de la Tienda OPOX (Bloque 11).
 * Implementado por SupabaseStoreRepository en infrastructure/.
 */
export interface IStoreRepository {
    // ── Saldo de Opopoints ──────────────────────────────────────────────────
    getBalance(userId: string): Promise<number>;
    addLedgerEntry(entry: Omit<OpoLedgerEntry, 'id' | 'createdAt'>): Promise<OpoLedgerEntry>;

    // ── Catálogo de recompensas reales ──────────────────────────────────────
    listProducts(category?: string): Promise<StoreProduct[]>;
    getProduct(id: string): Promise<StoreProduct | null>;
    decrementStock(id: string): Promise<void>;

    // ── Catálogo de descuentos virtuales ────────────────────────────────────
    listDiscounts(category?: string): Promise<StoreDiscount[]>;
    getDiscount(id: string): Promise<StoreDiscount | null>;

    // ── Cartera del usuario ─────────────────────────────────────────────────
    listWalletItems(userId: string): Promise<WalletItem[]>;
    getWalletItem(id: string, userId: string): Promise<WalletItem | null>;
    createWalletItem(item: Omit<WalletItem, 'id' | 'createdAt'>): Promise<WalletItem>;
    markWalletItemUsed(id: string, userId: string): Promise<WalletItem>;

    // ── Marketplace de tests de la comunidad ────────────────────────────────
    listCommunityTests(filters: { category?: string; isFree?: boolean }): Promise<CommunityTest[]>;
    getCommunityTest(id: string): Promise<CommunityTest | null>;
    publishCommunityTest(test: Omit<CommunityTest, 'id' | 'totalMade' | 'rating' | 'createdAt'>): Promise<CommunityTest>;
    hasPurchasedTest(userId: string, testId: string): Promise<boolean>;
    recordTestPurchase(userId: string, testId: string): Promise<void>;
    incrementTestTotalMade(testId: string): Promise<void>;
}
