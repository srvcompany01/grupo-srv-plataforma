-- Sai o Kommo, o Atendimento e o teste da Evolution API: nem todo cliente assina o Kommo, e a captação passa a ser pelo Biolytics.
-- Apaga as tabelas e funções das migrations 72 a 76 (inclusive as conversas e análises guardadas). O WhatsApp de atendimento
-- do cadastro do cliente (clients.whatsapp_atendimento), usado pela página da bio, continua.
drop function if exists public.apagar_mensagens_antigas();
drop table if exists public.wa_alertas, public.wa_analises, public.wa_mensagens, public.wa_conversas, public.kommo_negocios, public.kommo_funis, public.kommo_eventos_teste, public.wa_eventos_teste;
alter table public.clients drop constraint if exists clients_atend_ordem;
alter table public.clients drop column if exists atend_abre, drop column if exists atend_fecha, drop column if exists atend_dias;
