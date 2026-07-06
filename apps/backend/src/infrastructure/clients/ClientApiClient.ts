import axios, { type AxiosInstance } from 'axios';
import type { ClientApiConfig, ClientApiContract } from '@opox/types';
import { logger } from '@opox/utils';

/**
 * Cliente HTTP hacia la API del cliente (temarios oficiales, BOE, exámenes).
 *
 * TODO: los métodos concretos se añadirán cuando se firme el contrato con
 * el cliente. Este stub monta el Axios con timeouts + interceptores para
 * que solo haya que rellenar las operaciones.
 */
export class ClientApiClient implements ClientApiContract {
    private readonly http: AxiosInstance;

    constructor(config: ClientApiConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                Accept: 'application/json',
            },
        });

        this.http.interceptors.request.use((req) => {
            logger.debug('[client-api] request', { url: req.url, method: req.method });
            return req;
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[client-api] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    message: err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    // TODO: añadir métodos concretos aquí — getSyllabus, getBoeUpdates, etc.
}
