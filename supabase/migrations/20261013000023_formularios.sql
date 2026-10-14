-- Formulários públicos: um link por formulário que cria uma tarefa na lista escolhida.
-- A pessoa de fora não tem login: a Server Action chama enviar_formulario com a service role.
-- `fields` é a lista ordenada dos campos pedidos: {key, label, required}.
-- key = 'title' | 'description' | id de um campo personalizado já vinculado à lista.

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id),
  client_id uuid references public.clients (id),
  assignee_id uuid not null references public.profiles (id), -- toda tarefa precisa de responsável
  name text not null check (btrim(name) <> ''),
  description text,
  token text not null unique check (token ~ '^[A-Za-z0-9]{32}$'),
  active boolean not null default true,
  fields jsonb not null default '[{"key":"title","label":"Título","required":true}]'::jsonb
    check (jsonb_typeof(fields) = 'array' and jsonb_array_length(fields) between 1 and 40),
  created_by uuid references public.profiles (id) default auth.uid(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index forms_list_idx on public.forms (list_id);

-- Todo campo precisa existir; 'title' é obrigatório e os campos personalizados precisam estar na lista.
create function public.validar_formulario() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  campo jsonb;
  chave text;
  chaves text[] := '{}';
begin
  for campo in select * from jsonb_array_elements(new.fields) loop
    chave := campo ->> 'key';
    if chave is null or btrim(coalesce(campo ->> 'label', '')) = '' then
      raise exception 'Todo campo do formulário precisa de chave e rótulo';
    end if;
    if chave = any (chaves) then raise exception 'Campo repetido no formulário'; end if;
    chaves := chaves || chave;
    if chave not in ('title', 'description') and not exists (
      select 1 from list_custom_fields lf join custom_fields f on f.id = lf.field_id
      where lf.list_id = new.list_id and f.id::text = chave and f.archived_at is null
    ) then
      raise exception 'O campo "%" não pertence à lista do formulário', campo ->> 'label';
    end if;
  end loop;
  if not ('title' = any (chaves)) then raise exception 'O formulário precisa pedir o título'; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger validar_formulario before insert or update on public.forms
  for each row execute function public.validar_formulario();

alter table public.forms enable row level security;
create policy forms_select on public.forms for select to authenticated
  using (is_team() and can_read_list(list_id));
create policy forms_write on public.forms for all to authenticated
  using (is_space_manager(list_space(list_id))) with check (is_space_manager(list_space(list_id)));

-- Cria a tarefa a partir das respostas {key: valor}. Só service role: o link é público, a função não.
create function public.enviar_formulario(p_token text, p_respostas jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  f forms%rowtype;
  campo jsonb;
  chave text;
  valor jsonb;
  titulo text;
  texto text;
  paragrafos jsonb := '[]'::jsonb;
  linha text;
  tarefa uuid;
begin
  select * into f from forms where token = p_token and active and archived_at is null;
  if not found then raise exception 'Formulário indisponível'; end if;
  if jsonb_typeof(p_respostas) <> 'object' then raise exception 'Respostas inválidas'; end if;

  for campo in select * from jsonb_array_elements(f.fields) loop
    valor := p_respostas -> (campo ->> 'key');
    if coalesce((campo ->> 'required')::boolean, false)
       and (valor is null or valor = 'null'::jsonb or valor = '""'::jsonb or btrim(coalesce(valor #>> '{}', 'x')) = '') then
      raise exception 'Preencha: %', campo ->> 'label';
    end if;
  end loop;

  titulo := btrim(coalesce(p_respostas ->> 'title', ''));
  if titulo = '' or length(titulo) > 200 then raise exception 'Título inválido'; end if;

  texto := btrim(coalesce(p_respostas ->> 'description', ''));
  if texto <> '' and exists (select 1 from jsonb_array_elements(f.fields) c where c ->> 'key' = 'description') then
    foreach linha in array string_to_array(left(texto, 20000), E'\n') loop
      paragrafos := paragrafos || jsonb_build_array(jsonb_build_object('type', 'paragraph')
        || case when btrim(linha) = '' then '{}'::jsonb
                else jsonb_build_object('content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', linha))) end);
    end loop;
  end if;

  insert into tasks (list_id, client_id, title, description, position)
  values (f.list_id, f.client_id, titulo,
          case when jsonb_array_length(paragrafos) > 0 then jsonb_build_object('type', 'doc', 'content', paragrafos) end,
          'a1' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '1')
  returning id into tarefa;

  insert into task_assignees (task_id, user_id) values (tarefa, f.assignee_id);

  -- O gatilho normalizar_valor_campo valida cada valor conforme o tipo do campo.
  for campo in select * from jsonb_array_elements(f.fields) loop
    chave := campo ->> 'key';
    valor := p_respostas -> chave;
    if chave in ('title', 'description') or valor is null or valor = 'null'::jsonb or valor = '""'::jsonb then continue; end if;
    insert into task_custom_field_values (task_id, field_id, value) values (tarefa, chave::uuid, valor);
  end loop;
  return tarefa;
end $$;
revoke execute on function public.enviar_formulario(text, jsonb) from public, anon, authenticated;
grant execute on function public.enviar_formulario(text, jsonb) to service_role;
