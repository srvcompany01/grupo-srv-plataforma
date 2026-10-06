# Plataforma da Agência — Grupo SRV

Data: 2026-10-06
Status: desenho aprovado em conversa, aguardando revisão do arquivo
Substitui: `2026-10-05-aprovacao-conteudo-design.md` (o app de aprovação vira parte desta plataforma)

## Objetivo

Plataforma própria da agência, no estilo ClickUp, para gerir operação, comercial e
financeiro, com portal compartilhado com cada cliente. Construída em fases; ao fim de
cada fase a entrega é mostrada e só seguimos com aprovação.

Painéis nunca mostram dados fictícios: toda métrica vem de registros reais. Seed só em
desenvolvimento.

**Sucesso da Fase 1 (1a + 1b + 1c):** a equipe passa a organizar todo o trabalho dentro
da plataforma (sem ClickUp para tarefas), cada pessoa vê só o que lhe cabe, e os clientes
aprovam posts pelo portal — com o isolamento entre clientes provado por testes
automatizados contra o banco.

Este documento traz a visão geral de todas as fases e o detalhe das Fases 1a e 1b.
As demais fases ganham especificação própria quando chegarmos nelas.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Repositório | este (`grupo-srv-conteudo`) evolui para a plataforma; projeto Vercel mantido, região `gru1` |
| Endereço | `app.gruposrv.com.br`; portal em `app.gruposrv.com.br/portal` |
| App antigo | `conteudo.gruposrv.com.br` e seus dados são descartados; nada é migrado |
| Site institucional | fora deste projeto e adiado; será um projeto separado em `gruposrv.com.br` que envia leads para a API da plataforma (Fase 2) |
| Banco e login | Supabase (Postgres + Auth), projeto na região São Paulo; Neon e Drizzle saem |
| Mídias | Cloudflare R2 (bucket atual), URLs pré-assinadas como hoje |
| Login da equipe | e-mail + senha |
| Login do cliente | link mágico por e-mail (sem senha) |
| Gestor | por departamento; só admin vê tudo |
| Membro | vê departamentos dos quais é membro + tarefas em que é responsável; cria e edita tarefas, não cria listas |
| Lista × cliente | toda lista pertence a um único cliente; a tarefa herda o cliente da lista |
| Post | é uma tarefa com aba "Peça" (mídias, legenda, versões, aprovação) |
| Workspace | não vira tabela (uma agência só) |
| Nomes | tabelas e colunas em inglês; interface em português |
| UI | Tailwind + shadcn/ui, mantendo o visual inspirado no ClickUp já aprovado |

## Fases

| Fase | Entrega |
|---|---|
| **1a** | Login e papéis, departamentos, clientes (com "Interno"), Espaço › Pasta › Lista › Tarefa › Subtarefa, responsáveis, status por lista, visões Lista e Kanban, histórico de alterações, RLS com testes |
| **1b** | Aba Peça (mídias, legenda, versões) + portal do cliente com aprovação e comentários internos/externos + testes de isolamento. Ao fim, o app antigo é desligado |
| **1c** | Visão Tabela (edição inline), Calendário, campos personalizados, checklist, anexos, filtros salvos, templates de lista/tarefa (Conteúdo Estratégico, Onboarding) |
| 2 | Comercial: CRM, pipeline, endpoint de leads com rastreamento (Pixel + Conversions API + Google Ads, logs, consentimento LGPD) |
| 3 | Financeiro e contratos (lançamentos manuais e recorrentes) |
| 4 | Visão por cliente completa (contrato, onboarding, tráfego, arquivos, relatórios) |
| 5 | Painéis Geral e por Departamento com drill-down |
| 6 | Meta Ads API → `ad_metrics_daily`; integração com o tracking de WhatsApp (Evolution API) |

## Arquitetura

- Next.js 16 (App Router) + TypeScript, na Vercel. Antes de escrever código, ler os guias
  em `node_modules/next/dist/docs/` (exigência do `AGENTS.md`).
- Supabase via `@supabase/ssr`. **Toda leitura e escrita acontece como o usuário logado**,
  então a RLS vale sempre, inclusive se a tela tiver um bug.
