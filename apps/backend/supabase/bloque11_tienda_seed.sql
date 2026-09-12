-- ─── Bloque 11 · Tienda OPOX · Seed de prueba ──────────────────────────────
-- Ejecutar en Supabase SQL Editor con permisos de administrador.
-- Requiere que bloque11_tienda.sql ya haya sido ejecutado.
-- Idempotente: usa ON CONFLICT DO NOTHING por título de producto.

-- 1. Productos reales de prueba
INSERT INTO store_products (partner, title, subtitle, description, cost, stock, icon, color, category, is_available)
VALUES
  ('opox', 'Acceso Premium 1 mes',    'Desbloquea todas las funciones Pro durante 30 días.', 'Acceso completo a estadísticas Pro, exportación PDF, Aula Virtual sin límites y soporte prioritario.', 500, 99, 'star-outline',  '#7B4BC4', 'virtual', true),
  ('opox', 'Test Oficial Resuelto PDF', 'Examen oficial con respuestas comentadas.',           'Descarga un examen oficial de tu oposición con todas las respuestas comentadas y referencia normativa.', 200, 99, 'document-text-outline', '#34C759', 'virtual', true)
ON CONFLICT DO NOTHING;

-- 2. Descuento de prueba (requiere columnas cost y code — ver bloque11_tienda.sql)
INSERT INTO store_discounts (partner, title, subtitle, discount, cost, code, category, icon, is_active)
VALUES
  ('opox', '10% dto. material estudio', 'Descuento en material de preparación de oposiciones.', '10%', 100, 'OPOX10', 'virtual', 'pricetag-outline', true)
ON CONFLICT DO NOTHING;
