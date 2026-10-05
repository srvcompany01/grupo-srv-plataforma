# Aprovação de Conteúdo — Grupo SRV

Data: 2026-10-05
Status: aprovado em conversa, aguardando revisão do arquivo

## Objetivo

Sistema fechado em `conteudo.gruposrv.com.br` onde a agência cadastra posts
(ideia, objetivo, legenda, data, formato e mídia) e cada cliente aprova ou pede
ajuste pelo celular. Serve também como registro de "o cliente aprovou exatamente
esta versão".

**Sucesso:** o cliente abre o link recebido no WhatsApp, vê o post como ficará
no celular, aprova ou pede ajuste em menos de um minuto, e a agência vê o status
no painel sem perguntar.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Endereço | subdomínio `conteudo.gruposrv.com.br` (DNS já está na Vercel) |
| Acesso do cliente | link secreto por cliente, sem senha; revogável |
| Acesso da agência | `/admin` com senha única em variável de ambiente |
| Ajustes | versões: cada edição após pedido de ajuste gera nova versão; histórico preservado |
| Granularidade | aprovação do post inteiro (comentário pode citar a imagem) |
| Notificação | nenhuma; agência acompanha pelo painel e envia o link manualmente |
| Campos extras | data prevista e formato |
| Dados | Postgres Neon (via Vercel Marketplace) |
| Mídia | Cloudflare R2, bucket privado |

## Arquitetura

- Projeto Vercel novo `grupo-srv-conteudo`, Next.js (App Router) + TypeScript,
  pasta própria `~/Downloads/grupo-srv-conteudo`.
- Neon Postgres acessado pelo servidor (ORM: Drizzle).
- Cloudflare R2 (API S3):
  - **Upload:** o servidor gera URL pré-assinada de `PUT`; o navegador envia o
    arquivo direto ao R2. O arquivo nunca passa pela função da Vercel.
  - **Leitura:** ao renderizar uma página, o servidor gera URLs pré-assinadas de
    `GET` válidas por 6 horas. Bucket sem acesso público.
  - CORS do bucket liberando `PUT`/`GET` a partir de `https://conteudo.gruposrv.com.br`
    (e `http://localhost:3000` em desenvolvimento).
- Todas as páginas com `noindex, nofollow` e `robots.txt` bloqueando tudo.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Neon |
| `ADMIN_SENHA` | senha do painel |
| `SESSAO_SEGREDO` | assinatura do cookie de sessão do admin |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 |

## Modelo de dados

**clientes**
- `id`, `nome`, `token` (32 caracteres aleatórios, único), `ativo` (bool), `criado_em`

**posts**
- `id`, `cliente_id`, `data_prevista` (date), `formato` (`feed` | `reels` | `stories` | `tiktok`),
  `status` (`rascunho` | `aguardando` | `aprovado` | `ajuste`), `criado_em`, `atualizado_em`

**versoes**
- `id`, `post_id`, `numero` (1, 2, 3…), `ideia`, `objetivo`, `legenda`, `criada_em`
- A versão atual é a de maior `numero`.

**midias**
- `id`, `versao_id`, `ordem`, `tipo` (`imagem` | `video`), `chave_r2`, `nome_original`, `tamanho_bytes`
- Regras: um vídeo **ou** uma imagem **ou** 2–20 imagens (carrossel). Sem misturar vídeo com imagens.

**respostas**
- `id`, `versao_id`, `decisao` (`aprovado` | `ajuste`), `comentario`, `nome_respondente`, `criada_em`

## Regras de status

```
rascunho --(enviar para aprovação)--> aguardando
aguardando --(cliente aprova)--> aprovado
aguardando --(cliente pede ajuste)--> ajuste
ajuste --(agência salva edição)--> nova versão, aguardando
aprovado --(agência edita)--> nova versão, aguardando
```

- Em `rascunho`, editar altera a versão 1 no lugar (cliente ainda não viu).
- Em `aguardando`, editar também altera a versão atual no lugar (cliente ainda
  não respondeu a ela).
- Em `ajuste` ou `aprovado`, salvar edição cria versão nova; a versão respondida
  fica congelada com sua resposta.
- Cliente só responde a posts em `aguardando`, e só à versão atual. Resposta a
  versão desatualizada é rejeitada com mensagem para recarregar.
- Pedir ajuste exige comentário; aprovar não exige.
- Cliente não vê posts em `rascunho`.
- Mídias de versões antigas são mantidas (fazem parte do registro).

## Telas

### Painel da agência (`/admin`)

- **Login:** campo de senha; cookie de sessão `httpOnly`, assinado, 30 dias.
- **Clientes:** lista, cadastrar, ativar/desativar, "copiar mensagem com link"
  (texto pronto para WhatsApp com o link), "gerar novo link" (com confirmação;
  o anterior deixa de funcionar).
- **Posts do cliente:** lista ordenada por data prevista, filtro por status,
  contador de pendentes.
- **Editor do post:** data, formato, ideia, objetivo, legenda, upload por
  arrastar-e-soltar com barra de progresso, reordenação do carrossel, remover
  mídia. Botões "salvar rascunho" e "enviar para aprovação".
- **Detalhe do post:** versão atual + histórico (cada versão com suas mídias e
  a resposta recebida).

### Tela do cliente (`/c/<token>`)

- Cabeçalho com nome do cliente.
- Seção "Aguardando sua aprovação" em destaque; abaixo, posts já respondidos
  com o status.
- **Página do post** (`/c/<token>/p/<id>`): mídia em moldura de celular (player
  de vídeo, imagem ou carrossel deslizável com indicador de posição), formato,
  data prevista, ideia, objetivo, legenda.
- Botões **Aprovar** e **Pedir ajuste**. Na primeira resposta pede "Seu nome",
  lembrado no navegador (`localStorage`, com fallback para pedir de novo).
- Pensada primeiro para celular.

## Erros e limites

- Token inexistente ou cliente inativo → página neutra "Link indisponível"
  (status 404), sem revelar se o cliente existe.
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`,
  `video/quicktime`. Até 1 GB por arquivo, até 20 imagens por carrossel.
  Validado no navegador e de novo no servidor ao gerar a URL de upload e ao salvar.
- Falha de upload: mensagem na mídia afetada com botão "tentar de novo"; o post
  não pode ser enviado para aprovação com upload pendente ou com falha.
- Senha de admin errada: mensagem genérica e atraso de 1 s por tentativa.

## Testes

- **Automáticos (Vitest):** transições de status, criação de versão ao editar
  após resposta, rejeição de resposta a versão desatualizada, validação das
  regras de mídia, comentário obrigatório no ajuste, token inválido/inativo.
- **Roteiro manual:** criar cliente → criar post com carrossel → enviar →
  abrir link no celular real → pedir ajuste → editar (versão 2) → aprovar →
  conferir histórico no painel → gerar novo link e confirmar que o antigo falha.

## Implantação (ação humana)

1. Criar conta Cloudflare, bucket R2 privado, token de API com permissão de
   leitura/escrita no bucket, e configurar CORS.
2. Criar banco Neon pela Vercel (Storage → Neon) no projeto.
3. Preencher as variáveis de ambiente na Vercel.
4. Adicionar o domínio `conteudo.gruposrv.com.br` ao projeto.

## Fora do escopo (v1)

Notificações (e-mail/WhatsApp/Telegram), login por e-mail, capa do Reels,
aprovação por imagem, calendário visual, múltiplos usuários de agência,
limpeza automática de mídias antigas.

## Observação

A conta Vercel aparenta estar no plano Hobby, cujos termos vedam uso comercial.
Avaliar migração para Pro.