- A chave `service_role` (ignora RLS) fica isolada em `src/infra/supabase/admin.ts`, só no
  servidor, usada apenas para: convidar usuários, o script de criação do primeiro admin e,
  na Fase 2, o endpoint público de leads. Cada uso é comentado no código.
- `src/proxy.ts` renova a sessão do Supabase e direciona por papel: `/portal/*` só para
  `cliente`; o resto da área logada só para a equipe; sem sessão → `/login`. É só uma
  barreira de navegação; a garantia é a RLS.
- Migrações SQL versionadas em `supabase/migrations/` (tabelas, RLS, funções, gatilhos);
  tipos TypeScript gerados a partir do banco (`supabase gen types`).
- Mídias: o servidor gera URL de `PUT` pré-assinada (upload direto navegador → R2) e URLs
  de `GET` (6 h) **só depois de ler a linha da mídia com o usuário logado**. Se a RLS
  esconde a mídia, não há link.
- E-mail do login (convites, link mágico): SMTP próprio no Supabase (ex.: Resend), pois o
  SMTP padrão do Supabase tem limite baixo de envios por hora.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | só servidor, usos listados acima |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 |
| `NEXT_PUBLIC_URL_BASE` | `https://app.gruposrv.com.br` |

Saem: `DATABASE_URL`, `ADMIN_SENHA`, `SESSAO_SEGREDO`.

## Modelo de dados — Fase 1a

Convenções: `id uuid` padrão, `created_at`/`updated_at timestamptz`, `archived_at` para
arquivar (nada de apagar trabalho), `position double precision` para ordenação manual.

### Pessoas e acesso

**profiles** — 1:1 com `auth.users`
- `id` (= `auth.users.id`), `full_name`, `avatar_url`, `role` (`admin` | `gestor` | `membro` | `cliente`), `active`
- Criado por gatilho quando o usuário é criado no Auth (papel vem dos metadados do convite).
- `role` e `active` só podem ser alterados por admin (gatilho bloqueia nas demais sessões).

**spaces** — departamentos (configuráveis)
- `name`, `color`, `position`, `parent_id` (um nível; ex.: Operacional agrupa Conteúdo,
  Tráfego e Onboarding), `archived_at`
- Valores iniciais criados por migração (existem também em produção): Comercial,
  Financeiro, Operacional › {Conteúdo, Tráfego, Onboarding}.
- Tarefas e listas ficam nos espaços-folha; o espaço-pai serve para agrupar a barra
  lateral e somar indicadores.

**space_members**
- `space_id`, `user_id`, `role` (`gestor` | `membro`); PK (`space_id`, `user_id`)
- Só usuários da equipe (não `cliente`). Ser membro de um espaço-pai dá acesso aos filhos.

**clients**
- `name`, `legal_name`, `document` (CNPJ/CPF), `email`, `phone`, `status` (`ativo` | `pausado` | `encerrado`), `is_internal`
- Índice único parcial garante um só `is_internal = true`. O cliente "Grupo SRV (Interno)"
  é criado por migração.

**client_users**
- `user_id` (PK) → `client_id`. Um usuário cliente pertence a exatamente um cliente.

### Trabalho

**folders** — `space_id`, `name`, `position`, `archived_at`

**lists**
- `space_id`, `folder_id` (opcional; se informado, a pasta tem de ser do mesmo espaço),
  `client_id` **obrigatório**, `name`, `reference_month` (date, dia 1; opcional),
  `position`, `archived_at`
- Exemplo: Conteúdo › pasta "Padaria X" › lista "Conteúdo Estratégico", cliente Padaria X,
  mês 2026-10-01. Várias listas com o mesmo nome em clientes/meses diferentes é o normal.

**list_statuses**
- `list_id`, `name`, `color`, `position`, `category` (`todo` | `in_progress` | `done`),
  `approval_state` (opcional, `aguardando` | `aprovado` | `ajuste`; usado na Fase 1b)
- Lista nova nasce com: A fazer (todo), Em andamento (in_progress), Concluído (done).
  Templates da Fase 1c trazem conjuntos próprios.
- Toda lista tem ao menos um status `todo` e um `done` (o banco não deixa remover o último).

