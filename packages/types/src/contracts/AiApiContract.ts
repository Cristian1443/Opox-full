/**
 * Contrato de la API de IA para los Bloques 6, 7 y 9.
 *
 * El responsable de IA implementa esta interfaz en:
 *   apps/backend/src/infrastructure/clients/AiApiClient.ts
 *
 * El backend usa AiApiClientStub (misma interfaz, datos mock) mientras
 * la implementación real no esté lista. El container.ts elige cuál usar
 * en función de si las env vars AI_* están configuradas.
 *
 * Prompts y ejemplos de entrada/salida en: packages/ai/
 * Briefs por bloque: BRIEF_IA_BLOQUE6.md / 7 / 8 / 9.
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

    // ── Bloque 9 · Factoría de Apuntes ──────────────────────────────────────
    // Ver brief completo en: packages/ai/BRIEF_IA_BLOQUE9.md

    /**
     * OCR + limpieza de un apunte subido por el usuario. Recibe las páginas
     * (imágenes o PDF ya convertido a imágenes) y devuelve el texto extraído
     * página a página junto con la confianza del OCR.
     *
     * Se llama al arrancar el análisis (fase 'processing_ocr' del status).
     */
    analyzeNoteDocument(params: AnalyzeNoteDocumentParams): Promise<AnalyzeNoteDocumentResult>;

    /**
     * Detección de temas/etiquetas sobre el texto ya extraído. Devuelve un
     * array corto de etiquetas legibles (máx. 6) que el usuario podrá editar
     * después desde 9.4.
     *
     * Se llama tras el OCR (fase 'processing_topics' del status).
     */
    generateTagsFromNote(params: GenerateTagsFromNoteParams): Promise<GenerateTagsFromNoteResult>;

    /**
     * Genera el banco de preguntas tipo test a partir del texto extraído
     * del apunte del usuario. El backend las persiste para que 9.5 pueda
     * filtrarlas por tags al arrancar el runner.
     *
     * Se llama al final del pipeline (fase 'processing_questions' del status).
     */
    generateQuestionsFromNote(params: GenerateQuestionsFromNoteParams): Promise<GenerateQuestionsFromNoteResult>;

    // ── Bloque 10 · Monitor BOE ──────────────────────────────────────────────
    // Ver brief completo en: packages/ai/BRIEF_IA_BLOQUE10.md

    /**
     * Genera un mini-test de 2-3 preguntas para validar que el usuario
     * ha asimilado un cambio legislativo detectado por el Monitor BOE.
     *
     * Se usa cuando el usuario pulsa "Mini-test" en la pantalla de detalle
     * del cambio (pantalla 10.4).
     */
    generateBoeMiniTest(params: GenerateBoeMiniTestParams): Promise<BoeMiniTestAiResult>;
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

// ─── Bloque 9 · Factoría de Apuntes ──────────────────────────────────────────

export interface AnalyzeNoteDocumentParams {
    /** Oposición del usuario, para orientar la limpieza y el vocabulario. */
    oposicion: string;
    /** Cada página en base64. En PDF, el backend ya la ha rasterizado a imágenes. */
    pages: Array<{
        pageNumber: number;
        imageBase64: string;
        mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    }>;
}

export interface AnalyzeNoteDocumentResult {
    /** Título propuesto por la IA a partir del contenido (máx. 60 caracteres). */
    suggestedTitle: string;
    /** Texto extraído + calidad del OCR, página a página. */
    pages: Array<{
        pageNumber: number;
        extractedText: string;
        /** 0..1 — el móvil marca visualmente las páginas con confidence < 0.6. */
        ocrConfidence: number;
    }>;
}

export interface GenerateTagsFromNoteParams {
    oposicion: string;
    /** Concatenación de los `extractedText` de todas las páginas del apunte. */
    fullText: string;
}

export interface GenerateTagsFromNoteResult {
    /** Entre 3 y 6 etiquetas cortas (máx. 30 chars cada una). */
    tags: string[];
}

export interface GenerateQuestionsFromNoteParams {
    oposicion: string;
    /** Texto completo del apunte ya limpio por el OCR. */
    fullText: string;
    /** Etiquetas ya detectadas — la IA puede etiquetar cada pregunta con la que le aplique. */
    tags: string[];
    /**
     * Nº total de preguntas a generar. El backend lo calcula proporcional
     * al tamaño del texto (ej. ~3 preguntas por página).
     */
    count: number;
}

export interface GenerateQuestionsFromNoteResult {
    /** Reutiliza el shape de GeneratedQuestion del Bloque 6. */
    questions: Array<GeneratedQuestion & {
        /** Tag al que pertenece la pregunta (para que 9.5 filtre por selección). */
        tag?: string;
    }>;
}

// ─── Bloque 10 · Monitor BOE ─────────────────────────────────────────────────

export interface GenerateBoeMiniTestParams {
    /** Oposición del usuario (contexto del temario). */
    oposicion: string;
    /** Precepto modificado (ej. "Art. 14", "Art. 21.2"). */
    articulo: string;
    /** Nombre y número de la ley modificada. */
    ley: string;
    /** Código oficial BOE-A-AAAA-NNNNN — solo trazabilidad, no usar en preguntas. */
    identificador_boe: string;
    /** Redacción derogada. Vacío si el artículo es nuevo. */
    antes: string;
    /** Redacción vigente. Vacío si el artículo fue derogado. */
    despues: string;
    /** Número de preguntas a generar: 2 o 3. */
    count: 2 | 3;
}

export interface BoeMiniTestQuestion {
    /** String único por pregunta en el lote (ej. "boe-q1"). */
    id: string;
    /** Etiqueta corta del cambio para el banner de contexto (máx. 40 chars). */
    context: string;
    /** Enunciado de la pregunta (máx. 280 chars). */
    question: string;
    /** Exactamente 3 opciones (sin prefijo A/B/C — la app lo añade). */
    options: [string, string, string];
    /** Índice de la opción correcta (0, 1 o 2). */
    correctIndex: 0 | 1 | 2;
    /** Justificación breve citando la redacción vigente (máx. 300 chars). */
    explanation: string;
}

export interface BoeMiniTestAiResult {
    questions: BoeMiniTestQuestion[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface AiApiConfig {
    baseUrl: string;
    apiKey: string;
    /** Modelo por defecto para operaciones que no especifiquen uno */
    defaultModel: string;
    timeoutMs: number;
}
