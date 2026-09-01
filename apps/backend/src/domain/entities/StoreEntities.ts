// ─── Bloque 11 · Tienda — entidades de dominio ──────────────────────────────

export interface StoreProduct {
    id: string;
    partner: string;
    title: string;
    subtitle: string;
    description: string;
    cost: number;
    stock: number;
    icon: string;
    color: string;
    category: string;
    tag: string;
    isAvailable: boolean;
    conditions: string[];
    expiry: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StoreDiscount {
    id: string;
    partner: string;
    title: string;
    subtitle: string;
    discount: string;
    originalPrice: string;
    category: string;
    color: string;
    icon: string;
    isNew: boolean;
    expiryDate: string;
    conditions: string[];
    deepLink: string | null;
    isActive: boolean;
    cost: number;
    code: string;
    createdAt: Date;
}

/** Status of a user's redeemed wallet item. */
export type WalletItemStatus = 'active' | 'used' | 'expired';

export interface WalletItem {
    id: string;
    userId: string;
    productId: string | null;
    partner: string;
    title: string;
    code: string;
    status: WalletItemStatus;
    expiryDate: string;
    usedDate: string | null;
    color: string;
    icon: string;
    actionUrl: string | null;
    createdAt: Date;
}

/** Opopoints ledger entry (earn or spend event). */
export type LedgerEntryType = 'earn' | 'spend';

export interface OpoLedgerEntry {
    id: string;
    userId: string;
    type: LedgerEntryType;
    amount: number;
    reason: string;
    refId: string | null;
    createdAt: Date;
}

export interface CommunityTest {
    id: string;
    authorId: string;
    authorUsername: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    price: number;
    isFree: boolean;
    questionCount: number;
    /** Cached count of purchases. */
    totalMade: number;
    /** Cached average rating (0-5). */
    rating: number;
    isPublished: boolean;
    createdAt: Date;
}
