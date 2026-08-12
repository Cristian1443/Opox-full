import { DomainError } from './DomainError';

export class StoreProductNotFoundError extends DomainError {
    readonly code = 'store/product-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese producto en la tienda.'); }
}

export class StoreProductOutOfStockError extends DomainError {
    readonly code = 'store/out-of-stock';
    readonly httpStatus = 409;
    constructor() { super('Este producto se ha agotado.'); }
}

export class StoreInsufficientBalanceError extends DomainError {
    readonly code = 'store/insufficient-balance';
    readonly httpStatus = 422;
    constructor() { super('No tienes suficientes Opopoints para canjear este producto.'); }
}

export class WalletItemNotFoundError extends DomainError {
    readonly code = 'store/wallet-item-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese código en tu cartera.'); }
}

export class CommunityTestNotFoundError extends DomainError {
    readonly code = 'store/community-test-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese test de la comunidad.'); }
}

export class StoreAlreadyPurchasedError extends DomainError {
    readonly code = 'store/already-purchased';
    readonly httpStatus = 409;
    constructor() { super('Ya tienes este test en tu biblioteca.'); }
}
