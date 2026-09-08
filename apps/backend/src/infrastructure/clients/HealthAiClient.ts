import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';

export interface HealthAiConfig {
    baseUrl: string;
    apiKey: string;
    timeoutMs?: number;
}

export class HealthAiClient {
    private readonly http: AxiosInstance;
    private static readonly MODEL = 'gpt-4o-mini';

    constructor(config: HealthAiConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs ?? 30_000,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[health-ai] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.error?.message ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    private async chatJson(system: string, user: string, maxTokens: number): Promise<unknown> {
        for (let attempt = 1; attempt <= 2; attempt++) {
            const { data } = await this.http.post('/chat/completions', {
                model: HealthAiClient.MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                max_tokens: maxTokens,
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });
            const content: string = data.choices?.[0]?.message?.content ?? '';
            try {
                return JSON.parse(content);
            } catch {
                if (attempt === 2) throw new Error('[health-ai] JSON parse falló en 2 intentos');
                logger.warn('[health-ai] JSON parse falló, reintentando');
            }
        }
    }

    // ─── Tarea 2: Menús de estudio ────────────────────────────────────────────
    async generateMenus(input: {
        objetivo: string;
        fatigueLevel: string;
        restrictions: string[];
        count: number;
    }): Promise<unknown> {
        const restrictionsText = input.restrictions.length > 0
            ? `Restricciones dietéticas del usuario: ${input.restrictions.join(', ')}.`
            : 'Sin restricciones dietéticas.';

        const fatigueNote = input.fatigueLevel === 'alto'
            ? 'IMPORTANTE: El usuario tiene fatiga alta hoy — prioriza siempre la recuperación aunque el objetivo elegido sea otro.'
            : input.fatigueLevel === 'medio'
                ? 'El usuario tiene fatiga media — equilibra el objetivo con alimentos que favorezcan la recuperación.'
                : '';

        const system = `Eres un nutricionista deportivo especializado en rendimiento cognitivo para estudiantes de oposiciones españolas.
Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "menus": [
    {
      "titulo": "string",
      "tipo": "string (ej: Concentración, Energía, Examen, Recuperación)",
      "comidas": {
        "desayuno": { "nombre": "string", "descripcion": "string", "kcal": number },
        "comida": { "nombre": "string", "descripcion": "string", "kcal": number },
        "cena": { "nombre": "string", "descripcion": "string", "kcal": number }
      },
      "kcal_total": number,
      "macros": { "proteinas_g": number, "carbohidratos_g": number, "grasas_g": number },
      "beneficio": "string (1 frase explicando el beneficio cognitivo)",
      "lista_compra": ["string"]
    }
  ]
}`;

        const user = `Genera ${input.count} menú(s) completo(s) para un estudiante de oposiciones.
Objetivo del día: ${input.objetivo}.
${restrictionsText}
${fatigueNote}
Incluye ingredientes fáciles de encontrar en España. Las kcal deben ser realistas (1800-2200 kcal/día total).`;

        return this.chatJson(system, user, 1500);
    }

    // ─── Tarea 3: Guión de meditación ────────────────────────────────────────
    async generateMeditation(input: {
        tipo: string;
        duracion: number;
        fatigueLevel: string;
        diasHastaExamen?: number | null;
    }): Promise<unknown> {
        const examContext = input.diasHastaExamen != null && input.diasHastaExamen <= 7
            ? `El usuario tiene el examen en ${input.diasHastaExamen} días — adapta el tono para calmar la ansiedad.`
            : '';

        const totalSegundos = input.duracion * 60;

        const system = `Eres un instructor de mindfulness especializado en gestión del estrés para opositores.
Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "titulo": "string",
  "subtitulo": "string (ej: gestión de la ansiedad)",
  "fases": [
    { "nombre": "string", "texto": "string (instrucción para mostrar en pantalla)", "segundos": number }
  ]
}
CRÍTICO: La suma de todos los campos "segundos" debe ser exactamente ${totalSegundos}.
El texto de cada fase debe ser la instrucción que el usuario lee en pantalla durante esa fase (voz tranquilizadora, presente).`;

        const user = `Crea una sesión de meditación de tipo "${input.tipo}" de ${input.duracion} minutos exactos.
Nivel de fatiga del usuario: ${input.fatigueLevel}.
${examContext}
Divide la sesión en 3-4 fases (introducción, ejercicio principal, cierre). Suma total: ${totalSegundos} segundos.`;

        return this.chatJson(system, user, 1200);
    }

    // ─── Tarea 4: Técnica de estudio recomendada ──────────────────────────────
    async recommendStudyTechnique(input: {
        fatigueLevel: string;
        fatigueType?: string | null;
        diasHastaExamen?: number | null;
        ultimoTema?: string | null;
        tiempoDisponible?: number | null;
    }): Promise<unknown> {
        const examContext = input.diasHastaExamen != null
            ? `Días hasta el examen: ${input.diasHastaExamen}.`
            : 'Fecha de examen no especificada.';

        const temaContext = input.ultimoTema
            ? `Último tema trabajado: ${input.ultimoTema}.`
            : '';

        const tiempoContext = input.tiempoDisponible
            ? `Tiempo disponible hoy: ${input.tiempoDisponible} minutos.`
            : '';

        // Reglas de negocio inyectadas en el prompt
        const rules = `REGLAS OBLIGATORIAS:
- Si fatiga alta Y examen en ≤3 días → recomienda SIEMPRE "Práctica de preguntas cortas" (máxima eficiencia, mínimo desgaste).
- Si fatiga alta Y estrés agudo Y examen en ≤7 días → recomienda SIEMPRE "Repaso en audio" y menciona el Podcast del Aula Virtual.
- Para cualquier otro caso, elige la técnica más adecuada entre: Técnica Pomodoro, Repetición espaciada, Active recall, Curva del olvido, Lectura activa, Mapas mentales, Práctica de preguntas cortas.`;

        const system = `Eres un coach de aprendizaje especializado en preparación de oposiciones españolas.
Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "tecnica": "string (nombre de la técnica)",
  "porque": "string (1-2 frases citando los datos concretos del usuario que justifican esta elección)",
  "adaptacion": "string (cómo aplicar la técnica hoy teniendo en cuenta su estado)",
  "tema_sugerido": "string o null (qué parte del temario conviene trabajar hoy)"
}
${rules}`;

        const user = `Recomienda la técnica de estudio más adecuada para hoy.
Nivel de fatiga: ${input.fatigueLevel}${input.fatigueType ? ` (tipo: ${input.fatigueType})` : ''}.
${examContext}
${temaContext}
${tiempoContext}`;

        return this.chatJson(system, user, 600);
    }
}
