# Tela da tarefa (estilo ClickUp) — design

Data: 2026-10-07 · Base: `docs/superpowers/specs/2026-10-06-plataforma-agencia-design.md`

## Objetivo

Toda tarefa (mãe, filha, subtarefa) abre numa tela grande, igual ao print do ClickUp enviado pelo
dono: conteúdo à esquerda, coluna "Atividade" à direita. Junto vêm três recursos novos: cronômetro
de tempo, @menções com aviso no sino e anexos (arquivo, áudio gravado, vídeo/tela gravado) nos
comentários.

Sucesso = a equipe abre uma tarefa e faz tudo dali: muda status/datas/responsáveis/campos, conta o
tempo, comenta marcando colegas e anexando mídia, e vê o histórico, sem sair da tela.

## Decisões do dono

- Tudo nesta etapa, inclusive cronômetro e extras de comentário.
- Cronômetro igual ClickUp: Start/Stop por pessoa, **um cronômetro ativo por pessoa**, lançamento
  manual, total na tarefa e lista de registros.
- Comentário: @menções, anexos, gravar áudio, gravar vídeo/tela.
- Tempo gasto é **só da equipe**; cliente nunca vê.

## 1. Janela

- Abrir uma tarefa a partir de qualquer tela (lista, kanban, calendário, subtarefa, aviso do sino)
  usa a rota interceptada atual (`@painel/(.)tarefas/[tarefa]`), mas o `PainelLateral` (Sheet) vira
  um `Dialog` que cobre a tela com 16px de margem (em telas < 768px, a tela inteira). Fecha com
  Esc, clique no "»" ou fora; `router.back()` volta para onde estava.
- `/tarefas/[tarefa]` acessada direto (F5, link) mostra o mesmo conteúdo em página cheia.
- Layout: coluna principal rolável + coluna "Atividade" de 400px à direita (em < 1024px a
  Atividade vira uma aba abaixo do conteúdo).

## 2. Coluna principal

1. **Topo:** rótulo fixo "Tarefa" ou "Subtarefa" (sem tipos de tarefa) e botão que copia o link da
   tarefa. Se tiver mãe: "Subtarefa de ○ <título da mãe>" — clique abre a mãe na mesma janela.
2. **Título** grande, editável no lugar.
3. **Grade em duas colunas** (rótulo com ícone + valor; vazio mostra "Vazio" clicável):
   | Esquerda | Direita |
   |---|---|
   | Status (seletor colorido + botão ✓ que move para o 1º status "concluído") | Responsáveis |
   | Datas: Início → Prazo (prazo vencido em vermelho) | Prioridade |
   | Estimativa de tempo | Rastrear tempo (seção 4) |
   | Etiquetas | |
4. **Descrição** (editor atual; vazio mostra "Adicionar descrição").
5. **Campos** (recolhível): campos personalizados da lista, um por linha. Link
   "Ocultar N campos vazios / Mostrar N campos vazios"; a escolha fica salva no navegador.
6. **Subtarefas** (lista atual, com criar).
7. Arquivar (só gestor) continua no menu "…" do topo.

## 3. Coluna "Atividade"

- Uma linha do tempo única, em ordem cronológica (mais antigo em cima, como no ClickUp), juntando
  histórico (`task_activity`) e comentários. Histórico em texto pequeno cinza; comentário em cartão
  com autor, hora, texto, menções destacadas e anexos.
- Mostra o 1º item e os 10 últimos; o resto fica em "Mostrar mais".
- Topo: busca (filtra o texto, no navegador) e filtro "Tudo / Comentários / Histórico".
- Rodapé fixo: caixa de comentário (seção 5). Ao enviar, a coluna rola para o fim.
- Novos registros de tempo aparecem no histórico ("Fabricio registrou 1h 20min").

## 4. Cronômetro (rastrear tempo)

**Banco** — tabela `time_entries`:
`id`, `task_id` (FK, cascade), `user_id` (default `auth.uid()`), `started_at`, `ended_at` (nulo =
rodando), `duration_seconds` (preenchido ao parar ou no lançamento manual), `note`, `source`
(`timer`|`manual`), `created_at`. Índice único parcial: um registro com `ended_at is null` por
`user_id`.

**RPCs (security invoker):**
- `iniciar_cronometro(p_task)` — para o cronômetro que a pessoa tiver rodando (em qualquer tarefa)
  e abre um novo nesta.
- `parar_cronometro()` — fecha o que estiver rodando; calcula a duração.
- `lancar_tempo(p_task, p_data date, p_minutos int, p_nota text)` — registro manual (1 a 1440 min).

**Regras (RLS + gatilhos):**
- Só equipe ativa (`is_team()`) com acesso à tarefa (`can_read_task`) lê e cria.
- Cada pessoa edita/apaga só os próprios registros; admin e gestor do espaço editam/apagam qualquer
  um da tarefa.
