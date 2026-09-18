import { useEffect, useRef, useState } from 'react';
import { trainingApi } from '../api';

// Hook de polling para el flujo streaming del Motor. Recibe un `jobId` y
// devuelve las preguntas publicadas hasta el momento + progreso. Cuando el
// caller no pasa `jobId`, el hook queda inactivo (útil para el flujo síncrono
// legacy que ya recibe las preguntas por `route.params.questions`).
//
// Ciclo de vida:
//  1. GET /training/job/:jobId cada `intervalMs` (default 2500ms).
//  2. Cuando `progress.done >= 1` y hay sessionId, dispara GET /training/session/:sessionId
//     y agrega las nuevas preguntas al array (dedupe por id).
//  3. Cuando `status === 'done'`, detiene el polling.
//  4. Timeout total `timeoutMs` (default 90 s). Al agotarse marca `error='TIMEOUT'`.
//
// El hook expone `postAnswer(questionId, optionIndex)` para enviar respuestas
// mientras el motor sigue generando (postSessionAnswer del backend).

// Intervalo bajado a 1.5 s (antes 2.5 s) — el contador "N de M preguntas"
// avanza ~40 % más rápido, reduce la sensación de "no pasa nada".
// Timeout subido a 180 s (antes 90 s) — el Motor tarda 60-120 s en generar
// 30 preguntas RAG con evidencia verbatim; 90 s cortaba antes de terminar
// y el usuario veía "El motor está tardando más de lo normal" aunque el
// job estaba a punto de completar.
const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 180_000;

export function useTestSession(jobId, opts = {}) {
    const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const [questions, setQuestions] = useState([]);
    const [progress, setProgress] = useState({ done: 0, total: opts.expectedTotal ?? 0 });
    const [status, setStatus] = useState('idle'); // idle → running → done | error
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const knownIdsRef = useRef(new Set());
    const activeRef = useRef(true);

    useEffect(() => {
        if (!jobId) return undefined;
        activeRef.current = true;
        setStatus('running');
        const startedAt = Date.now();
        let timer = null;

        const tick = async () => {
            if (!activeRef.current) return;
            if (Date.now() - startedAt > timeoutMs) {
                setStatus('error');
                setError('TIMEOUT');
                return;
            }

            const { data: job, error: jobErr } = await trainingApi.getJobStatus(jobId);
            if (!activeRef.current) return;
            if (jobErr) {
                setStatus('error');
                setError(jobErr?.code ?? 'JOB_ERROR');
                return;
            }

            if (job?.progress) setProgress(job.progress);
            if (job?.sessionId && sessionId !== job.sessionId) setSessionId(job.sessionId);

            // El Motor no siempre publica progreso incremental; `progress.done`
            // puede quedarse en 0 hasta que el job termina. Refrescamos las
            // preguntas cuando (a) hay progreso publicado ≥ 1, o (b) el job
            // ya está en 'done' — en ambos casos el sessionId debe existir.
            const sid = job?.sessionId ?? sessionId;
            const jobDone = job?.status === 'done';
            if (sid && (job?.progress?.done >= 1 || jobDone)) {
                const { data: sess } = await trainingApi.getSessionQuestions(sid);
                if (!activeRef.current) return;
                if (Array.isArray(sess?.questions)) {
                    const fresh = sess.questions.filter((q) => !knownIdsRef.current.has(q.id));
                    for (const q of fresh) knownIdsRef.current.add(q.id);
                    if (fresh.length > 0) setQuestions((prev) => [...prev, ...fresh]);
                }
            }

            if (jobDone) {
                setStatus('done');
                return;
            }
            timer = setTimeout(tick, intervalMs);
        };

        // Primera consulta inmediata; luego se auto-programa cada intervalMs.
        tick();

        return () => {
            activeRef.current = false;
            if (timer) clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);

    const postAnswer = async (questionId, optionIndex) => {
        if (!sessionId) return null;
        const { data } = await trainingApi.postSessionAnswer(sessionId, { questionId, optionIndex });
        return data ?? null;
    };

    return { questions, progress, status, error, sessionId, postAnswer };
}
