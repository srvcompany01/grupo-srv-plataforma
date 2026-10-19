-- Landing pages ligadas a formulários pela própria aba Formulários (sem token em variável de ambiente):
-- cada formulário pode apontar para uma landing (coluna `landing` = nome dela em src/dominio/landings.ts) e é ele que recebe os leads.
-- Também cria, na lista CRM (slug 'crm'), os campos personalizados que o lead preenche pelo nome e o formulário
-- "Leads — Máquina de Vendas" já ligado à landing /maquinadevendas. Pode rodar de novo: não duplica nada.

alter table public.forms add column if not exists landing text check (landing ~ '^[a-z0-9-]{1,40}$');
create unique index if not exists forms_landing_idx on public.forms (landing) where landing is not null and archived_at is null;

do $$
declare
  lista record;
  campo record;
  fid uuid;
  chaves jsonb := '[]'::jsonb;
  admin uuid;
begin
  select id, space_id into lista from public.lists where slug = 'crm' limit 1;
  if not found then return; end if;

  for campo in
    select * from (values
      (1,  'Nome',                      'text',      '{}'::jsonb, 'users',             '#6366f1'),
      (2,  'Telefone',                  'phone',     '{}'::jsonb, 'phone',             '#16a34a'),
      (3,  'E-mail',                    'email',     '{}'::jsonb, 'mail',              '#0ea5e9'),
      (4,  'Cargo',                     'text',      '{}'::jsonb, 'briefcase',         '#64748b'),
      (5,  'Empresa',                   'text',      '{}'::jsonb, 'building-2',        '#6366f1'),
      (6,  'Site ou Instagram',         'text',      '{}'::jsonb, 'globe-2',           '#0ea5e9'),
      (7,  'Cidade/UF',                 'text',      '{}'::jsonb, 'map-pin',           '#ef4444'),
      (8,  'Faturamento mensal',        'dropdown',  '{"options":["Até R$25 mil","De R$25 mil a R$69 mil","De R$70 mil a R$99 mil","De R$100 mil a R$299 mil","De R$300 mil a R$999 mil","Acima de R$1 milhão"]}'::jsonb, 'badge-dollar-sign', '#16a34a'),
      (9,  'Funcionários',              'dropdown',  '{"options":["Somente o proprietário","De 2 a 4","De 5 a 8","De 9 a 20","De 21 a 50","Mais de 50"]}'::jsonb, 'users', '#64748b'),
      (10, 'Investimento em marketing', 'dropdown',  '{"options":["Não investe","Até R$2 mil","De R$2 mil a R$5 mil","De R$5 mil a R$10 mil","De R$10 mil a R$30 mil","Acima de R$30 mil"]}'::jsonb, 'megaphone', '#f59e0b'),
      (11, 'Capacidade de atender',     'dropdown',  '{"options":["Menos de 20 por mês","De 20 a 49","De 50 a 99","De 100 a 200","Mais de 200"]}'::jsonb, 'target', '#0ea5e9'),
      (12, 'Papel na decisão',          'dropdown',  '{"options":["Sou o decisor","Divido a decisão","Não sou o decisor"]}'::jsonb, 'star', '#6366f1'),
      (13, 'Contexto',                  'long_text', '{}'::jsonb, 'text-cursor-input', '#64748b'),
      (14, 'Pontuação',                 'number',    '{}'::jsonb, 'hash',              '#d80d12'),
      (15, 'Vértice prioritário',       'text',      '{}'::jsonb, 'target',            '#d80d12'),
      (16, 'Engrenagem prioritária',    'text',      '{}'::jsonb, 'zap',               '#d80d12'),
      (17, 'Dor principal',             'text',      '{}'::jsonb, 'zap',               '#f59e0b'),
      (18, 'Urgência',                  'text',      '{}'::jsonb, 'zap',               '#ef4444'),
      (19, 'Resumo do diagnóstico',     'long_text', '{}'::jsonb, 'text-cursor-input', '#64748b'),
      (20, 'Diagnóstico concluído',     'checkbox',  '{}'::jsonb, 'square-check-big',  '#16a34a'),
      (21, 'Origem',                    'text',      '{}'::jsonb, 'rocket',            '#8b5cf6'),
      (22, 'Meio',                      'text',      '{}'::jsonb, 'rocket',            '#8b5cf6'),
      (23, 'Campanha',                  'text',      '{}'::jsonb, 'megaphone',         '#8b5cf6'),
      (24, 'Anúncio',                   'text',      '{}'::jsonb, 'megaphone',         '#8b5cf6'),
      (25, 'Página',                    'text',      '{}'::jsonb, 'globe-2',           '#8b5cf6'),
      (26, 'Data do lead',              'date',      '{}'::jsonb, 'calendar-days',     '#0ea5e9')
    ) as v (n, nome, tipo, config, icone, cor)
    order by n
  loop
    -- Se já existe um campo com esse nome no espaço da lista, reaproveita (não duplica nem mexe no que você já personalizou).
    select id into fid from public.custom_fields
      where space_id is not distinct from lista.space_id and lower(name) = lower(campo.nome) and archived_at is null
      limit 1;
    if fid is null then
      insert into public.custom_fields (space_id, name, type, config, icon, color, position)
      values (lista.space_id, campo.nome, campo.tipo, campo.config, campo.icone, campo.cor, 'm' || lpad(campo.n::text, 3, '0'))
      returning id into fid;
    end if;
    insert into public.list_custom_fields (list_id, field_id, position)
    values (lista.id, fid, 'm' || lpad(campo.n::text, 3, '0'))
    on conflict do nothing;
    chaves := chaves || jsonb_build_object('key', fid::text, 'label', campo.nome, 'required', false);
  end loop;

  -- O formulário precisa de um responsável (toda tarefa tem): o administrador mais antigo. Troque na aba Formulários se quiser outro.
  select id into admin from public.profiles where role = 'admin' and active order by created_at limit 1;
  if admin is not null and not exists (select 1 from public.forms where landing = 'maquinadevendas' and archived_at is null) then
    insert into public.forms (list_id, assignee_id, name, description, token, landing, fields)
    values (
      lista.id, admin, 'Leads — Máquina de Vendas',
      'Recebe os leads da landing /maquinadevendas (contato, empresa e resultado do pré-diagnóstico).',
      replace(gen_random_uuid()::text, '-', ''),
      'maquinadevendas',
      jsonb_build_array(
        jsonb_build_object('key', 'title', 'label', 'Título', 'required', true),
        jsonb_build_object('key', 'description', 'label', 'Descrição', 'required', false)
      ) || chaves
    );
  end if;
end $$;
