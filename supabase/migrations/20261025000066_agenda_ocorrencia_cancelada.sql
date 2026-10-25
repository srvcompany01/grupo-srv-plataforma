-- Cancelar UM dia de um compromisso fixo (ex.: a reunião semanal não acontece nesta terça): a data entra em
-- skipped_dates; a agenda e o Google Agenda (EXDATE) pulam esse dia e o resto da série continua.
alter table public.agenda_events add column skipped_dates date[] not null default '{}';
