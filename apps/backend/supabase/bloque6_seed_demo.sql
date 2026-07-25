-- ─────────────────────────────────────────────────────────────────────────────
-- Bloque 6 · Seed DEMO — datos realistas para probar la app
-- ─────────────────────────────────────────────────────────────────────────────
-- Ejecutar DESPUÉS de bloque6_entrenamiento.sql.
-- Idempotente: puede correrse varias veces sin duplicar.
--
-- Contenido:
--   PARTE 1 — 32 preguntas oficiales repartidas entre los 4 simulacros
--             (Justicia · Tramitación 2019/2021/2022/2023). Alimenta la
--             pantalla "Simulacros oficiales" (6.6 → 6.7 → 7.x).
--             Ajusta los mock_exams a 8 preguntas · 10 min para que
--             coincidan con las preguntas realmente sembradas.
--
--   PARTE 2 — 3 intentos previos + ~30 respuestas para UN usuario concreto.
--             Los fallos están concentrados en "Ley 39/2015" y "Ley 40/2015"
--             para que aparezcan como debilidades en el Laboratorio de
--             Errores (6.8) — necesita ≥5 respuestas por tema para salir.
--             Cambia el email en el CREATE TEMP TABLE si tu usuario es otro.
--             Si el usuario no existe, los INSERT SELECT insertan 0 filas
--             (no dan error) — busca la marca ⚠️ en el archivo.
--
-- NOTA sobre el "Generador infinito":
--   No lee de esta tabla — sus preguntas las produce la IA (o el stub
--   AiApiClientStub en dev). Este seed no lo afecta.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── PARTE 1 · Preguntas oficiales ───────────────────────────────────────────
-- Ajustamos primero los mock_exams a 8 preguntas · 10 minutos para que las
-- tarjetas de la pantalla 6.6 muestren cifras coherentes con lo sembrado.
update public.training_mock_exams
   set question_count = 8,
       duration_minutes = 10
 where oposicion = 'justicia-tramitacion'
   and year in (2019, 2021, 2022, 2023);


-- 32 preguntas · 5 temas · 4 exámenes. IDs semánticos:
--   00000000-0000-0006-0001-0000000000NN   NN = 01..32
insert into public.training_questions
    (id, mock_exam_id, oposicion, topic_id, topic, text, options, correct_index, explanation, difficulty, source)
values

-- ══════════ EXAMEN 2019 (preguntas 01-08) ══════════
('00000000-0000-0006-0001-000000000001'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿Cuántos artículos tiene la Constitución Española de 1978?',
 '["139","157","169","183"]'::jsonb, 2,
 'La Constitución Española de 1978 tiene 169 artículos, distribuidos en un Título Preliminar y 10 Títulos.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000002'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 'Según el artículo 159 CE, ¿cómo se compone el Tribunal Constitucional?',
 '["12 miembros: 4 Congreso, 4 Senado, 2 Gobierno y 2 CGPJ","10 miembros: 4 Congreso, 4 Senado y 2 Gobierno","12 miembros nombrados por el Presidente del Gobierno","12 miembros: 6 Congreso y 6 Senado por mayoría absoluta"]'::jsonb, 0,
 'El TC se compone de 12 miembros nombrados por el Rey: 4 a propuesta del Congreso, 4 del Senado, 2 del Gobierno y 2 del CGPJ (art. 159.1 CE).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000003'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿Cuál es el plazo general para resolver un procedimiento administrativo?',
 '["1 mes","2 meses","3 meses","6 meses"]'::jsonb, 2,
 'El art. 21.2 Ley 39/2015 fija el plazo general en 3 meses, salvo que otra norma con rango de ley establezca uno mayor.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000004'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿Qué efecto general tiene el silencio administrativo en los procedimientos iniciados a solicitud del interesado?',
 '["Desestimatorio","Estimatorio","Suspensivo","Anulatorio"]'::jsonb, 1,
 'El art. 24.1 Ley 39/2015 establece que el silencio es, con carácter general, estimatorio (positivo) salvo las excepciones previstas.',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000005'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 '¿Cuál de los siguientes NO es un principio general de la Ley 40/2015?',
 '["Eficacia","Jerarquía","Beneficio máximo","Transparencia"]'::jsonb, 2,
 '"Beneficio máximo" no figura en la Ley 40/2015. Eficacia, jerarquía y transparencia sí están en el art. 3.',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000006'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 '¿Qué órgano ostenta la representación ordinaria de la Administración General del Estado en la Comunidad Autónoma?',
 '["El Presidente autonómico","El Delegado del Gobierno","El Subdelegado del Gobierno","El Ministro de Política Territorial"]'::jsonb, 1,
 'El Delegado del Gobierno representa al Gobierno de la Nación en cada CA (art. 72 Ley 40/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000007'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'lopj', 'LOPJ',
 '¿Cuántos miembros componen el Consejo General del Poder Judicial?',
 '["12","15","20","21"]'::jsonb, 2,
 'El CGPJ está compuesto por 20 vocales más el Presidente del TS (art. 122.3 CE, art. 566 LOPJ).',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000008'::uuid,
 '00000000-0000-0000-0006-201900000001'::uuid,
 'justicia-tramitacion', 'procesal', 'Derecho Procesal',
 'En el proceso civil español, ¿ante qué órgano se interpone el recurso de apelación contra sentencias de un Juzgado de Primera Instancia?',
 '["Ante el propio Juzgado, para su Audiencia Provincial","Directamente ante el TS","Ante el Tribunal Superior de Justicia","Ante el TC"]'::jsonb, 0,
 'La apelación se interpone ante el mismo órgano que dictó la sentencia, para su resolución por la Audiencia Provincial (art. 458 LEC).',
 'medium', 'official'),

