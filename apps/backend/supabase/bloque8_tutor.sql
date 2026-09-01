-- ============================================================
-- BLOQUE 8 · AULA VIRTUAL / TUTOR IA
-- Ejecutar después de los seeds de bloques anteriores
-- ============================================================

-- ── Conversaciones del chat ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       text NOT NULL DEFAULT 'Nueva conversación',
    topic       text,
    last_message text,
    created_at  timestamptz DEFAULT now() NOT NULL,
    updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user
    ON tutor_conversations(user_id, updated_at DESC);

ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_conversations
    FOR ALL USING (auth.uid() = user_id);

-- ── Mensajes del chat ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            text NOT NULL CHECK (role IN ('user', 'assistant')),
    content         text NOT NULL,
    created_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation
    ON tutor_messages(conversation_id, created_at ASC);

ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_messages
    FOR ALL USING (auth.uid() = user_id);

-- Migración: chips de acción sugeridos por la IA con cada mensaje
ALTER TABLE tutor_messages ADD COLUMN IF NOT EXISTS suggested_actions jsonb DEFAULT NULL;

-- ── Mazos de flashcards ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_flashcard_decks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id    text NOT NULL,
    topic_title text NOT NULL,
    oposicion   text NOT NULL,
    card_count  integer NOT NULL DEFAULT 0,
    created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_decks_user
    ON tutor_flashcard_decks(user_id, created_at DESC);

ALTER TABLE tutor_flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_flashcard_decks
    FOR ALL USING (auth.uid() = user_id);

