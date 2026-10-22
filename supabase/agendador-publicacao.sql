-- Rotina que publica os posts agendados (Instagram/Facebook) a cada 5 minutos.
-- NÃO é migration: rode UMA vez no SQL Editor do Supabase de PRODUÇÃO, trocando SEU_CRON_SECRET pelo valor da
-- variável CRON_SECRET da Vercel (Settings → Environment Variables). Se ela não existir, crie uma lá (qualquer texto
-- longo e aleatório) e faça um novo deploy antes.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('publicar-posts') where exists (select 1 from cron.job where jobname = 'publicar-posts');

select cron.schedule(
  'publicar-posts',
  '*/5 * * * *',
  $$ select net.http_get(
       url := 'https://app.gruposrv.com.br/api/cron/publicar',
       headers := jsonb_build_object('Authorization', 'Bearer SEU_CRON_SECRET'),
       timeout_milliseconds := 300000
     ) $$
);

-- Para conferir: select * from cron.job_run_details order by start_time desc limit 10;
-- Para desligar: select cron.unschedule('publicar-posts');