-- ══════════ EXAMEN 2021 (preguntas 09-16) ══════════
('00000000-0000-0006-0001-000000000009'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿En qué artículo de la CE se recoge el derecho a la tutela judicial efectiva?',
 '["Artículo 14","Artículo 24","Artículo 27","Artículo 53"]'::jsonb, 1,
 'El art. 24 CE reconoce el derecho a la tutela judicial efectiva sin indefensión.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000010'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿Quién sanciona y promulga las leyes en España?',
 '["El Presidente del Gobierno","El Presidente del Congreso","El Rey","El Presidente del Senado"]'::jsonb, 2,
 'El Rey sanciona y promulga las leyes (art. 62.a CE) en el plazo de 15 días.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000011'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿Cuál es el plazo máximo para interponer un recurso de alzada?',
 '["10 días","15 días","1 mes","3 meses"]'::jsonb, 2,
 'El recurso de alzada se interpone en el plazo de 1 mes si el acto es expreso, o 3 meses si es presunto (art. 122 Ley 39/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000012'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 'La abstención de una autoridad o personal deberá comunicarse:',
 '["Al superior jerárquico inmediato","Al Ministerio Fiscal","Al Defensor del Pueblo","A la Junta Consultiva de Contratación"]'::jsonb, 0,
 'La abstención se comunica al superior jerárquico inmediato, que resolverá (art. 23 Ley 40/2015 en conexión con Ley 39/2015).',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000013'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 '¿Cuál es el número mínimo de miembros para constituir válidamente un órgano colegiado en primera convocatoria?',
 '["El Presidente y un vocal","El Presidente, el Secretario y la mitad de los miembros","Un tercio de los miembros","Dos tercios de los miembros"]'::jsonb, 1,
 'Se requieren Presidente, Secretario (o sus suplentes) y la mitad al menos de los miembros (art. 17 Ley 40/2015).',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000014'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 'Los convenios que suscriban las Administraciones Públicas tienen una vigencia máxima de:',
 '["1 año","4 años prorrogable 4 más","10 años","Indefinida"]'::jsonb, 1,
 'Los convenios tienen vigencia máxima de 4 años, prorrogable por otros 4 (art. 49.h Ley 40/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000015'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'lopj', 'LOPJ',
 '¿Quién nombra a los Magistrados del Tribunal Supremo?',
 '["El Rey, a propuesta del CGPJ","El Presidente del Gobierno","Las Cortes Generales","El propio Tribunal Supremo"]'::jsonb, 0,
 'Son nombrados por el Rey a propuesta del CGPJ (art. 316 LOPJ).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000016'::uuid,
 '00000000-0000-0000-0006-202100000001'::uuid,
 'justicia-tramitacion', 'procesal', 'Derecho Procesal',
 'En el juicio verbal, ¿en qué plazo debe contestar el demandado a la demanda?',
 '["5 días","10 días","20 días","30 días"]'::jsonb, 1,
 'El demandado dispone de 10 días para contestar en el juicio verbal (art. 438 LEC).',
 'medium', 'official'),

