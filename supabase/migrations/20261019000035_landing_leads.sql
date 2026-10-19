-- Leads vindos das landing pages que moram no app (/api/leads). Só o servidor (service role) grava; admin e gestor leem.
-- `payload` é o envio completo (contato, empresa, pré-diagnóstico, origem e consentimento), guardado como veio.
-- `task_id` aponta a tarefa criada na plataforma (quando há um formulário de leads configurado em LEADS_FORM_TOKEN).

create table public.landing_leads (
  id uuid primary key,
  landing text not null check (length(landing) between 1 and 80),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now()
);
create index landing_leads_criado_idx on public.landing_leads (created_at desc);

alter table public.landing_leads enable row level security;
create policy landing_leads_leitura on public.landing_leads for select to authenticated
  using (my_role() in ('admin', 'gestor'));
