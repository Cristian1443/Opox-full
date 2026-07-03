/**
 * Handler para los webhooks de RevenueCat (INITIAL_PURCHASE, RENEWAL,
 * CANCELLATION, EXPIRATION, etc.).
 *
 * TODO: implementar cuando se aborde el bloque de pagos.
 * Verificar la firma HMAC del webhook con REVENUECAT_WEBHOOK_SECRET
 * antes de procesar el evento.
 */

export type RevenueCatEventType =
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'
    | 'EXPIRATION'
    | 'BILLING_ISSUE'
    | 'PRODUCT_CHANGE'
    | 'TRANSFER';

export interface RevenueCatEvent {
    type: RevenueCatEventType;
    app_user_id: string;
    /** ISO 8601 */
    event_timestamp_ms: number;
    /** Payload completo del evento — dejamos unknown hasta tipar */
    payload: Record<string, unknown>;
}

export class RevenueCatWebhookHandler {
    constructor(private readonly webhookSecret?: string) { }

    /**
     * Verifica firma HMAC del webhook. RevenueCat firma con el secret
     * configurado en el dashboard.
     */
    verifySignature(_rawBody: string, _signatureHeader: string): boolean {
        // TODO: implementar verificación HMAC-SHA256
        return true;
    }

    async handle(_event: RevenueCatEvent): Promise<void> {
        // TODO: actualizar tabla `subscriptions` en Supabase según el tipo de evento.
        throw new Error('RevenueCatWebhookHandler.handle: pendiente de implementar');
    }
}
