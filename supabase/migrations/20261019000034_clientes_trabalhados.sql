-- "Já trabalhei neste cliente hoje": uma marca por pessoa, cliente e dia (data de Belém, calculada pelo servidor).
-- Não há rotina para zerar: a marca vale só para o seu dia; à meia-noite a data muda e o botão volta a ficar vazio.
-- As marcas antigas ficam guardadas (dão histórico de quem trabalhou em quem e quando). Cada pessoa só vê e mexe nas suas.

create table public.client_work_marks (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, client_id, day)
);
create index client_work_marks_dia_idx on public.client_work_marks (day);

alter table public.client_work_marks enable row level security;
create policy client_work_marks_dono on public.client_work_marks for all to authenticated
  using (user_id = auth.uid() and is_team())
  with check (user_id = auth.uid() and is_team());
