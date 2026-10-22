-- Galeria de anúncios do Meta: conta de anúncios do cliente (só os números do act_...). A plataforma lê os anúncios
-- ativos e os resultados pela API de Marketing com o token do usuário do sistema (META_ACCESS_TOKEN, na Vercel).

alter table public.clients add column meta_ad_account_id text check (meta_ad_account_id ~ '^[0-9]{5,25}$');
