-- ============================================================
-- BLOQUE 6 · TEMAS "Policía de Galicia" (training_topics)
-- Curso Motor: 672e3a8bad0f45c8 (temario completo, 40 temas).
-- Ejecutar DESPUÉS de bloque6_topics.sql (que crea la tabla).
-- Idempotente (safe to re-run).
--
-- Los topic_id son los IDs hexadecimales del Motor (misma nomenclatura que
-- usa el Motor RAG). El label es el título del tema truncado a algo legible.
--
-- Fuente: GET /v1/courses/672e3a8bad0f45c8 (2026-09-09).
-- ============================================================

INSERT INTO training_topics (oposicion, topic_id, label, sort_order) VALUES
-- ── Bloque 1 · Temas 1-10 (Constitución, derechos, poderes) ─────────────────
('policia-local-galicia', 'cb93fdfcc3944529', 'Tema 1 · El Estado, división de poderes, organización', 1),
('policia-local-galicia', '23116c4c10d3465a', 'Tema 2 · Derechos fundamentales I (vida, ideología, libertad)', 2),
('policia-local-galicia', 'fa3a03ab5d054ccf', 'Tema 3 · Derechos fundamentales II', 3),
('policia-local-galicia', '2d5444ec8ac44973', 'Tema 4 · Derechos, deberes y garantías', 4),
('policia-local-galicia', 'f8d9c23505e549e3', 'Tema 5 · La Corona y las Cortes Generales', 5),
('policia-local-galicia', '78583f6543a24bf7', 'Tema 6 · El Poder Judicial y el Tribunal Constitucional', 6),
('policia-local-galicia', '1de17f91b7574587', 'Tema 7 · Organización territorial y Estatuto de Galicia', 7),
('policia-local-galicia', 'd9c96b02a7234508', 'Tema 8 · Relación entre poderes', 8),
('policia-local-galicia', 'cd7be272b4dd4344', 'Tema 9 · Derecho administrativo · fuentes y jerarquía', 9),
('policia-local-galicia', '613bcd905125486e', 'Tema 10 · Administración pública', 10),

-- ── Bloque 2 · Temas 11-20 (Procedimiento admin, régimen local, policía) ────
('policia-local-galicia', '85959328c58f4414', 'Tema 11 · Procedimiento administrativo · interesados', 11),
('policia-local-galicia', 'c8ae486837294471', 'Tema 12 · Régimen local · entidades y principios', 12),
('policia-local-galicia', 'af11eaf666c74d33', 'Tema 13 · Organización municipal', 13),
('policia-local-galicia', '936c1be1e9fe4690', 'Tema 14 · Ordenanzas, reglamentos y bandos', 14),
('policia-local-galicia', 'b80391d2ee12496d', 'Tema 15 · La licencia municipal', 15),
('policia-local-galicia', 'b105472828b54a36', 'Tema 16 · Función pública local · funcionarios', 16),
('policia-local-galicia', '89423af80150418c', 'Tema 17 · LO Fuerzas y Cuerpos de Seguridad · Policía Local', 17),
('policia-local-galicia', 'e5293c95ba3e41f5', 'Tema 18 · Coordinación de policías locales de Galicia', 18),
('policia-local-galicia', '148f53eb0fb14da5', 'Tema 19 · Policía Local como policía administrativa I', 19),
('policia-local-galicia', '9e9fd662803e47ca', 'Tema 20 · Policía Local como policía administrativa II', 20),

