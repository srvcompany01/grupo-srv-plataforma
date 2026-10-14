-- Ordem manual da galeria de clientes (arrastar e soltar). Vale para toda a equipe.
-- Sem posição (clientes novos) vai para o fim, em ordem alfabética.
alter table public.clients add column gallery_position text;
