# Plataforma da Agência — Fase 1a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fundação da plataforma em `app.gruposrv.com.br`: login por papel, departamentos, clientes, Espaço › Pasta › Lista › Tarefa › Subtarefa com responsáveis, status por lista, visões Lista e Kanban, comentários, histórico — tudo protegido por RLS provada em testes.

**Architecture:** Regras de negócio e de acesso vivem **no banco** (Supabase Postgres: tabelas, RLS, gatilhos, funções) e são testadas contra PGlite com um "shim" que imita o Supabase (papéis `anon`/`authenticated`/`service_role`, `auth.users`, `auth.uid()`). O app Next.js fala com o Supabase **como o usuário logado** (`@supabase/ssr`); `src/servicos/` são consultas finas, `src/dominio/` são funções puras testadas. A chave `service_role` só existe em `src/infra/supabase/admin.ts`.

**Tech Stack:** Next.js 16.3 (App Router, `src/proxy.ts`), React 19, TypeScript, Tailwind 4 + shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, Supabase CLI via `npx supabase`, `@electric-sql/pglite` (testes), Vitest, `@dnd-kit/core` + `@dnd-kit/sortable`, Tiptap (`@tiptap/react`, `@tiptap/starter-kit`), `fractional-indexing`.

**Spec:** `docs/superpowers/specs/2026-10-06-plataforma-agencia-design.md` (seções "Fase 1a", "Modelo de dados — Fase 1a", "Regras de acesso", "Testes"). A Fase 1b vem em plano próprio.

## Global Constraints

- **Antes de qualquer código Next.js:** ler `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `02-guides/authentication.md`, `01-getting-started/07-mutating-data.md` (exigência do `AGENTS.md`). Middleware agora se chama `proxy` (`export function proxy`).
- Tabelas e colunas em inglês (como na spec). Código TypeScript (funções, variáveis, arquivos) e interface em português, sem acento nos identificadores — mesmo padrão do código existente.
- Enumerações no banco são `text` + `check`, não `create type` (mais fácil de evoluir). Valores exatos:
  - `profiles.role`: `admin` | `gestor` | `membro` | `cliente`
  - `space_members.role`: `gestor` | `membro`
  - `clients.status`: `ativo` | `pausado` | `encerrado`
  - `list_statuses.category`: `todo` | `in_progress` | `done`
  - `tasks.priority`: `urgente` | `alta` | `normal` | `baixa` (padrão `normal`)
  - `task_activity.action`: `created` | `updated` | `moved` | `archived` | `assignee_added` | `assignee_removed` | `tag_added` | `tag_removed`
- **Ordenação manual:** `position text collate "C" not null`, gerada com `generateKeyBetween` do pacote `fractional-indexing` (substitui o `double precision` da spec: chaves fracionárias não perdem precisão após muitos arrastes).
- Arquivar = preencher `archived_at`; nenhuma tela apaga tarefa, lista, pasta ou espaço. Itens arquivados somem das telas.
- Todo `security definer` com `set search_path = public` (ou `''` com nomes qualificados).
- Toda migração precisa rodar **igual** no Supabase e no PGlite + shim. Nada de extensões além de `pgcrypto` (`gen_random_uuid()` já é nativo).
- Valores criados por migração (existem em produção): espaços Comercial, Financeiro, Operacional › {Conteúdo, Tráfego, Onboarding}; cliente `Grupo SRV (Interno)` com `is_internal = true`. Status padrão de lista nova: `A fazer` (todo, `#87909e`), `Em andamento` (in_progress, `#5b8def`), `Concluído` (done, `#2fa36b`).
- Usuário inativo (`profiles.active = false`) não acessa nada, mesmo com sessão válida.
- Signups públicos **desligados** no Supabase; usuários só entram por convite. Perfil nasce `active = false`, `role = 'cliente'`; quem convida ativa e define o papel.
- Toda Server Action que usa `criarClienteAdmin()` chama `exigirAdmin()` (ou a checagem equivalente indicada) **antes**, porque a chave mestra ignora RLS.
- Páginas `noindex, nofollow`; `robots.txt` com `Disallow: /` (mantém o que existe).
- O app antigo (`src/app/admin`, `src/app/c`, Drizzle, Neon) **continua no repositório e funcionando** até a Fase 1b; não remova nem quebre seus testes nesta fase. Rotas novas não podem colidir com `/admin` e `/c`.
- Variáveis novas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (só para `db push`), `SUPABASE_PROJECT_ID` (só para gerar tipos).

## Review Focus

1. **Usuário desativado com a sessão ainda aberta** → perde acesso a tudo na próxima consulta (não espera o token expirar). Teste em Task 2 (`usuário inativo não lê nada`).
2. **Mover para outra lista uma tarefa com subtarefas** → a árvore inteira vai junto e o `client_id` de todas passa a ser o da lista nova; status inválido na lista nova é trocado pelo primeiro `todo`. Teste em Task 4.
3. **Remover o último responsável** (inclusive quando a pessoa sai da equipe) → rejeitado com mensagem clara; trocar responsável (adicionar o novo e remover o antigo na mesma ação) funciona. Teste em Task 4; a action de Task 12 faz a troca numa só chamada RPC.
4. **Arrastar várias vezes um cartão para o mesmo lugar no Kanban** → a ordem continua correta após 60 inserções entre os mesmos vizinhos. Teste em Task 11 (`posicaoEntre`).
5. **Membro abre por link uma lista de outro departamento onde só tem uma tarefa atribuída** → vê a lista e só a sua tarefa, sem erro. Teste em Task 4 (RLS) e verificação manual em Task 14.

---

## File Structure

