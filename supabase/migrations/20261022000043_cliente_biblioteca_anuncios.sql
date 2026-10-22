-- Biblioteca de Anúncios do Meta: ID da página do Facebook do cliente. A plataforma monta o link público dos anúncios
-- ativos dela (no painel do cliente e no portal). Quem lê e edita segue as regras da tabela clients.

alter table public.clients add column meta_page_id text check (meta_page_id ~ '^[0-9]{5,25}$');
