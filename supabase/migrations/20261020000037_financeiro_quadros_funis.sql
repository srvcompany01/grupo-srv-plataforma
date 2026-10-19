-- Financeiro, Quadros (quadro branco) e Funis (funil visual).
--  * finance_entries: lançamentos de entrada e saída (equipe, tráfego, ferramentas…). Só o admin enxerga e mexe.
--  * canvases: quadros brancos e funis. `data` guarda os elementos (JSON); a equipe toda vê e edita, só o dono (ou admin) exclui.

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('entrada', 'saida')),
  category text not null check (length(btrim(category)) between 1 and 60),
  description text not null default '' check (length(description) <= 200),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents < 100000000000),
  occurred_on date not null,
  paid boolean not null default true,
  client_id uuid references public.clients (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index finance_entries_data_idx on public.finance_entries (occurred_on desc);
create index finance_entries_cliente_idx on public.finance_entries (client_id) where client_id is not null;

alter table public.finance_entries enable row level security;
create policy finance_entries_admin on public.finance_entries for all to authenticated
  using (is_admin()) with check (is_admin());

create table public.canvases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quadro', 'funil')),
  title text not null default 'Sem título' check (length(btrim(title)) between 1 and 120),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 4000000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index canvases_kind_idx on public.canvases (kind, updated_at desc);

create function public.canvases_tocar() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger canvases_tocar before update on public.canvases for each row execute function public.canvases_tocar();

alter table public.canvases enable row level security;
create policy canvases_select on public.canvases for select to authenticated using (is_team());
create policy canvases_insert on public.canvases for insert to authenticated with check (is_team() and created_by = auth.uid());
create policy canvases_update on public.canvases for update to authenticated using (is_team()) with check (is_team());
create policy canvases_delete on public.canvases for delete to authenticated using (is_team() and (created_by = auth.uid() or is_admin()));