```
supabase/
  config.toml                         gerado por `npx supabase init`
  migrations/
    20261006000001_identidade.sql     profiles, spaces, space_members, clients, client_users, funções de acesso, RLS, dados iniciais
    20261006000002_estrutura.sql      folders, lists, list_statuses, RLS
    20261006000003_tarefas.sql        tasks, task_assignees, tags, task_tags, regras, RLS
    20261006000004_conversa.sql       comments, task_activity, gatilhos de histórico, RLS
    20261006000005_rpc.sql            funções chamadas pelo app (trocar responsáveis, mover tarefa)
  seed.sql                            só desenvolvimento
tests/
  ajuda/
    supabase-shim.sql                 imita o Supabase no PGlite
    banco.ts                          criarBanco, comoUsuario, comoAnonimo
    cenario.ts                        fábricas: usuários, espaços, clientes, listas, tarefas
  rls/identidade.test.ts
  rls/estrutura.test.ts
  rls/tarefas.test.ts
  rls/conversa.test.ts
  banco/tarefas.test.ts               regras de integridade (não-RLS)
  banco/historico.test.ts
  dominio/acesso.test.ts
  dominio/tarefas.test.ts
  dominio/posicao.test.ts
  dominio/filtros.test.ts
  dominio/atividade.test.ts
src/
  proxy.ts                            sessão Supabase + destino por papel (substitui o atual; preserva /admin antigo)
  dominio/
    acesso.ts                         destinoPorPapel
    tarefas.ts                        montarArvore, agruparPorStatus
    posicao.ts                        posicaoEntre
    filtros.ts                        lerFiltros, escreverFiltros
    atividade.ts                      descreverAtividade
  infra/supabase/
    servidor.ts                       criarClienteServidor (cookies)
    navegador.ts                      criarClienteNavegador
    admin.ts                          criarClienteAdmin (service_role) — uso isolado
    tipos.ts                          gerado: `npm run tipos`
    sessao.ts                         usuarioAtual, exigirEquipe, exigirAdmin, exigirCliente
  servicos/
    espacos.ts  pastas.ts  listas.ts  status.ts  tarefas.ts  comentarios.ts  usuarios.ts  clientes-plataforma.ts
  app/
    (auth)/login/page.tsx, acoes.ts
    auth/confirmar/route.ts           troca do código do link mágico/convite/recuperação
    (app)/layout.tsx                  casca + barra lateral
    (app)/inicio/page.tsx             "Minhas tarefas"
    (app)/espacos/[espaco]/page.tsx
    (app)/listas/[lista]/page.tsx
    (app)/tarefas/[tarefa]/page.tsx
    (app)/@painel/(.)tarefas/[tarefa]/page.tsx   painel lateral (rota interceptada)
    (app)/clientes/page.tsx, [cliente]/page.tsx
    (app)/config/usuarios/page.tsx, config/espacos/page.tsx
    portal/page.tsx                   placeholder "Em breve" (Fase 1b)
  componentes/ui/                     shadcn/ui
  componentes/app/                    BarraLateral, ArvoreEspacos
  componentes/tarefas/                VisaoLista, VisaoKanban, LinhaTarefa, CartaoTarefa, DetalheTarefa, SeletorResponsaveis, SeletorStatus, EditorDescricao, Comentarios, Historico, BarraFiltros
scripts/criar-admin.ts
```

`clientes-plataforma.ts` evita colidir com o `src/servicos/clientes.ts` do app antigo (será renomeado para `clientes.ts` na Fase 1b, quando o antigo sai).

---

### Task 1: Banco de testes que imita o Supabase

**Files:**
- Create: `tests/ajuda/supabase-shim.sql`, `tests/ajuda/banco.ts`, `tests/ajuda/cenario.ts` (só `criarUsuario` nesta task), `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/.gitkeep`
- Test: `tests/ajuda/banco.test.ts`

**Interfaces:**
- Produces:
  - `criarBanco(): Promise<PGlite>` — novo PGlite, aplica o shim e depois todo `supabase/migrations/*.sql` em ordem alfabética; conexão como superusuário (equivale a `service_role`/`postgres`).
  - `comoUsuario<T>(db: PGlite, userId: string, fn: (tx: Transaction) => Promise<T>): Promise<T>` — dentro de `db.transaction`: `set local role authenticated` + `set_config('request.jwt.claims', '{"sub":"<id>","role":"authenticated"}', true)`.
  - `comoAnonimo<T>(db, fn)` — idem com `set local role anon` e claims vazios.
  - `criarUsuario(db, opts: { role: Papel; ativo?: boolean; nome?: string; email?: string }): Promise<string>` — insere em `auth.users` (o gatilho da Task 2 cria o perfil) e depois faz `update profiles set role, active, full_name` como superusuário. Até a Task 2 existir, só insere em `auth.users`.
  - `type Papel = 'admin' | 'gestor' | 'membro' | 'cliente'` exportado de `tests/ajuda/cenario.ts`.

O shim cria: papéis `anon`, `authenticated` (nologin) e `service_role` (nologin, bypassrls); schema `auth` com `auth.users (id uuid pk, email text unique, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}', created_at timestamptz default now())`; `auth.uid()` lendo `current_setting('request.jwt.claims', true)::json->>'sub'`; `grant usage on schema public, auth to anon, authenticated, service_role`; `alter default privileges in schema public grant all on tables to anon, authenticated, service_role` e o mesmo para `functions` e `sequences` (é o que o Supabase faz — por isso toda proteção vem de RLS).

- [ ] **Step 1: Teste**

```ts
it('aplica migrações e isola papéis', async () => {
  const db = await criarBanco()
  await db.exec(`create table public.t (id int, dono uuid); alter table public.t enable row level security;
    create policy p on public.t for select to authenticated using (dono = auth.uid());`)
  const a = await criarUsuario(db, { role: 'membro' })
  await db.query('insert into public.t values (1, $1), (2, gen_random_uuid())', [a])
  expect(await comoUsuario(db, a, (tx) => tx.query('select id from public.t').then((r) => r.rows))).toEqual([{ id: 1 }])
  expect(await comoAnonimo(db, (tx) => tx.query('select id from public.t').then((r) => r.rows))).toEqual([])
})
```

