-- ─────────────────────────────────────────────────────────────────────────
-- embodegate — fase 2: reseñas nativas de la comunidad.
-- Correr este script en el SQL Editor del proyecto de Supabase.
--
-- Además de esto, en el dashboard hay que:
--  1. Authentication → Providers → habilitar Google (client id + secret de
--     Google Cloud Console) y agregar el dominio a Redirect URLs.
--  2. Storage → el bucket `resenas` lo crea este script; verificar que quede
--     con lectura pública.
-- ─────────────────────────────────────────────────────────────────────────

-- La tabla de reseñas. Dimensiones estandarizadas del formulario de la maqueta.
create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  bodega_slug text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_nombre text,
  plan text not null check (plan in ('visita', 'degustacion', 'almuerzo', 'picnic', 'actividades')),
  -- vista: 0.5-5 en medios puntos; null + sin_vista=true = "sin vista a viñedos"
  vista numeric(2, 1) check (vista >= 0.5 and vista <= 5),
  sin_vista boolean not null default false,
  calidad_precio smallint not null check (calidad_precio between 1 and 5),
  servicio smallint not null check (servicio between 1 and 5),
  comida smallint check (comida between 1 and 5),
  precio_pagado integer check (precio_pagado >= 0), -- ARS por persona
  como_llego text check (como_llego in ('auto', 'tour', 'bus', 'bici', 'otro')),
  comentario text check (char_length(comentario) <= 2000),
  fotos text[] not null default '{}' check (array_length(fotos, 1) is null or array_length(fotos, 1) <= 3),
  created_at timestamptz not null default now(),
  -- una reseña por usuario, bodega y plan (puede reseñar la visita Y el almuerzo)
  unique (bodega_slug, user_id, plan),
  -- o tiene puntaje de vista o marcó "sin vista", nunca ambos
  check (not (vista is not null and sin_vista))
);

create index if not exists resenas_bodega_idx on public.resenas (bodega_slug, created_at desc);

-- RLS: cualquiera lee; solo el dueño autenticado escribe lo suyo.
alter table public.resenas enable row level security;

drop policy if exists "lectura publica" on public.resenas;
create policy "lectura publica" on public.resenas
  for select using (true);

drop policy if exists "crear propia" on public.resenas;
create policy "crear propia" on public.resenas
  for insert with check (auth.uid() = user_id);

drop policy if exists "editar propia" on public.resenas;
create policy "editar propia" on public.resenas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "borrar propia" on public.resenas;
create policy "borrar propia" on public.resenas
  for delete using (auth.uid() = user_id);

-- Bucket para las fotos de las reseñas (lectura pública, escritura del dueño).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resenas', 'resenas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'resenas');

drop policy if exists "fotos subir propias" on storage.objects;
create policy "fotos subir propias" on storage.objects
  for insert with check (
    bucket_id = 'resenas'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos borrar propias" on storage.objects;
create policy "fotos borrar propias" on storage.objects
  for delete using (
    bucket_id = 'resenas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
