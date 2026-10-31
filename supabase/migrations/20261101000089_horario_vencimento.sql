-- Vencimento com horário opcional: due_date continua mandando no calendário; due_time (hora de Belém, sem fuso) só aparece quando preenchido.
-- Nos posts de conteúdo, o agendamento preenche os dois sozinho.
alter table public.tasks
  add column if not exists due_time time without time zone;
alter table public.tasks
  drop constraint if exists tasks_due_time_exige_data;
alter table public.tasks
  add constraint tasks_due_time_exige_data check (due_time is null or due_date is not null);