- [ ] **Step 2:** `npx vitest run tests/ajuda/banco.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** `npx supabase init` (aceitar padrões, sem VS Code settings); implementar shim e `banco.ts`.
- [ ] **Step 4:** `npx vitest run tests/ajuda/banco.test.ts` → PASS. `npm test` → testes antigos continuam passando.
- [ ] **Step 5:** Commit `test: banco PGlite que imita o Supabase`.

---

### Task 2: Identidade, departamentos e clientes (migração 1)

**Files:**
- Create: `supabase/migrations/20261006000001_identidade.sql`
- Modify: `tests/ajuda/cenario.ts` (+ `criarEspaco`, `adicionarMembro`, `criarCliente`, `vincularUsuarioCliente`)
- Test: `tests/rls/identidade.test.ts`

**Interfaces:**
- Produces (SQL, todos `security definer stable`, retornam `false`/`null` para usuário inativo ou sem perfil):
  - `public.is_admin() boolean`, `public.is_team() boolean` (ativo e papel ≠ cliente), `public.my_client_id() uuid` (ativo, papel cliente)
  - `public.is_space_member(space uuid) boolean` — admin, ou membro/gestor do espaço ou do seu `parent_id`
  - `public.is_space_manager(space uuid) boolean` — admin, ou gestor do espaço ou do seu pai
- Produces (TS, `cenario.ts`): `criarEspaco(db, nome, parentId?) → id`, `adicionarMembro(db, spaceId, userId, role: 'gestor'|'membro')`, `criarCliente(db, nome) → id`, `vincularUsuarioCliente(db, userId, clientId)`, `idEspaco(db, nome) → id` (busca dos criados por migração), `idInterno(db) → id`.

Tabelas e colunas conforme a spec. Além disso:
- Gatilho `after insert on auth.users` → `insert into profiles (id, full_name, role, active) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'cliente', false)`.
- Gatilho `before update on profiles`: se `role` ou `active` mudam e `auth.uid() is not null and not is_admin()` → `raise exception 'Somente administradores alteram papel ou status'`.
- `space_members` e `task_assignees` (Task 4) só aceitam usuário com `role <> 'cliente'` (gatilho). `client_users` só aceita `role = 'cliente'`.
- `spaces.parent_id`: o pai não pode ter pai (gatilho, um nível só).
- Dados iniciais da Global Constraints, inseridos nesta migração.
- `profiles` select: `id = auth.uid()` (qualquer usuário, inclusive inativo) **ou** `is_team()`.
- Políticas conforme a tabela "Equipe" da spec. `space_members` insert/delete por gestor: só linhas com `role = 'membro'` no espaço que ele gerencia.

- [ ] **Step 1: Testes** (`describe` por tabela; cada `it` cria seu banco). Asserções obrigatórias:
  - `migração cria departamentos e cliente interno`: nomes `['Comercial','Financeiro','Operacional','Conteúdo','Tráfego','Onboarding']`; Conteúdo, Tráfego e Onboarding com `parent_id` = Operacional; exatamente um `clients` com `is_internal`.
  - `segundo cliente interno é rejeitado` (índice único parcial).
  - `perfil nasce inativo como cliente` ao inserir em `auth.users`.
  - `membro não altera o próprio papel` → `update profiles set role='admin'` como o membro rejeita com /Somente administradores/.
  - `admin altera papel de outro` → sucesso.
  - `usuário inativo não lê nada`: membro ativo de Comercial lê `spaces`/`clients`; após `active=false` lê 0 linhas em `spaces` e `clients`, e em `profiles` só o próprio (o proxy precisa ler o próprio perfil para saber que está inativo).
  - `todo usuário lê o próprio perfil` (inclusive cliente); `cliente não lê perfis da equipe nesta fase`.
  - `membro vê só seus espaços`: membro de Conteúdo lê Conteúdo e Operacional (pai); não lê Comercial. Membro de Operacional lê os filhos.
  - `admin vê todos os espaços`; `só admin cria espaço` (gestor recebe erro de RLS).
  - `gestor adiciona membro no seu espaço e não em outro`; `gestor não promove ninguém a gestor`.
  - `equipe lê todos os clientes`; `gestor cria cliente`; `membro não cria cliente`.
  - `cliente lê só o próprio cliente` (dois clientes, um usuário cada).
  - `cliente não lê spaces, space_members nem client_users de outros`.
  - `anônimo não lê nada` em todas as tabelas desta migração.
  - `cliente não pode ser membro de espaço`; `membro da equipe não pode ser vinculado a cliente`.
- [ ] **Step 2:** `npx vitest run tests/rls/identidade.test.ts` → FAIL.
- [ ] **Step 3:** Escrever a migração.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(banco): identidade, departamentos e clientes com RLS`.

---

### Task 3: Pastas, listas e status (migração 2)

**Files:**
- Create: `supabase/migrations/20261006000002_estrutura.sql`
- Modify: `tests/ajuda/cenario.ts` (+ `criarPasta`, `criarLista(db, { spaceId, clientId, folderId?, nome?, mes? }) → id`, `statusDaLista(db, listId) → {id, name, category}[]`)
- Test: `tests/rls/estrutura.test.ts`

**Interfaces:**
- Produces (SQL): `public.can_read_list(list uuid) boolean` — admin, `is_space_member(lists.space_id)`, ou responsável por alguma tarefa não arquivada da lista. **Atenção:** como `task_assignees` só nasce na Task 4, crie aqui a função só com as duas primeiras condições e a Task 4 faz `create or replace` incluindo a terceira.

Regras:
- `lists.folder_id`, se informado, pertence ao mesmo `space_id` (gatilho).
- `lists.reference_month`, se informado, é dia 1 (`check (extract(day from reference_month) = 1)`).
- Gatilho `after insert on lists` cria os três status padrão.
- `list_statuses`: não permite apagar nem mudar a categoria do último `todo` ou do último `done` da lista (gatilho, mensagem `A lista precisa de pelo menos um status "a fazer" e um "concluído"`).
- `lists.client_id` só pode mudar se a lista não tiver tarefas (gatilho; a Task 4 mantém a regra válida). Mensagem: `Não é possível trocar o cliente de uma lista com tarefas`.
- RLS: leitura via `is_space_member` (pastas) e `can_read_list` (listas e status); escrita `is_space_manager(space_id)`.

- [ ] **Step 1: Testes**:
  - `lista nova nasce com A fazer, Em andamento, Concluído` (nomes, categorias e cores exatas).
  - `pasta de outro espaço é rejeitada`; `mês que não é dia 1 é rejeitado`; `lista sem cliente é rejeitada`.
  - `não apaga o último status concluído`.
  - `gestor de Conteúdo cria lista em Conteúdo; gestor de Tráfego não`; `membro não cria lista nem pasta`.
  - `membro de Conteúdo lê listas de Conteúdo e não de Comercial`.
  - `cliente não lê folders, lists nem list_statuses`; `anônimo não lê nada`.
