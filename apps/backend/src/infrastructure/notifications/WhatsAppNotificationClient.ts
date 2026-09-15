import { logger } from '@opox/utils';

// Traducciones a español para que el equipo lea el tipo sin descifrar el enum.
const TYPE_LABELS: Record<string, string> = {
    suggestion: 'Sugerencia',
    bug: 'Reporte de un error',
    other: 'Otro comentario',
};

// Formatea la fecha en la zona horaria de Madrid (donde vive el equipo OPOX)
// con un locale legible: "14 sep 2026, 15:23 h".
function formatSpainTimestamp(date: Date): string {
    const formatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${formatter.format(date)} h`;
}

export class WhatsAppNotificationClient {
    private readonly endpoint: string;

    constructor(
        private readonly apiToken: string,
        phoneNumberId: string,
        private readonly recipientNumber: string,
    ) {
        this.endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    }

    async sendFeedback(type: string, message: string): Promise<void> {
        const typeLabel = TYPE_LABELS[type] ?? type;
        const receivedAt = formatSpainTimestamp(new Date());
        // WhatsApp usa asteriscos simples para *negrita* — no Markdown estándar.
        const body = [
            '*Nuevo mensaje desde OPOX*',
            '',
            'Un opositor acaba de escribirnos desde la sección "Mi opinión" de la app.',
            '',
            `*Tipo:* ${typeLabel}`,
            `*Recibido:* ${receivedAt}`,
            '',
            '*Mensaje:*',
            `"${message.trim()}"`,
            '',
            '_Gracias por leerlo y darle seguimiento._',
        ].join('\n');
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
        } catch (err: unknown) {
            logger.warn('[WhatsApp] Error de red al enviar feedback:', err as Record<string, unknown>);
        }
    }
}
