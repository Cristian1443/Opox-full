/**
 * Adaptador entre GeneratedQuestion del backend (contrato AiApiContract) y el
 * shape que consume QuestionActiveScreen. Existe porque la pantalla se diseñó
 * con datos mock antes de que el contrato del backend estuviese cerrado.
 *
 * Backend →  { id, text, options: [4 strings], correctIndex: 0-3, explanation,
 *              topicId, topic, difficulty: 'easy'|'medium'|'hard', articleRef? }
 *
 * Pantalla → { id, difficulty: 1-5, law, title, topicId, options: [{id,text,correct}],
 *              explanation, articleRef: { article, title, text, boeUrl } }
 */

const DIFFICULTY_TO_STARS = { easy: 1, medium: 3, hard: 5 };
const OPTION_IDS = ['A', 'B', 'C', 'D'];

// El modelo a veces devuelve las opciones con prefijo "A)", "A.", "a) " o
// "A - ". La UI ya pinta la letra por su cuenta, así que la quitamos.
const OPTION_PREFIX_RE = /^\s*[A-Da-d]\s*[\)\.\-:]\s+/;

function stripOptionPrefix(text) {
    if (typeof text !== 'string') return text;
    return text.replace(OPTION_PREFIX_RE, '').trim();
}

export function adaptGeneratedQuestion(q) {
    if (!q) return null;
    return {
        id: q.id,
        topicId: q.topicId,
        law: q.topic ?? '',
        title: q.text,
        difficulty: DIFFICULTY_TO_STARS[q.difficulty] ?? 3,
        options: q.options.map((text, i) => ({
            id: OPTION_IDS[i],
            text: stripOptionPrefix(text),
            correct: i === q.correctIndex,
        })),
        explanation: q.explanation,
        // La pantalla tiene un explanationWrong opcional para el feedback rojo;
        // el backend no lo devuelve, así que reutilizamos la explanation general.
        explanationWrong: q.explanation,
        articleRef: q.articleRef
            ? { article: q.articleRef, title: '', text: q.explanation, boeUrl: null }
            : null,
    };
}

export function adaptGeneratedQuestions(list) {
    return (list ?? []).map(adaptGeneratedQuestion).filter(Boolean);
}