-- ══════════ EXAMEN 2022 (preguntas 17-24) ══════════
('00000000-0000-0006-0001-000000000017'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿Cuál es la mayoría necesaria para reformar el Título Preliminar de la CE?',
 '["Mayoría simple","3/5 en ambas Cámaras","Mayoría absoluta del Congreso","2/3 en ambas Cámaras y disolución de Cortes"]'::jsonb, 3,
 'El art. 168 CE exige mayoría de 2/3, disolución de las Cámaras, ratificación por las nuevas Cortes y referéndum.',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000018'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿Qué órgano nombra al Defensor del Pueblo?',
 '["El Rey","Las Cortes Generales","El Gobierno","El CGPJ"]'::jsonb, 1,
 'Es designado por las Cortes Generales (art. 54 CE) por 3/5 de cada Cámara.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000019'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿En qué plazo debe notificarse una resolución expresa a partir de la fecha en que se dicta?',
 '["3 días","10 días","15 días","1 mes"]'::jsonb, 1,
 'Las resoluciones deben notificarse en el plazo de 10 días desde que se dicten (art. 40.2 Ley 39/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000020'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿Quiénes están obligados a relacionarse a través de medios electrónicos con las AA.PP.?',
 '["Solo las personas jurídicas","Personas jurídicas y entidades sin personalidad","Todas las personas físicas","Únicamente los profesionales colegiados"]'::jsonb, 1,
 'El art. 14.2 Ley 39/2015 obliga a personas jurídicas, entidades sin personalidad, colegiados y empleados públicos.',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000021'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 'La responsabilidad patrimonial de las AA.PP. se rige por el principio de:',
 '["Culpabilidad","Responsabilidad objetiva","Riesgo asumido","Autotutela"]'::jsonb, 1,
 'La Ley 40/2015 (arts. 32 y ss.) consagra un régimen de responsabilidad objetiva por el funcionamiento normal o anormal de los servicios públicos.',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000022'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 '¿Cuál es el plazo para reclamar responsabilidad patrimonial a la Administración?',
 '["6 meses","1 año","3 años","5 años"]'::jsonb, 1,
 'La acción prescribe al año de producido el hecho o el acto que motive la indemnización (art. 67 Ley 39/2015).',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000023'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'lopj', 'LOPJ',
 '¿Qué órgano es competente para conocer de los recursos de amparo?',
 '["Tribunal Supremo","Tribunal Constitucional","Audiencia Nacional","Tribunales Superiores de Justicia"]'::jsonb, 1,
 'El TC conoce del recurso de amparo (arts. 53.2 y 161.1.b CE).',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000024'::uuid,
 '00000000-0000-0000-0006-202200000001'::uuid,
 'justicia-tramitacion', 'procesal', 'Derecho Procesal',
 '¿Cuál es la cuantía que delimita el juicio verbal del juicio ordinario en el proceso civil?',
 '["3.000 €","6.000 €","12.000 €","30.000 €"]'::jsonb, 1,
 'El art. 250.2 LEC fija en 6.000 € el límite del juicio verbal por cuantía (los > 6.000 € van a juicio ordinario).',
 'medium', 'official'),

-- ══════════ EXAMEN 2023 (preguntas 25-32) ══════════
('00000000-0000-0006-0001-000000000025'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 '¿En cuántos títulos se estructura la Constitución Española (además del Preliminar)?',
 '["8","9","10","11"]'::jsonb, 2,
 'La CE tiene un Título Preliminar y 10 Títulos numerados.',
 'easy', 'official'),

