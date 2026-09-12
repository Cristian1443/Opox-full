import { logger } from '@opox/utils';

export class WhatsAppNotificationClient {
    private readonly endpoint: string;

    constructor(
        private readonly apiToken: string,
        private readonly phoneNumberId: string,
        private readonly recipientNumber: string,
    ) {
        this.endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    }

    async sendFeedback(type: string, message: string): Promise<void> {
        const body = `[OPOX Feedback] Tipo: ${type}\n\n${message}`;
        try {
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: this.recipientNumber,
                    type: 'text',
                    text: { body },
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                logger.warn(`[WhatsApp] Envío fallido ${res.status}: ${text}`);
            }
        } catch (err) {
            logger.warn('[WhatsApp] Error de red al enviar feedback:', err);
        }
    }
}
