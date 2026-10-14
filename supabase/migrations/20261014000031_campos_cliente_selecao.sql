-- Campo de cliente do tipo "seleção": o admin define as opções (nome + cor) e cada cliente escolhe uma.
-- Já cria o campo "Risco de churn" (Baixo / Médio / Alto), editável em Configurações → Campos de cliente.

alter table public.client_fields
  add column options jsonb check (options is null or jsonb_typeof(options) = 'array');

alter table public.client_fields drop constraint client_fields_kind_check;
alter table public.client_fields add constraint client_fields_kind_check check (kind in ('texto', 'numero', 'data', 'link', 'selecao'));

-- O valor de um campo de seleção precisa ser uma das opções (nome) cadastradas.
create function public.validar_valor_campo_cliente() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  campo client_fields%rowtype;
begin
  select * into campo from client_fields where id = new.field_id;
  if campo.kind = 'selecao' and not exists (
    select 1 from jsonb_array_elements(coalesce(campo.options, '[]'::jsonb)) o where o ->> 'nome' = new.value
  ) then
    raise exception 'Escolha uma das opções do campo "%"', campo.name;
  end if;
  return new;
end $$;
create trigger client_field_values_validar before insert or update on public.client_field_values
  for each row execute function public.validar_valor_campo_cliente();

insert into public.client_fields (name, kind, show_on_card, position, options)
select 'Risco de churn', 'selecao', true, coalesce((select max(position) from public.client_fields), 0) + 1,
  '[{"nome":"Baixo","cor":"#2fa36b"},{"nome":"Médio","cor":"#e0a100"},{"nome":"Alto","cor":"#d64545"}]'::jsonb
where not exists (select 1 from public.client_fields where name = 'Risco de churn');