('00000000-0000-0006-0001-000000000026'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'constitucion', 'Constitución Española',
 'El Consejo de Ministros está regulado en:',
 '["Título III CE","Título IV CE","Título V CE","Título VI CE"]'::jsonb, 1,
 'El Gobierno y la Administración están en el Título IV (arts. 97-107 CE).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000027'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 'La caducidad del procedimiento iniciado de oficio se produce cuando ha transcurrido:',
 '["El plazo de resolución sin más","30 días desde el vencimiento","3 meses desde el vencimiento","6 meses desde el inicio"]'::jsonb, 2,
 'En procedimientos susceptibles de producir efectos desfavorables, se declara la caducidad transcurridos 30 días desde el vencimiento (art. 25.1.b Ley 39/2015).',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000028'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'ley-39', 'Ley 39/2015',
 '¿Cuál es el plazo para interponer un recurso potestativo de reposición contra un acto expreso?',
 '["1 mes","2 meses","3 meses","6 meses"]'::jsonb, 0,
 'El recurso potestativo de reposición se interpone en el plazo de 1 mes si el acto es expreso (art. 124.1 Ley 39/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000029'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 '¿En qué caso puede delegarse el ejercicio de una competencia?',
 '["Nunca","Siempre que esté justificado","En órganos jerárquicamente dependientes u organismos vinculados","Solo con autorización de las Cortes"]'::jsonb, 2,
 'La delegación exige tratarse de un órgano de la misma Administración jerárquicamente dependiente o un organismo público vinculado (art. 9 Ley 40/2015).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000030'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'ley-40', 'Ley 40/2015',
 'La avocación consiste en:',
 '["Delegar una competencia en otro órgano","Recuperar el conocimiento de un asunto delegado o atribuido","Recusar a un funcionario","Prorrogar un convenio"]'::jsonb, 1,
 'La avocación permite al órgano superior conocer un asunto cuya resolución corresponde por delegación o atribución a otro órgano (art. 10 Ley 40/2015).',
 'hard', 'official'),

('00000000-0000-0006-0001-000000000031'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'lopj', 'LOPJ',
 '¿Cuántas Salas tiene el Tribunal Supremo?',
 '["3","4","5","6"]'::jsonb, 2,
 'El TS se compone de 5 Salas: Civil, Penal, Contencioso-Administrativo, Social y Militar (art. 55 LOPJ).',
 'medium', 'official'),

('00000000-0000-0006-0001-000000000032'::uuid,
 '00000000-0000-0000-0006-202300000001'::uuid,
 'justicia-tramitacion', 'procesal', 'Derecho Procesal',
 'En el proceso penal, ¿qué principio impide juzgar dos veces por los mismos hechos?',
 '["Contradicción","Non bis in idem","Congruencia","Preclusión"]'::jsonb, 1,
 'El principio non bis in idem prohíbe la doble sanción o el doble enjuiciamiento por los mismos hechos.',
 'easy', 'official')

on conflict (id) do nothing;


-- ─── PARTE 2 · Historial del usuario para el Laboratorio de Errores ──────────
-- Cada statement resuelve al usuario por email con una subquery inline.
-- Nada de temp tables (Supabase usa PgBouncer y las pierde entre statements)
-- y nada de bloques DO $$ con variables PL/pgSQL.
-- Si el email no existe en auth.users, los INSERT SELECT insertan 0 filas.
--
-- ⚠️  CAMBIA ESTE EMAIL POR EL DE TU USUARIO SI ES DISTINTO ⚠️  (aparece 3 veces)
--     (usa Ctrl+H → "santigarciavel33@gmail.com" → tu email)


-- ── Limpieza previa: elimina el historial anterior del seed (idempotente) ────
delete from public.training_attempt_responses
 where attempt_id in (
    '00000000-0000-0006-a001-000000000001'::uuid,
    '00000000-0000-0006-a001-000000000002'::uuid,
    '00000000-0000-0006-a001-000000000003'::uuid
);
delete from public.training_attempts
 where id in (
    '00000000-0000-0006-a001-000000000001'::uuid,
    '00000000-0000-0006-a001-000000000002'::uuid,
    '00000000-0000-0006-a001-000000000003'::uuid
);


-- ── 3 intentos previos (uno por día) ─────────────────────────────────────────
insert into public.training_attempts
    (id, user_id, source, mock_exam_id, topic_id, difficulty,
     question_count, correct_count, wrong_count, blank_count,
     score, duration_secs, completed_at, created_at)
select
    v.attempt_id, u.user_id, v.source, v.mock_exam_id, v.topic_id, v.difficulty,
    v.qcount, v.correct, v.wrong, v.blank,
    v.score, v.secs, v.completed, v.completed
