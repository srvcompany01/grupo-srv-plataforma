# Social & Conteúdo: pipeline de conteúdo dentro da plataforma

Data: 2026-10-08 · Status: **aguardando aprovação** · Escopo: tela do departamento Social & Conteúdo, post como tarefa, versões, mídias, aprovação do cliente por link e três visões (quadro, calendário editorial, por cliente).

## 1. Objetivo
Substituir o módulo antigo de conteúdo (conteudo.gruposrv, banco Neon separado, em desuso) por um pipeline **dentro da plataforma**: o time cria o post, produz, envia para o cliente aprovar por link e acompanha tudo na mesma tela, com o mesmo cliente, responsáveis, comentários e tempo das demais tarefas.

Sucesso = (1) criar um post com ideia, objetivo, legenda e mídias; (2) enviar ao cliente e receber aprovação ou pedido de ajuste sem login; (3) ver todos os posts por etapa, por data de publicação e por cliente.

## 2. O que já existe e será reaproveitado
- **Tarefa** com cliente por tarefa, responsáveis, prazo, status por lista, comentários, anexos, tempo, histórico.
- **Campos personalizados** com opções coloridas (serve para *formato*).
- **Visões** lista, quadro (por status), calendário; agrupar por tag do cliente.
- **R2** para mídias e **cliente admin do Supabase** para o link público.
- Do módulo antigo, a **regra de versões**: depois que o cliente responde, a versão fica congelada; editar cria uma nova versão e volta para "aguardando".

## 3. Modelo de dados (migration 22, só adiciona)
O post **é uma tarefa** da lista Social & Conteúdo. O que é de conteúdo mora em tabelas ligadas à tarefa:

| Tabela | Campos | Função |
|---|---|---|
| `content_posts` | `task_id` (PK, FK tasks), `format` (feed, reels, stories, tiktok), `approval` (rascunho, aguardando, aprovado, ajuste), `current_version` | Dados próprios do post |
| `content_versions` | `id`, `task_id`, `number`, `idea`, `objective`, `caption`, `created_at`; único (task, number) | Texto versionado |
| `content_media` | `id`, `version_id`, `position`, `kind` (imagem, video), `r2_key`, `original_name`, `size_bytes` | Mídias de cada versão |
| `content_responses` | `id`, `version_id` (único), `decision` (aprovado, ajuste), `comment`, `responder_name`, `created_at` | Resposta do cliente |
| `clients.approval_token` | texto único, gerado por cliente | Link público de aprovação |

- **Data prevista** = prazo da tarefa. **Cliente** = tag da tarefa (já existe).
- **RLS:** equipe lê e escreve conforme o acesso à lista (mesmas funções das tarefas). O cliente **não** tem acesso direto às tabelas.
- **Link público:** rotas `/c/[token]` rodam no servidor com o cliente admin do Supabase, filtram pelo `approval_token` e só expõem posts do cliente cujo `approval` é `aguardando` ou já respondido. Mídias via URL assinada.
- **Etapas do pipeline** = status da lista (editáveis hoje no editor de status). Padrão proposto: Ideia, Roteiro, Produção, Aprovação do cliente, Ajustes, Agendado, Publicado.

## 4. Fluxo
1. **Criar:** "Novo post" na tela de Social & Conteúdo escolhe cliente, formato e data; nasce `rascunho`, versão 1.
2. **Produzir:** editor com ideia, objetivo, legenda e mídias; a equipe move o cartão pelas etapas.
3. **Enviar:** "Enviar para aprovação" (só em `rascunho`) muda `approval` para `aguardando` e move a tarefa para a etapa *Aprovação do cliente* (se existir).
4. **Cliente:** abre o link, vê a prévia e **aprova** ou **pede ajuste** com comentário e nome. A versão fica congelada.
5. **Depois:** `aprovado` move para *Agendado*; `ajuste` volta para *Ajustes* e avisa os responsáveis. Editar um post respondido cria a **versão N+1** e volta a `aguardando`.

## 5. Telas
- **Tela do departamento** (`/listas/<Social & Conteúdo>`): três visões na mesma página.
  - **Quadro por etapa:** colunas = status; cartão mostra formato (cor), cliente, data, selo de aprovação e responsável.
  - **Calendário editorial:** posts pela data prevista, coloridos por formato.
  - **Por cliente:** agrupado por tag do cliente.
- **Editor do post** (abre sobre a tarefa): abas Conteúdo (ideia, objetivo, legenda), Mídias, Histórico de versões e respostas, Comentários (os que já existem).
- **Portal de aprovação** (`/c/<token>`): lista de pendentes e respondidos, página do post com prévia da mídia, botões Aprovar e Pedir ajuste.

## 6. Fora do escopo desta entrega
- Importar posts do banco antigo (Neon): o módulo está em desuso. Se algum post ainda precisar ser levado, é uma tarefa à parte.
- Agendamento e publicação automática nas redes.
- Login do cliente no portal (continua o link por token).
- Métricas de desempenho do post.

## 7. Entrega em fases (cada uma sobe sozinha)
1. **Dados e editor:** migration 22, criação de post, versões e mídias (upload no R2) no editor da tarefa.
2. **Aprovação:** token por cliente, rotas públicas, resposta do cliente, avisos para a equipe.
3. **Visões:** etapas padrão da lista, cartão de conteúdo no quadro, calendário editorial por formato.

## 8. Decisões assumidas (corrija o que não servir)
- O post é uma **tarefa** (não uma entidade separada), para herdar tudo que a plataforma já faz.
- Etapas do pipeline são os **status da lista**; a aprovação é um estado à parte, para os dois não se misturarem.
- Link de aprovação **por cliente**, como no módulo antigo.
- Formatos fixos: feed, reels, stories, tiktok.
- Sem migração de dados do módulo antigo.

## 9. Riscos
- **Link público:** é a única porta sem login. Mitigação: token longo e aleatório, rotas só leem pelo servidor, nada de listar clientes, mídias por URL assinada com expiração curta, e testes de que um token nunca vê post de outro cliente.
- **Mover etapa por nome:** buscar "Aprovação do cliente" por nome é frágil se alguém renomear. Mitigação: se a etapa não existir, só muda o selo de aprovação e avisa.
- **Armazenamento:** mídias de vídeo pesam; mantém os limites de tipo e tamanho do módulo antigo.