- [ ] **Step 2:** → FAIL. **Step 3:** migração. **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(banco): pastas, listas e status com RLS`.

---

### Task 4: Tarefas, responsáveis e etiquetas (migração 3)

**Files:**
- Create: `supabase/migrations/20261006000003_tarefas.sql`
- Modify: `tests/ajuda/cenario.ts` (+ `criarTarefa(db, { listId, responsaveis: string[], titulo?, parentId?, statusId? }) → id` — insere tarefa e responsáveis na mesma transação)
- Test: `tests/banco/tarefas.test.ts`, `tests/rls/tarefas.test.ts`

**Interfaces:**
- Produces (SQL): `public.can_read_task(task uuid) boolean` (admin, `is_space_member` do espaço da lista, ou responsável); `public.can_edit_task(task uuid) boolean` (mesmo critério; a equipe que lê, edita); `can_read_list` atualizado (Task 3).

Regras (gatilhos `before insert or update on tasks`, nesta ordem lógica):
1. Se `parent_task_id` informado: `list_id := lista da mãe`; rejeita ciclo (a mãe não pode ser descendente da própria tarefa) com `Subtarefa não pode conter a tarefa mãe`.
2. `client_id := lists.client_id` sempre (ignora o que vier).
3. `status_id` nulo → primeiro `todo` da lista por `position`; `status_id` de outra lista → em UPDATE de mudança de lista, troca pelo primeiro `todo` da lista nova; em qualquer outro caso, rejeita com `Status não pertence à lista`.
4. `completed_at := now()` ao entrar num status `done`; `null` ao sair.
5. `updated_at := now()`.
- `after update of list_id` → atualiza `list_id`, `client_id` (e status, pela regra 3) de todos os descendentes.
- `task_assignees`: gatilho de restrição `deferrable initially deferred` em `tasks` (insert) e em `task_assignees` (delete) verificando ≥ 1 responsável no fim da transação: `A tarefa precisa de pelo menos um responsável`. Tarefas arquivadas são isentas.
- `tags.space_id` deve ser o espaço da lista da tarefa ao associar (`task_tags`), ou o pai dele.
- RLS: `tasks` select `can_read_task(id)`; insert: `is_team() and (is_space_member(espaço da lista))`; update: `can_edit_task(id)`; `archived_at` só muda por admin/gestor do espaço (gatilho, `Só gestores arquivam tarefas`); sem delete para ninguém. `task_assignees`/`task_tags`: select `can_read_task(task_id)`, insert/delete `can_edit_task(task_id)`. `tags`: select `is_space_member`, escrita `is_space_manager`.

- [ ] **Step 1: Testes** — `tests/banco/tarefas.test.ts`:
  - `client_id vem da lista` (insere com outro `client_id`, lê o da lista).
  - `subtarefa herda lista e cliente da mãe` (insere com outra `list_id`).
  - `subtarefa em três níveis`; `ciclo é rejeitado`.
  - `mover tarefa com subtarefas move a árvore`: mãe + filha + neta movidas para lista de outro cliente → as três com `list_id` e `client_id` novos e status `A fazer` da lista nova.
  - `status nulo vira A fazer`; `status de outra lista é rejeitado` (sem mudança de lista).
  - `completed_at acompanha concluído` (entra → preenchido; volta → null).
  - `tarefa sem responsável é rejeitada`; `remover o último responsável é rejeitado`; `trocar responsável na mesma transação funciona`.
  - `cliente não pode ser responsável`.
  - `etiqueta de outro espaço é rejeitada`.
  - `não é possível trocar o cliente de uma lista com tarefas`.
- [ ] **Step 2: Testes** — `tests/rls/tarefas.test.ts`:
  - `membro do espaço lê, cria e edita tarefa`.
  - `membro de fora não lê a tarefa`; `membro de fora que é responsável lê e edita a tarefa e lê a lista, mas não as outras tarefas da lista` (Review Focus 5).
  - `membro não arquiva; gestor do espaço arquiva`.
  - `ninguém apaga tarefa` (delete afeta 0 linhas ou erro).
  - `gestor de Tráfego não lê tarefas do Comercial`.
  - `cliente não lê tarefas nesta fase` mesmo com `visible_to_client = true` (o acesso do cliente entra na Fase 1b — garante que nada vaza antes).
  - `anônimo não lê nada`.
- [ ] **Step 3:** → FAIL. **Step 4:** migração. **Step 5:** → PASS.
- [ ] **Step 6:** Commit `feat(banco): tarefas, subtarefas, responsáveis e etiquetas com RLS`.

---

### Task 5: Comentários e histórico (migração 4)

**Files:**
- Create: `supabase/migrations/20261006000004_conversa.sql`
- Test: `tests/rls/conversa.test.ts`, `tests/banco/historico.test.ts`

Regras:
- `comments`: autor = `auth.uid()` (gatilho força); usuário `cliente` → `is_internal = false` (gatilho força; já deixa pronto para 1b). Editar define `edited_at`. Select/insert: `can_read_task(task_id)`; update/delete: só o autor.
- `task_activity`: sem políticas de escrita; gatilhos `security definer` gravam:
  - `tasks` insert → `created`; update → uma linha `updated` por campo alterado entre `title, description, status_id, priority, start_date, due_date, estimate_minutes, visible_to_client` com `old_value`/`new_value`; mudança de `list_id` → `moved` (não grava `updated` de `client_id`/`list_id` dos descendentes — só a tarefa movida diretamente registra `moved`); `archived_at` preenchido → `archived`.
  - `task_assignees` insert/delete → `assignee_added`/`assignee_removed` com `new_value`/`old_value` = `{"user_id": ...}`.
  - `task_tags` → `tag_added`/`tag_removed`.
  - `actor_id := auth.uid()` (null quando feito pelo sistema).
- Select de `task_activity`: `can_read_task(task_id)`.

- [ ] **Step 1: Testes**:
  - `criar tarefa registra created com ator`.
  - `mudar título e prioridade registra duas linhas updated com valores antigo e novo`.
  - `mudar status registra updated de status_id`; `mover registra moved`.
  - `adicionar e remover responsável registra`.
  - `ninguém insere em task_activity` (membro recebe erro de RLS).
  - `membro de fora não lê comentários nem histórico`.
  - `só o autor edita o comentário`; `editar preenche edited_at`.
  - `autor é sempre o usuário logado` (tentativa de inserir com outro `author_id` grava o próprio).
- [ ] **Step 2:** → FAIL. **Step 3:** migração. **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(banco): comentários e histórico de atividades`.

---

### Task 6: Funções para o app (migração 5)