from (select id as user_id from auth.users
       where email = 'santigarciavel33@gmail.com' limit 1) u
cross join (values
    -- Intento 1 · hace 3 días · Generador · Ley 39/2015
    ('00000000-0000-0006-a001-000000000001'::uuid,
     'generator', null::uuid, 'ley-39', 'medium',
     10, 3, 7, 0, 3.00::numeric, 480, now() - interval '3 days'),
    -- Intento 2 · hace 1 día · Generador · Ley 40/2015
    ('00000000-0000-0006-a001-000000000002'::uuid,
     'generator', null::uuid, 'ley-40', 'medium',
     10, 4, 6, 0, 4.00::numeric, 520, now() - interval '1 day'),
    -- Intento 3 · hoy · Simulacro oficial 2023
    ('00000000-0000-0006-a001-000000000003'::uuid,
     'official', '00000000-0000-0000-0006-202300000001'::uuid, null, null,
     15, 9, 5, 1, 6.00::numeric, 700, now())
) as v(attempt_id, source, mock_exam_id, topic_id, difficulty,
       qcount, correct, wrong, blank, score, secs, completed);


-- ── 35 respuestas con fallos concentrados en Ley 39/2015 y Ley 40/2015 ───────
-- Requisito de training_error_patterns: ≥5 respuestas por tema para aparecer.
--   ley-39      · 8 respuestas · 6 fallos → 75% fail
--   ley-40      · 7 respuestas · 5 fallos → 71% fail
--   constitucion· 7 respuestas · 2 fallos → 29% fail
--   lopj        · 5 respuestas · 1 fallo  → 20% fail
--   procesal    · 5 respuestas · 1 fallo  → 20% fail
insert into public.training_attempt_responses
    (attempt_id, user_id, question_id, topic_id, topic,
     question_text, options_snapshot, correct_index,
     user_answer_index, is_correct, time_secs)
select
    v.attempt_id, u.user_id, v.question_id, v.topic_id, v.topic,
    v.question_text, v.options_snapshot, v.correct_index,
    v.user_answer_index, v.is_correct, v.time_secs
from (select id as user_id from auth.users
       where email = 'santigarciavel33@gmail.com' limit 1) u
