// ─── Bloque 9 · Factoría de Apuntes ────────────────────────────────────────

// Origen del documento subido.
export type NoteKind = 'pdf' | 'photo';

// Estado del análisis IA. El polling de status se hace hasta llegar a 'ready' o 'error'.
export type NoteStatus =
    | 'processing_ocr'
    | 'processing_topics'
    | 'processing_questions'
    | 'ready'
    | 'error';

// Estado global de ingesta agregado (para el pill de la home 9.1).
// - 'ok' → todos los apuntes en 'ready'
// - 'processing' → al menos uno en fase de análisis
// - 'error' → al menos uno en 'error'
export type NotesIngestStatus = 'ok' | 'processing' | 'error';

// Item resumido para el listado 9.1.
export interface Note {
    id: string;
    title: string;
    kind: NoteKind;
    pages: number;
    questionsCount: number;
    status: NoteStatus;
    createdAt: string;
}

// Miniatura de una página del apunte. `ocrConfidence` sirve para destacar
// visualmente páginas con problemas (9.4 con needsReview).
export interface NotePage {
    pageNumber: number;
    thumbnailUrl: string | null;
    ocrConfidence: number;
    extractedText?: string;
}

// Detalle completo para la pantalla 9.4.
export interface NoteDetail {
    id: string;
    title: string;
    fileName: string;
    kind: NoteKind;
    pages: number;
    status: NoteStatus;
    tags: string[];
    questionsCount: number;
    createdAt: string;
    pageThumbnails: NotePage[];
}

// Snapshot del análisis en curso — devuelto por GET /notes/:id/status.
// Sustituye a los timers mock del cliente cuando el backend esté vivo.
export interface NoteAnalysisStatus {
    noteId: string;
    status: NoteStatus;
    progress: number; // 0..100
    pagesDone: number;
    topicsFound: number;
    questionsGenerated: number;
    errorCode?: NoteAnalysisErrorCode;
    errorMessage?: string;
    pagesWithLowConfidence?: number[];
}

// Códigos de error tipados que el móvil usa para elegir qué modal mostrar.
export type NoteAnalysisErrorCode =
    | 'INVALID_FORMAT'
    | 'FILE_TOO_LARGE'
    | 'OCR_LOW_CONFIDENCE'
    | 'OCR_FAILED'
    | 'AI_QUOTA_EXCEEDED'
    | 'UNKNOWN';

// KPIs agregados de la home 9.1.
export interface NotesStats {
    totalNotes: number;
    totalQuestions: number;
    ingestStatus: NotesIngestStatus;
}

// Payload de POST /notes/upload — el móvil sube uno o varios assets.
// El backend crea un Note con status='processing_ocr' y arranca el pipeline IA.
export interface UploadNoteRequest {
    kind: NoteKind;
    fileName: string;
    // base64 del/los archivos (imágenes o PDF).
    files: Array<{
        base64: string;
        mimeType: string;
        sizeBytes: number;
    }>;
}

export interface UploadNoteResponse {
    noteId: string;
    status: NoteStatus;
}

// Payload y respuesta para "Generar test de estos apuntes" (9.5 → runner del Bloque 7).
export interface GenerateTestFromNoteRequest {
    noteId: string;
    questionCount: number;
    topics: string[];
    timed?: boolean;
}

export interface GenerateTestFromNoteResponse {
    // Las preguntas se devuelven con el mismo shape que GeneratedQuestion del
    // Bloque 6 para que QuestionActiveScreen las consuma sin adaptador.
    questions: Array<{
        id: string;
        text: string;
        options: string[];
        correctIndex: number;
        topicId?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
    }>;
}
