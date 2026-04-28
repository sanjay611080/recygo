-- Run this in the Supabase SQL editor of the database project
-- (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_DB_URL).
-- The storage project is a separate Supabase account and is unaffected.

create table if not exists users (
  username   text        primary key,
  password   text        not null,
  role       text        not null check (role in ('admin', 'user')),
  tokens     integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id          text    primary key,
  name        text    not null,
  price       integer not null,
  description text    not null,
  image       text    not null
);

create table if not exists sessions (
  id             uuid        primary key,
  username       text        not null references users(username) on delete cascade,
  category       text        not null,
  weight         numeric     not null,
  tokens_earned  integer     not null,
  photos         jsonb       not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists sessions_username_idx   on sessions(username);
create index if not exists sessions_created_at_idx on sessions(created_at desc);

create table if not exists orders (
  id          uuid        primary key,
  username    text        not null references users(username) on delete cascade,
  items       jsonb       not null default '[]'::jsonb,
  subtotal    integer     not null,
  tokens_used integer     not null,
  total       integer     not null,
  created_at  timestamptz not null default now()
);
create index if not exists orders_username_idx on orders(username);

-- Atomic token adjustment to avoid lost updates under concurrent writes.
create or replace function increment_user_tokens(p_username text, p_delta integer)
returns integer
language plpgsql
as $$
declare
  new_tokens integer;
begin
  update users
     set tokens = tokens + p_delta
   where username = p_username
   returning tokens into new_tokens;
  return new_tokens;
end;
$$;

-- Seed: default admin + demo user (idempotent).
insert into users (username, password, role, tokens) values
  ('admin', 'admin', 'admin', 0),
  ('user',  'user',  'user',  0)
on conflict (username) do nothing;

-- Seed: starter product catalogue (idempotent).
insert into products (id, name, price, description, image) values
  ('p-towel',    'Recycled Cotton Towel',    1000, 'Soft towel made from 100% post-consumer recycled cotton.',  '🧺'),
  ('p-notebook', 'Recycled Paper Notebook',  500,  'A5 notebook with 120 pages of recycled paper.',             '📓'),
  ('p-bag',      'Recycled Tote Bag',        800,  'Durable shopper made from recycled PET bottles.',           '👜'),
  ('p-tshirt',   'Recycled Cotton T-Shirt',  1500, 'Unisex tee, 60% recycled cotton + 40% recycled poly.',      '👕'),
  ('p-pot',      'Recycled Plant Pot',       600,  'Indoor pot moulded from recycled HDPE caps.',               '🪴'),
  ('p-bottle',   'Recycled Glass Bottle',    700,  '500ml reusable bottle made from melted scrap glass.',       '🍾')
on conflict (id) do nothing;
