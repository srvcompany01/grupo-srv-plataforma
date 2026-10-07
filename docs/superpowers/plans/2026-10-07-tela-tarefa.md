# Tela da tarefa (estilo ClickUp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda tarefa abre numa janela grande (conteúdo + coluna "Atividade"), com cronômetro de tempo, @menções com sino de avisos e anexos/gravações nos comentários.

**Architecture:** Três migrações novas (tempo; comentários/menções/avisos/anexos; histórico de campos) com RLS testada em PGlite. Lógica pura em `src/dominio/`, acesso a dados em `src/servicos/`, server actions em `src/app/(app)/…/acoes*.ts`. A UI da tarefa sai de `DetalheTarefa.tsx` (279 linhas) e vira componentes focados em `src/componentes/tarefas/tela/`. A rota interceptada continua; só o invólucro muda de `Sheet` para `Dialog` de tela cheia.

**Tech Stack:** Next.js 16.3 (ler `node_modules/next/dist/docs/` antes, conforme AGENTS.md), Supabase (`@supabase/ssr`, RLS, Realtime), PGlite + Vitest, Cloudflare R2 (`@aws-sdk/client-s3`, já instalado), shadcn/ui, Tailwind 4, lucide-react, `MediaRecorder`/`getDisplayMedia` do navegador.

**Spec:** `docs/superpowers/specs/2026-10-07-tela-tarefa-design.md`

## Global Constraints

- Texto da interface em português do Brasil; nomes de código em português, como no restante do projeto.
- RLS em toda tabela nova; funções `security definer` com `set search_path = public`; `revoke execute … from public, anon` e `grant … to authenticated, service_role` em toda função nova (padrão da migração `…0007_revisao`).
- Tempo gasto é **só da equipe**: cliente nunca lê `time_entries`.
- **Um cronômetro ativo por pessoa.** Iniciar em outra tarefa para o anterior.
- Lançamento manual: 1 a 1440 minutos.
- Anexos: até **100 MB** por arquivo, **500 MB** por vídeo, **10** por comentário; chaves `tarefas/<task_id>/<uuid>.<ext>`.
- Gravação de áudio e vídeo: até **10 min** (600 s).
- Atividade: mostra o 1º item e os **10** últimos; resto em "Mostrar mais".
- Coluna Atividade com **400px**; janela com **16px** de margem; abaixo de 768px ocupa a tela inteira; abaixo de 1024px a Atividade vira aba.
- Nunca imprimir segredos (`R2_*`, chaves Supabase). Validar variáveis só por tamanho.
- Aplicar migração em **produção** só com aprovação explícita do dono (o modo automático bloqueia).
- Antes da Task 1, as mudanças locais não commitadas do dono (campos em listas, `…0010_campos_em_listas.sql`) precisam estar commitadas por ele ou com autorização dele.

## Review Focus

