import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStoreRepository } from '../../domain';
import type {
    StoreProduct,
    StoreDiscount,
    WalletItem,
    WalletItemStatus,
    OpoLedgerEntry,
    LedgerEntryType,
    CommunityTest,
} from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseStoreRepository implements IStoreRepository {
    constructor(private readonly db: SupabaseClient) {}

    // ── Saldo de Opopoints ─────────────────────────────────────────────────────

    async getBalance(userId: string): Promise<number> {
        const { data, error } = await this.db
            .from('user_opopoints_ledger')
            .select('type, amount')
            .eq('user_id', userId);
        if (error) { logger.error('[store-repo] getBalance', { error }); return 0; }
        if (!data?.length) return 0;
        return data.reduce((sum, row) => {
            return sum + (row.type === 'earn' ? row.amount : -row.amount);
        }, 0);
    }

    async addLedgerEntry(entry: Omit<OpoLedgerEntry, 'id' | 'createdAt'>): Promise<OpoLedgerEntry> {
        const { data, error } = await this.db
            .from('user_opopoints_ledger')
            .insert({
                user_id: entry.userId,
                type: entry.type,
                amount: entry.amount,
                reason: entry.reason,
                ref_id: entry.refId ?? null,
            })
            .select('*')
            .single();
        if (error) throw new Error(`[store-repo] addLedgerEntry: ${error.message}`);
        return mapLedger(data);
    }

    // ── Catálogo de recompensas reales ─────────────────────────────────────────

    async listProducts(category?: string): Promise<StoreProduct[]> {
        let q = this.db.from('store_products').select('*');
        if (category && category !== 'all') q = q.eq('category', category);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) { logger.error('[store-repo] listProducts', { error }); return []; }
        return (data ?? []).map(mapProduct);
    }

    async getProduct(id: string): Promise<StoreProduct | null> {
        const { data, error } = await this.db
            .from('store_products')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) return null;
        return mapProduct(data);
    }

    async decrementStock(id: string): Promise<void> {
        const { error } = await this.db.rpc('decrement_store_product_stock', { product_id: id });
        if (error) {
            // Fallback manual si la función RPC no existe todavía
            const { data: p } = await this.db.from('store_products').select('stock').eq('id', id).single();
            if (p && p.stock > 0) {
                await this.db.from('store_products').update({ stock: p.stock - 1, updated_at: new Date().toISOString() }).eq('id', id);
            }
        }
    }

    // ── Catálogo de descuentos virtuales ──────────────────────────────────────

    async listDiscounts(category?: string): Promise<StoreDiscount[]> {
        let q = this.db.from('store_discounts').select('*').eq('is_active', true);
        if (category && category !== 'all') q = q.eq('category', category);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) { logger.error('[store-repo] listDiscounts', { error }); return []; }
        return (data ?? []).map(mapDiscount);
    }

    async getDiscount(id: string): Promise<StoreDiscount | null> {
        const { data, error } = await this.db
            .from('store_discounts')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) return null;
        return mapDiscount(data);
    }

    // ── Cartera del usuario ────────────────────────────────────────────────────

    async listWalletItems(userId: string): Promise<WalletItem[]> {
        const { data, error } = await this.db
            .from('user_wallet')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) { logger.error('[store-repo] listWalletItems', { error }); return []; }
        return (data ?? []).map(mapWalletItem);
    }

    async getWalletItem(id: string, userId: string): Promise<WalletItem | null> {
        const { data, error } = await this.db
            .from('user_wallet')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !data) return null;
        return mapWalletItem(data);
    }

    async createWalletItem(item: Omit<WalletItem, 'id' | 'createdAt'>): Promise<WalletItem> {
        const { data, error } = await this.db
            .from('user_wallet')
            .insert({
                user_id: item.userId,
                product_id: item.productId ?? null,
                partner: item.partner,
                title: item.title,
                code: item.code,
                status: item.status,
                expiry_date: item.expiryDate,
                used_date: item.usedDate ?? null,
                color: item.color,
                icon: item.icon,
                action_url: item.actionUrl ?? null,
            })
            .select('*')
            .single();
        if (error) throw new Error(`[store-repo] createWalletItem: ${error.message}`);
        return mapWalletItem(data);
    }

    async markWalletItemUsed(id: string, userId: string): Promise<WalletItem> {
        const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const { data, error } = await this.db
            .from('user_wallet')
            .update({ status: 'used', used_date: today })
            .eq('id', id)
            .eq('user_id', userId)
            .select('*')
            .single();
        if (error) throw new Error(`[store-repo] markWalletItemUsed: ${error.message}`);
        return mapWalletItem(data);
    }

    // ── Marketplace de la comunidad ────────────────────────────────────────────

    async listCommunityTests(filters: { category?: string; isFree?: boolean }): Promise<CommunityTest[]> {
        let q = this.db.from('community_tests').select('*').eq('is_published', true);
        if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
        if (typeof filters.isFree === 'boolean') q = q.eq('is_free', filters.isFree);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) { logger.error('[store-repo] listCommunityTests', { error }); return []; }
        return (data ?? []).map(mapCommunityTest);
    }

    async getCommunityTest(id: string): Promise<CommunityTest | null> {
        const { data, error } = await this.db
            .from('community_tests')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) return null;
        return mapCommunityTest(data);
    }

    async publishCommunityTest(test: Omit<CommunityTest, 'id' | 'totalMade' | 'rating' | 'createdAt'>): Promise<CommunityTest> {
        const { data, error } = await this.db
            .from('community_tests')
            .insert({
                author_id: test.authorId,
                author_username: test.authorUsername,
                title: test.title,
                description: test.description,
                category: test.category,
                tags: test.tags,
                price: test.price,
                question_count: test.questionCount,
                is_published: test.isPublished,
            })
            .select('*')
            .single();
        if (error) throw new Error(`[store-repo] publishCommunityTest: ${error.message}`);
        return mapCommunityTest(data);
    }

    async hasPurchasedTest(userId: string, testId: string): Promise<boolean> {
        const { data } = await this.db
            .from('community_test_purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('test_id', testId)
            .single();
        return !!data;
    }

    async recordTestPurchase(userId: string, testId: string): Promise<void> {
        const { error } = await this.db
            .from('community_test_purchases')
            .insert({ user_id: userId, test_id: testId });
        if (error) throw new Error(`[store-repo] recordTestPurchase: ${error.message}`);
    }

    async incrementTestTotalMade(testId: string): Promise<void> {
        const { data: t } = await this.db.from('community_tests').select('total_made').eq('id', testId).single();
        if (t) {
            await this.db.from('community_tests').update({ total_made: (t.total_made ?? 0) + 1 }).eq('id', testId);
        }
    }
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): StoreProduct {
    return {
        id: row.id,
        partner: row.partner,
        title: row.title,
        subtitle: row.subtitle ?? '',
        description: row.description ?? '',
        cost: row.cost,
        stock: row.stock,
        icon: row.icon,
        color: row.color,
        category: row.category,
        tag: row.tag ?? '',
        isAvailable: row.is_available,
        conditions: row.conditions ?? [],
        expiry: row.expiry ?? '',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDiscount(row: any): StoreDiscount {
    return {
        id: row.id,
        partner: row.partner,
        title: row.title,
        subtitle: row.subtitle ?? '',
        discount: row.discount,
        originalPrice: row.original_price ?? '',
        category: row.category,
        color: row.color,
        icon: row.icon,
        isNew: row.is_new,
        expiryDate: row.expiry_date ?? '',
        conditions: row.conditions ?? [],
        deepLink: row.deep_link ?? null,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWalletItem(row: any): WalletItem {
    return {
        id: row.id,
        userId: row.user_id,
        productId: row.product_id ?? null,
        partner: row.partner,
        title: row.title,
        code: row.code,
        status: row.status as WalletItemStatus,
        expiryDate: row.expiry_date,
        usedDate: row.used_date ?? null,
        color: row.color,
        icon: row.icon,
        actionUrl: row.action_url ?? null,
        createdAt: new Date(row.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLedger(row: any): OpoLedgerEntry {
    return {
        id: row.id,
        userId: row.user_id,
        type: row.type as LedgerEntryType,
        amount: row.amount,
        reason: row.reason,
        refId: row.ref_id ?? null,
        createdAt: new Date(row.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommunityTest(row: any): CommunityTest {
    return {
        id: row.id,
        authorId: row.author_id,
        authorUsername: row.author_username,
        title: row.title,
        description: row.description ?? '',
        category: row.category,
        tags: row.tags ?? [],
        price: row.price,
        isFree: row.is_free,
        questionCount: row.question_count,
        totalMade: row.total_made,
        rating: parseFloat(row.rating) || 0,
        isPublished: row.is_published,
        createdAt: new Date(row.created_at),
    };
}
