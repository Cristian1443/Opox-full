import { useEffect, useRef, useState } from 'react';
import { trainingApi } from '../api';

// Hook de polling para el flujo streaming del Motor. Recibe un `jobId` y
// devuelve las preguntas publicadas hasta el momento + progreso. Cuando el
// caller no pasa `jobId`, el hook queda inactivo (útil para el flujo síncrono
// legacy que ya recibe las preguntas por `route.params.questions`).
//
// Ciclo de vida:
//  1. GET /training/job/:jobId cada `intervalMs` (default 1500ms).
//  2. En cada tick, si ya hay sessionId, dispara GET /training/session/:sessionId
//     y agrega las nuevas preguntas al array (dedupe por id) — sin esperar
//     ninguna señal de progreso del Motor, que no es confiable (ver abajo).
//  3. Cuando `status === 'done'`, detiene el polling.
//  4. Timeout total `timeoutMs` (default 360 s). Al agotarse marca `error='TIMEOUT'`.
//
// El hook expone `postAnswer(questionId, optionIndex)` para enviar respuestas
// mientras el motor sigue generando (postSessionAnswer del backend).

// Intervalo bajado a 1.5 s (antes 2.5 s) — descubre preguntas nuevas más rápido.
// Timeout subido a 360 s (antes 180 s) tras barrido de rendimiento:
// n=30 media null tarda ~191 s en el Motor, n=50 supera los 300 s con
// frecuencia. Con 180 s el usuario veía "El motor está tardando más
// de lo normal" en tests medianos aunque el job estuviera casi listo.
// Combinar con G09 (cap del picker a 30 preguntas mientras no se
// paralelice) para no dejar al usuario esperando 6 minutos.
const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 360_000;

export function useTestSession(jobId, opts = {}) {
    const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const expectedTotal = opts.expectedTotal ?? 0;
    // Temas solicitados por el usuario — usados para el fill del banco en el backend.
    const requestedTopicId = opts.requestedTopicId ?? null;

    const [questions, setQuestions] = useState([]);
    // Progreso real del Motor (rara vez se actualiza incremental — se guarda
    // solo por si el caller lo necesita, pero el "done" que se EXPONE al
    // usuario es `questions.length`, ver más abajo).
    const [realProgress, setRealProgress] = useState({ done: 0, total: expectedTotal });
    const [status, setStatus] = useState('idle'); // idle → running → done | error
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    // deficitDetail del Motor cuando entrega menos preguntas de las pedidas
    // (G08 · INFORME_GENERADOR_INFINITO.md). Ver getSessionQuestions del backend.
    const [deficit, setDeficit] = useState(null);

    const knownIdsRef = useRef(new Set());
    const activeRef = useRef(true);
    const sessionIdRef = useRef(null);
    sessionIdRef.current = sessionId;

    // Polling del job (progreso REAL)
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

            if (job?.progress) setRealProgress(job.progress);
            if (job?.sessionId && sessionIdRef.current !== job.sessionId) setSessionId(job.sessionId);

            // El Motor no siempre publica progreso incremental; `progress.done`
            // puede quedarse en 0 hasta que el job termina, aunque ya haya
            // preguntas reales disponibles en la sesión. Antes solo se
            // consultaba `getSessionQuestions` cuando `progress.done >= 1`,
            // así que en esos casos NUNCA se descubrían las preguntas ya
            // generadas hasta el final del job — el cliente pedía
            // explícitamente arrancar con 1-2 preguntas listas, no esperar.
            // Fix: consultar en cada tick en cuanto exista sessionId, sin
            // esperar la señal de progreso (que puede no llegar a tiempo o
            // nunca). getSessionQuestions ya es barata y devuelve array
            // vacío si la sesión aún no tiene nada.
            const sid = job?.sessionId ?? sessionIdRef.current;
            const jobDone = job?.status === 'done';
            if (sid) {
                const { data: sess } = await trainingApi.getSessionQuestions(sid, {
                    temaIds: requestedTopicId || undefined,
                    done: jobDone,
                });
                if (!activeRef.current) return;
                if (Array.isArray(sess?.questions)) {
                    const fresh = sess.questions.filter((q) => !knownIdsRef.current.has(q.id));
                    for (const q of fresh) knownIdsRef.current.add(q.id);
                    if (fresh.length > 0) setQuestions((prev) => [...prev, ...fresh]);
                }
                // Deficit: solo lo exponemos cuando el Motor ya terminó, para
                // no mostrar el modal en mitad del stream si el Motor está a
                // punto de publicar más preguntas.
                if (jobDone && sess?.deficitDetail) setDeficit(sess.deficitDetail);
            }

            if (jobDone) {
                setStatus('done');
                return;
            }
            timer = setTimeout(tick, intervalMs);
        };

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

    // El "done" expuesto es SIEMPRE `questions.length` — el número real de
    // preguntas ya cargadas y listas para mostrar, nunca una estimación.
    // Antes se mostraba un progreso simulado que avanzaba solo con el reloj
    // (independiente de si el Motor había generado algo de verdad), y podía
    // decir "8 de 10 listas" cuando en realidad solo había 2 — confuso y
    // contradecía al DeficitWarningModal cuando el Motor entregaba menos de
    // lo pedido. `questions.length` nunca puede mentir: es exactamente lo
    // que el usuario puede ver y responder ahora mismo.
    const progress = { done: questions.length, total: realProgress.total || expectedTotal };

    return { questions, progress, status, error, sessionId, postAnswer, deficit };
}
