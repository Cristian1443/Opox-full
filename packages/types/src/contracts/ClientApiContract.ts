/**
 * Contrato de la API del cliente (fuente de datos oficiales de oposiciones,
 * temarios, BOE, etc.). El backend actúa como proxy/orquestador.
 *
 * TODO: contratos por definir con el cliente. Cuando lleguen los endpoints
 * reales, tipar las peticiones y respuestas aquí y adaptar
 * `apps/backend/src/infrastructure/clients/ClientApiClient.ts`.
 *
 * Ejemplos de operaciones esperadas (a confirmar):
 *   - getOppositionCatalog(): oposiciones disponibles
 *   - getSyllabus(oppositionId): temario oficial
 *   - getBoeUpdates(sinceIso): cambios en el BOE relevantes
 *   - getExamHistorical(oppositionId, year): exámenes de convocatorias pasadas
 */
export interface ClientApiContract {
    // TODO: definir cuando el cliente entregue OpenAPI / documentación
    readonly _placeholder?: never;
}

export interface ClientApiConfig {
    baseUrl: string;
    apiKey: string;
    /** Timeout en ms para cada petición individual */
    timeoutMs: number;
}
