-- ─── Bloque 11 · Tienda OPOX ────────────────────────────────────────────────
-- Ejecutar en Supabase SQL editor con permisos de administrador.

-- 1. Catálogo de recompensas reales (administrado por OPOX)
create table if not exists store_products (
    id              uuid primary key default gen_random_uuid(),
    partner         text not null,
    title           text not null,
    subtitle        text not null default '',
    description     text not null default '',
    cost            integer not null check (cost > 0),
    stock           integer not null default 0 check (stock >= 0),
    icon            text not null default 'gift-outline',
    color           text not null default '#6C5CE7',
    category        text not null default 'Other',
    tag             text not null default '',
    is_available    boolean not null default true,
    conditions      text[] not null default '{}',
    expiry          text not null default '',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- 2. Catálogo de descuentos / vouchers virtuales (administrado por OPOX)
create table if not exists store_discounts (
    id              uuid primary key default gen_random_uuid(),
    partner         text not null,
    title           text not null,
    subtitle        text not null default '',
    discount        text not null,
    original_price  text not null default '',
    category        text not null default 'Other',
    color           text not null default '#6C5CE7',
    icon            text not null default 'pricetag-outline',
    is_new          boolean not null default false,
    expiry_date     text not null default '',
    conditions      text[] not null default '{}',
    deep_link       text,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now()
);

-- 3. Cartera de códigos canjeados por el usuario
create table if not exists user_wallet (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    product_id  uuid references store_products (id) on delete set null,
    partner     text not null,
    title       text not null,
    code        text not null,
    -- 'active' | 'used' | 'expired'
    status      text not null default 'active' check (status in ('active', 'used', 'expired')),
    expiry_date text not null,
    used_date   text,
    color       text not null default '#6C5CE7',
    icon        text not null default 'gift-outline',
    action_url  text,
    created_at  timestamptz not null default now()
);

-- 4. Ledger de Opopoints (historial de ganancias y gastos)
create table if not exists user_opopoints_ledger (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    -- 'earn' | 'spend'
    type        text not null check (type in ('earn', 'spend')),
    amount      integer not null check (amount > 0),
    reason      text not null,
    ref_id      text,
    created_at  timestamptz not null default now()
);

-- 5. Tests publicados por la comunidad
create table if not exists community_tests (
    id              uuid primary key default gen_random_uuid(),
    author_id       uuid not null references auth.users (id) on delete cascade,
    author_username text not null,
    title           text not null,
    description     text not null default '',
    category        text not null default 'General',
    tags            text[] not null default '{}',
    price           integer not null default 0 check (price >= 0),
    is_free         boolean not null generated always as (price = 0) stored,
    question_count  integer not null default 0 check (question_count >= 0),
    total_made      integer not null default 0 check (total_made >= 0),
    rating          numeric(3,1) not null default 0.0,
    is_published    boolean not null default false,
    created_at      timestamptz not null default now()
);

-- 6. Registro de compras/obtenciones de tests de la comunidad
create table if not exists community_test_purchases (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    test_id     uuid not null references community_tests (id) on delete cascade,
    purchased_at timestamptz not null default now(),
    unique (user_id, test_id)
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table store_products enable row level security;
alter table store_discounts enable row level security;
alter table user_wallet enable row level security;
alter table user_opopoints_ledger enable row level security;
alter table community_tests enable row level security;
alter table community_test_purchases enable row level security;

-- Productos y descuentos: lectura pública (usuarios autenticados)
create policy "store_products_read" on store_products
    for select to authenticated using (true);

create policy "store_discounts_read" on store_discounts
    for select to authenticated using (true);

-- Cartera: solo el propietario
create policy "wallet_owner_read" on user_wallet
    for select to authenticated using (auth.uid() = user_id);

create policy "wallet_owner_insert" on user_wallet
    for insert to authenticated with check (auth.uid() = user_id);

create policy "wallet_owner_update" on user_wallet
    for update to authenticated using (auth.uid() = user_id);

-- Ledger: solo el propietario puede leer
create policy "ledger_owner_read" on user_opopoints_ledger
    for select to authenticated using (auth.uid() = user_id);

create policy "ledger_owner_insert" on user_opopoints_ledger
    for insert to authenticated with check (auth.uid() = user_id);

-- Community tests: lectura pública; inserción solo por el autor
create policy "community_tests_read" on community_tests
    for select to authenticated using (is_published = true or auth.uid() = author_id);

create policy "community_tests_insert" on community_tests
    for insert to authenticated with check (auth.uid() = author_id);

-- Purchases: solo el comprador
create policy "test_purchases_read" on community_test_purchases
    for select to authenticated using (auth.uid() = user_id);

create policy "test_purchases_insert" on community_test_purchases
    for insert to authenticated with check (auth.uid() = user_id);

-- ─── Índices ─────────────────────────────────────────────────────────────────

create index if not exists idx_user_wallet_user_id on user_wallet (user_id);
create index if not exists idx_ledger_user_id on user_opopoints_ledger (user_id);
create index if not exists idx_community_tests_category on community_tests (category);
create index if not exists idx_community_tests_author on community_tests (author_id);
create index if not exists idx_test_purchases_user on community_test_purchases (user_id);

-- ─── Datos semilla (catálogo inicial) ────────────────────────────────────────

insert into store_products (partner, title, subtitle, description, cost, stock, icon, color, category, tag, is_available, conditions, expiry) values
(
    'Uber Eats',
    '1 mes gratis',
    'Suscripción Uber One durante 30 días sin coste.',
    'Pide tus menús equilibrados sin gastos de envío y con tarifas preferentes.',
    1500, 20, 'restaurant-outline', '#000000', 'Food', 'Comida equilibrada', true,
    ARRAY['Válido solo en España', 'Requiere cuenta verificada de Opox', 'El código caduca a los 30 días de canjearlo', 'Solo para usuarios sin Uber One activo'],
    'El código caduca en 30 días'
),
(
    'Decathlon',
    '-20% en tienda',
    'Ideal para tu prueba física',
    'Descuento del 20% en toda la tienda online y física de Decathlon España.',
    1200, 10, 'fitness-outline', '#0082C3', 'Sport', 'Prueba física', true,
    ARRAY['Válido en tiendas Decathlon España', 'Un uso por código', 'No acumulable con otras ofertas'],
    'El código caduca en 60 días'
),
(
    'Spotify',
    '3 meses Premium',
    'Música sin anuncios para estudiar',
    'Escucha podcasts jurídicos y música de concentración sin interrupciones.',
    2000, 0, 'musical-notes-outline', '#1DB954', 'Music', 'Podcasts', false,
    ARRAY['Solo para cuentas nuevas de Spotify Premium', 'No combinable con otras ofertas'],
    'El código caduca en 90 días'
),
(
    'Amazon',
    '15€ en libros',
    'Material de estudio',
    'Vale de 15€ canjeables en libros digitales o físicos en Amazon.es.',
    1800, 5, 'book-outline', '#FF9900', 'Books', 'Libros', true,
    ARRAY['Válido en Amazon.es', 'Solo para compras de libros', 'Un vale por usuario'],
    'El código caduca en 45 días'
)
on conflict do nothing;

insert into store_discounts (partner, title, subtitle, discount, original_price, category, color, icon, is_new, expiry_date, conditions, deep_link, is_active) values
(
    'FNAC',
    '-15% en libros',
    'Temario oficial y libros de oposiciones',
    '-15%', 'Precio normal FNAC', 'Books', '#E91E63', 'book-outline', true,
    '31 ago 2026',
    ARRAY['Solo en sección de libros', 'No acumulable con otras ofertas'],
    null, true
),
(
    'El Corte Inglés',
    '-10% en papelería',
    'Material de estudio y oficina',
    '-10%', 'Precio tarjeta', 'Office', '#009B3A', 'briefcase-outline', false,
    '30 sep 2026',
    ARRAY['Aplicable en El Corte Inglés online y física', 'Usar código OPOX10 en caja'],
    null, true
)
on conflict do nothing;