**Files:**
- Create: `supabase/migrations/20261006000005_rpc.sql`
- Test: `tests/banco/rpc.test.ts`

**Interfaces:**
- Produces (SQL, `security invoker` — RLS se aplica normalmente):
  - `public.criar_tarefa(p_list uuid, p_title text, p_assignees uuid[], p_parent uuid default null, p_status uuid default null, p_position text default null) returns uuid` — tarefa + responsáveis numa transação.
  - `public.definir_responsaveis(p_task uuid, p_assignees uuid[]) returns void` — substitui o conjunto inteiro (insere novos, remove os ausentes); vazio → erro do gatilho adiado.
  - `public.mover_tarefa(p_task uuid, p_status uuid, p_position text) returns void` — usado pelo Kanban.

- [ ] **Step 1: Testes**: `criar_tarefa com dois responsáveis`; `criar_tarefa sem responsáveis falha com "pelo menos um responsável"`; `definir_responsaveis troca A por B`; `definir_responsaveis vazio falha`; `membro de fora não consegue criar_tarefa na lista` (erro de RLS); `mover_tarefa muda status e posição e registra no histórico`.
- [ ] **Step 2:** → FAIL. **Step 3:** migração. **Step 4:** → PASS.
- [ ] **Step 5:** `npm test` inteiro → PASS. Commit `feat(banco): funções de criar, mover e atribuir tarefas`.

---

### Task 7: ⚠️ Ação humana — projeto Supabase de desenvolvimento

