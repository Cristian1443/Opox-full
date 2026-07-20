/**
 * Contrato de la API de IA para los Bloques 6 y 7 · Entrenamiento.
 *
 * El responsable de IA implementa esta interfaz en:
 *   apps/backend/src/infrastructure/clients/AiApiClient.ts
 *
 * El backend usa AiApiClientStub (misma interfaz, datos mock) mientras
 * la implementación real no esté lista. El container.ts elige cuál usar
 * en función de si las env vars AI_* están configuradas.
 *
 * Prompts y ejemplos de entrada/salida en: packages/ai/
 */
export interface AiApiContract {
    /**
     * Genera preguntas tipo test para el Generador Infinito (pantalla 6.2).
     *
     * La IA produce preguntas originales ajustadas al nivel pedido. Nunca
     * debe repetir IDs de la lista excludeIds (historial del usuario).
     */
    generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;

    /**
     * Analiza la foto de un apunte o examen impreso y extrae el concepto
     * clave visible en la imagen (pantallas 6.3 → 6.4 → 6.5, Foto-Test).
     *
     * La IA identifica el texto/contexto de la imagen, determina el
     * concepto jurídico/administrativo principal y genera una pregunta +
     * respuesta tipo flashcard sobre ese concepto.
     */
    analyzePhoto(params: AnalyzePhotoParams): Promise<PhotoTestResult>;

    /**
     * Genera un test quirúrgico personalizado para el Laboratorio de
     * Errores (pantallas 6.8 → 6.9). Recibe los patrones de error del
     * usuario y devuelve preguntas que atacan específicamente esos puntos
     * débiles, priorizando los temas con mayor tasa de fallo.
     */
    generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult>;

    /**
     * Genera una pista contextual para la pregunta activa (pantalla 7.2,
     * botón "Pista IA"). La pista orienta al usuario sin revelar la respuesta.
     *
     * Ver brief completo en: packages/ai/BRIEF_IA_BLOQUE7.md
     */
    generateHint(params: HintParams): Promise<HintResult>;
}

// ─── Tipos compartidos ────────────────────────────────────────────────────────

/** Una pregunta generada por la IA (usada por generateQuestions y generateSurgicalTest) */
export interface GeneratedQuestion {
    /** UUID generado por la IA o por el backend al persistir */
    id: string;
    /** Texto de la pregunta */
    text: string;
    /** Exactamente 4 opciones (A, B, C, D) */
    options: [string, string, string, string];
    /** Índice de la opción correcta (0 = A, 1 = B, 2 = C, 3 = D) */
    correctIndex: 0 | 1 | 2 | 3;
    /** Explicación de por qué la opción correcta es correcta */
    explanation: string;
    /** ID del tema al que pertenece la pregunta */
    topicId: string;
    /** Nombre legible del tema */
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    /** Dificultad numérica 1-5 para mostrar estrellas en la UI (1=muy fácil, 5=muy difícil) */
    difficultyScore?: number;
    /** Referencia legal principal (ej. "art. 21.2 Ley 39/2015") para mostrar en la sesión */
    articleRef?: string;
}

// ─── generateQuestions ────────────────────────────────────────────────────────

export interface GenerateQuestionsParams {
    /** Código de la oposición del usuario (ej. 'justicia-tramitacion') */
    oposicion: string;
    /**
     * ID del tema seleccionado. 'all' = todo el temario.
     * Los IDs concretos los define el backend según la oposición.
     */
    topicId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    /** Número de preguntas solicitadas: 10 | 25 | 50 | 100 */
    count: number;
    /**
     * IDs de preguntas ya vistas por el usuario en sesiones anteriores.
     * La IA no debe devolver preguntas con estos IDs (o suficientemente
     * similares si son generadas dinámicamente).
     */
    excludeIds?: string[];
}

// ─── analyzePhoto ─────────────────────────────────────────────────────────────

export interface AnalyzePhotoParams {
    /** Imagen en base64 (sin prefijo data:image/...) */
    imageBase64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    /** Contexto de la oposición para que la IA enfoque el análisis */
    oposicion: string;
}

export interface PhotoTestResult {
    /** Concepto jurídico/administrativo principal identificado en la imagen */
    concept: string;
    /** Pregunta tipo test generada sobre ese concepto */
    question: string;
    /** Respuesta correcta con explicación breve */
    answer: string;
    /**
     * ID del tema si la IA reconoce a cuál pertenece. Permite al backend
     * sugerir un test quirúrgico relacionado.
     */
    relatedTopicId?: string;
    /** Número de preguntas que el generador puede producir sobre este concepto */
    availableQuestionsCount: number;
}

// ─── generateSurgicalTest ─────────────────────────────────────────────────────

export interface GenerateSurgicalTestParams {
    oposicion: string;
    /** Patrones de error del usuario calculados por el backend */
    errorPatterns: Array<{
        topicId: string;
        topic: string;
        /** Porcentaje de preguntas falladas en este tema (0–100) */
        failRate: number;
        /** Porcentaje de dominio actual (0–100, inverso de failRate con matices) */
        domain: number;
    }>;
    /** Número total de preguntas del test quirúrgico (recomendado: 20) */
    count: number;
}

export interface SurgicalTestResult {
    questions: GeneratedQuestion[];
    /**
     * Distribución de preguntas por tema — para mostrar en la pantalla
     * de preview 6.9 antes de que el usuario empiece el test.
     */
    distribution: Array<{
        topicId: string;
        topic: string;
        count: number;
        /** Porcentaje del total de preguntas asignado a este tema */
        percentage: number;
    }>;
}

// ─── generateHint ─────────────────────────────────────────────────────────────

export interface HintParams {
    /** Texto completo de la pregunta */
    questionText: string;
    /** Las 4 opciones en orden A-D */
    options: [string, string, string, string];
    /** ID del tema de la pregunta */
    topicId: string;
    /** Nombre legible del tema */
    topic: string;
    /** Oposición del usuario (ej. 'justicia-tramitacion') */
    oposicion: string;
}

export interface HintResult {
    /** Pista que orienta al usuario sin revelar la respuesta directamente. Máx. 300 caracteres. */
    hint: string;
    /** Referencia legal relevante (ej. "art. 21.2 Ley 39/2015"). Opcional. */
    articleRef?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface AiApiConfig {
    baseUrl: string;
    apiKey: string;
    /** Modelo por defecto para operaciones que no especifiquen uno */
    defaultModel: string;
    timeoutMs: number;
}
