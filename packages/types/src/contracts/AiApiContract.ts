/**
 * Contrato de la API de IA (tutor, generación de tests, Foto-Test,
 * evaluación de respuestas, feedback pedagógico).
 * El backend orquesta llamadas a este servicio.
 *
 * TODO: contratos por definir con el proveedor de IA. Cuando lleguen los
 * endpoints reales, tipar aquí y adaptar
 * `apps/backend/src/infrastructure/clients/AiApiClient.ts`.
 *
 * Ejemplos de operaciones esperadas:
 *   - chat(prompt, context): tutor conversacional
 *   - generateQuiz(topicId, difficulty, n): banco de preguntas dinámico
 *   - evaluateAnswer(question, userAnswer): feedback con explicación
 *   - photoTest(imageUrl): reconocer texto de apuntes y generar preguntas
 *   - summarizeSyllabus(topicId): resúmenes con voz/notas del tutor
 */
export interface AiApiContract {
    // TODO: definir cuando el proveedor entregue documentación
    readonly _placeholder?: never;
}

export interface AiApiConfig {
    baseUrl: string;
    apiKey: string;
    /** Modelo por defecto para operaciones que no especifiquen uno */
    defaultModel: string;
    timeoutMs: number;
}