Parar e pedir ao usuário (com passo a passo no chat, como foi feito para Cloudflare/Vercel):
1. Criar conta/projeto Supabase **`srv-plataforma-dev`**, região `South America (São Paulo)`; guardar a senha do banco.
2. Authentication → Sign In / Providers: **desligar "Allow new users to sign up"**; Email ligado.
3. Authentication → URL Configuration: Site URL `http://localhost:3000`; Redirect URLs `http://localhost:3000/**`.
4. Passar para `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (connection string "Session pooler"), `SUPABASE_PROJECT_ID`.
5. `npx supabase login` (abre o navegador; necessário para gerar tipos).

Depois, o agente:
- [ ] Adiciona scripts ao `package.json`: `"db:push": "supabase db push --db-url \"$SUPABASE_DB_URL\""` e `"tipos": "supabase gen types typescript --project-id \"$SUPABASE_PROJECT_ID\" --schema public > src/infra/supabase/tipos.ts"`, e `supabase` em devDependencies.
- [ ] `npm run db:push` → aplica as 5 migrações sem erro. Isso confirma que o shim não divergiu do Supabase real; se alguma falhar só no real, corrigir a migração **e** o shim.
- [ ] `npm run tipos` → `src/infra/supabase/tipos.ts` com `Database`.
- [ ] Atualiza `.env.example` com as variáveis novas (sem valores). Commit `chore: scripts do Supabase e tipos gerados`.

---

### Task 8: Sessão, proxy e login

**Files:**
- Create: `src/infra/supabase/{servidor,navegador,admin,sessao}.ts`, `src/dominio/acesso.ts`, `src/app/(auth)/login/{page.tsx,acoes.ts}`, `src/app/auth/confirmar/route.ts`, `src/app/portal/page.tsx`, `scripts/criar-admin.ts`
- Modify: `src/proxy.ts`, `package.json` (deps `@supabase/ssr`, `@supabase/supabase-js`; script `"criar-admin": "tsx --env-file=.env.local scripts/criar-admin.ts"`; devDep `tsx` — Node 20 não roda TypeScript direto)
- Test: `tests/dominio/acesso.test.ts`

**Interfaces:**
- Produces:
  - `criarClienteServidor(): Promise<SupabaseClient<Database>>` (cookies do `next/headers`), `criarClienteNavegador()`, `criarClienteAdmin()` (lança se chamado fora do servidor; comentário no topo listando os usos permitidos).
  - `type Perfil = { id: string; nome: string; papel: 'admin'|'gestor'|'membro'|'cliente'; ativo: boolean }`
  - `usuarioAtual(): Promise<Perfil | null>` (cacheado por requisição com `cache` do React), `exigirEquipe(): Promise<Perfil>`, `exigirAdmin(): Promise<Perfil>`, `exigirCliente(): Promise<Perfil>` — redirecionam (`/login`) ou dão `notFound()`.
  - `destinoPorPapel(caminho: string, papel: Perfil['papel'] | null, ativo: boolean): string | null` — `null` = segue; senão o caminho para redirecionar.

Regras de `destinoPorPapel` (as asserções do teste):
- `/admin`, `/admin/*`, `/c/*`, `/api/dev-arquivos/*`, `/robots.txt` → `null` (app antigo intacto; o proxy mantém a checagem de cookie antiga para `/admin`).
- `/login`, `/auth/*` → `null`.
- sem papel (deslogado) ou inativo → `/login` (para qualquer outro caminho).
- `cliente` em caminho fora de `/portal` → `/portal`.
- equipe em `/portal/*` → `/inicio`.
- `/` → `/inicio` (equipe) ou `/portal` (cliente).

`src/proxy.ts`: renova a sessão conforme o guia do `@supabase/ssr` (cria cliente com cookies de request/response e chama `auth.getUser()`), lê `profiles(role, active)` do usuário, aplica `destinoPorPapel`. Preserva o bloco atual do `/admin` (cookie `COOKIE_SESSAO`). Matcher exclui `_next/static`, `_next/image`, `favicon.ico`, arquivos de imagem.

Login: formulário e-mail + senha (`signInWithPassword`); aba "Sou cliente — receber link" (`signInWithOtp` com `shouldCreateUser: false`, `emailRedirectTo: <URL_BASE>/auth/confirmar`); "Esqueci a senha" (`resetPasswordForEmail`, redireciona para `/auth/confirmar?next=/login/nova-senha`). Mensagens genéricas em erro de credencial (`E-mail ou senha incorretos`). `/auth/confirmar` troca `code` por sessão (`exchangeCodeForSession`) ou `token_hash` + `type` (`verifyOtp`) e redireciona para `next` ou `/`. Inclui `src/app/(auth)/login/nova-senha/page.tsx` (definir senha — usado também no primeiro acesso por convite).

`scripts/criar-admin.ts <email> <nome>`: `auth.admin.inviteUserByEmail(email, { redirectTo: <URL_BASE>/auth/confirmar?next=/login/nova-senha })`, depois `update profiles set role='admin', active=true, full_name=<nome>`.

- [ ] **Step 1:** Teste de `destinoPorPapel` com uma linha por regra acima (tabela `it.each`). **Step 2:** → FAIL. **Step 3:** implementar `acesso.ts`. **Step 4:** → PASS.
- [ ] **Step 5:** Implementar infra, proxy, login, confirmação, portal placeholder ("Seu portal estará disponível em breve") e script.
- [ ] **Step 6:** `npm run typecheck && npm test` → PASS.
- [ ] **Step 7: Verificação manual** (`npm run dev`): `npm run criar-admin -- <email do usuário> "<nome>"` → e-mail chega → definir senha → cai em `/inicio` (404 por enquanto é aceitável) ; deslogado em `/listas/x` → `/login`; `/admin/login` antigo continua abrindo.
- [ ] **Step 8:** Commit `feat: login com Supabase, sessão e direcionamento por papel`.

---

### Task 9: shadcn/ui e casca do app

**Files:**
- Create: `components.json`, `src/componentes/ui/*` (button, input, dialog, dropdown-menu, select, popover, command, badge, avatar, tooltip, sheet, tabs, sonner), `src/lib/utils.ts` (`cn`), `src/app/(app)/layout.tsx`, `src/componentes/app/{BarraLateral,ArvoreEspacos}.tsx`, `src/servicos/espacos.ts`
- Modify: `src/app/globals.css` (tokens do shadcn mapeados para as cores atuais: `--primary` = roxo atual do tema ClickUp, fundo, texto, bordas), `src/app/layout.tsx` (título `Grupo SRV`), `src/app/page.tsx` (vira só redirecionamento — o proxy já resolve; página server com `redirect('/inicio')`)

**Interfaces:**
- Produces: `listarArvore(sb): Promise<NoEspaco[]>` em `src/servicos/espacos.ts`, com `type NoEspaco = { id; nome; cor; filhos: NoEspaco[]; pastas: { id; nome; listas: ItemLista[] }[]; listas: ItemLista[] }` e `type ItemLista = { id; nome; clienteNome: string; mes: string | null }`. Uma consulta por tabela (spaces, folders, lists com `clients(name)`), montagem em memória; a RLS já filtra.

shadcn: `npx shadcn@latest init` com alias `@/componentes/ui` e `@/lib/utils`; conferir que funciona com Tailwind 4 e React 19. Rótulo da lista na barra lateral: `nome · cliente · mês` (mês como `out/26`).

Barra lateral: logo, "Minhas tarefas" (`/inicio`), árvore (espaço-pai › espaços › pastas › listas, recolhível), rodapé com "Clientes" (equipe), "Configurações" (admin) e menu do usuário (Sair → `signOut` + `/login`).

- [ ] **Step 1:** Implementar. **Step 2:** `npm run typecheck && npm run build` → sucesso.
- [ ] **Step 3: Verificação manual:** admin vê os 6 espaços na árvore; com `seed.sql` (Step 4) aparecem pastas e listas.
- [ ] **Step 4:** `supabase/seed.sql` (só dev, aplicado à mão no SQL editor do projeto dev): 2 clientes, 1 pasta por cliente em Conteúdo, lista "Conteúdo Estratégico" de outubro/2026 em cada uma, 5 tarefas por lista. Usuários não entram no seed (vêm por convite).
- [ ] **Step 5:** Commit `feat: casca do app com barra lateral e shadcn/ui`.

---

### Task 10: Configurações — usuários e departamentos; Clientes

**Files:**
- Create: `src/servicos/usuarios.ts`, `src/servicos/clientes-plataforma.ts`, `src/app/(app)/config/usuarios/{page.tsx,acoes.ts}`, `src/app/(app)/config/espacos/{page.tsx,acoes.ts}`, `src/app/(app)/clientes/{page.tsx,acoes.ts}`, `src/app/(app)/clientes/[cliente]/{page.tsx,acoes.ts}`

**Interfaces:**
- Produces:
  - `convidarUsuario(dados: { email: string; nome: string; papel: Papel; clienteId?: string; espacos?: { id: string; papel: 'gestor'|'membro' }[] }): Promise<{ ok: true } | { erro: string }>` (Server Action em `config/usuarios/acoes.ts`). Ordem: `exigirAdmin()` → `criarClienteAdmin().auth.admin.inviteUserByEmail` (redirect para `/auth/confirmar?next=/login/nova-senha`) → via cliente admin: `update profiles` (papel, nome, ativo) → `client_users` ou `space_members`. Se o e-mail já existe: `{ erro: 'Já existe um usuário com este e-mail' }`. Papel `cliente` exige `clienteId`.
  - Convite de usuário do cliente na página do cliente reutiliza `convidarUsuario` com `papel: 'cliente'`. Gestor pode convidar usuário de cliente? **Não** nesta fase — só admin (a action exige admin).
  - `alterarPapel`, `ativarDesativar` (admin; não permite desativar a si mesmo: `Você não pode desativar a própria conta`).
  - Espaços: `criarEspaco`, `renomearEspaco`, `reordenarEspacos`, `arquivarEspaco`, `adicionarMembroEspaco`, `removerMembroEspaco` — via cliente do usuário (RLS decide; gestor pode gerenciar membros do seu espaço pela página do espaço na Task 13).
  - Clientes: `criarCliente`, `editarCliente` (nome, razão social, documento, e-mail, telefone, status) — cliente do usuário; RLS permite admin e gestores.

- [ ] **Step 1:** Implementar telas e actions. Formulários com validação no servidor (e-mail válido, nome não vazio).
- [ ] **Step 2:** `npm run typecheck && npm test` → PASS.
- [ ] **Step 3: Verificação manual:** convidar um membro para Conteúdo → e-mail chega → membro define senha → vê só Operacional › Conteúdo; admin desativa o membro → na próxima navegação o membro cai em `/login`. Criar cliente; convidar usuário do cliente → entra por link → cai em `/portal`.
- [ ] **Step 4:** Commit `feat: gestão de usuários, departamentos e clientes`.

---

### Task 11: Funções puras das visões

**Files:**
- Create: `src/dominio/posicao.ts`, `src/dominio/tarefas.ts`, `src/dominio/filtros.ts`, `src/dominio/atividade.ts`; dep `fractional-indexing`
- Test: `tests/dominio/{posicao,tarefas,filtros,atividade}.test.ts`

**Interfaces:**
- Produces:
  - `posicaoEntre(antes: string | null, depois: string | null): string` — `generateKeyBetween`.
  - `type TarefaResumo = { id: string; titulo: string; paiId: string | null; statusId: string; prioridade: Prioridade; prazo: string | null; posicao: string; responsaveis: { id: string; nome: string; avatar: string | null }[]; tags: { id: string; nome: string; cor: string }[]; listaId: string; clienteNome: string; concluidaEm: string | null }`
  - `type No<T> = T & { filhos: No<T>[] }`; `montarArvore(tarefas: TarefaResumo[]): No<TarefaResumo>[]` — ordena por `posicao` em cada nível; filha cuja mãe não veio na consulta (ex.: mãe invisível para o membro) aparece como raiz.
  - `agruparPorStatus(raizes, status: { id; nome; cor; categoria }[]): { status; tarefas: No<TarefaResumo>[] }[]` — na ordem dos status; status sem tarefa aparece vazio.
  - `type Filtros = { responsaveis: string[]; status: string[]; prioridades: Prioridade[]; tags: string[]; prazo: 'atrasadas' | 'hoje' | 'semana' | 'sem-prazo' | null; clientes: string[]; mes: string | null; visao: 'lista' | 'kanban' }`; `lerFiltros(sp: Record<string, string | string[] | undefined>): Filtros` e `escreverFiltros(f: Filtros): URLSearchParams` — chaves `resp`, `status`, `prio`, `tag`, `prazo`, `cliente`, `mes`, `visao`; valores múltiplos separados por vírgula; padrão `visao=lista`; valores desconhecidos ignorados.
  - `descreverAtividade(a: { action; field; old_value; new_value; ator: string }, nomes: { status: Record<string,string>; usuarios: Record<string,string>; tags: Record<string,string> }): string`.
  - `prazoEm(filtro: Filtros['prazo'], hoje: string): { de?: string; ate?: string; semPrazo?: true }` — datas `YYYY-MM-DD`, sem fuso (reaproveitar o cuidado de `formatarData` em `src/dominio/formatar.ts`).

- [ ] **Step 1: Testes** (asserções obrigatórias):
  - `posicaoEntre(null, null)` é string não vazia; `a < posicaoEntre(a, b) < b`; **60 inserções sucessivas entre o mesmo par** mantêm a ordem estrita (Review Focus 4).
  - `montarArvore` com neta, ordenação por posição, e órfã virando raiz.
  - `agruparPorStatus` mantém status vazio e a ordem.
  - `lerFiltros({ resp: 'a,b', visao: 'kanban', prio: 'alta,xyz' })` → `responsaveis ['a','b']`, `visao 'kanban'`, `prioridades ['alta']`; ida e volta `lerFiltros(escreverFiltros(f))` igual a `f`.
  - `prazoEm('atrasadas', '2026-10-06')` → `{ ate: '2026-10-05' }`; `'semana'` → `{ de: '2026-10-06', ate: '2026-10-12' }`.
  - `descreverAtividade`: `Ana mudou o status de A fazer para Em andamento`; `Ana adicionou Bruno como responsável`; `Ana moveu a tarefa`; `Ana criou a tarefa`; prazo `Ana mudou o prazo de — para 07/10/2026`.
- [ ] **Step 2:** → FAIL. **Step 3:** implementar. **Step 4:** → PASS.
- [ ] **Step 5:** Commit `feat(dominio): árvore, agrupamento, filtros, posição e histórico`.

---

### Task 12: Página da lista — visão Lista, criação de tarefa, filtros

**Files:**
- Create: `src/servicos/{listas,status,tarefas}.ts`, `src/app/(app)/listas/[lista]/{page.tsx,acoes.ts}`, `src/componentes/tarefas/{VisaoLista,LinhaTarefa,BarraFiltros,SeletorResponsaveis,SeletorStatus,NovaTarefa}.tsx`, `src/app/(app)/listas/[lista]/status/` (editor de status em diálogo)

**Interfaces:**
- Consumes: Task 6 RPCs, Task 11 funções.
- Produces (`src/servicos/tarefas.ts`):
  - `listarTarefas(sb, escopo: { listaId: string } | { espacoId: string } | { responsavelId: string }, filtros: Filtros, hoje: string): Promise<TarefaResumo[]>` — uma consulta com `task_assignees(profiles(...))`, `task_tags(tags(...))`, `lists(clients(name))`; exclui arquivadas; aplica filtros no banco. Para `espacoId`, inclui espaços filhos.
  - `criarTarefa(sb, { listaId, titulo, responsaveis, paiId?, statusId? })` → RPC `criar_tarefa` com `posicaoEntre(ultima, null)`.
  - `atualizarTarefa(sb, id, campos: Partial<{ titulo; descricao; statusId; prioridade; inicio; prazo; estimativaMin; visivelCliente }>)`, `definirResponsaveis(sb, id, ids)`, `moverTarefa(sb, id, statusId, posicao)`, `moverParaLista(sb, id, listaId)`, `arquivarTarefa(sb, id)`.
  - `buscarLista(sb, id)` → lista + cliente + espaço + status; `null` se a RLS esconder (página dá `notFound()`).
- Actions retornam `{ ok: true } | { erro: string }`; erros do Postgres (`P0001` com nossas mensagens) são repassados; erros de RLS viram `Você não tem permissão para isso.`

Tela: cabeçalho (nome, cliente, mês, alternador Lista/Kanban que só muda `?visao=`), `BarraFiltros` (responsável, status, prioridade, tag, prazo), grupos por status recolhíveis, linha com: expandir subtarefas, título, responsáveis (avatares), prazo (vermelho se atrasado e não concluído), prioridade, tags. Clicar na linha abre o painel da tarefa (Task 13). "+ Nova tarefa" em cada grupo: título + responsável (padrão: o próprio usuário). Gestor/admin vê "Editar status" (diálogo: nome, cor, categoria, reordenar, remover).

- [ ] **Step 1:** Implementar serviços, actions e telas.
- [ ] **Step 2:** `npm run typecheck && npm test && npm run build` → sucesso.
- [ ] **Step 3: Verificação manual** com o seed: criar tarefa e subtarefa; filtrar por responsável e prazo e ver a URL mudar; recarregar mantém filtros; membro sem permissão de criar status não vê o botão; tentar `definirResponsaveis` vazio mostra `A tarefa precisa de pelo menos um responsável`.
- [ ] **Step 4:** Commit `feat: página da lista com visão Lista e filtros`.

---

### Task 13: Detalhe da tarefa, comentários e histórico

**Files:**
- Create: `src/app/(app)/tarefas/[tarefa]/page.tsx`, `src/app/(app)/@painel/default.tsx`, `src/app/(app)/@painel/(.)tarefas/[tarefa]/page.tsx`, `src/componentes/tarefas/{DetalheTarefa,EditorDescricao,Comentarios,Historico}.tsx`, `src/servicos/comentarios.ts`; deps `@tiptap/react @tiptap/pm @tiptap/starter-kit`
- Modify: `src/app/(app)/layout.tsx` (slot `painel`)

**Interfaces:**
- Produces: `buscarTarefa(sb, id)` → tarefa completa + subtarefas + responsáveis + tags + status da lista; `null` se invisível. `listarComentarios(sb, tarefaId)`, `comentar(sb, tarefaId, texto, interno: boolean)`, `editarComentario`, `apagarComentario`. `listarAtividade(sb, tarefaId)`.

Detalhe (painel lateral via rota interceptada + página cheia em acesso direto): título editável, status, responsáveis, prioridade, início, prazo, estimativa (horas e minutos), etiquetas, interruptor **"Visível para o cliente"** (padrão desligado; sem efeito no portal até 1b), descrição Tiptap salva ao sair do foco (JSON em `description`), subtarefas (criar, marcar concluída = mover para o primeiro status `done`), mover para outra lista (seletor das listas que o usuário vê; aviso se o cliente muda), arquivar (só gestor/admin). Abas "Comentários" (com seletor **Interno/Externo**, padrão Interno; externo marcado com selo "visível ao cliente") e "Histórico" (`descreverAtividade`).

- [ ] **Step 1:** Implementar. **Step 2:** `npm run typecheck && npm run build` → sucesso.
- [ ] **Step 3: Verificação manual:** cada campo alterado aparece no histórico com a frase certa; recarregar a página direta `/tarefas/<id>` funciona; membro de fora recebe 404; comentário de outra pessoa não tem botão editar.
- [ ] **Step 4:** Commit `feat: detalhe da tarefa com descrição, comentários e histórico`.

---

### Task 14: Kanban, página do espaço e Minhas tarefas

**Files:**
- Create: `src/componentes/tarefas/{VisaoKanban,CartaoTarefa}.tsx`, `src/app/(app)/espacos/[espaco]/page.tsx`, `src/app/(app)/inicio/page.tsx`; deps `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Modify: `src/app/(app)/listas/[lista]/page.tsx` (renderiza Kanban quando `visao=kanban`)

Kanban da lista: colunas = status da lista; cartões só de tarefas raiz (subtarefas como contador "3 subtarefas"); arrastar → atualização otimista + `moverTarefa` com `posicaoEntre(vizinhoAcima, vizinhoAbaixo)`; em erro, desfaz e mostra toast.

Página do espaço: tarefas de todas as listas do espaço (e filhos), filtros + **cliente** e **mês**; Lista agrupa por categoria (A fazer / Em andamento / Concluído) e mostra a lista de origem em cada linha; Kanban por categoria — arrastar entre categorias move para o primeiro status daquela categoria **na lista da tarefa**. Gestor do espaço vê aba "Membros" (adicionar/remover membros, via action da Task 10).

Minhas tarefas (`/inicio`): `escopo { responsavelId: eu }`, agrupado por prazo (Atrasadas, Hoje, Esta semana, Depois, Sem prazo), concluídas ocultas por padrão.

- [ ] **Step 1:** Implementar. **Step 2:** `npm run typecheck && npm test && npm run build` → sucesso.
- [ ] **Step 3: Verificação manual:** arrastar entre colunas e dentro da coluna, recarregar e ver a ordem mantida; Review Focus 5 (membro com uma tarefa em lista de outro departamento abre a lista pelo link e vê só a sua); espaço Operacional mostra tarefas de Conteúdo, Tráfego e Onboarding; filtro por cliente e mês.
- [ ] **Step 4:** Commit `feat: Kanban, página do departamento e Minhas tarefas`.

---

### Task 15: Publicação para avaliação da Fase 1a

- [ ] **Step 1:** `npm run lint && npm run typecheck && npm test && npm run build` → tudo verde; colar o resumo da saída no relatório.
- [ ] **Step 2: ⚠️ Ação humana** (passo a passo no chat):
  - Criar projeto Supabase **`srv-plataforma`** (produção, São Paulo), signups desligados, SMTP próprio (Resend: criar conta, verificar domínio `gruposrv.com.br`, preencher SMTP em Authentication → Emails), Site URL `https://app.gruposrv.com.br`, Redirect URLs `https://app.gruposrv.com.br/**` e `https://*-srvcompanyoficial-4435s-projects.vercel.app/**`.
  - Na Vercel, ambiente **Preview** (não Production — o app antigo continua em produção até a 1b): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_URL_BASE` (URL do preview ou `app.gruposrv.com.br` se o domínio for apontado para a branch).
- [ ] **Step 3:** `SUPABASE_DB_URL=<prod> npm run db:push`; `npm run criar-admin` com o e-mail do dono.
- [ ] **Step 4:** `npx vercel deploy` (preview) da branch `feat/plataforma`; adicionar `app.gruposrv.com.br` ao projeto apontando para a branch `feat/plataforma` (Vercel → Domains → Git Branch), ou usar a URL de preview.
- [ ] **Step 5: Roteiro de aceite** (executar no preview e relatar): login admin → convidar um gestor de Conteúdo e um membro de Tráfego → gestor cria pasta "Cliente X", lista "Conteúdo Estratégico" out/26 → cria 3 tarefas com subtarefas → membro de Tráfego não vê a lista → gestor atribui uma tarefa ao membro de Tráfego → membro vê só essa tarefa → Kanban arrasta → histórico registra → comentário interno → desativar membro e confirmar a perda de acesso.
- [ ] **Step 6:** Commit de ajustes; relatório ao usuário com o que foi feito e pedido de aprovação da Fase 1a antes de iniciar o plano da 1b.