- Cliente nunca lê (`is_team()` na política de leitura).
- Registro novo/alterado gera histórico (`time_logged`) — ação nova no `check` de `task_activity`.

**Tela:** "Rastrear tempo" mostra ▶ Start (ou ■ e o relógio contando, se rodando nesta tarefa) e o
total da tarefa. Clicar no total abre a lista de registros (pessoa, data, duração, nota; editar e
apagar conforme permissão) e o formulário "Lançar tempo". Se a pessoa já tiver cronômetro em outra
tarefa, o Start avisa "Parou o cronômetro de <tarefa>". A barra lateral mostra um indicador do
cronômetro ativo (clique abre a tarefa).

## 5. Comentários

### @menções
- Digitar `@` abre a lista de pessoas da equipe **que têm acesso à tarefa** (membros do espaço,
  responsáveis e admins), ativas.
- Tabela `comment_mentions(comment_id, user_id)`. Um gatilho valida que o mencionado é equipe ativa
  e consegue ler a tarefa (helper novo `usuario_le_tarefa(p_user, p_task)`), e cria o aviso.
- No texto, a menção fica guardada como `@[Nome](uuid)` e aparece como destaque.

### Avisos (sino)
- Tabela `notifications`: `id`, `user_id`, `kind` (`mention`), `task_id`, `comment_id`,
  `actor_id`, `read_at`, `created_at`. Só gatilhos inserem; cada um lê e marca como lido só os
  seus.
- Sino na barra lateral com o número de não lidos (atualiza em tempo real via Supabase Realtime).
  Lista: "<Pessoa> mencionou você em <tarefa>"; clicar abre a tarefa e marca como lido; "Marcar
  todos como lidos".

### Anexos
- Armazenamento no Cloudflare R2 já usado pelo app antigo (`src/infra/r2.ts`, mesmas variáveis
  `R2_*`), com chaves `tarefas/<task_id>/<uuid>.<ext>`.
- Tabela `comment_attachments`: `id`, `comment_id` (cascade), `task_id`, `r2_key`, `file_name`,
  `mime_type`, `size_bytes`, `kind` (`arquivo`|`audio`|`video`), `uploaded_by`, `created_at`.
  Leitura segue `can_read_task`; inserção só pela RPC.
- Fluxo: o navegador pede uma URL de envio (server action valida acesso à tarefa, tipo e tamanho),
  envia direto ao R2, e então chama a RPC `criar_comentario(p_task, p_body, p_internal,
  p_mencoes uuid[], p_anexos jsonb)` que grava comentário, menções e anexos numa transação.
  Comentário pode ter texto vazio se tiver anexo.
- Limites: imagens, PDF, documentos Office, zip, áudio e vídeo; até **100 MB** por arquivo e
  **500 MB** por vídeo gravado; até 10 anexos por comentário.
- Exibição: imagem em miniatura (clique amplia), áudio e vídeo com player, outros com ícone e
  download. URLs de leitura assinadas no servidor (6h).

### Gravação
- **Áudio:** botão 🎤 grava pelo microfone (`MediaRecorder`; webm, ou mp4 no Safari), até 10 min,
  com ouvir/descartar antes de enviar.
- **Vídeo/tela:** botão 🎥 com escolha "Tela" (`getDisplayMedia`, com áudio do microfone) ou
  "Câmera"; até 10 min; prévia antes de enviar.
- Se o navegador negar permissão, aviso claro e nada é enviado.

## 6. Fora desta etapa

Tipos de tarefa (o seletor "Tarefa" do print), relatórios de horas, avisos por e-mail/WhatsApp,
avisos de outros eventos além de menção, emojis/reações nos comentários.

## 7. Pré-requisitos operacionais

- O CORS do bucket R2 precisa aceitar `PUT` de `https://app.gruposrv.com.br` e
  `http://localhost:3000` (o dono faz no painel da Cloudflare; passo a passo no plano).
- Variáveis `R2_*` no projeto Vercel (provavelmente já existem do app antigo; conferir).
- Aplicar as migrações novas em dev e produção (o modo automático exige aprovação do dono).
- Mudanças locais ainda não commitadas (campos em listas, migração `…0010`) precisam ser
  commitadas antes de começar.

## 8. Testes

- **Banco (PGlite):** RLS e RPCs de `time_entries` (um ativo por pessoa, parar ao iniciar outro,
  cliente não lê, editar só o próprio, gestor edita todos); menções (rejeita quem não lê a tarefa,
  cria aviso); `notifications` (só o dono lê/marca); `criar_comentario` (transação, texto vazio só
  com anexo, limite de anexos); `comment_attachments` (leitura por `can_read_task`).
- **Domínio:** juntar histórico + comentários em ordem; "mostrar mais"; contar campos vazios;
  formatar duração; validar tipo/tamanho de anexo; extrair/renderizar menções.
- Checagem de tipos, lint, build e verificação no navegador (abrir tarefa, cronômetro, comentar com
  menção e anexo).
