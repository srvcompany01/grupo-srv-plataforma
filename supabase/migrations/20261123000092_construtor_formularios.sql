-- Construtor de formulários: perguntas independentes, publicação e histórico das novas respostas.
alter table public.forms add column settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object');
alter table public.forms add column draft jsonb check (draft is null or jsonb_typeof(draft) = 'object');
alter table public.forms add column published_at timestamptz default now();
alter table public.forms add constraint forms_publicacao_ativa check (not active or published_at is not null);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id),
  task_id uuid references public.tasks(id) on delete set null,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  score integer not null default 0,
  attribution jsonb not null default '{}'::jsonb check (jsonb_typeof(attribution) = 'object'),
  dedup_key text,
  created_at timestamptz not null default now()
);
create index form_submissions_form_date_idx on public.form_submissions(form_id, created_at desc);
create unique index form_submissions_dedup_idx on public.form_submissions(form_id, dedup_key) where dedup_key is not null;
alter table public.form_submissions enable row level security;
create policy form_submissions_admin_read on public.form_submissions for select to authenticated using (public.is_admin());

create or replace function public.validar_formulario() returns trigger
language plpgsql security definer set search_path = public as $$
declare campo jsonb; chave text; chaves text[] := '{}';
begin
  for campo in select * from jsonb_array_elements(new.fields) loop
    chave := campo ->> 'key';
    if chave is null or btrim(coalesce(campo ->> 'label', '')) = '' then raise exception 'Todo campo do formulário precisa de chave e rótulo'; end if;
    if chave = any(chaves) then raise exception 'Campo repetido no formulário'; end if;
    if campo ? 'condicao' and not ((campo -> 'condicao' ->> 'campo') = any(chaves)) then raise exception 'A condição deve usar uma pergunta anterior'; end if;
    if chave = 'title' and campo ? 'condicao' then raise exception 'O título deve estar sempre visível'; end if;
    if chave like 'q\_%' escape '\' then
      if chave !~ '^q_[a-zA-Z0-9-]{8,60}$' or coalesce(campo ->> 'tipo', '') not in ('text','name','long_text','email','phone','date','site','number','money','dropdown','multiple_choice','rating','checkbox','terms','cpf','cnpj','address','statement') then raise exception 'Tipo de pergunta inválido'; end if;
    elsif chave not in ('title', 'description') and not exists (
      select 1 from list_custom_fields lf join custom_fields f on f.id = lf.field_id
      where lf.list_id = new.list_id and f.id::text = chave and f.archived_at is null
    ) then raise exception 'O campo "%" não pertence à lista do formulário', campo ->> 'label'; end if;
    chaves := chaves || chave;
  end loop;
  if not ('title' = any(chaves)) then raise exception 'O formulário precisa pedir o título'; end if;
  new.updated_at := now(); return new;
end $$;

