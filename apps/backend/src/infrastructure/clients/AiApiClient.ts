import axios, { type AxiosInstance } from 'axios';
import type { AiApiConfig, AiApiContract } from '@opox/types';
import { logger } from '@opox/utils';

/**
 * Cliente HTTP hacia la API de IA (tutor, Foto-Test, quiz generation).
 *
 * TODO: contratos por definir. Este stub monta el Axios con
 * timeout mayor (los endpoints de IA pueden tardar) y logging.
 */
export class AiApiClient implements AiApiContract {
    private readonly http: AxiosInstance;

    constructor(private readonly config: AiApiConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[ai-api] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    message: err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    /** Modelo por defecto configurado en env, expuesto para los use cases */
    getDefaultModel(): string {
        return this.config.defaultModel;
    }

    // TODO: añadir métodos concretos — chat, generateQuiz, photoTest, etc.
}
