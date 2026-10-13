-- Tokens pessoais da API/MCP. O token completo aparece uma única vez, na criação; aqui fica só o hash (SHA-256).
-- A verificação do token acontece no servidor com a service role. A pessoa só enxerga e revoga os próprios.

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null check (btrim(name) <> '' and length(name) <= 80),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  scope text not null check (scope in ('read', 'write')),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index api_tokens_user_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;
create policy api_tokens_select on public.api_tokens for select to authenticated using (user_id = auth.uid());
create policy api_tokens_insert on public.api_tokens for insert to authenticated
  with check (user_id = auth.uid() and is_team() and expires_at > now() and expires_at <= now() + interval '366 days');
-- A pessoa só consegue revogar (preencher revoked_at); nome, hash e escopo ficam como foram criados.
create function public.so_revogar_token() returns trigger
language plpgsql as $$
begin
  if (new.user_id, new.name, new.token_hash, new.scope, new.expires_at, new.created_at)
     is distinct from (old.user_id, old.name, old.token_hash, old.scope, old.expires_at, old.created_at)
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Só é possível revogar um token';
  end if;
  return new;
end $$;
create trigger so_revogar_token before update on public.api_tokens for each row execute function public.so_revogar_token();
create policy api_tokens_update on public.api_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