create or replace function public.enviar_formulario(p_token text, p_respostas jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  f forms%rowtype; campo jsonb; chave text; valor jsonb; titulo text; texto text; linha text; tarefa uuid;
  paragrafos jsonb := '[]'::jsonb; limpas jsonb := '{}'::jsonb; visiveis text[] := '{}';
  regra jsonb; anterior jsonb; bate boolean; mostrar boolean; pontos integer := 0; opcao text; p text; duplicado text;
begin
  select * into f from forms where token = p_token and active and archived_at is null;
  if not found then raise exception 'Formulário indisponível'; end if;
  if jsonb_typeof(p_respostas) <> 'object' then raise exception 'Respostas inválidas'; end if;
  for campo in select * from jsonb_array_elements(f.fields) loop
    chave := campo ->> 'key'; regra := campo -> 'condicao'; mostrar := true;
    if regra is not null then
      anterior := limpas -> (regra ->> 'campo');
      bate := case when jsonb_typeof(anterior) = 'array' then anterior @> jsonb_build_array(regra ->> 'valor') else coalesce(anterior #>> '{}', '') = coalesce(regra ->> 'valor', '') end;
      mostrar := (regra ->> 'campo') = any(visiveis) and case regra ->> 'operador'
        when 'igual' then bate when 'diferente' then not bate
        when 'contem' then position(coalesce(regra ->> 'valor', '') in coalesce(anterior #>> '{}', '')) > 0
        when 'preenchido' then anterior is not null and anterior not in ('null'::jsonb, '""'::jsonb, '[]'::jsonb)
        else false end;
    end if;
    if not mostrar then continue; end if;
    visiveis := visiveis || chave;
    if campo ->> 'tipo' = 'statement' then continue; end if;
    valor := p_respostas -> chave;
    if coalesce((campo ->> 'required')::boolean, false) and
       (valor is null or valor in ('null'::jsonb, '""'::jsonb, '[]'::jsonb) or btrim(coalesce(valor #>> '{}', 'x')) = '' or (campo ->> 'tipo' = 'terms' and valor <> 'true'::jsonb)) then
      raise exception 'Preencha: %', campo ->> 'label';
    end if;
    if valor is null or valor in ('null'::jsonb, '""'::jsonb) then continue; end if;
    limpas := limpas || jsonb_build_object(chave, valor);
    if campo ->> 'tipo' = 'rating' and jsonb_typeof(valor) = 'number' then pontos := pontos + least(10000, greatest(-10000, (valor #>> '{}')::numeric))::integer;
    elsif campo ? 'pontos' then
      for opcao in select jsonb_array_elements_text(case when jsonb_typeof(valor) = 'array' then valor else jsonb_build_array(valor) end) loop
        p := campo -> 'pontos' ->> opcao;
        if p ~ '^-?[0-9]{1,5}$' then pontos := pontos + least(10000, greatest(-10000, p::integer)); end if;
      end loop;
    end if;
  end loop;
  titulo := btrim(coalesce(limpas ->> 'title', ''));
  if titulo = '' or length(titulo) > 200 then raise exception 'Título inválido'; end if;
  texto := case when 'description' = any(visiveis) then btrim(coalesce(limpas ->> 'description', '')) else '' end;
  for campo in select * from jsonb_array_elements(f.fields) loop
    chave := campo ->> 'key'; valor := limpas -> chave;
    if chave like 'q\_%' escape '\' and valor is not null then texto := texto || E'\n\n' || (campo ->> 'label') || ': ' || (valor #>> '{}'); end if;
  end loop;
  if btrim(texto) <> '' then
    foreach linha in array string_to_array(left(btrim(texto), 20000), E'\n') loop
      paragrafos := paragrafos || jsonb_build_array(jsonb_build_object('type', 'paragraph') || case when btrim(linha) = '' then '{}'::jsonb else jsonb_build_object('content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', linha))) end);
    end loop;
  end if;
  insert into tasks(list_id, client_id, title, description, position)
  values (f.list_id, f.client_id, titulo, case when jsonb_array_length(paragrafos) > 0 then jsonb_build_object('type','doc','content',paragrafos) end, 'a1' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '1') returning id into tarefa;
  insert into task_assignees(task_id, user_id) values (tarefa, f.assignee_id);
  for campo in select * from jsonb_array_elements(f.fields) loop
    chave := campo ->> 'key'; valor := limpas -> chave;
    if chave in ('title','description') or chave like 'q\_%' escape '\' or valor is null then continue; end if;
    insert into task_custom_field_values(task_id,field_id,value) values(tarefa,chave::uuid,valor);
  end loop;
  if coalesce(f.settings ->> 'duplicadoPor', '') <> '' and nullif(btrim(limpas ->> (f.settings ->> 'duplicadoPor')), '') is not null then
    duplicado := md5(lower(btrim(limpas ->> (f.settings ->> 'duplicadoPor'))));
  end if;
  insert into form_submissions(form_id,task_id,answers,questions,score,attribution,dedup_key)
  values(f.id,tarefa,limpas,f.fields,pontos,case when jsonb_typeof(p_respostas -> '__utm') = 'object' then p_respostas -> '__utm' else '{}'::jsonb end,duplicado);
  return tarefa;
exception when unique_violation then raise exception 'Já recebemos uma resposta com esse identificador.';
end $$;
revoke execute on function public.enviar_formulario(text,jsonb) from public,anon,authenticated;
grant execute on function public.enviar_formulario(text,jsonb) to service_role;
