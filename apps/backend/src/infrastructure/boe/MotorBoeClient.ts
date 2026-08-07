import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';

/**
 * Cliente HTTP para el Motor BOE externo.
 *
 * El Motor está en: https://ingesta-demo-uadftnwmda-ue.a.run.app
 * Se configura con MOTOR_BOE_BASE_URL y MOTOR_BOE_API_KEY en apps/backend/.env.
 *
 * Colección Postman: MotorIA_Monitor_BOE.postman_collection.json
 *
 * Responsabilidades de este cliente:
 *   - Seguir/resolver el título oficial de una norma BOE
 *   - Obtener cambios detectados para un conjunto de identificadores
 */

export interface MotorBoeConfig {
    baseUrl: string;
    apiKey: string;
    timeoutMs?: number;
}

export interface MotorBoeRegulationResult {
    boeIdentifier: string;
    title: string;
}

export interface MotorBoeChange {
    boeIdentifier: string;
    articulo: string;
    changeType: 'modificacion' | 'derogacion' | 'nueva' | 'tipografica';
    detectedAt: string;
    antes: string;
    despues: string;
    affectedQuestions: number;
}

export class MotorBoeClient {
    private readonly http: AxiosInstance;

    constructor(config: MotorBoeConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs ?? 15_000,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[motor-boe] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.message ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    /**
     * Registra una norma en el Motor y devuelve su título oficial.
     * Lanza si el identificador no existe en el BOE (404) o es inválido (422).
     */
    async followRegulation(boeIdentifier: string): Promise<MotorBoeRegulationResult> {
        logger.info('[motor-boe] followRegulation', { boeIdentifier });
        const { data } = await this.http.post('/api/regulations', { boe_identifier: boeIdentifier });
        return {
            boeIdentifier: data.boe_identifier ?? boeIdentifier,
            title: data.title ?? data.name ?? boeIdentifier,
        };
    }

    /**
     * Obtiene los cambios recientes detectados para los identificadores dados.
     */
    async getChanges(boeIdentifiers: string[]): Promise<MotorBoeChange[]> {
        logger.info('[motor-boe] getChanges', { count: boeIdentifiers.length });
        const { data } = await this.http.get('/api/changes', {
            params: { identifiers: boeIdentifiers.join(',') },
        });
        return (data.changes ?? data ?? []).map((c: any) => ({
            boeIdentifier: c.boe_identifier,
            articulo: c.articulo ?? c.article,
            changeType: c.change_type ?? 'modificacion',
            detectedAt: c.detected_at ?? new Date().toISOString(),
            antes: c.text_before ?? c.antes ?? '',
            despues: c.text_after ?? c.despues ?? '',
            affectedQuestions: c.affected_questions ?? 0,
        }));
    }
}
