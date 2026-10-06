-- Personalização visual da navegação e campos personalizados tipados.
-- Os valores normalizados permitem filtrar e agregar relatórios sem interpretar texto livre.

alter table public.spaces
  add column icon text not null default 'layers-3',
  add column emoji text,
  add column description text;

alter table public.folders
  add column color text not null default '#646464',
  add column icon text not null default 'folder',
  add column emoji text;

alter table public.lists
  add column color text not null default '#646464',
  add column icon text not null default 'list',
  add column emoji text;

alter table public.spaces add constraint spaces_color_hex check (color ~ '^#[0-9a-fA-F]{6}$');
alter table public.folders add constraint folders_color_hex check (color ~ '^#[0-9a-fA-F]{6}$');
alter table public.lists add constraint lists_color_hex check (color ~ '^#[0-9a-fA-F]{6}$');

create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  type text not null check (type in (
    'dropdown', 'text', 'date', 'long_text', 'number', 'labels', 'files', 'signature',
    'rating', 'button', 'checkbox', 'money', 'email', 'formula', 'location', 'people',
    'progress_auto', 'progress_manual', 'relationship', 'site', 'tasks', 'phone', 'vote',
    'instagram', 'tiktok'
  )),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  color text not null default '#6647f0' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null default 'type',
  position text collate "C" not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index custom_fields_space_idx on public.custom_fields (space_id, position);

-- Um campo pode ser reutilizado em várias listas do mesmo espaço.
create table public.list_custom_fields (
  list_id uuid not null references public.lists (id) on delete cascade,
  field_id uuid not null references public.custom_fields (id) on delete cascade,
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  primary key (list_id, field_id)
);
create index list_custom_fields_field_idx on public.list_custom_fields (field_id);

create table public.task_custom_field_values (
  task_id uuid not null references public.tasks (id) on delete cascade,
  field_id uuid not null references public.custom_fields (id) on delete cascade,
  value jsonb not null,
  number_value numeric,
  text_value text,
  date_value date,
  boolean_value boolean,
  updated_at timestamptz not null default now(),
  primary key (task_id, field_id)
);
create index task_custom_values_field_number_idx on public.task_custom_field_values (field_id, number_value) where number_value is not null;
create index task_custom_values_field_text_idx on public.task_custom_field_values (field_id, text_value) where text_value is not null;
create index task_custom_values_field_date_idx on public.task_custom_field_values (field_id, date_value) where date_value is not null;

create function public.validar_campo_na_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from lists l join custom_fields f on f.id = new.field_id
    where l.id = new.list_id and l.space_id = f.space_id
  ) then
    raise exception 'O campo personalizado precisa pertencer ao mesmo espaço da lista';
  end if;
  return new;
end $$;

create trigger validar_campo_na_lista before insert or update on public.list_custom_fields
for each row execute function public.validar_campo_na_lista();

create function public.normalizar_valor_campo() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  tipo text;
  configuracao jsonb;
  valor_texto text;
  maximo numeric;
begin
  select f.type, f.config into tipo, configuracao
  from custom_fields f
  join list_custom_fields lf on lf.field_id = f.id
  join tasks t on t.list_id = lf.list_id
  where f.id = new.field_id and t.id = new.task_id and f.archived_at is null;

  if tipo is null then
    raise exception 'O campo não está disponível na lista desta tarefa';
  end if;

  new.number_value := null;
  new.text_value := null;
  new.date_value := null;
  new.boolean_value := null;
  new.updated_at := now();

  if tipo in ('number', 'money', 'rating', 'progress_auto', 'progress_manual', 'vote', 'formula') then
    if jsonb_typeof(new.value) <> 'number' then raise exception 'Este campo exige um número'; end if;
    new.number_value := (new.value #>> '{}')::numeric;
    if tipo in ('progress_auto', 'progress_manual') and (new.number_value < 0 or new.number_value > 100) then
      raise exception 'O progresso precisa estar entre 0 e 100';
    end if;
    if tipo = 'rating' then
      maximo := coalesce((configuracao ->> 'max')::numeric, 5);
      if new.number_value < 0 or new.number_value > maximo then raise exception 'Avaliação fora do intervalo configurado'; end if;
    end if;
  elsif tipo = 'date' then
    if jsonb_typeof(new.value) <> 'string' then raise exception 'Este campo exige uma data'; end if;
    new.date_value := (new.value #>> '{}')::date;
  elsif tipo = 'checkbox' then
    if jsonb_typeof(new.value) <> 'boolean' then raise exception 'Este campo exige verdadeiro ou falso'; end if;
    new.boolean_value := (new.value #>> '{}')::boolean;
  elsif tipo in ('labels', 'files', 'people', 'relationship', 'tasks') then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'Este campo exige uma lista de valores'; end if;
  else
    if jsonb_typeof(new.value) <> 'string' then raise exception 'Este campo exige texto'; end if;
    valor_texto := new.value #>> '{}';
    if tipo = 'email' and valor_texto <> '' and valor_texto !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'E-mail inválido';
    end if;
    if tipo = 'site' and valor_texto <> '' and valor_texto !~* '^https?://' then
      raise exception 'O site precisa começar com http:// ou https://';
    end if;
    if tipo = 'dropdown' and jsonb_array_length(coalesce(configuracao -> 'options', '[]'::jsonb)) > 0
       and not (configuracao -> 'options') ? valor_texto then
      raise exception 'Opção inválida para a lista suspensa';
    end if;
    new.text_value := valor_texto;
  end if;
  return new;
end $$;

create trigger normalizar_valor_campo before insert or update on public.task_custom_field_values
for each row execute function public.normalizar_valor_campo();

create trigger tocar_custom_field before update on public.custom_fields
for each row execute function public.tocar_updated_at();

alter table public.custom_fields enable row level security;
alter table public.list_custom_fields enable row level security;
alter table public.task_custom_field_values enable row level security;

create policy custom_fields_select on public.custom_fields for select to authenticated
  using (is_space_member(space_id));
create policy custom_fields_insert on public.custom_fields for insert to authenticated
  with check (is_space_manager(space_id));
create policy custom_fields_update on public.custom_fields for update to authenticated
  using (is_space_manager(space_id)) with check (is_space_manager(space_id));
create policy custom_fields_delete on public.custom_fields for delete to authenticated
  using (is_space_manager(space_id));

create policy list_custom_fields_select on public.list_custom_fields for select to authenticated
  using (can_read_list(list_id));
create policy list_custom_fields_insert on public.list_custom_fields for insert to authenticated
  with check (is_space_manager(list_space(list_id)));
create policy list_custom_fields_update on public.list_custom_fields for update to authenticated
  using (is_space_manager(list_space(list_id))) with check (is_space_manager(list_space(list_id)));
create policy list_custom_fields_delete on public.list_custom_fields for delete to authenticated
  using (is_space_manager(list_space(list_id)));

create policy task_custom_values_select on public.task_custom_field_values for select to authenticated
  using (can_read_task(task_id));
create policy task_custom_values_insert on public.task_custom_field_values for insert to authenticated
  with check (can_edit_task(task_id));
create policy task_custom_values_update on public.task_custom_field_values for update to authenticated
  using (can_edit_task(task_id)) with check (can_edit_task(task_id));
create policy task_custom_values_delete on public.task_custom_field_values for delete to authenticated
  using (can_edit_task(task_id));
