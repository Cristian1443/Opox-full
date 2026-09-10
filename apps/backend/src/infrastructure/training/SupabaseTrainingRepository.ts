import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeneratedQuestion } from '@opox/types';
import {
    MockExam,
    type MockExamWithStatus,
    type ErrorPattern,
    type MockExamProgress,
    type LawView,
    TrainingAttempt,
    TrainingBookmark,
    BookmarkNotFoundError,
    type ITrainingRepository,
    type SaveAttemptInput,
} from '../../domain';

// ─── Row types (espejo del schema SQL) ───────────────────────────────────────

type MockExamRow = {
    id: string;
    oposicion: string;
    year: number;
    title: string;
    category: string | null;
    question_count: number;
    duration_minutes: number;
    penalty_ratio: number | null;
    created_at: string;
};

type QuestionRow = {
    id: string;
    topic_id: string;
    topic: string;
    text: string;
    options: string[];
    correct_index: number;
    explanation: string | null;
    difficulty: string;
};

type AttemptRow = {
    id: string;
    user_id: string;
    source: string;
    mock_exam_id: string | null;
    topic_id: string | null;
    difficulty: string | null;
    question_count: number;
    correct_count: number;
    wrong_count: number;
    blank_count: number;
    score: number | null;
    duration_secs: number | null;
    completed_at: string;
    created_at: string;
};

type BookmarkRow = {
    id: string;
    user_id: string;
    concept: string;
    question: string;
    answer: string;
    related_topic_id: string | null;
    created_at: string;
};

// ─── Mapeadores ───────────────────────────────────────────────────────────────

function toMockExam(row: MockExamRow): MockExam {
    return MockExam.create({
        id: row.id,
        oposicion: row.oposicion,
        year: row.year,
        title: row.title,
        category: row.category,
        questionCount: row.question_count,
        durationMinutes: row.duration_minutes,
        penaltyRatio: row.penalty_ratio,
        createdAt: new Date(row.created_at),
    });
}

function toQuestion(row: QuestionRow): GeneratedQuestion {
    const options = row.options as [string, string, string, string];
    const correctIndex = row.correct_index as 0 | 1 | 2 | 3;
    return {
        id: row.id,
        text: row.text,
        options,
        correctIndex,
        explanation: row.explanation ?? '',
        topicId: row.topic_id,
        topic: row.topic,
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    };
}

function toAttempt(row: AttemptRow): TrainingAttempt {
    return TrainingAttempt.create({
        id: row.id,
        userId: row.user_id,
        source: row.source as 'generator' | 'official' | 'surgical',
        mockExamId: row.mock_exam_id,
        topicId: row.topic_id,
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard' | null,
        questionCount: row.question_count,
        correctCount: row.correct_count,
        wrongCount: row.wrong_count,
        blankCount: row.blank_count,
        score: row.score,
        durationSecs: row.duration_secs,
        completedAt: new Date(row.completed_at),
        createdAt: new Date(row.created_at),
    });
}

function toBookmark(row: BookmarkRow): TrainingBookmark {
    return TrainingBookmark.create({
        id: row.id,
        userId: row.user_id,
        concept: row.concept,
        question: row.question,
        answer: row.answer,
        relatedTopicId: row.related_topic_id,
        createdAt: new Date(row.created_at),
    });
}

// ─── Repositorio ──────────────────────────────────────────────────────────────

export class SupabaseTrainingRepository implements ITrainingRepository {
    constructor(private readonly supabaseAdmin: SupabaseClient) { }

    // ─── Multi-curso ───────────────────────────────

    async getCursoId(oposicion: string): Promise<string | null> {
        const { data } = await this.supabaseAdmin
            .from('training_courses')
            .select('motor_curso_id')
            .eq('oposicion', oposicion)
            .maybeSingle();
        return data?.motor_curso_id ?? null;
    }

    // ─── Simulacros ────────────────────────────────

    async listMockExams(input: { oposicion: string; userId: string }): Promise<MockExamWithStatus[]> {
        const [mocksRes, attemptsRes] = await Promise.all([
            this.supabaseAdmin
                .from('training_mock_exams')
                .select('*')
                .eq('oposicion', input.oposicion)
                .order('year', { ascending: false }),
            this.supabaseAdmin
                .from('training_attempts')
                .select('mock_exam_id, score, completed_at')
                .eq('user_id', input.userId)
                .eq('source', 'official')
                .not('mock_exam_id', 'is', null),
        ]);

        if (mocksRes.error) throw new Error(`listMockExams: ${mocksRes.error.message}`);

        // Indexa los mejores intentos por mock_exam_id
        const bestByMock = new Map<string, { score: number | null; completedAt: Date }>();
        for (const row of (attemptsRes.data ?? [])) {
            const existing = bestByMock.get(row.mock_exam_id);
            const score = row.score as number | null;
            const completedAt = new Date(row.completed_at as string);
            if (!existing || (score !== null && (existing.score === null || score > existing.score))) {
                bestByMock.set(row.mock_exam_id, { score, completedAt });
            }
        }

        return (mocksRes.data as MockExamRow[]).map((row) => {
            const best = bestByMock.get(row.id);
            return {
                exam: toMockExam(row),
                status: best ? 'completed' : 'pending',
                bestScore: best?.score ?? null,
                completedAt: best?.completedAt ?? null,
            };
        });
    }

