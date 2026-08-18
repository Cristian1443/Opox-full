// ─── Bloque 11 · Tienda OPOX ────────────────────────────────────────────────
// Shared DTOs between mobile and backend.

/** Opopoints balance for the authenticated user. */
export interface StoreBalanceDTO {
    balance: number;
}

/** A redeemable real-world reward from the catalog. */
export interface StoreProductDTO {
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
}

/** A discount/voucher from the virtual rewards catalog. */
export interface StoreDiscountDTO {
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
}

/** A single item in the user's wallet (a redeemed code). */
export interface WalletItemDTO {
    id: string;
    partner: string;
    title: string;
    code: string;
    /** 'active' | 'used' | 'expired' */
    status: string;
    expiryDate: string;
    usedDate: string | null;
    color: string;
    icon: string;
    actionUrl: string | null;
}

/** Result returned after successfully redeeming a product. */
export interface PurchaseResultDTO {
    walletItemId: string;
    code: string;
    newBalance: number;
}

/** A community-created test listed in the marketplace. */
export interface CommunityTestDTO {
    id: string;
    title: string;
    author: string;
    avatar: string;
    rating: number;
    totalMade: number;
    price: number;
    isFree: boolean;
    category: string;
    questionCount: number;
    createdAt: string;
}

/** Detailed view of a community test (includes questions preview). */
export interface CommunityTestDetailDTO extends CommunityTestDTO {
    description: string;
    tags: string[];
}

/** Result returned after publishing or purchasing a community test. */
export interface CommunityTestActionResultDTO {
    id: string;
    newBalance: number;
}