**tasks**
- `list_id`, `client_id` (preenchido por gatilho a partir da lista; não editável),
  `parent_task_id`, `title`, `description` (jsonb, documento do editor de texto),
  `status_id` (tem de ser um status da mesma lista), `priority` (`urgente` | `alta` |
  `normal` | `baixa`, padrão `normal`), `start_date`, `due_date`, `estimate_minutes`,
  `visible_to_client` (padrão `false`), `completed_at` (preenchido/limpo por gatilho
  quando o status entra/sai de `done`), `position`, `created_by`, `archived_at`
- Subtarefa: mesma `list_id` da mãe (gatilho garante; mover a mãe de lista move a árvore),
  níveis ilimitados, sem ciclos.
- Nova tarefa sem status recebe o primeiro status `todo` da lista.

**task_assignees** — `task_id`, `user_id`; PK composta
- Só usuários da equipe.
- Toda tarefa tem ≥ 1 responsável: gatilho de restrição **adiado** (`DEFERRABLE INITIALLY
  DEFERRED`) verifica no fim da transação, para permitir criar a tarefa e o responsável
  juntos e trocar o último responsável.

**tags** — `space_id`, `name`, `color` · **task_tags** — `task_id`, `tag_id`

**comments**
- `task_id`, `author_id`, `body`, `is_internal` (padrão `true`), `created_at`, `edited_at`
- Comentário escrito por usuário `cliente` é sempre `is_internal = false` (gatilho força).

**task_activity**
- `task_id`, `actor_id`, `action` (`created` | `updated` | `moved` | `archived` |
  `assignee_added` | `assignee_removed` | `tag_added` | `tag_removed`), `field`,
  `old_value` jsonb, `new_value` jsonb, `created_at`
- Escrita **só por gatilhos** em `tasks`, `task_assignees` e `task_tags`; ninguém insere
  direto. `actor_id` vem de `auth.uid()`.

## Modelo de dados — Fase 1b (Peça)

**content_items** — `task_id` (único), `format` (`feed` | `reels` | `stories` | `tiktok`),
`publish_date`, `approval_status` (`rascunho` | `aguardando` | `aprovado` | `ajuste`)

**content_versions** — `content_item_id`, `number`, `idea`, `objective`, `caption`, `created_by`, `created_at`; único (`content_item_id`, `number`)

**content_media** — `version_id`, `position`, `kind` (`imagem` | `video`), `r2_key`, `original_name`, `size_bytes`

**content_reviews** — `version_id` (único), `decision` (`aprovado` | `ajuste`), `comment`, `reviewer_id`, `created_at`

Regras herdadas do app atual (já testadas lá):

```
rascunho --(enviar para aprovação)--> aguardando
aguardando --(cliente aprova)--> aprovado
aguardando --(cliente pede ajuste)--> ajuste
ajuste/aprovado --(equipe salva edição)--> nova versão, aguardando
```

- Em `rascunho` e `aguardando`, editar altera a versão atual no lugar; em `ajuste` ou
  `aprovado`, salvar cria versão nova e a respondida fica congelada com a resposta.
- Cliente só responde à versão atual de peça `aguardando`; resposta a versão
  desatualizada é rejeitada. Pedir ajuste exige comentário.
- Mídia: um vídeo, ou uma imagem, ou carrossel de 2–20 imagens; tipos jpeg, png, webp,
  mp4, quicktime; até 1 GB por arquivo.
- **Enviar para aprovação** marca a tarefa como `visible_to_client = true`.
- Quando o cliente responde, se a lista tiver um status com o `approval_state`
  correspondente, a tarefa vai para esse status (o histórico registra).
- A resposta do cliente passa pela função `submit_content_review(version_id, decision,
  comment)` (`SECURITY DEFINER`), que confere: usuário é cliente, peça é do seu
  `client_id`, tarefa visível, versão é a atual, peça `aguardando`, ainda sem resposta.

## Regras de acesso (RLS) — Fases 1a e 1b

Todas as tabelas com RLS ligada; `anon` não acessa nada. Funções auxiliares
(`SECURITY DEFINER`, `STABLE`, `search_path` fixo):