-- ── Tarjetas individuales ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_flashcard_cards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id         uuid NOT NULL REFERENCES tutor_flashcard_decks(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question        text NOT NULL,
    answer          text NOT NULL,
    ease_factor     numeric(4,2) NOT NULL DEFAULT 2.5,
    interval_days   integer NOT NULL DEFAULT 1,
    next_review_at  timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_cards_deck
    ON tutor_flashcard_cards(deck_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tutor_cards_review
    ON tutor_flashcard_cards(user_id, next_review_at ASC);

ALTER TABLE tutor_flashcard_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_flashcard_cards
    FOR ALL USING (auth.uid() = user_id);

-- ── Registro de sesiones de repaso ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_flashcard_reviews (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id      uuid NOT NULL REFERENCES tutor_flashcard_decks(id) ON DELETE CASCADE,
    known_count  integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    completed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_reviews_user
    ON tutor_flashcard_reviews(user_id, completed_at DESC);

ALTER TABLE tutor_flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_flashcard_reviews
    FOR ALL USING (auth.uid() = user_id);

-- ── Episodios de podcast (administrador los crea; IA los generará) ─────────────
CREATE TABLE IF NOT EXISTS tutor_podcast_episodes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    oposicion        text NOT NULL,
    topic_id         text NOT NULL,
    topic_title      text NOT NULL,
    duration_seconds integer NOT NULL DEFAULT 600,
    created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_episodes_oposicion
    ON tutor_podcast_episodes(oposicion, created_at ASC);

ALTER TABLE tutor_podcast_episodes ENABLE ROW LEVEL SECURITY;
-- Los episodios son públicos para usuarios autenticados
CREATE POLICY "read_authenticated" ON tutor_podcast_episodes
    FOR SELECT USING (auth.role() = 'authenticated');

-- ── Progreso de reproducción del usuario ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_podcast_progress (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    episode_id   uuid NOT NULL REFERENCES tutor_podcast_episodes(id) ON DELETE CASCADE,
    position_secs integer NOT NULL DEFAULT 0,
    updated_at   timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, episode_id)
);

ALTER TABLE tutor_podcast_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON tutor_podcast_progress
    FOR ALL USING (auth.uid() = user_id);

-- ── Resúmenes inteligentes (IA los genera y se cachean aquí) ─────────────────
CREATE TABLE IF NOT EXISTS tutor_summaries (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    oposicion    text NOT NULL,
    topic_id     text NOT NULL,
    topic_title  text NOT NULL,
    sections     jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at   timestamptz DEFAULT now() NOT NULL,
    updated_at   timestamptz DEFAULT now() NOT NULL,
    UNIQUE(oposicion, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_summaries_oposicion
    ON tutor_summaries(oposicion, topic_title ASC);

ALTER TABLE tutor_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_authenticated" ON tutor_summaries
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DE DEMO  (oposicion = 'aux-adm-estado')
-- ============================================================

-- Episodios de podcast de demo
INSERT INTO tutor_podcast_episodes (oposicion, topic_id, topic_title, duration_seconds) VALUES
    ('aux-adm-estado', 'constitucion',      'Constitución Española · Título I',    720),
    ('aux-adm-estado', 'ley-39',            'Ley 39/2015 · Procedimiento Administrativo', 600),
    ('aux-adm-estado', 'ley-40',            'Ley 40/2015 · Régimen Jurídico del Sector Público', 540),
    ('aux-adm-estado', 'opositor-estrategia','Estrategia de estudio para la convocatoria 2026', 480)
ON CONFLICT DO NOTHING;

-- Resúmenes de demo
INSERT INTO tutor_summaries (oposicion, topic_id, topic_title, sections) VALUES
(
    'aux-adm-estado',
    'constitucion',
    'Constitución Española · Título I',
    '[
        {
            "id": "principles",
            "type": "principles",
            "title": "PRINCIPIOS CLAVE",
            "icon": "star-outline",
            "content": [
                "Igualdad ante la ley (art. 14)",
                "Dignidad de la persona como fundamento del orden político",
                "Los derechos fundamentales vinculan a todos los poderes públicos"
            ]
        },
        {
            "id": "structure",
            "type": "structure",
            "title": "ESTRUCTURA",
            "icon": "layers-outline",
            "content": [
                "Cap. I — Españoles y extranjeros (arts. 11-13)",
                "Cap. II — Derechos y libertades (arts. 14-38)",
                "Cap. III — Principios rectores (arts. 39-52)",
                "Cap. IV — Garantías (arts. 53-54)",
                "Cap. V — Suspensión de derechos (art. 55)"
            ]
        },
        {
            "id": "reminder",
            "type": "reminder",
            "title": "A RECORDAR",
            "icon": "alert-circle-outline",
            "content": [
                "El art. 14 abre la sección de derechos: igualdad sin discriminación.",
                "Los arts. 15-29 son derechos fundamentales protegidos por recurso de amparo.",
                "Solo se suspenden derechos (art. 55) en estados de excepción o sitio."
            ]
        }
    ]'::jsonb
),
(
    'aux-adm-estado',
    'ley-39',
    'Ley 39/2015 · Procedimiento Administrativo',
    '[
        {
            "id": "principles",
            "type": "principles",
            "title": "PRINCIPIOS CLAVE",
            "icon": "star-outline",
            "content": [
                "Eficacia, eficiencia y servicio a los ciudadanos",
                "Transparencia y participación",
                "Administración electrónica como canal preferente"
            ]
        },
        {
            "id": "structure",
            "type": "structure",
            "title": "ESTRUCTURA",
            "icon": "layers-outline",
            "content": [
                "Título I — Disposiciones generales sobre actividad administrativa",
                "Título II — Actividad de las AAPP",
                "Título III — Actos administrativos",
                "Título IV — Disposiciones sobre el procedimiento",
                "Título V — Revisión de actos en vía administrativa"
            ]
        },
        {
            "id": "reminder",
            "type": "reminder",
            "title": "A RECORDAR",
            "icon": "alert-circle-outline",
            "content": [
                "Plazo general de resolución: 3 meses (art. 21.2).",
                "Silencio positivo regla general; silencio negativo excepción (art. 24).",
                "Recurso de alzada: 1 mes desde notificación del acto expreso."
            ]
        }
    ]'::jsonb
)
ON CONFLICT (oposicion, topic_id) DO NOTHING;