1. Duas abas/dispositivos da mesma pessoa clicam Start em tarefas diferentes ao mesmo tempo: no fim deve existir um único cronômetro ativo, nunca erro 500 nem dois ativos (índice único + RPC). Teste na Task 1.
2. Menção a alguém que perde o acesso (sai do espaço) entre abrir a lista e enviar: o envio inteiro é recusado com mensagem clara e nenhum aviso vaza o título da tarefa. Teste na Task 2.
3. Navegador grava com mime com parâmetros (`audio/webm;codecs=opus`) ou o Safari usa `audio/mp4`: o anexo é aceito e toca. Teste na Task 4 (`normalizarMime`).
4. Upload termina, mas a criação do comentário falha (sem permissão, rede): nenhuma linha de anexo fica órfã no banco, e a pessoa vê o erro e mantém o texto digitado. Teste na Task 2 (transação) + comportamento na Task 9.
5. Lista solta (sem espaço) e tarefa só atribuída (pessoa não é membro do espaço): cronômetro, menção e anexos funcionam igual. Testes nas Tasks 1 e 2.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20261007000011_tempo.sql` | `time_entries`, RPCs do cronômetro, RLS, histórico `time_logged`, novo `check` de `task_activity` |
| `supabase/migrations/20261007000012_comentarios_avisos.sql` | `usuario_le_tarefa`, `pessoas_da_tarefa`, `comment_mentions`, `notifications`, `comment_attachments`, `criar_comentario`, texto vazio com anexo |
| `supabase/migrations/20261007000013_historico_campos.sql` | Histórico `field_set` ao mudar valor de campo personalizado |
| `src/dominio/linha-do-tempo.ts` | Juntar, recortar e filtrar histórico + comentários |
| `src/dominio/anexos.ts` | Tipos permitidos, limites, `normalizarMime`, `tipoDoAnexo`, `validarAnexo` |
| `src/dominio/mencoes.ts` | Formato `@[Nome](uuid)`: extrair e segmentar |
| `src/dominio/formatar.ts` (mod) | `formatarDuracao`, `formatarRelogio` |
| `src/dominio/personalizacao.ts` (mod) | `campoVazio`, `separarCamposVazios` |
| `src/dominio/atividade.ts` (mod) | Descrever `time_logged` e `field_set` |
| `src/servicos/tempo.ts` | Registros de tempo e cronômetro |
| `src/servicos/avisos.ts` | Avisos do sino |
| `src/servicos/comentarios.ts` (mod) | Comentário com menções e anexos (URLs assinadas) |
| `src/servicos/tarefas.ts` (mod) | `TarefaCompleta.pai` |
| `src/infra/r2.ts` (mod) | `gerarChaveTarefa` |
| `src/app/(app)/tarefas/acoes.ts` (mod) | Ações de comentário, anexo e tempo |
| `src/app/(app)/acoes-avisos.ts` | Ações do sino |
| `src/componentes/tarefas/tela/*` | UI da janela (ver Tasks 6–10) |
| `src/componentes/app/SinoAvisos.tsx`, `IndicadorCronometro.tsx` | Sino e cronômetro na barra lateral |

Removidos ao final: `PainelLateral.tsx`, `DetalheTarefa.tsx`, `Comentarios.tsx` (substituídos).

---

### Task 1: Banco — registros de tempo e cronômetro

**Files:**
- Create: `supabase/migrations/20261007000011_tempo.sql`
- Test: `tests/banco/tempo.test.ts`

**Interfaces:**
- Consumes: `can_read_task(uuid)`, `is_team()`, `can_manage_space_target(uuid)`, `list_space(uuid)`; helpers de teste `criarBanco`, `comoUsuario`, `ler`, `executar`, `criarUsuario`, `criarCliente`, `criarLista`, `criarTarefa`, `adicionarMembro`, `idEspaco`.
- Produces:
  - Tabela `time_entries(id uuid, task_id uuid, user_id uuid, started_at timestamptz, ended_at timestamptz null, duration_seconds int null, note text null, source text check in ('timer','manual'), created_at)`; `check ((ended_at is null) = (duration_seconds is null))`; índice único parcial `time_entries_um_ativo on (user_id) where ended_at is null`.
  - `iniciar_cronometro(p_task uuid) returns uuid`; `parar_cronometro() returns uuid` (null se nada rodando); `lancar_tempo(p_task uuid, p_data date, p_minutos int, p_nota text default null) returns uuid` (início `p_data` às 12:00 `America/Belem`).
  - Edição: `update time_entries set duration_seconds, note` — gatilho mantém `task_id`, `user_id`, `source`, `started_at`; recalcula `ended_at = started_at + duration` se o registro já estiver fechado; recusa editar a duração de registro rodando.
  - `task_activity.action` aceita também `'time_logged'` e `'field_set'` (troca a constraint `task_activity_action_check`).
  - Histórico: ao fechar (insert manual ou `ended_at` passando de nulo a preenchido) grava `task_activity(action='time_logged', new_value = jsonb {"seconds": n})`, com `actor_id` = dono do registro.

- [ ] **Step 1: Escrever os testes que falham** em `tests/banco/tempo.test.ts`, com cenário: espaço Conteúdo, cliente A, lista, membro `ana` (membro do espaço), membro `bruno` (membro do espaço), gestor `gil` (gestor do espaço), cliente `cli` vinculado ao cliente A, tarefas `t1` e `t2`.
  - `iniciar abre cronômetro e parar fecha com duração` → depois de `parar_cronometro()`, linha com `ended_at` não nulo e `duration_seconds >= 0`.
  - `iniciar em outra tarefa para o anterior` → depois de `iniciar(t1)` e `iniciar(t2)`: `select count(*) from time_entries where user_id = ana and ended_at is null` = 1, com `task_id = t2`; o registro de `t1` está fechado.
  - `não existem dois ativos para a mesma pessoa` → `insert` direto de um segundo registro aberto para `ana` falha com violação de unicidade (23505).
  - `lançamento manual aceita 1 a 1440 minutos` → 90 min gera `duration_seconds = 5400`; 0 e 1441 são rejeitados com `/entre 1 e 1440 minutos/`.
  - `cliente não lê tempo` → `ler(db, cli, 'select * from time_entries')` retorna `[]`, mesmo com `t1` visível ao cliente.
  - `membro edita só o próprio registro; gestor edita qualquer um` → `executar(db, bruno, update … where registro de ana)` = 0; `executar(db, gil, …)` = 1; `executar(db, ana, …)` = 1.
  - `editar duração recalcula o fim` → definir `duration_seconds = 600` em registro fechado deixa `ended_at - started_at = 600 s`.
  - `fechar registro grava histórico time_logged` → `task_activity` de `t1` tem `action='time_logged'` e `new_value->>'seconds'` igual à duração.
  - `funciona em lista solta e para responsável fora do espaço` → lista com `space_id null` criada pelo admin; membro só responsável por uma tarefa de outro espaço consegue `iniciar_cronometro` nela.
  - `quem não acessa a tarefa não inicia` → membro de outro espaço: `iniciar_cronometro(t1)` falha.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx vitest run tests/banco/tempo.test.ts`
  Expected: FAIL (`relation "time_entries" does not exist` / função inexistente).

- [ ] **Step 3: Escrever a migração** `20261007000011_tempo.sql` com tabela, índices (`task_id`, `user_id`), gatilho `preparar_registro_tempo` (before insert/update), gatilho `registrar_tempo_no_historico` (after insert/update), RPCs (`security invoker`; `iniciar_cronometro` chama `parar_cronometro()` antes de inserir), troca da constraint de `task_activity` e políticas:
  - select: `is_team() and can_read_task(task_id)`
  - insert: `user_id = auth.uid() and is_team() and can_read_task(task_id)`
  - update/delete: `user_id = auth.uid() or can_manage_space_target(list_space((select list_id from tasks where id = task_id)))`
  Mensagem do limite: `'O tempo lançado deve ficar entre 1 e 1440 minutos'`.

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx vitest run tests/banco/tempo.test.ts`
  Expected: PASS em todos.

- [ ] **Step 5: Commit**
  ```bash
  git add supabase/migrations/20261007000011_tempo.sql tests/banco/tempo.test.ts
  git commit -m "feat(banco): registros de tempo e cronômetro por pessoa"
  ```

### Task 2: Banco — menções, avisos e anexos de comentário

**Files:**
- Create: `supabase/migrations/20261007000012_comentarios_avisos.sql`
- Test: `tests/banco/comentarios-avisos.test.ts`

**Interfaces:**
- Consumes: as mesmas da Task 1, mais `comments` e `preparar_comentario`.
- Produces:
  - `usuario_le_tarefa(p_user uuid, p_task uuid) returns boolean` (security definer): mesma regra de `can_read_task`, mas para `p_user`: perfil ativo, papel de equipe, e (admin, ou lista sem espaço, ou membro do espaço/espaço pai via `space_members`, ou responsável pela tarefa).
  - `pessoas_da_tarefa(p_task uuid) returns table(id uuid, full_name text, avatar_url text)`: só funciona se quem chama lê a tarefa; devolve quem `usuario_le_tarefa` aprova, em ordem de nome.
  - `comment_mentions(comment_id uuid → comments on delete cascade, user_id uuid → profiles, primary key)`.
  - `notifications(id uuid, user_id uuid, kind text check in ('mention'), task_id uuid → tasks cascade, comment_id uuid → comments cascade, actor_id uuid, read_at timestamptz null, created_at)`; índice `(user_id, read_at)`; adicionada à publicação `supabase_realtime` só se ela existir (bloco `do`, para o PGlite).
  - `comment_attachments(id uuid, comment_id uuid → comments cascade, task_id uuid → tasks cascade, r2_key text unique, file_name text, mime_type text, size_bytes bigint, kind text check in ('arquivo','audio','video'), uploaded_by uuid default auth.uid(), created_at)`; `check (size_bytes > 0 and size_bytes <= case when kind = 'video' then 524288000 else 104857600 end)`; `check (r2_key like 'tarefas/' || task_id || '/%')`.
  - `criar_comentario(p_task uuid, p_body text, p_internal boolean, p_mencoes uuid[] default '{}', p_anexos jsonb default '[]') returns uuid` (security invoker). Cada item de `p_anexos`: `{"r2_key","file_name","mime_type","size_bytes","kind"}`.
  - `comments.body` aceita `''`: remove a constraint de `btrim(body) <> ''` e cria um gatilho de restrição adiado em `comments` que exige texto não vazio **ou** ao menos um anexo.
  - Mensagens: `'A pessoa mencionada não tem acesso a esta tarefa'`, `'Escreva um comentário ou anexe um arquivo'`, `'Máximo de 10 anexos por comentário'`.

- [ ] **Step 1: Escrever os testes que falham** em `tests/banco/comentarios-avisos.test.ts`:
  - `usuario_le_tarefa bate com can_read_task` → para admin, membro do espaço, membro do espaço pai, responsável fora do espaço, membro de outro espaço, cliente e membro inativo: `usuario_le_tarefa(u, t)` (lido como admin) é igual a `can_read_task(t)` lido como `u`.
  - `menção cria aviso para o mencionado e não para o autor` → `criar_comentario(t, 'oi @[Bruno](id)', true, array[bruno, ana])` feito por `ana`: `notifications` tem 1 linha, de `bruno`, com `actor_id = ana`.
  - `menção a quem não lê a tarefa recusa tudo` → mencionando um membro de outro espaço: erro `/não tem acesso a esta tarefa/`; `comments` e `notifications` continuam vazios.
  - `cada um vê e marca só os próprios avisos` → `bruno` lê o seu; `ana` lê `[]`; `executar(ana, update notifications set read_at = now())` = 0; `bruno` consegue; `bruno` não altera `task_id` (o gatilho mantém o valor original).
  - `comentário só com anexo é aceito; vazio sem anexo é recusado` → `p_body ''` com 1 anexo funciona; `''` sem anexo falha com `/Escreva um comentário ou anexe um arquivo/`.
  - `anexo fora do prefixo da tarefa é recusado` → `r2_key 'tarefas/<outra>/x.png'` falha.
  - `limites de tamanho` → arquivo de 104857601 bytes falha; vídeo de 524288000 passa.
  - `mais de 10 anexos é recusado` → 11 anexos falham com `/Máximo de 10 anexos/`.
  - `falha no comentário não deixa anexo órfão` → chamada com menção inválida e 2 anexos: `comment_attachments` continua vazia.
  - `anexos seguem a leitura da tarefa` → membro de outro espaço lê `[]`; o cliente não lê anexos de comentário interno (política: `can_read_task(task_id)` e, para cliente, só comentário com `is_internal = false`; na Fase 1a cliente não lê tarefa, então hoje basta `can_read_task`).
  - `pessoas_da_tarefa lista quem lê a tarefa` → inclui membro do espaço e responsável; exclui cliente, inativo e membro de outro espaço; chamada por quem não lê a tarefa devolve vazio.
  - `funciona em lista solta` → menção e anexo numa tarefa de lista com `space_id null`.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx vitest run tests/banco/comentarios-avisos.test.ts`
  Expected: FAIL (função/tabela inexistente).

- [ ] **Step 3: Escrever a migração** `20261007000012_comentarios_avisos.sql`. Políticas:
  - `comment_mentions`: select `can_read_task((select task_id from comments where id = comment_id))`; insert com `exists (select 1 from comments where id = comment_id and author_id = auth.uid())`.
  - `notifications`: select/update `user_id = auth.uid()`; sem insert/delete para `authenticated` (só gatilho, security definer). Gatilho before update mantém tudo menos `read_at`.
  - `comment_attachments`: select `can_read_task(task_id)`; insert com `uploaded_by = auth.uid()` e o comentário do mesmo `task_id` e do mesmo autor; delete pelo autor do comentário.
  - Gatilho before insert em `comment_mentions` valida `usuario_le_tarefa`; after insert cria o aviso, exceto quando `user_id` = autor.
  - Gatilho before insert em `comment_attachments` conta anexos do comentário (máx. 10).

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx vitest run tests/banco/comentarios-avisos.test.ts tests/rls/conversa.test.ts`
  Expected: PASS (o teste antigo de conversa continua verde; se ele testava texto vazio direto em `insert`, ajuste para esperar a nova mensagem adiada e anote como Ruling).

- [ ] **Step 5: Commit**
  ```bash
  git add supabase/migrations/20261007000012_comentarios_avisos.sql tests/banco/comentarios-avisos.test.ts tests/rls/conversa.test.ts
  git commit -m "feat(banco): menções com avisos e anexos em comentários"
  ```

### Task 3: Banco — histórico de campos personalizados e tipos gerados

**Files:**
- Create: `supabase/migrations/20261007000013_historico_campos.sql`
- Modify: `src/infra/supabase/tipos.ts` (gerado)
- Test: `tests/banco/historico.test.ts` (acrescentar)

**Interfaces:**
- Produces: gatilho after insert/update/delete em `task_custom_field_values` que grava `task_activity(action='field_set', field = field_id::text, old_value = old.value, new_value = new.value)` (delete → `new_value` nulo). Não grava se o valor não mudou. Usa `auth.uid()` como ator.

- [ ] **Step 1: Testes que falham** (em `tests/banco/historico.test.ts`):
  - `definir campo grava field_set` → inserir valor `"Desejo"` gera `action='field_set'`, `field = <field_id>`, `new_value = '"Desejo"'`.
  - `mesmo valor não gera histórico` → update com o mesmo `value` não cria linha.
  - `limpar campo grava new_value nulo`.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/banco/historico.test.ts` → FAIL.
- [ ] **Step 3: Escrever a migração.**
- [ ] **Step 4: Rodar e ver passar** — mesmo comando → PASS; depois `npx vitest run` → suíte inteira verde.
- [ ] **Step 5: Aplicar no Supabase de dev e gerar tipos**
  Run: `npm run db:push && npm run tipos`
  Expected: as 3 migrações aplicadas sem erro; `tipos.ts` passa a ter `time_entries`, `notifications`, `comment_attachments`, `comment_mentions` e as RPCs novas. (Se o modo automático bloquear, pedir ao dono para rodar os dois comandos.)
- [ ] **Step 6: Commit**
  ```bash
  git add supabase/migrations/20261007000013_historico_campos.sql tests/banco/historico.test.ts src/infra/supabase/tipos.ts
  git commit -m "feat(banco): histórico de campos personalizados; tipos atualizados"
  ```

### Task 4: Domínio — linha do tempo, anexos, menções, duração, campos vazios

**Files:**
- Create: `src/dominio/linha-do-tempo.ts`, `src/dominio/anexos.ts`, `src/dominio/mencoes.ts`
- Modify: `src/dominio/formatar.ts`, `src/dominio/personalizacao.ts`, `src/dominio/atividade.ts`
- Test: `tests/dominio/linha-do-tempo.test.ts`, `tests/dominio/anexos.test.ts`, `tests/dominio/mencoes.test.ts`, `tests/dominio/formatar.test.ts` (acrescentar), `tests/dominio/personalizacao.test.ts` (acrescentar), `tests/dominio/atividade.test.ts` (acrescentar)

**Interfaces:**
- Produces:
  ```ts
  // linha-do-tempo.ts
  export type ItemLinha<A, C> =
    | { tipo: 'atividade'; chave: string; em: string; item: A }
    | { tipo: 'comentario'; chave: string; em: string; item: C }
  export type FiltroLinha = 'tudo' | 'comentarios' | 'historico'
  export function montarLinhaDoTempo<A extends { id: number; criadoEm: string }, C extends { id: string; criadoEm: string }>(atividades: A[], comentarios: C[]): ItemLinha<A, C>[]
  export function recortarLinhaDoTempo<T>(itens: T[], expandido: boolean, ultimos?: number): { visiveis: T[]; ocultos: number }
  export function filtrarLinhaDoTempo<A, C>(itens: ItemLinha<A, C>[], filtro: FiltroLinha, busca: string, texto: (i: ItemLinha<A, C>) => string): ItemLinha<A, C>[]
  // anexos.ts
  export type TipoAnexo = 'arquivo' | 'audio' | 'video'
  export const LIMITE_ARQUIVO = 104_857_600, LIMITE_VIDEO = 524_288_000, MAX_ANEXOS = 10, DURACAO_MAX_GRAVACAO_S = 600
  export const EXTENSAO_ANEXO: Record<string, string>
  export function normalizarMime(mime: string): string
  export function tipoDoAnexo(mime: string): TipoAnexo
  export function validarAnexo(a: { mime: string; tamanho: number }): string | null
  // mencoes.ts
  export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'mencao'; nome: string; id: string }
  export function marcarMencao(nome: string, id: string): string   // "@[Nome](id)"
  export function extrairMencoes(texto: string): string[]
  export function segmentarTexto(texto: string): Segmento[]
  // formatar.ts
  export function formatarDuracao(segundos: number): string
  export function formatarRelogio(segundos: number): string
  // personalizacao.ts
  export function campoVazio(c: DefinicaoCampo): boolean
  export function separarCamposVazios(campos: DefinicaoCampo[]): { preenchidos: DefinicaoCampo[]; vazios: DefinicaoCampo[] }
  // atividade.ts — NomesAtividade ganha:
  campos: Record<string, Pick<DefinicaoCampo, 'nome' | 'tipo' | 'configuracao'>>
  ```

- [ ] **Step 1: Testes que falham**
  - `montarLinhaDoTempo` junta em ordem crescente de `criadoEm`; empate → atividade antes de comentário; a chave é `a-<id>` ou `c-<id>`; a entrada da atividade vem em ordem decrescente (como `listarAtividade` devolve) e a saída fica crescente.
  - `recortarLinhaDoTempo`: 11 itens → todos visíveis, `ocultos 0`; 15 itens → `[0, 5..14]`, `ocultos 4`; `expandido true` → todos.
  - `filtrarLinhaDoTempo`: `'comentarios'` só comentários; busca `"desejo"` acha `"Desejo"` e `"Désejo"` (sem acento e sem maiúsculas); busca vazia não filtra.
  - `normalizarMime('audio/webm;codecs=opus')` → `'audio/webm'`; `normalizarMime('Video/MP4')` → `'video/mp4'`.
  - `tipoDoAnexo`: `audio/mp4` → `'audio'`; `video/quicktime` → `'video'`; `application/pdf` → `'arquivo'`.
  - `validarAnexo`: `{mime:'application/x-msdownload', tamanho:10}` → `'Tipo de arquivo não permitido'`; pdf com `LIMITE_ARQUIVO + 1` → `'Arquivo maior que 100 MB'`; `video/webm` com `LIMITE_VIDEO` → `null`; com `LIMITE_VIDEO + 1` → `'Vídeo maior que 500 MB'`; tamanho 0 → `'Arquivo vazio'`.
  - `EXTENSAO_ANEXO` cobre: jpeg/png/gif/webp/heic, pdf, doc/docx/xls/xlsx/ppt/pptx, zip, txt, csv, audio webm/mp4/mpeg/ogg/wav, video webm/mp4/quicktime.
  - `extrairMencoes('oi @[Ana Paula](11111111-1111-1111-1111-111111111111) e @[Ana Paula](mesmo id)')` → um id, sem repetir; texto com `@` solto → `[]`.
  - `segmentarTexto('a @[Bia](id) b')` → `[{texto 'a '}, {mencao Bia id}, {texto ' b'}]`.
  - `formatarDuracao`: 0 → `'0min'`; 2700 → `'45min'`; 4800 → `'1h 20min'`; 7200 → `'2h'`; 59 → `'0min'`. `formatarRelogio(3723)` → `'1:02:03'`; `formatarRelogio(65)` → `'0:01:05'`.
  - `campoVazio`: `valor` undefined/null/`''`/`[]` → true; `0`, `false` e `'x'` → false; tipo `formula` → sempre false.
  - `descreverAtividade`: `time_logged` com `{seconds: 4800}` → `'registrou 1h 20min'`; `field_set` com campo de opções `Gatilho`, `new_value "Desejo"` → `'definiu Gatilho como Desejo'`; com `new_value null` → `'limpou Gatilho'`; campo desconhecido → `'alterou um campo'`.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/dominio` → FAIL nos novos.
- [ ] **Step 3: Implementar.** Para `field_set`, use `formatarValorCampo`. Em `formatarDuracao`, use os minutos inteiros (arredondar para baixo) e reaproveite o `duracao(min)` interno de `atividade.ts`, movendo-o para `formatar.ts`.
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run tests/dominio` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(dominio): linha do tempo, anexos, menções e duração"`.

### Task 5: Serviços e ações — tempo, comentários com anexos, avisos

**Files:**
- Create: `src/servicos/tempo.ts`, `src/servicos/avisos.ts`, `src/app/(app)/acoes-avisos.ts`
- Modify: `src/servicos/comentarios.ts`, `src/servicos/tarefas.ts`, `src/infra/r2.ts`, `src/app/(app)/tarefas/acoes.ts`
- Test: `tests/dominio/anexos.test.ts` (acrescentar `gerarChaveTarefa`); o restante é verificado por `npm run typecheck` (o projeto não testa serviços contra Supabase real; a regra está no banco, testada nas Tasks 1–3)

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  ```ts
  // servicos/tempo.ts
  export type RegistroTempo = { id: string; usuarioId: string; usuarioNome: string; inicio: string; fim: string | null; segundos: number | null; nota: string | null; origem: 'timer' | 'manual' }
  export type CronometroAtivo = { registroId: string; tarefaId: string; tarefaTitulo: string; inicio: string }
  export async function listarTempo(sb: Supabase, tarefaId: string): Promise<RegistroTempo[]>
  export async function cronometroAtivo(sb: Supabase, usuarioId: string): Promise<CronometroAtivo | null>
  export async function iniciarCronometro(sb: Supabase, tarefaId: string): Promise<void>
  export async function pararCronometro(sb: Supabase): Promise<void>
  export async function lancarTempo(sb: Supabase, tarefaId: string, data: string, minutos: number, nota: string | null): Promise<void>
  export async function editarTempo(sb: Supabase, id: string, minutos: number, nota: string | null): Promise<void>
  export async function apagarTempo(sb: Supabase, id: string): Promise<void>
  // servicos/avisos.ts
  export type Aviso = { id: string; tarefaId: string; tarefaTitulo: string; atorNome: string; criadoEm: string; lido: boolean }
  export async function listarAvisos(sb: Supabase, limite?: number): Promise<Aviso[]>   // padrão 30, mais novos primeiro
  export async function contarNaoLidos(sb: Supabase): Promise<number>
  export async function marcarLido(sb: Supabase, id: string): Promise<void>
  export async function marcarTodosLidos(sb: Supabase): Promise<void>
  // servicos/comentarios.ts
  export type AnexoComentario = { id: string; nome: string; mime: string; tamanho: number; tipo: TipoAnexo; url: string }
  export type Comentario = { …atual; mencoes: string[]; anexos: AnexoComentario[] }
  export type NovoAnexo = { chave: string; nome: string; mime: string; tamanho: number }
  export async function criarComentario(sb: Supabase, c: { tarefaId: string; texto: string; interno: boolean; mencoes: string[]; anexos: NovoAnexo[] }): Promise<void>   // substitui comentar()
  export async function pessoasDaTarefa(sb: Supabase, tarefaId: string): Promise<{ id: string; nome: string; avatar: string | null }[]>
  // servicos/tarefas.ts — TarefaCompleta ganha: pai: { id: string; titulo: string } | null
  // infra/r2.ts
  export function gerarChaveTarefa(tarefaId: string, mime: string): string   // tarefas/<id>/<uuid>.<ext de EXTENSAO_ANEXO>
  // app/(app)/tarefas/acoes.ts (todas 'use server', usam exigirEquipe + tentar)
  export async function prepararEnvioAnexoAcao(tarefaId: string, a: { nome: string; mime: string; tamanho: number }): Promise<{ chave: string; url: string } | { erro: string }>
  export async function comentarAcao(tarefaId: string, texto: string, interno: boolean, mencoes: string[], anexos: NovoAnexo[]): Promise<Resultado>
  export async function iniciarCronometroAcao(tarefaId: string): Promise<Resultado>   // ok = "Parou o cronômetro de <tarefa>" quando havia outro ativo; senão "Cronômetro iniciado."
  export async function pararCronometroAcao(): Promise<Resultado>
  export async function lancarTempoAcao(tarefaId: string, data: string, minutos: number, nota: string): Promise<Resultado>
  export async function editarTempoAcao(id: string, minutos: number, nota: string): Promise<Resultado>
  export async function apagarTempoAcao(id: string): Promise<Resultado>
  // app/(app)/acoes-avisos.ts
  export async function marcarAvisoLidoAcao(id: string): Promise<Resultado>
  export async function marcarTodosAvisosLidosAcao(): Promise<Resultado>
  ```
  `prepararEnvioAnexoAcao`: normaliza o mime, roda `validarAnexo`, confirma acesso com `buscarTarefa(sb, id) !== null`, gera a chave e devolve `urlUpload(chave, mime, tamanho)`. `listarComentarios` assina cada anexo com `urlLeitura(chave)` (anexo `arquivo` que não é imagem com `{ download: nome }`). Todas as ações chamam `revalidatePath` do jeito que as ações atuais de tarefa já fazem.

- [ ] **Step 1: Teste que falha** — `gerarChaveTarefa('t1', 'audio/webm')` casa com `/^tarefas\/t1\/[0-9a-f-]{36}\.webm$/`; mime desconhecido lança erro.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/dominio/anexos.test.ts` → FAIL.
- [ ] **Step 3: Implementar** serviços, `gerarChaveTarefa` e ações. Ajustar `CarregarTarefa` para também carregar `listarTempo`, `cronometroAtivo` e `pessoasDaTarefa` (props novas usadas nas Tasks 7–10).
- [ ] **Step 4: Verificar** — `npx vitest run tests/dominio/anexos.test.ts && npm run typecheck` → PASS e 0 erros. (`DetalheTarefa`/`Comentarios` ainda usam `comentar`; mantenha `comentar` até a Task 9 removê-lo.)
- [ ] **Step 5: Commit** — `git commit -m "feat: serviços de tempo, avisos e comentários com anexos"`.

### Task 6: Janela de tela cheia e esqueleto da tela

**Files:**
- Create: `src/componentes/tarefas/tela/JanelaTarefa.tsx`, `src/componentes/tarefas/tela/TelaTarefa.tsx`
- Modify: `src/app/(app)/@painel/(.)tarefas/[tarefa]/page.tsx`, `src/app/(app)/tarefas/[tarefa]/page.tsx`, `src/componentes/tarefas/CarregarTarefa.tsx`
- Delete: `src/componentes/tarefas/PainelLateral.tsx`

**Interfaces:**
- Produces:
  - `JanelaTarefa({ children })`: `Dialog` sempre aberto; ao fechar chama `router.back()`. Conteúdo `fixed inset-4` (`inset-0` abaixo de `md`), sem padding, `DialogTitle` só para leitor de tela.
  - `TelaTarefa(props: PropsTela)`: grid `lg:grid-cols-[1fr_400px]`, com coluna principal rolável e coluna Atividade com rolagem própria. Abaixo de `lg`, `Tabs` "Detalhes / Atividade". `PropsTela` = as props atuais de `DetalheTarefa` + `tempo: RegistroTempo[]`, `cronometro: CronometroAtivo | null`, `pessoas: {id; nome; avatar}[]`, `emJanela: boolean` (substitui `noPainel`).
  - Página direta: `TelaTarefa` com `emJanela=false` ocupando `h-[calc(100dvh-…)]` dentro do layout.
- [ ] **Step 1:** Ler `node_modules/next/dist/docs/` sobre rotas interceptadas/paralelas antes de mexer.
- [ ] **Step 2:** Implementar com a coluna principal ainda renderizando o conteúdo atual de `DetalheTarefa` (temporário) e a coluna direita vazia com o título "Atividade".
- [ ] **Step 3: Verificar** — `npm run typecheck && npm run lint` → 0 erros. No navegador (`npm run dev`): abrir uma tarefa pela lista abre a janela grande; Esc fecha e volta para a lista; F5 em `/tarefas/<id>` mostra a página cheia.
- [ ] **Step 4: Commit** — `git commit -m "feat(tarefa): janela de tela cheia"`.

### Task 7: Coluna principal — cabeçalho, grade de propriedades, campos, subtarefas

**Files:**
- Create: `src/componentes/tarefas/tela/CabecalhoTarefa.tsx`, `GradePropriedades.tsx`, `SecaoCampos.tsx`, `SecaoSubtarefas.tsx`
- Modify: `src/componentes/tarefas/tela/TelaTarefa.tsx`, `src/componentes/tarefas/CamposPersonalizados.tsx` (receber a lista já filtrada)
- Delete: `src/componentes/tarefas/DetalheTarefa.tsx` (todo o conteúdo migra)

**Interfaces:**
- Consumes: `separarCamposVazios`, `TarefaCompleta.pai`, ações existentes de tarefa (`atualizarTarefaAcao`, status, responsáveis, etiquetas, arquivar).
- Produces: componentes sem lógica de dados própria; todos recebem dados por props e chamam as ações existentes.
  - `CabecalhoTarefa`: rótulo "Tarefa"/"Subtarefa"; botão copiar link (`navigator.clipboard`, toast "Link copiado"); linha "Subtarefa de ○ <pai.titulo>" com `Link` para `/tarefas/<pai.id>`; menu "…" com Arquivar (só `podeGerir`) e Mover para lista; título editável (mesmo comportamento atual).
  - `GradePropriedades`: grade `md:grid-cols-2`, linhas rótulo (ícone lucide: `CircleDot` Status, `Calendar` Datas, `Hourglass` Estimativa, `Tag` Etiquetas, `User` Responsáveis, `Flag` Prioridade, `Timer` Rastrear tempo). Vazio mostra "Vazio" clicável. Botão ✓ ao lado do status move para o 1º status de categoria `done`. Prazo vencido (antes de `hoje` e não concluída) em vermelho. A célula "Rastrear tempo" recebe `children` (preenchida na Task 10).
  - `SecaoCampos`: título "Campos" recolhível; link "Ocultar N campos vazios" / "Mostrar N campos vazios"; preferência salva em `localStorage['tarefa:ocultarVazios']` dentro de `try/catch`; padrão: mostrar.
- [ ] **Step 1:** Implementar e ligar em `TelaTarefa`.
- [ ] **Step 2: Verificar** — `npm run typecheck && npm run lint` → 0 erros; `npx vitest run` → verde. No navegador: editar título, status (incluindo ✓), datas, estimativa, etiquetas, responsáveis, prioridade e campo personalizado salva e reflete; "Ocultar 2 campos vazios" esconde e volta; numa subtarefa, "Subtarefa de" abre a mãe.
- [ ] **Step 3: Commit** — `git commit -m "feat(tarefa): coluna principal no padrão ClickUp"`.

### Task 8: Coluna Atividade — linha do tempo, busca e filtro

**Files:**
- Create: `src/componentes/tarefas/tela/PainelAtividade.tsx`, `ItemComentario.tsx`, `ListaAnexos.tsx`
- Modify: `src/componentes/tarefas/tela/TelaTarefa.tsx`

**Interfaces:**
- Consumes: `montarLinhaDoTempo`, `recortarLinhaDoTempo`, `filtrarLinhaDoTempo`, `descreverAtividade` (com `nomes.campos` montado de `camposPersonalizados`), `segmentarTexto`, `Comentario`, `AnexoComentario`.
- Produces:
  - `PainelAtividade({ atividade, comentarios, nomes, euId, rodape })`: cabeçalho "Atividade" com ícone de busca (abre campo) e filtro (`DropdownMenu`: Tudo / Comentários / Histórico); lista; botão "Mostrar mais (N)"; `rodape` fixo embaixo (a caixa da Task 9). Rola para o fim ao montar e quando muda o número de comentários.
  - Histórico: linha cinza `text-[12px]` com "• <ator ou 'Sistema'> <descrição>" e data/hora à direita (`jun 1 às 17:51`, via `Intl` pt-BR, fuso America/Belem).
  - `ItemComentario`: cartão com avatar, nome, hora, selo "visível ao cliente" quando `!interno`, texto com menções em destaque (`text-primaria font-medium`), editar/apagar do próprio (ações existentes) e `ListaAnexos`.
  - `ListaAnexos`: imagem → miniatura 120px que amplia num `Dialog`; áudio → `<audio controls>`; vídeo → `<video controls>` com no máximo 320px; outros → ícone, nome, tamanho e download.
- [ ] **Step 1:** Implementar.
- [ ] **Step 2: Verificar** — typecheck + lint → 0 erros. No navegador: criar tarefa, mudar campos e comentar mostra tudo na ordem certa; filtro e busca funcionam; com mais de 11 itens aparece "Mostrar mais".
- [ ] **Step 3: Commit** — `git commit -m "feat(tarefa): coluna de atividade com histórico e comentários"`.

### Task 9: Caixa de comentário — menções, anexos e gravação

**Files:**
- Create: `src/componentes/tarefas/tela/CaixaComentario.tsx`, `SeletorMencao.tsx`, `Gravador.tsx`, `src/componentes/tarefas/tela/enviarAnexo.ts`
- Delete: `src/componentes/tarefas/Comentarios.tsx`; remover `comentar()` de `servicos/comentarios.ts`

**Interfaces:**
- Consumes: `prepararEnvioAnexoAcao`, `comentarAcao`, `pessoas` (Task 5), `marcarMencao`, `extrairMencoes`, `validarAnexo`, `normalizarMime`, `MAX_ANEXOS`, `DURACAO_MAX_GRAVACAO_S`.
- Produces:
  - `enviarAnexo(tarefaId: string, arquivo: Blob, nome: string, aoProgresso: (pct: number) => void): Promise<NovoAnexo>`: pede a URL, faz `PUT` com `XMLHttpRequest` (para ter progresso) e `Content-Type` = mime normalizado; erro → lança `Error` com mensagem em português.
  - `CaixaComentario({ tarefaId, pessoas })`: `textarea` que cresce sozinha, com placeholder "Escreva um comentário…"; alternador Interno/Visível ao cliente (comportamento atual); barra de ícones: 📎 anexar (input de arquivo múltiplo), `@` menção, 🎤 áudio, 🎥 vídeo/tela; fichas dos anexos pendentes com progresso e ✕; botão enviar (Ctrl/⌘+Enter também envia). Os uploads acontecem ao escolher o arquivo; enviar fica desabilitado enquanto há upload pendente ou com texto e anexos vazios. Se `comentarAcao` falhar, texto e anexos ficam na caixa.
  - `SeletorMencao`: abre ao digitar `@` (ou pelo botão); filtra `pessoas` pelo texto depois do `@` (sem acento); Enter/clique insere `marcarMencao(nome, id)` + espaço; Esc fecha. Na caixa, a menção aparece como `@Nome`, e o texto com marcação completa é o que vai para o servidor. Guardar o mapa nome↔id no estado e trocar na hora de enviar; `mencoes = extrairMencoes(textoFinal)`.
  - `Gravador({ modo: 'audio' | 'video', aoConcluir: (blob: Blob, nome: string) => void })`: áudio usa `getUserMedia({audio:true})`; vídeo pergunta "Tela" (`getDisplayMedia({video:true})` + microfone, se permitido) ou "Câmera" (`getUserMedia({video:true,audio:true})`). Escolhe o 1º mime suportado entre `video/webm;codecs=vp9,opus`, `video/webm`, `video/mp4` (áudio: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`). Mostra o relógio e para sozinho em 600 s; tem prévia com Usar/Descartar. Permissão negada → toast "Permita o acesso ao microfone/câmera/tela no navegador" e nada é enviado. Sempre para as trilhas (`track.stop()`) ao terminar ou desmontar. Nome do arquivo: `audio-AAAA-MM-DD-HHmm.webm|m4a` / `video-…`.
- [ ] **Step 1:** Implementar.
- [ ] **Step 2: Verificar** — typecheck + lint → 0 erros; `npx vitest run` → verde. No navegador (com R2 e CORS prontos, ver Task 12): comentar com menção (o mencionado recebe o aviso); anexar PNG e PDF; gravar 5 s de áudio e 5 s de tela e ver os players; tentar um `.exe` mostra "Tipo de arquivo não permitido".
- [ ] **Step 3: Commit** — `git commit -m "feat(tarefa): comentários com menções, anexos e gravação"`.

### Task 10: Cronômetro — célula "Rastrear tempo" e indicador na barra lateral

**Files:**
- Create: `src/componentes/tarefas/tela/RastrearTempo.tsx`, `src/componentes/app/IndicadorCronometro.tsx`
- Modify: `src/componentes/tarefas/tela/GradePropriedades.tsx` (passa a célula), `src/app/(app)/layout.tsx`, `src/componentes/app/BarraLateral.tsx`

**Interfaces:**
- Consumes: `RegistroTempo`, `CronometroAtivo`, ações de tempo (Task 5), `formatarDuracao`, `formatarRelogio`.
- Produces:
  - `RastrearTempo({ tarefaId, registros, cronometro, euId, podeGerir })`: se `cronometro?.tarefaId === tarefaId`, mostra ■ e o relógio contando (`setInterval` de 1 s a partir de `inicio`); senão, ▶ "Start". Ao lado, o total (`formatarDuracao` da soma dos fechados + o tempo corrido do ativo). Clique no total abre um `Popover` com: formulário "Lançar tempo" (data, padrão hoje; horas + minutos; nota) e a lista de registros (pessoa, data, duração, nota; editar/apagar se `usuarioId === euId || podeGerir`). Toast com o `ok` da ação (inclui "Parou o cronômetro de <tarefa>").
  - `IndicadorCronometro({ cronometro })`: na barra lateral, quando há cronômetro ativo, mostra ponto vermelho, título da tarefa (truncado) e relógio; clique abre `/tarefas/<id>`; botão ■ para.
  - `layout.tsx` carrega `cronometroAtivo(sb, eu.id)` e passa para `BarraLateral`.
- [ ] **Step 1:** Implementar.
- [ ] **Step 2: Verificar** — typecheck + lint → 0 erros. No navegador: Start → relógio conta na tarefa e na barra lateral; Start em outra tarefa mostra "Parou o cronômetro de …"; Stop gera "registrou …" na Atividade; lançar 1h 30min soma no total; membro não vê editar no registro de outra pessoa.
- [ ] **Step 3: Commit** — `git commit -m "feat(tarefa): cronômetro e lançamento de tempo"`.

### Task 11: Sino de avisos

**Files:**
- Create: `src/componentes/app/SinoAvisos.tsx`
- Modify: `src/app/(app)/layout.tsx`, `src/componentes/app/BarraLateral.tsx`

**Interfaces:**
- Consumes: `listarAvisos`, `contarNaoLidos`, `marcarAvisoLidoAcao`, `marcarTodosAvisosLidosAcao`, `criarClienteNavegador` (`src/infra/supabase/navegador.ts`), `opcoesRealtime`.
- Produces: `SinoAvisos({ avisos, naoLidos, euId })`: ícone `Bell` com selo do número (oculto se 0; "9+" acima de 9). `Popover` com a lista "<ator> mencionou você em <tarefa>", com tempo relativo ("há 5 min"); não lidos em negrito. Clique marca lido e navega para `/tarefas/<id>`. Rodapé "Marcar todos como lidos". Assina `postgres_changes` (`INSERT` em `notifications`, `filter: user_id=eq.<euId>`) e, ao receber, chama `router.refresh()` e mostra o toast "<ator> mencionou você". Remove o canal ao desmontar.
- [ ] **Step 1:** Implementar; `layout.tsx` carrega `listarAvisos` + `contarNaoLidos`.
- [ ] **Step 2: Verificar** — typecheck + lint → 0 erros. Em dois navegadores (dois usuários): A menciona B, e o sino de B sobe na hora; clicar abre a tarefa e zera o número.
- [ ] **Step 3: Commit** — `git commit -m "feat: sino de avisos de menção"`.

### Task 12: Operação — R2/CORS, verificação final e produção

**Files:**
- Modify: `README.md` (seção "Anexos (R2)": CORS e variáveis)

- [ ] **Step 1: Instruir o dono a configurar o CORS** do bucket no painel da Cloudflare (R2 → bucket → Settings → CORS policy):
  ```json
  [{ "AllowedOrigins": ["https://app.gruposrv.com.br", "http://localhost:3000"],
     "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
  ```
  Manter as origens que já existirem (app antigo).
- [ ] **Step 2: Conferir as variáveis `R2_*` no Vercel** (Production e Preview) só pelo nome, sem ler valores; se faltarem, pedir ao dono.
- [ ] **Step 3: Verificação completa**
  Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
  Expected: tudo verde, build concluído.
- [ ] **Step 4: Commit** — `git commit -m "docs: anexos no R2 e CORS"`.
- [ ] **Step 5: Produção (só com aprovação do dono):** aplicar as migrações `…0011` a `…0013` no Supabase de produção (`SUPABASE_DB_URL` de `.env.producao`) e dar push da branch `feat/plataforma` (deploy automático em app.gruposrv.com.br). Conferir em produção: abrir tarefa, Start/Stop, comentário com menção e anexo.
