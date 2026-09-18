import { useEffect, useRef, useState } from 'react';
import { trainingApi } from '../api';

// Hook de polling para el flujo streaming del Motor. Recibe un `jobId` y
// devuelve las preguntas publicadas hasta el momento + progreso. Cuando el
// caller no pasa `jobId`, el hook queda inactivo (útil para el flujo síncrono
// legacy que ya recibe las preguntas por `route.params.questions`).
//
// Ciclo de vida:
//  1. GET /training/job/:jobId cada `intervalMs` (default 1500ms).
//  2. Cuando `progress.done >= 1` y hay sessionId, dispara GET /training/session/:sessionId
//     y agrega las nuevas preguntas al array (dedupe por id).
//  3. Cuando `status === 'done'`, detiene el polling.
//  4. Timeout total `timeoutMs` (default 360 s). Al agotarse marca `error='TIMEOUT'`.
//
// El hook expone `postAnswer(questionId, optionIndex)` para enviar respuestas
// mientras el motor sigue generando (postSessionAnswer del backend).

// Intervalo bajado a 1.5 s (antes 2.5 s) — el contador "N de M preguntas"
// avanza ~40 % más rápido, reduce la sensación de "no pasa nada".
// Timeout subido a 360 s (antes 180 s) tras barrido de rendimiento:
// n=30 media null tarda ~191 s en el Motor, n=50 supera los 300 s con
// frecuencia. Con 180 s el usuario veía "El motor está tardando más
// de lo normal" en tests medianos aunque el job estuviera casi listo.
// Combinar con G09 (cap del picker a 30 preguntas mientras no se
// paralelice) para no dejar al usuario esperando 6 minutos.
const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 360_000;

// Ritmo de progreso simulado (G02(A) — INFORME_GENERADOR_INFINITO.md).
// El Motor A VECES publica `progress.done` incremental (batches cada ~30-60s
// según barrido de replay 2026-09-18: 3→7→11→15→21→27) pero otras se queda
// en 0 hasta el final. Usamos progreso simulado como fallback: si el Motor
// publica real más rápido, el `max(real, simulado)` prevalece. Si no, el
// usuario ve algo moviéndose en vez de "0 de 30" durante 3 min.
// Datos: n=10 → 73 s, n=20 → 135 s, n=30 → 191 s (~6.4 s/pregunta).
// Usamos 7 s para quedarnos ligeramente por debajo de la realidad.
const SIMULATED_STEP_MS = 7000;

export function useTestSession(jobId, opts = {}) {
    const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const expectedTotal = opts.expectedTotal ?? 0;

    const [questions, setQuestions] = useState([]);
    // Progreso real del Motor (rara vez se actualiza incremental).
    const [realProgress, setRealProgress] = useState({ done: 0, total: expectedTotal });
    // Progreso simulado — corre en paralelo mientras el Motor genera.
    // Nunca supera `total - 1` para dejar la "última pregunta" a la señal real.
    const [simulatedDone, setSimulatedDone] = useState(0);
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
            // puede quedarse en 0 hasta que el job termina. Refrescamos las
            // preguntas cuando (a) hay progreso publicado ≥ 1, o (b) el job
            // ya está en 'done' — en ambos casos el sessionId debe existir.
            const sid = job?.sessionId ?? sessionIdRef.current;
            const jobDone = job?.status === 'done';
            if (sid && (job?.progress?.done >= 1 || jobDone)) {
                const { data: sess } = await trainingApi.getSessionQuestions(sid);
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

    // Progreso SIMULADO — corre en paralelo mientras el status sea 'running'.
    // Se detiene al llegar a `total - 1` (deja el último salto para la señal
    // real cuando el job entra en 'done'). Solo se activa si conocemos el
    // total (via `expectedTotal` del caller o `progress.total` del Motor).
    useEffect(() => {
        if (status !== 'running') return undefined;
        const total = realProgress.total || expectedTotal;
        if (total <= 1) return undefined;
        const id = setInterval(() => {
            setSimulatedDone((prev) => (prev < total - 1 ? prev + 1 : prev));
        }, SIMULATED_STEP_MS);
        return () => clearInterval(id);
    }, [status, realProgress.total, expectedTotal]);

    // Al terminar (status === 'done'), completar el progreso visual al 100%.
    useEffect(() => {
        if (status === 'done') {
            const total = realProgress.total || expectedTotal;
            if (total > 0) setSimulatedDone(total);
        }
    }, [status, realProgress.total, expectedTotal]);

    const postAnswer = async (questionId, optionIndex) => {
        if (!sessionId) return null;
        const { data } = await trainingApi.postSessionAnswer(sessionId, { questionId, optionIndex });
        return data ?? null;
    };

    // El `progress.done` expuesto es el mayor entre el real y el simulado.
    // Así, si el Motor SÍ publica progreso incremental (caso raro pero posible),
    // se muestra el real; si no, se muestra el simulado.
    const displayedDone = Math.max(realProgress.done || 0, simulatedDone);
    const displayedTotal = realProgress.total || expectedTotal;
    const progress = { done: displayedDone, total: displayedTotal };

    return { questions, progress, status, error, sessionId, postAnswer, deficit };
}