cross join (values
    -- ── Ley 39/2015 · 6 fallos / 8 ─────────────────────────────────────────
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000003'::uuid,
     'ley-39', 'Ley 39/2015', 'Plazo general para resolver',
     '["1 mes","2 meses","3 meses","6 meses"]'::jsonb, 2::smallint, 1::smallint, false, 40),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000004'::uuid,
     'ley-39', 'Ley 39/2015', 'Efecto general del silencio',
     '["Desestimatorio","Estimatorio","Suspensivo","Anulatorio"]'::jsonb, 1::smallint, 0::smallint, false, 55),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000011'::uuid,
     'ley-39', 'Ley 39/2015', 'Plazo recurso de alzada',
     '["10 días","15 días","1 mes","3 meses"]'::jsonb, 2::smallint, 3::smallint, false, 60),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000019'::uuid,
     'ley-39', 'Ley 39/2015', 'Plazo de notificación',
     '["3 días","10 días","15 días","1 mes"]'::jsonb, 1::smallint, 3::smallint, false, 35),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000020'::uuid,
     'ley-39', 'Ley 39/2015', 'Obligados a medios electrónicos',
     '["Solo jurídicas","Jurídicas y sin personalidad","Todas físicas","Colegiados"]'::jsonb, 1::smallint, 2::smallint, false, 30),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000027'::uuid,
     'ley-39', 'Ley 39/2015', 'Caducidad procedimiento oficio',
     '["El plazo sin más","30 días","3 meses","6 meses"]'::jsonb, 2::smallint, 0::smallint, false, 50),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000028'::uuid,
     'ley-39', 'Ley 39/2015', 'Plazo reposición',
     '["1 mes","2 meses","3 meses","6 meses"]'::jsonb, 0::smallint, 0::smallint, true, 20),
    ('00000000-0000-0006-a001-000000000001'::uuid, '00000000-0000-0006-0001-000000000012'::uuid,
     'ley-39', 'Ley 39/2015', 'Comunicación de la abstención',
     '["Superior","Fiscal","Defensor","Junta"]'::jsonb, 0::smallint, 0::smallint, true, 25),

    -- ── Ley 40/2015 · 5 fallos / 7 ─────────────────────────────────────────
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000005'::uuid,
     'ley-40', 'Ley 40/2015', 'Principios generales',
     '["Eficacia","Jerarquía","Beneficio máximo","Transparencia"]'::jsonb, 2::smallint, 0::smallint, false, 45),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000006'::uuid,
     'ley-40', 'Ley 40/2015', 'Representación ordinaria del Estado',
     '["Presidente autonómico","Delegado del Gobierno","Subdelegado","Ministro"]'::jsonb, 1::smallint, 3::smallint, false, 60),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000013'::uuid,
     'ley-40', 'Ley 40/2015', 'Mínimo constituir órgano colegiado',
     '["Presidente y vocal","Presidente+Secretario+mitad","Un tercio","Dos tercios"]'::jsonb, 1::smallint, 3::smallint, false, 70),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000014'::uuid,
     'ley-40', 'Ley 40/2015', 'Vigencia máxima convenios',
     '["1 año","4+4","10 años","Indefinida"]'::jsonb, 1::smallint, 2::smallint, false, 40),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000021'::uuid,
     'ley-40', 'Ley 40/2015', 'Principio responsabilidad',
     '["Culpabilidad","Objetiva","Riesgo","Autotutela"]'::jsonb, 1::smallint, 0::smallint, false, 50),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000029'::uuid,
     'ley-40', 'Ley 40/2015', 'Delegación de competencia',
     '["Nunca","Siempre","Jerárquicos/vinculados","Cortes"]'::jsonb, 2::smallint, 2::smallint, true, 30),
    ('00000000-0000-0006-a001-000000000002'::uuid, '00000000-0000-0006-0001-000000000030'::uuid,
     'ley-40', 'Ley 40/2015', 'Concepto de avocación',
     '["Delegar","Recuperar","Recusar","Prorrogar"]'::jsonb, 1::smallint, 1::smallint, true, 25),

    -- ── Constitución · 2 fallos / 7 ────────────────────────────────────────
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000001'::uuid,
     'constitucion', 'Constitución Española', 'Nº artículos CE',
     '["139","157","169","183"]'::jsonb, 2::smallint, 2::smallint, true, 15),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000002'::uuid,
     'constitucion', 'Constitución Española', 'Composición TC',
     '["12: 4/4/2/2","10","12 Presidente","12: 6/6"]'::jsonb, 0::smallint, 0::smallint, true, 30),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000009'::uuid,
     'constitucion', 'Constitución Española', 'Tutela judicial efectiva',
     '["Art. 14","Art. 24","Art. 27","Art. 53"]'::jsonb, 1::smallint, 1::smallint, true, 20),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000010'::uuid,
     'constitucion', 'Constitución Española', 'Sanción y promulgación',
     '["Presidente Gob.","Presidente Congreso","El Rey","Presidente Senado"]'::jsonb, 2::smallint, 2::smallint, true, 20),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000017'::uuid,
     'constitucion', 'Constitución Española', 'Reforma Título Preliminar',
     '["Simple","3/5","Absoluta Congreso","2/3 + disolución"]'::jsonb, 3::smallint, 1::smallint, false, 60),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000018'::uuid,
     'constitucion', 'Constitución Española', 'Nombramiento Defensor Pueblo',
     '["El Rey","Cortes","Gobierno","CGPJ"]'::jsonb, 1::smallint, 0::smallint, false, 35),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000025'::uuid,
     'constitucion', 'Constitución Española', 'Nº títulos CE',
     '["8","9","10","11"]'::jsonb, 2::smallint, 2::smallint, true, 15),

    -- ── LOPJ · 1 fallo / 5 ─────────────────────────────────────────────────
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000007'::uuid,
     'lopj', 'LOPJ', 'Nº miembros CGPJ',
     '["12","15","20","21"]'::jsonb, 2::smallint, 2::smallint, true, 20),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000015'::uuid,
     'lopj', 'LOPJ', 'Nombramiento magistrados TS',
     '["Rey a propuesta CGPJ","Presidente Gob.","Cortes","TS"]'::jsonb, 0::smallint, 0::smallint, true, 25),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000023'::uuid,
     'lopj', 'LOPJ', 'Recursos amparo',
     '["TS","TC","AN","TSJ"]'::jsonb, 1::smallint, 1::smallint, true, 15),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000031'::uuid,
     'lopj', 'LOPJ', 'Nº Salas TS',
     '["3","4","5","6"]'::jsonb, 2::smallint, 3::smallint, false, 30),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000031'::uuid,
     'lopj', 'LOPJ', 'Nº Salas TS (repaso)',
     '["3","4","5","6"]'::jsonb, 2::smallint, 2::smallint, true, 15),

    -- ── Procesal · 1 fallo / 5 ─────────────────────────────────────────────
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000008'::uuid,
     'procesal', 'Derecho Procesal', 'Apelación civil',
     '["Al Juzgado, AP","TS","TSJ","TC"]'::jsonb, 0::smallint, 0::smallint, true, 30),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000016'::uuid,
     'procesal', 'Derecho Procesal', 'Plazo contestación verbal',
     '["5","10","20","30"]'::jsonb, 1::smallint, 1::smallint, true, 20),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000024'::uuid,
     'procesal', 'Derecho Procesal', 'Cuantía verbal/ordinario',
     '["3.000","6.000","12.000","30.000"]'::jsonb, 1::smallint, 2::smallint, false, 40),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000032'::uuid,
     'procesal', 'Derecho Procesal', 'Non bis in idem',
     '["Contradicción","Non bis","Congruencia","Preclusión"]'::jsonb, 1::smallint, 1::smallint, true, 15),
    ('00000000-0000-0006-a001-000000000003'::uuid, '00000000-0000-0006-0001-000000000024'::uuid,
     'procesal', 'Derecho Procesal', 'Cuantía (repaso)',
     '["3.000","6.000","12.000","30.000"]'::jsonb, 1::smallint, 1::smallint, true, 25)
) as v(attempt_id, question_id, topic_id, topic,
       question_text, options_snapshot, correct_index,
       user_answer_index, is_correct, time_secs);


