import { logger } from '@opox/utils';

export interface PushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: 'default' | null;
    badge?: number;
}

interface ExpoPushTicket {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: { error?: string };
}

export class ExpoPushService {
    private readonly endpoint = 'https://exp.host/--/api/v2/push/send';

    constructor(private readonly accessToken?: string) {}

    async send(messages: PushMessage[]): Promise<void> {
        if (messages.length === 0) return;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
        };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Expo recomienda lotes de máximo 100 mensajes por request
        const BATCH_SIZE = 100;
        for (let i = 0; i < messages.length; i += BATCH_SIZE) {
            const batch = messages.slice(i, i + BATCH_SIZE);
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(batch),
                });
                if (!response.ok) {
                    logger.warn('[push] Expo API error', { status: response.status });
                    continue;
                }
                const result = (await response.json()) as { data: ExpoPushTicket[] };
                const errors = result.data?.filter(t => t.status === 'error') ?? [];
                if (errors.length > 0) {
                    logger.warn('[push] algunos tickets con error', { errors });
                }
                logger.info('[push] batch enviado', { sent: batch.length, errors: errors.length });
            } catch (err) {
                logger.error('[push] fetch error', { err });
            }
        }
    }
}