    async getMockExam(id: string): Promise<MockExam | null> {
        const { data, error } = await this.supabaseAdmin
            .from('training_mock_exams')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw new Error(`getMockExam: ${error.message}`);
        return data ? toMockExam(data as MockExamRow) : null;
    }

    async listMockQuestions(mockExamId: string): Promise<GeneratedQuestion[]> {
        const { data, error } = await this.supabaseAdmin
            .from('training_questions')
            .select('id, topic_id, topic, text, options, correct_index, explanation, difficulty')
            .eq('mock_exam_id', mockExamId)
            .order('created_at', { ascending: true });
        if (error) throw new Error(`listMockQuestions: ${error.message}`);
        return ((data ?? []) as QuestionRow[]).map(toQuestion);
    }

    // ─── Intentos ──────────────────────────────────

    async saveAttempt(input: SaveAttemptInput): Promise<TrainingAttempt> {
        const attemptId = randomUUID();

        const { data, error } = await this.supabaseAdmin
            .from('training_attempts')
            .insert({
                id: attemptId,
                user_id: input.userId,
                source: input.source,
                mock_exam_id: input.mockExamId ?? null,
                topic_id: input.topicId ?? null,
                difficulty: input.difficulty ?? null,
                question_count: input.questionCount,
                correct_count: input.correctCount,
                wrong_count: input.wrongCount,
                blank_count: input.blankCount,
                score: input.score,
                duration_secs: input.durationSecs ?? null,
            })
            .select('*')
            .single();

        if (error || !data) throw new Error(`saveAttempt: ${error?.message}`);

        if (input.responses.length > 0) {
            // question_id → FK a training_questions. Las preguntas generadas por IA
            // no están persistidas ahí, así que hay que poner NULL o la FK falla.
            // Consultamos qué IDs existen realmente y mapeamos los ausentes a null.
            const candidateIds = input.responses
                .map((r) => r.questionId)
                .filter((id): id is string => typeof id === 'string');
            const knownIds = new Set<string>();
            if (candidateIds.length > 0) {
                const { data: existing, error: checkErr } = await this.supabaseAdmin
                    .from('training_questions')
                    .select('id')
                    .in('id', candidateIds);
                if (checkErr) throw new Error(`saveAttempt check ids: ${checkErr.message}`);
                for (const row of existing ?? []) knownIds.add((row as { id: string }).id);
            }

            const rows = input.responses.map((r) => ({
                attempt_id: attemptId,
                user_id: input.userId,
                question_id: r.questionId && knownIds.has(r.questionId) ? r.questionId : null,
                topic_id: r.topicId,
                topic: r.topic,
                question_text: r.questionText,
                options_snapshot: r.optionsSnapshot,
                correct_index: r.correctIndex,
                user_answer_index: r.userAnswerIndex,
                is_correct: r.userAnswerIndex !== null && r.userAnswerIndex === r.correctIndex,
                time_secs: r.timeSecs ?? null,
            }));

            const { error: respError } = await this.supabaseAdmin
                .from('training_attempt_responses')
                .insert(rows);

            if (respError) throw new Error(`saveAttempt responses: ${respError.message}`);
        }

        return toAttempt(data as AttemptRow);
    }

    // ─── Patrones de error ─────────────────────────

    async listErrorPatterns(userId: string): Promise<ErrorPattern[]> {
        // La vista ya filtra por auth.uid() — pero como usamos supabaseAdmin
        // (service role), tenemos que filtrar manualmente por user_id.
        const { data, error } = await this.supabaseAdmin
            .from('training_attempt_responses')
            .select('topic_id, topic, is_correct')
            .eq('user_id', userId);

        if (error) throw new Error(`listErrorPatterns: ${error.message}`);

        // Agrupamos en memoria (equivalente a la vista SQL)
        const byTopic = new Map<string, { topic: string; total: number; correct: number }>();
        for (const row of (data ?? [])) {
            const key = row.topic_id as string;
            const entry = byTopic.get(key) ?? { topic: row.topic as string, total: 0, correct: 0 };
            entry.total += 1;
            if (row.is_correct) entry.correct += 1;
            byTopic.set(key, entry);
        }

        const patterns: ErrorPattern[] = [];
        for (const [topicId, { topic, total, correct }] of byTopic.entries()) {
            if (total < 5) continue; // mínimo estadístico
            const wrong = total - correct;
            const domain = Math.round((correct / total) * 100);
            const failRate = Math.round((wrong / total) * 100);
            patterns.push({ topicId, topic, totalAnswered: total, totalCorrect: correct, totalWrong: wrong, domain, failRate });
        }

        return patterns.sort((a, b) => b.failRate - a.failRate);
    }

    // ─── Bookmarks ─────────────────────────────────

