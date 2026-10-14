-- Risco de churn: Baixo vira azul e Médio laranja (Alto continua vermelho). Só troca a cor dessas duas opções, preservando o resto.
update public.client_fields
set options = (
  select jsonb_agg(
    case o ->> 'nome'
      when 'Baixo' then jsonb_set(o, '{cor}', '"#3b82f6"')
      when 'Médio' then jsonb_set(o, '{cor}', '"#f97316"')
      else o
    end
    order by ord
  )
  from jsonb_array_elements(options) with ordinality as t (o, ord)
)
where name = 'Risco de churn' and kind = 'selecao' and options is not null and jsonb_array_length(options) > 0;

-- Cidade do cliente: campo de texto livre, mostrado na galeria.
insert into public.client_fields (name, kind, show_on_card, position)
select 'Cidade', 'texto', true, coalesce((select max(position) from public.client_fields), 0) + 1
where not exists (select 1 from public.client_fields where name = 'Cidade');
