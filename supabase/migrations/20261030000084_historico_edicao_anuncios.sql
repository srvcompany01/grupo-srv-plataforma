-- Histórico dos anúncios: passa a aceitar a ação "editar" (nome, texto, título, descrição, botão, link, faixa etária ou fim de um item que já está no ar).
alter table public.ad_changes drop constraint if exists ad_changes_acao_check;
alter table public.ad_changes add constraint ad_changes_acao_check check (acao in ('pausar', 'ativar', 'orcamento', 'criar', 'editar'));
