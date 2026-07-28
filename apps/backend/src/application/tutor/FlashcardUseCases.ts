import type { ITutorRepository } from '../../domain';
import { DeckNotFoundError } from '../../domain';
import type { TutorFlashcardDeck, TutorFlashcard } from '../../domain/entities';

// ─── Tarjetas stub por tema ───────────────────────────────────────────────────
// TODO(ia-bloque8): reemplazar con TutorAiContract.generateFlashcards()
const STUB_CARDS_BY_TOPIC: Record<string, Array<{ question: string; answer: string }>> = {
    constitucion: [
        { question: '¿Cuántos artículos tiene la Constitución Española de 1978?', answer: '169 artículos, distribuidos en un Título Preliminar y diez Títulos.' },
        { question: '¿Qué regula el artículo 14 CE?', answer: 'El principio de igualdad ante la ley, sin discriminación por nacimiento, raza, sexo, religión u opinión.' },
        { question: '¿Quién es el titular de la soberanía nacional en España?', answer: 'El pueblo español, del que emanan los poderes del Estado (art. 1.2 CE).' },
        { question: '¿Cuáles son los derechos fundamentales del Título I?', answer: 'Abarca del art. 10 al 55: derechos fundamentales, libertades públicas, deberes y garantías.' },
        { question: '¿Qué requisito exige el art. 53 CE para limitar los derechos fundamentales?', answer: 'Solo por Ley Orgánica, respetando su contenido esencial y el principio de proporcionalidad.' },
    ],
    'ley-39': [
        { question: '¿Cuál es el plazo general de resolución de un procedimiento administrativo?', answer: '3 meses salvo que una norma con rango de ley fije plazo distinto (art. 21.2 Ley 39/2015).' },
        { question: '¿Qué es el silencio administrativo positivo?', answer: 'La solicitud se entiende estimada si la Administración no resuelve en el plazo legal (art. 24 Ley 39/2015).' },
        { question: '¿Qué regula el art. 3 de la Ley 39/2015?', answer: 'Los principios generales de la actuación de las Administraciones Públicas: legalidad, eficacia, etc.' },
        { question: '¿Qué es la notificación electrónica obligatoria?', answer: 'Las personas jurídicas y entidades sin personalidad deben relacionarse electrónicamente con la Administración (art. 14).' },
        { question: '¿Cuál es el plazo para interponer recurso de alzada?', answer: '1 mes si el acto es expreso; 3 meses si es presunto (art. 122 Ley 39/2015).' },
    ],
    default: [
        { question: '¿Cuál es el órgano supremo de gobierno de la AGE?', answer: 'El Consejo de Ministros, presidido por el Presidente del Gobierno (art. 98 CE y Ley 50/1997).' },
        { question: '¿Qué principio rige la jerarquía normativa en España?', answer: 'El principio de legalidad: ninguna norma puede ir contra la Constitución ni contravenir a la norma superior.' },
        { question: '¿Qué es la potestad reglamentaria?', answer: 'La facultad del ejecutivo para dictar disposiciones generales de rango inferior a la ley (reglamentos).' },
        { question: '¿Qué es el recurso contencioso-administrativo?', answer: 'La vía jurisdiccional para impugnar actos administrativos ante los Tribunales de lo Contencioso (LJCA 1998).' },
        { question: '¿Cuándo prescribe la responsabilidad disciplinaria en la función pública?', answer: 'Faltas muy graves: 3 años; graves: 2 años; leves: 6 meses (art. 97 TREBEP).' },
    ],
};

function getStubCards(topicId: string): Array<{ question: string; answer: string }> {
    return STUB_CARDS_BY_TOPIC[topicId] ?? STUB_CARDS_BY_TOPIC['default']!;
}

// ─── Listar mazos del usuario ─────────────────────────────────────────────────
export class ListDecksUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(userId: string): Promise<TutorFlashcardDeck[]> {
        return this.tutorRepo.listDecks(userId);
    }
}

// ─── Obtener mazo con tarjetas ────────────────────────────────────────────────
export class GetDeckWithCardsUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(id: string, userId: string): Promise<{ deck: TutorFlashcardDeck; cards: TutorFlashcard[] }> {
        const deck = await this.tutorRepo.getDeck(id, userId);
        if (!deck) throw new DeckNotFoundError();
        const cards = await this.tutorRepo.getDeckCards(id, userId);
        return { deck, cards };
    }
}

// ─── Generar mazo (stub sin IA) ───────────────────────────────────────────────
export class GenerateDeckUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(params: {
        userId: string;
        topicId: string;
        topicTitle: string;
        oposicion: string;
    }): Promise<{ deck: TutorFlashcardDeck; cards: TutorFlashcard[] }> {
        // TODO(ia-bloque8): reemplazar getStubCards por TutorAiContract.generateFlashcards()
        const cards = getStubCards(params.topicId);
        return this.tutorRepo.createDeck({ ...params, cards });
    }
}

// ─── Eliminar mazo ────────────────────────────────────────────────────────────
export class DeleteDeckUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(id: string, userId: string): Promise<void> {
        const deck = await this.tutorRepo.getDeck(id, userId);
        if (!deck) throw new DeckNotFoundError();
        await this.tutorRepo.deleteDeck(id, userId);
    }
}

// ─── Guardar sesión de repaso ─────────────────────────────────────────────────
export class SubmitReviewUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(params: {
        userId: string;
        deckId: string;
        knownCount: number;
        failedCount: number;
        failedCardIds: string[];
    }): Promise<void> {
        const deck = await this.tutorRepo.getDeck(params.deckId, params.userId);
        if (!deck) throw new DeckNotFoundError();
        await this.tutorRepo.saveReview(params);
    }
}
