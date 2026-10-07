-- Campos personalizados pertencem ao contexto das listas e também funcionam em
-- listas soltas, que não têm espaço. O vínculo list_custom_fields continua sendo
-- a fonte de verdade das colunas visíveis em cada lista.

alter table public.custom_fields alter column space_id drop not null;

create or replace function public.validar_campo_na_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1
    from lists l
    join custom_fields f on f.id = new.field_id
    where l.id = new.list_id
      and l.space_id is not distinct from f.space_id
  ) then
    raise exception 'O campo personalizado precisa pertencer ao mesmo espaço ou contexto da lista';
  end if;
  return new;
end $$;

drop policy custom_fields_select on public.custom_fields;
drop policy custom_fields_insert on public.custom_fields;
drop policy custom_fields_update on public.custom_fields;
drop policy custom_fields_delete on public.custom_fields;

create policy custom_fields_select on public.custom_fields for select to authenticated
  using (can_access_space_target(space_id));
create policy custom_fields_insert on public.custom_fields for insert to authenticated
  with check (can_manage_space_target(space_id));
create policy custom_fields_update on public.custom_fields for update to authenticated
  using (can_manage_space_target(space_id)) with check (can_manage_space_target(space_id));
create policy custom_fields_delete on public.custom_fields for delete to authenticated
  using (can_manage_space_target(space_id));