- `is_admin()`, `is_team()` (papel ≠ cliente e ativo), `my_client_id()`
- `is_space_member(space_id)` — membro do espaço ou do espaço-pai
- `is_space_manager(space_id)` — gestor do espaço ou do espaço-pai
- `can_read_task(task_id)` — admin, membro do espaço da lista, ou responsável
- `client_can_read_task(task_id)` — cliente, `client_id` igual ao seu, `visible_to_client`

### Equipe

| Tabela | Leitura | Escrita |
|---|---|---|
| profiles | equipe lê todos | o próprio nome/foto; papel e ativo só admin |
| spaces | admin: todos; demais: os seus (e pais/filhos) | admin |
| space_members | admin; membros do mesmo espaço | admin; gestor adiciona/remove `membro` no seu espaço |
| clients | toda a equipe | admin e gestores (de qualquer espaço) |
| client_users | admin | admin |
| folders, lists, list_statuses | admin; membros do espaço; listas onde a pessoa é responsável por alguma tarefa | admin e gestor do espaço |
| tasks | `can_read_task` | criar/editar: admin e membros do espaço da lista, ou responsável (edição); arquivar: admin e gestor |
| task_assignees, task_tags | seguem a tarefa | seguem a edição da tarefa |
| tags | membros do espaço | admin e gestor do espaço |
| comments | seguem a tarefa | criar: quem lê a tarefa; editar/apagar: só o autor |
| task_activity | segue a tarefa | ninguém (só gatilhos) |
| content_* | segue a tarefa | segue a edição da tarefa; `content_reviews` só pela função |

### Cliente (portal)

| Tabela | Leitura |
|---|---|
| clients | só o seu |
| tasks | `client_id` = o seu **e** `visible_to_client = true` |
| comments | só `is_internal = false` das tarefas acima; pode criar (forçado externo) e editar os seus |
| content_items, content_versions, content_media, content_reviews | das tarefas acima, só versões já enviadas (nunca rascunho) |
| profiles | nome e foto de quem aparece em comentários/respostas das suas tarefas (via view `portal_people`) |
| list_statuses, task_activity, spaces, lists, tags, demais clientes | nada |

Cliente não tem nenhuma política de `UPDATE`/`DELETE` em tarefas nem peças; não consegue
mudar `visible_to_client`, status ou qualquer outro campo.

## Telas — Fase 1a

- **Login** (`/login`): e-mail + senha para a equipe; aba "receber link por e-mail" para
  clientes. Esqueci a senha via e-mail do Supabase.
- **Barra lateral:** Espaços › Pastas › Listas visíveis ao usuário; "Minhas tarefas" no topo.
- **Lista** (`/listas/[id]`): visões `?visao=lista` (agrupada por status, subtarefas
  expansíveis) e `?visao=kanban` (colunas por status, arrastar muda status e ordem).
  Filtros: responsável, status, prazo, tag, prioridade (o cliente já é o da lista).
- **Espaço** (`/espacos/[id]`): todas as tarefas do departamento em Lista/Kanban, agrupando
  status por categoria, com filtro por cliente e por mês de referência.
- **Minhas tarefas:** tarefas em que sou responsável, de qualquer espaço.
- **Tarefa** (painel lateral e `/tarefas/[id]`): título, descrição (editor rico — Tiptap),
  status, prioridade, datas, estimativa, responsáveis, tags, visível ao cliente,
  subtarefas, comentários (marcar interno/externo), histórico.
- **Clientes** (`/clientes`): cadastro, status, usuários do cliente (convidar por e-mail).
- **Configurações** (`/config`, admin): usuários da equipe (convidar, papel, ativar),
  departamentos (criar, renomear, ordenar, arquivar) e membros de cada um.
- Primeiro admin criado pelo script `npm run criar-admin -- <email>`.

## Telas — Fase 1b

- **Aba Peça** na tarefa: formato, data de publicação, ideia, objetivo, legenda, mídias
  (arrastar e soltar, progresso, reordenar), "salvar" e "enviar para aprovação", histórico
  de versões com respostas. Reaproveita `EditorMidias`, `VisualizadorMidia` e as regras de
  `src/dominio/`.
- **Portal** (`/portal`): layout simples, pensado para celular. "Aguardando sua aprovação"
  em destaque; demais tarefas visíveis por status; peça em moldura de celular com Aprovar
  / Pedir ajuste; comentários externos.

