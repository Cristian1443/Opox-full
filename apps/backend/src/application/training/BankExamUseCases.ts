import type {
    BankExamDTO,
    BankExamJobStatus,
    BankExamSource,
    StartBankMockRequest,
    StartBankMockResponse,
    UploadBankExamRequest,
    BankMockResultDTO,
} from '@opox/types';
import type { MotorAiClient } from '../../infrastructure/clients/MotorAiClient';
import type { GetCursoIdUseCase } from './GenerateUseCases';
import { DomainError } from '../../domain';
import type { ITrainingRepository } from '../../domain';

// ─── Banco de exámenes oficiales (Bloque 6.6 · Motor IA) ──────────────────────
// Cinco use cases delgados que proxyan al MotorAiClient. Si el Motor no está
// configurado, cada uno lanza el marcador 'MOTOR_UNAVAILABLE' que el controller
// traduce a 503. No hay persistencia local — el banco vive en el Motor.

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_MIME = new Set([
    'application/pdf',
    // DOCX (Office 2007+)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // DOC legacy (aceptado por si el picker devuelve MIME antiguo)
    'application/msword',
]);

export class BankExamValidationError extends DomainError {
    readonly code: string;
    readonly httpStatus: number;
    constructor(code: string, message: string, httpStatus = 422) {
        super(message);
        this.code = `bank_exam/${code}`;
        this.httpStatus = httpStatus;
    }
}

export class ListBankExamsUseCase {
    constructor(
        private readonly motor: MotorAiClient | undefined,
        private readonly getCursoId: GetCursoIdUseCase,
        private readonly trainingRepo: ITrainingRepository,
    ) {}

    async execute(input: {
        userId: string;
        oposicion: string | null | undefined;
        limit?: number;
        offset?: number;
    }): Promise<BankExamDTO[]> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        const cursoId = await this.getCursoId.execute(input.oposicion);
        const exams = await this.motor.listBankExams(cursoId, input.limit ?? 100, input.offset ?? 0);

        // Enriquecemos con el historial del usuario: mejor score, fecha del
        // último completado y nº de intentos por examen. Sin esto la lista
        // siempre muestra "0% completado" aunque el usuario ya haya terminado.
        const stats = await this.trainingRepo.getBankExamStats({
            userId: input.userId,
            mockExamIds: exams.map((e) => e.id),
        });

        return exams.map((e) => {
            const stat = stats.get(e.id);
            return {
                ...e,
                status: stat && stat.attemptCount > 0 ? 'completed' : 'pending',
                bestScore: stat?.bestScore ?? null,
                completedAt: stat?.completedAt?.toISOString() ?? null,
                attemptCount: stat?.attemptCount ?? 0,
            };
        });
    }
}

export class UploadBankExamUseCase {
    constructor(
        private readonly motor: MotorAiClient | undefined,
        private readonly getCursoId: GetCursoIdUseCase,
    ) {}

    async execute(input: {
        userId: string;
        oposicion: string | null | undefined;
        request: UploadBankExamRequest;
        isAdmin?: boolean;
    }): Promise<{ jobId: string }> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');

        // ─── Validaciones ─────────────────────────────────────────────────────
        const titulo = (input.request.titulo ?? '').trim();
        if (titulo.length < 1 || titulo.length > 120) {
            throw new BankExamValidationError('titulo_invalido', 'El título debe tener entre 1 y 120 caracteres.');
        }
        const anio = Number(input.request.anio);
        if (!Number.isFinite(anio) || anio < 1900 || anio > 2100) {
            throw new BankExamValidationError('anio_invalido', 'El año debe estar entre 1900 y 2100.');
        }
        const fuente: BankExamSource = input.request.fuente;
        if (!['oficial', 'profesor', 'otro'].includes(fuente)) {
            throw new BankExamValidationError('fuente_invalida', "Procedencia debe ser 'oficial', 'profesor' u 'otro'.");
        }
        if (fuente === 'oficial' && !input.isAdmin) {
            throw new BankExamValidationError(
                'fuente_oficial_reservada',
                "Solo el equipo puede subir exámenes con procedencia 'oficial'. Elige 'profesor' o 'otro'.",
                403,
            );
        }

        if (!input.request.file?.base64) {
            throw new BankExamValidationError('archivo_vacio', 'Falta el archivo a subir.');
        }
        const mimeType = input.request.file.mimeType;
        if (!ACCEPTED_MIME.has(mimeType)) {
            throw new BankExamValidationError(
                'extension_no_soportada',
                'Solo se aceptan archivos PDF o Word (.pdf / .docx).',
                415,
            );
        }

        // Base64 → Buffer y control de tamaño real.
        const fileBuffer = Buffer.from(input.request.file.base64, 'base64');
        if (fileBuffer.length === 0) {
            throw new BankExamValidationError('archivo_vacio', 'El archivo está vacío o su codificación es inválida.');
        }
        if (fileBuffer.length > MAX_FILE_BYTES) {
            throw new BankExamValidationError(
                'archivo_demasiado_grande',
                `El archivo supera el límite de ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.`,
                413,
            );
        }

        const fileName = input.request.file.fileName?.trim()
            ? input.request.file.fileName.trim()
            : `examen-${titulo.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${mimeType === 'application/pdf' ? 'pdf' : 'docx'}`;

        const cursoId = await this.getCursoId.execute(input.oposicion);
        return this.motor.uploadBankExam({
            cursoId,
            titulo,
            anio,
            fuente,
            fileBuffer,
            mimeType,
            fileName,
        });
    }
}

export class GetBankExamJobUseCase {
    constructor(private readonly motor: MotorAiClient | undefined) {}

    execute(jobId: string): Promise<BankExamJobStatus> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.getBankExamJob(jobId);
    }
}

export class StartBankMockUseCase {
    constructor(
        private readonly motor: MotorAiClient | undefined,
        private readonly getCursoId: GetCursoIdUseCase,
    ) {}

    async execute(input: {
        userId: string;
        oposicion: string | null | undefined;
        request: StartBankMockRequest;
    }): Promise<StartBankMockResponse> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        const cursoId = await this.getCursoId.execute(input.oposicion);
        return this.motor.startBankMock({
            cursoId,
            userId: input.userId,
            examId: input.request.examId,
            soloOficiales: input.request.soloOficiales,
            nPreguntas: input.request.nPreguntas,
            contrarrelojSeg: input.request.contrarrelojSeg,
            distribucion: input.request.distribucion,
        });
    }
}

export class GetBankMockResultUseCase {
    constructor(private readonly motor: MotorAiClient | undefined) {}

    execute(sesionId: string): Promise<BankMockResultDTO> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.getBankMockResult(sesionId);
    }
}