-- ─── Bookmarks de ejemplo (Foto-Test) ────────────────────────────────────────
delete from public.training_bookmarks
 where id in (
    '00000000-0000-0006-b001-000000000001'::uuid,
    '00000000-0000-0006-b001-000000000002'::uuid
);

insert into public.training_bookmarks
    (id, user_id, concept, question, answer, related_topic_id, created_at)
select v.id, u.user_id, v.concept, v.question, v.answer, v.related_topic_id, v.created_at
from (select id as user_id from auth.users
       where email = 'santigarciavel33@gmail.com' limit 1) u
cross join (values
    ('00000000-0000-0006-b001-000000000001'::uuid,
     'Plazos en el procedimiento administrativo',
     '¿Cuál es el plazo general para resolver un procedimiento administrativo?',
     'El plazo general es de 3 meses, salvo que una norma con rango de ley establezca uno mayor (art. 21.2 Ley 39/2015).',
     'ley-39', now() - interval '2 days'),
    ('00000000-0000-0006-b001-000000000002'::uuid,
     'Silencio administrativo',
     '¿Qué efectos tiene el silencio administrativo positivo?',
     'El silencio positivo otorga al interesado los derechos y facultades solicitados (art. 24.1 Ley 39/2015).',
     'ley-39', now() - interval '5 hours')
) as v(id, concept, question, answer, related_topic_id, created_at);


-- ─── Verificación (opcional) ─────────────────────────────────────────────────
-- Ejecuta esta consulta después del seed para ver las debilidades detectadas.
-- Deberías obtener: ley-39 (75% fail), ley-40 (71%), constitucion, lopj, procesal.
--
--   select * from public.training_error_patterns;
--
-- Si el resultado es vacío, revisa que el email del usuario sea correcto
-- y que la sesión de Supabase esté autenticada con ese usuario (la vista
-- filtra por auth.uid()). Puedes hacer el chequeo directo con:
--
--   select topic_id, topic,
--          count(*)                     as total,
--          count(*) filter (where not is_correct) as fallos
--     from public.training_attempt_responses
--    where user_id = (select id from auth.users where email = 'santigarciavel33@gmail.com')
--    group by topic_id, topic
--    order by fallos desc;
