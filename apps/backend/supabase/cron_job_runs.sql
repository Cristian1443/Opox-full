-- Idempotencia de crons — evita doble envío de notificaciones programadas.
--
-- Bug real (2026-09-12): la notificación diaria de racha (20:00h Colombia)
-- llegó 2 veces a cada usuario en la base de datos (confirmado: 2 filas en
-- `notifications` por usuario, separadas por 2-4 segundos), y hasta 4 veces
-- en el celular de un usuario con 2 tokens de push registrados. node-cron
-- corre en-proceso dentro del backend; si Render reinicia o redeploya justo
-- en la ventana del cron, dos procesos pueden disparar el mismo job casi
-- simultáneamente. Esta tabla usa una restricción UNIQUE para que solo el
-- primer proceso en insertar la fila del día gane la carrera.

CREATE TABLE IF NOT EXISTS cron_job_runs (
    job_name text NOT NULL,
    run_date date NOT NULL,
    ran_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (job_name, run_date)
);

-- Tabla operativa interna — sin políticas: solo el service_role (backend)
-- puede leerla/escribirla, ningún cliente público debe tocarla.
ALTER TABLE cron_job_runs ENABLE ROW LEVEL SECURITY;