## Erros

- Violação de RLS ou de regra do banco vira mensagem amigável na tela; o detalhe vai para o
  log do servidor.
- Página de tarefa/peça que o usuário não pode ver responde 404 (não revela que existe).
- Convite para e-mail já cadastrado: mensagem clara, sem duplicar usuário.
- Upload: mesmas regras do app atual (erro por mídia com "tentar de novo"; não envia para
  aprovação com upload pendente).

## Testes

- **RLS (`tests/rls/`)**: matriz de cenários, cada um executado como um usuário simulado
  (papel `authenticated` + `auth.uid()` configurado). Mínimo:
  - cliente A não lê nenhuma linha de cliente B em nenhuma tabela;
  - cliente não lê tarefa com `visible_to_client = false`, nem suas peças/comentários;
  - cliente não lê comentário interno; comentário criado por cliente sai externo;
  - cliente não altera `visible_to_client`, status nem qualquer campo de tarefa;
  - cliente não responde peça de outro cliente, versão antiga ou peça em rascunho;
  - membro fora do espaço não lê a tarefa, a menos que seja responsável;
  - gestor de Tráfego não cria/edita listas do Comercial;
  - membro não cria lista; ninguém altera o próprio papel;
  - ninguém escreve em `task_activity`; `anon` não lê nada.
- **Regras do banco:** subtarefa herda lista/cliente, tarefa sem responsável é rejeitada,
  status de outra lista é rejeitado, `completed_at` acompanha a categoria `done`,
  histórico registra cada alteração.
- **Domínio:** testes atuais de status, versões e mídias, adaptados.
- **Onde rodam:** primeira tarefa do plano é um teste rápido para ver se o PGlite (já usado
  no projeto) roda as migrações com papéis e `auth.uid()` simulados. Se não der, os testes
  rodam contra um projeto Supabase separado só para testes. Esta máquina não tem Docker,
  então o Supabase local não é opção sem instalá-lo.
- **Roteiro manual por fase**, executado em produção antes de pedir aprovação.

## Implantação (ação humana)

1. Criar projeto Supabase (região São Paulo); configurar SMTP próprio e URLs de
   redirecionamento (`https://app.gruposrv.com.br/**`).
2. Preencher variáveis na Vercel; remover as antigas.
3. Adicionar `app.gruposrv.com.br` ao projeto; incluir a origem no CORS do bucket R2.
4. Aplicar migrações e criar o primeiro admin.
5. Ao fim da 1b: remover `conteudo.gruposrv.com.br` e apagar o banco Neon.

## Visão geral das fases seguintes (detalhadas depois)

- **2 — Comercial:** `leads` (UTMs, gclid, fbclid, `_fbp`, `_fbc`, página de origem, user
  agent, IP, data/hora), `pipeline_stages`, Kanban do funil, endpoint público com
  honeypot + rate limit + validação; "Ganho" converte em cliente, cria contrato e aplica o
  template de Onboarding. `tracking_settings` (token da Conversions API criptografado),
  `tracking_events_log`; evento `Lead` no Pixel e na CAPI com o mesmo `event_id`, dados com
  SHA-256, conversão do Google Ads com enhanced conversions, banner de consentimento.
  Notificação do responsável a definir nessa fase.
- **3 — Financeiro:** `contracts`, `financial_entries` (recorrentes, pago/pendente/atrasado);
  visível só para admin e espaço Financeiro.
- **4 — Visão por cliente:** dados, contrato, onboarding com progresso, calendário de
  conteúdo, métricas de tráfego, tarefas, arquivos.
- **5 — Painéis:** Geral (admin; gestor vê só os seus espaços) e por Departamento, com filtro
  de período e drill-down para os registros.
- **6 — Integrações:** Meta Ads API → `ad_metrics_daily`; Evolution API.

## Fora do escopo da Fase 1

Notificações (e-mail/WhatsApp), app mobile, automações configuráveis pelo usuário,
controle de tempo (timer), múltiplos workspaces, importação do ClickUp.

## Observação

A conta Vercel aparenta estar no plano Hobby, cujos termos vedam uso comercial. Com a
plataforma virando ferramenta central da empresa, migrar para Pro.
