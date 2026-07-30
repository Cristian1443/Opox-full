export type NoteKind = 'pdf' | 'photo';

export type NoteStatus =
    | 'processing_ocr'
    | 'processing_topics'
    | 'processing_questions'
    | 'ready'
    | 'error';

export type NoteAnalysisErrorCode =
    | 'INVALID_FORMAT'
    | 'FILE_TOO_LARGE'
    | 'OCR_LOW_CONFIDENCE'
    | 'OCR_FAILED'
    | 'AI_QUOTA_EXCEEDED'
    | 'UNKNOWN';

export interface Note {
    id: string;
    userId: string;
    title: string;
    fileName: string;
    kind: NoteKind;
    pages: number;
    status: NoteStatus;
    progress: number;
    errorCode: NoteAnalysisErrorCode | null;
    errorMessage: string | null;
    storagePath: string | null;
    questionsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotePage {
    id: string;
    noteId: string;
    userId: string;
    pageNumber: number;
    thumbnailUrl: string | null;
    extractedText: string | null;
    ocrConfidence: number;
    createdAt: Date;
}

export interface NoteTag {
    id: string;
    noteId: string;
    userId: string;
    label: string;
    source: 'ai' | 'user';
    createdAt: Date;
}

export interface NoteQuestion {
    id: string;
    noteId: string;
    userId: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string | null;
    tag: string | null;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    createdAt: Date;
}