-- ── Bloque 3 · Temas 21-30 (Emergencias, penal, seguridad vial) ─────────────
('policia-local-galicia', 'b9f4ba79087e414e', 'Tema 21 · Ley 5/2007 de Emergencias de Galicia', 21),
('policia-local-galicia', '28113e0da5324264', 'Tema 22 · Delitos y faltas · responsabilidad criminal', 22),
('policia-local-galicia', 'a52012c749d94ac4', 'Tema 23 · Delitos contra derechos fundamentales', 23),
('policia-local-galicia', 'add76b3b8ff44e6b', 'Tema 24 · Delitos contra la Administración', 24),
('policia-local-galicia', 'd51c970f63c84c60', 'Tema 25 · Homicidio, patrimonio y orden socioeconómico', 25),
('policia-local-galicia', 'bdd3036b9df84c8a', 'Tema 26 · Delitos contra la seguridad vial y lesiones', 26),
('policia-local-galicia', 'd53db9b849cf4ae7', 'Tema 27 · El atestado policial', 27),
('policia-local-galicia', 'da0efff3629e4ff8', 'Tema 28 · La detención · concepto, plazos y obligaciones', 28),
('policia-local-galicia', 'eaba2b423d2248a9', 'Tema 29 · Ley de Seguridad Vial · reglamentos', 29),
('policia-local-galicia', '7261143debbe4dfc', 'Tema 30 · Normas de circulación', 30),

-- ── Bloque 4 · Temas 31-40 (Circulación, sociedad, deontología) ─────────────
('policia-local-galicia', 'fe30f1e9fe7440ab', 'Tema 31 · Zonas peatonales · emergencia · señales', 31),
('policia-local-galicia', '044a773afb094ea8', 'Tema 32 · Procedimiento sancionador · inmovilización', 32),
('policia-local-galicia', '6bc0d4020cb448b1', 'Tema 33 · Accidentes de circulación · alcoholemia', 33),
('policia-local-galicia', '2dc2453c54854a25', 'Tema 34 · Estructura económica y social de Galicia', 34),
('policia-local-galicia', '603551c5dc304b90', 'Tema 35 · Vida en sociedad', 35),
('policia-local-galicia', '84ee3dd7c65147ec', 'Tema 36 · Comunicación en la Policía', 36),
('policia-local-galicia', '87cbdf0889004d00', 'Tema 37 · Minorías, racismo y xenofobia', 37),
('policia-local-galicia', '30af6e6667e54b56', 'Tema 38 · Igualdad', 38),
('policia-local-galicia', 'd19c0e0a25044315', 'Tema 39 · Policía en la sociedad democrática', 39),
('policia-local-galicia', 'e1fa8817fa8a45ed', 'Tema 40 · Deontología policial', 40)
ON CONFLICT (oposicion, topic_id) DO UPDATE
    SET label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order;

-- ── Limpieza opcional: elimina los temas del curso anterior (0bed919120024e5f)
-- Los 11 temas viejos ya no existen en el Motor. Descomentar solo si se ha
-- verificado el nuevo curso y ya no se necesitan los antiguos.
--
-- DELETE FROM training_topics
--   WHERE oposicion = 'policia-local-galicia'
--     AND topic_id NOT IN (
--         'cb93fdfcc3944529','23116c4c10d3465a','fa3a03ab5d054ccf','2d5444ec8ac44973',
--         'f8d9c23505e549e3','78583f6543a24bf7','1de17f91b7574587','d9c96b02a7234508',
--         'cd7be272b4dd4344','613bcd905125486e','85959328c58f4414','c8ae486837294471',
--         'af11eaf666c74d33','936c1be1e9fe4690','b80391d2ee12496d','b105472828b54a36',
--         '89423af80150418c','e5293c95ba3e41f5','148f53eb0fb14da5','9e9fd662803e47ca',
--         'b9f4ba79087e414e','28113e0da5324264','a52012c749d94ac4','add76b3b8ff44e6b',
--         'd51c970f63c84c60','bdd3036b9df84c8a','d53db9b849cf4ae7','da0efff3629e4ff8',
--         'eaba2b423d2248a9','7261143debbe4dfc','fe30f1e9fe7440ab','044a773afb094ea8',
--         '6bc0d4020cb448b1','2dc2453c54854a25','603551c5dc304b90','84ee3dd7c65147ec',
--         '87cbdf0889004d00','30af6e6667e54b56','d19c0e0a25044315','e1fa8817fa8a45ed'
--     );