    async listBookmarks(userId: string): Promise<TrainingBookmark[]> {
        const { data, error } = await this.supabaseAdmin
            .from('training_bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(`listBookmarks: ${error.message}`);
        return ((data ?? []) as BookmarkRow[]).map(toBookmark);
    }

    async saveBookmark(input: {
        userId: string;
        concept: string;
        question: string;
        answer: string;
        relatedTopicId?: string;
    }): Promise<TrainingBookmark> {
        const { data, error } = await this.supabaseAdmin
            .from('training_bookmarks')
            .insert({
                user_id: input.userId,
                concept: input.concept,
                question: input.question,
                answer: input.answer,
                related_topic_id: input.relatedTopicId ?? null,
            })
            .select('*')
            .single();
        if (error || !data) throw new Error(`saveBookmark: ${error?.message}`);
        return toBookmark(data as BookmarkRow);
    }

    async deleteBookmark(input: { userId: string; bookmarkId: string }): Promise<void> {
        const { data, error } = await this.supabaseAdmin
            .from('training_bookmarks')
            .delete()
            .eq('id', input.bookmarkId)
            .eq('user_id', input.userId)
            .select('id')
            .maybeSingle();
        if (error) throw new Error(`deleteBookmark: ${error.message}`);
        if (!data) throw new BookmarkNotFoundError();
    }

    // ─── Reportes y valoraciones de preguntas ─────

    async reportQuestion(input: {
        userId: string;
        questionId: string;
        reason: string;
        details?: string;
    }): Promise<void> {
        const { error } = await this.supabaseAdmin
            .from('question_reports')
            .insert({
                user_id: input.userId,
                question_id: input.questionId,
                reason: input.reason,
                details: input.details ?? null,
            });
        if (error) throw new Error(`reportQuestion: ${error.message}`);
    }

    async rateQuestion(input: {
        userId: string;
        questionId: string;
        rating: number;
    }): Promise<{ questionId: string; rating: number }> {
        const { data, error } = await this.supabaseAdmin
            .from('question_ratings')
            .upsert(
                {
                    user_id: input.userId,
                    question_id: input.questionId,
                    rating: input.rating,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,question_id' },
            )
            .select('question_id, rating')
            .single();
        if (error || !data) throw new Error(`rateQuestion: ${error?.message}`);
        return { questionId: data.question_id as string, rating: data.rating as number };
    }

    // ─── Progreso de simulacro (resume) ───────────

    async saveMockProgress(input: {
        userId: string;
        mockExamId: string;
        examTitle: string;
        currentIndex: number;
        questionCount: number;
        answers: unknown[];
    }): Promise<void> {
        const { error } = await this.supabaseAdmin
            .from('mock_exam_progress')
            .upsert(
                {
                    user_id: input.userId,
                    mock_exam_id: input.mockExamId,
                    exam_title: input.examTitle,
                    current_index: input.currentIndex,
                    question_count: input.questionCount,
                    answers_snapshot: input.answers,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            );
        if (error) throw new Error(`saveMockProgress: ${error.message}`);
    }

    async getMockProgress(userId: string): Promise<MockExamProgress | null> {
        const { data, error } = await this.supabaseAdmin
            .from('mock_exam_progress')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw new Error(`getMockProgress: ${error.message}`);
        if (!data) return null;
        return {
            mockExamId: data.mock_exam_id as string,
            examTitle: data.exam_title as string,
            currentIndex: data.current_index as number,
            questionCount: data.question_count as number,
            answers: (data.answers_snapshot as unknown[]) ?? [],
            updatedAt: new Date(data.updated_at as string),
        };
    }

    async clearMockProgress(userId: string): Promise<void> {
        const { error } = await this.supabaseAdmin
            .from('mock_exam_progress')
            .delete()
            .eq('user_id', userId);
        if (error) throw new Error(`clearMockProgress: ${error.message}`);
    }

    // ─── Última ley consultada ─────────────────────

    async saveLawView(input: {
        userId: string;
        law: string;
        article?: string;
        articleTitle?: string;
        boeUrl?: string;
        topicId?: string;
    }): Promise<void> {
        const { error } = await this.supabaseAdmin
            .from('user_law_views')
            .upsert(
                {
                    user_id: input.userId,
                    law: input.law,
                    article: input.article ?? null,
                    article_title: input.articleTitle ?? null,
                    boe_url: input.boeUrl ?? null,
                    topic_id: input.topicId ?? null,
                    viewed_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            );
        if (error) throw new Error(`saveLawView: ${error.message}`);
    }

    async getLastLawView(userId: string): Promise<LawView | null> {
        const { data, error } = await this.supabaseAdmin
            .from('user_law_views')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw new Error(`getLastLawView: ${error.message}`);
        if (!data) return null;
        return {
            law: data.law as string,
            article: (data.article as string | null) ?? null,
            articleTitle: (data.article_title as string | null) ?? null,
            boeUrl: (data.boe_url as string | null) ?? null,
            topicId: (data.topic_id as string | null) ?? null,
            viewedAt: new Date(data.viewed_at as string),
        };
    }
}
