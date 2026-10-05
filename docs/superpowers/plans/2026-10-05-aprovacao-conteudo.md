# Aprovação de Conteúdo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistema em `conteudo.gruposrv.com.br` onde a agência cadastra posts versionados e cada cliente aprova ou pede ajuste por link secreto.

**Architecture:** Next.js (App Router) na Vercel. Regras puras em `src/dominio/` (sem I/O, testadas isoladamente); serviços em `src/servicos/` recebem o `db` por parâmetro e são testados contra PGlite (Postgres em memória) com as mesmas migrações do Neon. Mídia vai direto do navegador ao Cloudflare R2 por URL pré-assinada; telas usam Server Components + Server Actions.

**Tech Stack:** Next.js (versão atual do `create-next-app`), TypeScript estrito, Tailwind, Drizzle ORM + `@neondatabase/serverless` (produção) + `@electric-sql/pglite` (testes), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-aprovacao-conteudo-design.md`

## Global Constraints

- Domínio: `conteudo.gruposrv.com.br`. Projeto Vercel: `grupo-srv-conteudo`. Time Vercel: `team_pp6BiBKhK4AFKvAZDZfzsZXE`.
- Toda a interface em português do Brasil. Código (nomes de função, tabelas, variáveis) em português, sem acento.
- Status: `rascunho` | `aguardando` | `aprovado` | `ajuste`. Formatos: `feed` | `reels` | `stories` | `tiktok`.
- Token de cliente: 32 caracteres `[A-Za-z0-9]`, gerado com `crypto.getRandomValues`.
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`. Máx. 1 GB (`1024 ** 3` bytes) por arquivo. Carrossel: 2–20 imagens. Vídeo nunca com imagens.
- URL de leitura do R2 válida por 6 h (`21600` s). URL de upload válida por 1 h. Cookie de admin `httpOnly`, `secure`, `sameSite=lax`, 30 dias.
- Todas as páginas `noindex, nofollow`; `robots.txt` com `Disallow: /`.
- Nenhum segredo no código ou no bundle do cliente; só em variáveis de ambiente: `DATABASE_URL`, `ADMIN_SENHA`, `SESSAO_SEGREDO`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
- Toda Server Action do admin chama `exigirAdmin()` antes de qualquer coisa (o layout protege a renderização, não as actions).
- Toda Server Action do cliente revalida o token (`buscarClientePorToken`) e que o post pertence a esse cliente.

## Review Focus

1. **Duplo toque em "Aprovar"** (internet lenta, cliente clica duas vezes) → grava uma única resposta; a segunda é rejeitada sem erro feio. Teste em Task 4.
2. **Data prevista exibida um dia antes** por conversão UTC de `"2026-10-07"` → deve aparecer exatamente `07/10/2026`. Teste em Task 1 (`formatarData`).
3. **Vídeo `.mov` HEVC do iPhone não toca no Chrome/Android** → a página do cliente sempre mostra, abaixo do player, o link "Não carregou? Baixar o vídeo". Verificação manual em Task 10.
4. **Enviar para aprovação sem mídia, ou salvar chave de mídia que não pertence ao post** (ex.: chave forjada de outro post) → rejeitado. Testes em Task 3.
5. **Legenda com quebras de linha, emojis e hashtags** → exibida exatamente como digitada (`whitespace-pre-wrap`, sem markdown). Verificação manual em Task 10; persistência sem alteração testada em Task 3.

---

## File Structure

```
src/
  dominio/
    tipos.ts         tipos e constantes compartilhados
    erros.ts         ErroRegra com código
    status.ts        transições de status (puro)
    midias.ts        validação de arquivo e de conjunto (puro)
    token.ts         gerarToken
    formatar.ts      formatarData, rótulos de status/formato
  db/
    schema.ts        tabelas Drizzle
    conexao.ts       db de produção (Neon) e tipo Db
  servicos/
    clientes.ts
    posts.ts
    respostas.ts
  infra/
    r2.ts            URLs pré-assinadas
    sessao.ts        cookie assinado do admin
  app/
    layout.tsx, robots.ts
    admin/login/page.tsx
    admin/(protegido)/layout.tsx, page.tsx, clientes/[id]/page.tsx,
      posts/[id]/editar/page.tsx, posts/[id]/page.tsx, acoes.ts
    c/[token]/page.tsx, c/[token]/p/[id]/page.tsx, c/[token]/acoes.ts
  componentes/
    EditorMidias.tsx, VisualizadorMidia.tsx, FormResposta.tsx, CopiarLink.tsx
tests/
  ajuda/db.ts        cria PGlite + roda migrações
  dominio/*.test.ts, servicos/*.test.ts, infra/*.test.ts
drizzle/             migrações geradas
```

---

### Task 1: Projeto base e regras puras

**Files:**
- Create: projeto via `create-next-app`, `vitest.config.ts`, `src/app/robots.ts`, `src/dominio/{tipos,erros,status,midias,token,formatar}.ts`
- Modify: `src/app/layout.tsx` (metadata `robots: { index: false, follow: false }`, `lang="pt-BR"`)
- Test: `tests/dominio/{status,midias,token,formatar}.test.ts`

**Interfaces:**
- Produces:
  - `type Status = 'rascunho'|'aguardando'|'aprovado'|'ajuste'`; `type Formato = 'feed'|'reels'|'stories'|'tiktok'`; `type TipoMidia = 'imagem'|'video'`; `type Decisao = 'aprovado'|'ajuste'`
  - `interface MidiaEntrada { chave: string; tipo: TipoMidia; nomeOriginal: string; tamanhoBytes: number }`
  - `interface CamposPost { dataPrevista: string /* YYYY-MM-DD */; formato: Formato; ideia: string; objetivo: string; legenda: string }`
  - `class ErroRegra extends Error { constructor(public codigo: CodigoErro, mensagem: string) }` com `CodigoErro = 'tipo_invalido'|'arquivo_grande'|'midias_invalidas'|'sem_midia'|'status_invalido'|'versao_desatualizada'|'comentario_obrigatorio'|'nome_obrigatorio'|'chave_invalida'|'nao_encontrado'`
  - `edicaoCriaNovaVersao(status: Status): boolean` — true para `aprovado` e `ajuste`
  - `statusAposEdicao(status: Status): Status` — `rascunho`→`rascunho`, demais→`aguardando`
  - `podeEnviar(status: Status): boolean` — só `rascunho`
  - `statusAposResposta(d: Decisao): Status`
  - `validarArquivo(a: { tipoMime: string; tamanhoBytes: number }): TipoMidia` (lança `tipo_invalido`/`arquivo_grande`)
  - `validarConjunto(m: MidiaEntrada[]): void` (lança `sem_midia` se vazio, `midias_invalidas` se misturado, >1 vídeo, ou >20 imagens)
  - `gerarToken(): string`
  - `formatarData(iso: string): string`, `ROTULO_STATUS: Record<Status,string>`, `ROTULO_FORMATO: Record<Formato,string>`

- [ ] **Step 1: Criar projeto**

```bash
cd ~/Downloads/grupo-srv-conteudo
npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack
npm i -D vitest
```
Adicionar script `"test": "vitest run"` e `vitest.config.ts` com alias `@` → `src`. Se o `create-next-app` recusar a pasta por já conter `docs/`, mover `docs` temporariamente e restaurar.

- [ ] **Step 2: Escrever testes que falham**

```ts
// status.test.ts
expect(edicaoCriaNovaVersao('rascunho')).toBe(false)
expect(edicaoCriaNovaVersao('aguardando')).toBe(false)
expect(edicaoCriaNovaVersao('ajuste')).toBe(true)
expect(edicaoCriaNovaVersao('aprovado')).toBe(true)
expect(statusAposEdicao('rascunho')).toBe('rascunho')
expect(statusAposEdicao('ajuste')).toBe('aguardando')
expect(statusAposEdicao('aprovado')).toBe('aguardando')
expect(podeEnviar('rascunho')).toBe(true); expect(podeEnviar('aguardando')).toBe(false)
expect(statusAposResposta('ajuste')).toBe('ajuste')

// midias.test.ts
expect(validarArquivo({ tipoMime: 'video/quicktime', tamanhoBytes: 10 })).toBe('video')
expect(validarArquivo({ tipoMime: 'image/webp', tamanhoBytes: 10 })).toBe('imagem')
expect(() => validarArquivo({ tipoMime: 'image/gif', tamanhoBytes: 10 })).toThrow(/tipo/)        // codigo tipo_invalido
expect(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 1024 ** 3 + 1 })).toThrow()   // arquivo_grande
expect(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 1024 ** 3 })).not.toThrow()
// validarConjunto: [] → sem_midia; 1 vídeo ok; 1 imagem ok; 20 imagens ok; 21 → midias_invalidas;
// vídeo+imagem → midias_invalidas; 2 vídeos → midias_invalidas

// token.test.ts
expect(gerarToken()).toMatch(/^[A-Za-z0-9]{32}$/)
expect(new Set(Array.from({ length: 1000 }, gerarToken)).size).toBe(1000)

// formatar.test.ts  (roda com TZ=America/Belem e TZ=UTC)
expect(formatarData('2026-10-07')).toBe('07/10/2026')
```
Nos testes de erro, verificar `(e as ErroRegra).codigo` com o código exato.

- [ ] **Step 3: Rodar e ver falhar** — `npm test` → FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar os módulos de `src/dominio/`**

`gerarToken`: 32 bytes de `crypto.getRandomValues`, cada um mapeado por rejeição (`byte < 248`, `byte % 62`) no alfabeto de 62 caracteres, repetindo até ter 32. `formatarData`: dividir a string `YYYY-MM-DD` e montar `DD/MM/YYYY` sem `new Date()`.

- [ ] **Step 5: `src/app/robots.ts`** retornando `{ rules: { userAgent: '*', disallow: '/' } }`; metadata do layout com `robots` noindex.

- [ ] **Step 6: Rodar** — `npm test` → PASS; `npm run build` → sucesso.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: projeto base e regras de domínio"`

---

### Task 2: Banco, harness de teste e serviço de clientes

**Files:**
- Create: `src/db/schema.ts`, `src/db/conexao.ts`, `drizzle.config.ts`, `drizzle/` (gerado), `tests/ajuda/db.ts`, `src/servicos/clientes.ts`
- Test: `tests/servicos/clientes.test.ts`

**Interfaces:**
- Consumes: `gerarToken`, `ErroRegra`, tipos da Task 1.
- Produces:
  - Tabelas `clientes`, `posts`, `versoes`, `midias`, `respostas` exatamente com as colunas da spec (ids `uuid` com `defaultRandom()`, datas `timestamp with time zone` default `now()`, `data_prevista` tipo `date` em modo string, enums como `text` com `$type<>`). Índice único em `clientes.token`; único em `(versoes.post_id, versoes.numero)`; único em `respostas.versao_id` (uma resposta por versão — base do item 1 do Review Focus).
  - `type Db` = `PgDatabase<any, typeof schema>`; `getDb(): Db` (Neon via `drizzle-orm/neon-serverless` com `Pool`, porque o driver HTTP não suporta transações interativas).
  - `criarDbTeste(): Promise<Db>` em `tests/ajuda/db.ts` (PGlite + `migrate` de `drizzle-orm/pglite/migrator` na pasta `drizzle`).
  - `criarCliente(db, nome: string): Promise<Cliente>`
  - `listarClientes(db): Promise<(Cliente & { pendentes: number })[]>` — `pendentes` = posts em `aguardando`, ordenado por nome
  - `buscarCliente(db, id: string): Promise<Cliente>` (lança `nao_encontrado`)
  - `buscarClientePorToken(db, token: string): Promise<Cliente | null>` — null se não existe **ou** inativo
  - `regenerarToken(db, id: string): Promise<string>`
  - `definirAtivo(db, id: string, ativo: boolean): Promise<void>`
  - `Cliente = typeof clientes.$inferSelect`

- [ ] **Step 1: Escrever `schema.ts`, `drizzle.config.ts` e gerar migração** — `npx drizzle-kit generate` → arquivo SQL em `drizzle/`.

- [ ] **Step 2: Testes que falham** (`clientes.test.ts`, um `criarDbTeste()` por teste):
  - `criarCliente` com nome `"Aurum Belém"` → token 32 chars, `ativo === true`
  - `criarCliente(db, '  ')` → `nome_obrigatorio`
  - `buscarClientePorToken` com token certo → cliente; com token + `"x"` → null; com token em maiúsculas diferentes → null
  - após `definirAtivo(id, false)` → `buscarClientePorToken` → null
  - `regenerarToken` → token antigo retorna null, novo retorna o cliente
  - `listarClientes` conta só posts `aguardando` (inserir posts direto via `db.insert` neste teste)

- [ ] **Step 3: Rodar e ver falhar** — `npm test -- clientes` → FAIL.

- [ ] **Step 4: Implementar `conexao.ts` e `clientes.ts`.** `nome` é `trim()`ado.

- [ ] **Step 5: Rodar** — `npm test` → PASS.

- [ ] **Step 6: Commit** — `feat: schema, harness PGlite e serviço de clientes`

---

### Task 3: Serviço de posts e versões

**Files:**
- Create: `src/servicos/posts.ts`
- Test: `tests/servicos/posts.test.ts`

**Interfaces:**
- Consumes: `Db`, `criarCliente`, regras de `status.ts` e `midias.ts`.
- Produces:
  - `criarPost(db, clienteId: string, formato: Formato, dataPrevista: string): Promise<string>` — cria post `rascunho` + versão 1 com textos vazios; retorna id
  - `prefixoChave(postId: string): string` → `posts/${postId}/`
  - `salvarEdicao(db, postId: string, campos: CamposPost, midias: MidiaEntrada[]): Promise<void>`
  - `enviarParaAprovacao(db, postId: string): Promise<void>`
  - `listarPosts(db, clienteId: string, filtro?: Status): Promise<PostResumo[]>` — ordenado por `dataPrevista` asc
  - `detalhePost(db, postId: string): Promise<PostDetalhe>` (lança `nao_encontrado`)
  - `PostResumo = { id, formato, dataPrevista, status, versaoAtual: number, ideia: string }`
  - `PostDetalhe = { post, cliente, versoes: Array<VersaoComMidias & { resposta: Resposta | null }> }`, versões em ordem decrescente de `numero`; `VersaoComMidias = Versao & { midias: Midia[] }` (midias por `ordem`)

- [ ] **Step 1: Testes que falham**
  - `criarPost` → status `rascunho`, 1 versão, numero 1
  - `salvarEdicao` em `rascunho` → continua 1 versão, campos atualizados, status `rascunho`; legenda `"Linha 1\n\n🔥 #ouro"` volta idêntica
  - `salvarEdicao` em `aguardando` → altera versão atual, sem nova versão, continua `aguardando`
  - `salvarEdicao` em `ajuste` → cria versão 2 com as mídias novas, versão 1 e suas mídias intactas, status `aguardando`
  - `salvarEdicao` em `aprovado` → mesma coisa (versão nova, `aguardando`)
  - `salvarEdicao` com mídia de chave `posts/<outroId>/a.jpg` → `chave_invalida`
  - `salvarEdicao` com `[]` de mídias em `rascunho` → permitido (rascunho pode ficar sem mídia); `enviarParaAprovacao` nesse post → `sem_midia`
  - `salvarEdicao` em `aguardando`/`ajuste`/`aprovado` com `[]` → `sem_midia`
  - `enviarParaAprovacao` em post `aguardando` → `status_invalido`
  - mídias salvas preservam a ordem do array (`ordem` 0..n-1)
  - `listarPosts` com filtro `aguardando` retorna só esses, ordenados por data

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar.** `salvarEdicao` em transação: lê status; valida chaves com `prefixoChave`; valida conjunto (exceto vazio em `rascunho`); se `edicaoCriaNovaVersao` insere versão `numero+1` e mídias novas, senão atualiza versão atual e substitui suas mídias; aplica `statusAposEdicao`; atualiza `formato`, `dataPrevista`, `atualizadoEm`.

- [ ] **Step 4: Rodar** — `npm test` → PASS.

- [ ] **Step 5: Commit** — `feat: posts com versionamento`

---

### Task 4: Serviço de respostas

**Files:**
- Create: `src/servicos/respostas.ts`
- Test: `tests/servicos/respostas.test.ts`

**Interfaces:**
- Consumes: `Db`, `statusAposResposta`, tabelas.
- Produces:
  - `responder(db, entrada: { clienteId: string; postId: string; versaoNumero: number; decisao: Decisao; comentario: string; nome: string }): Promise<void>`
  - `postsDoClienteParaVer(db, clienteId: string): Promise<{ pendentes: PostResumo[]; respondidos: PostResumo[] }>` — exclui `rascunho`
  - `postParaCliente(db, clienteId: string, postId: string): Promise<PostDetalhe>` — `nao_encontrado` se o post é de outro cliente ou está em `rascunho`

- [ ] **Step 1: Testes que falham**
  - aprovar versão atual de post `aguardando` → status `aprovado`, resposta gravada com nome e `comentario` vazio permitido
  - pedir ajuste com comentário `"   "` → `comentario_obrigatorio`
  - nome vazio → `nome_obrigatorio`
  - responder com `versaoNumero` antigo (após nova versão) → `versao_desatualizada`
  - responder post em `rascunho` ou `aprovado` → `status_invalido`
  - **duplo toque:** duas chamadas `responder` em sequência com mesmos dados → a primeira passa, a segunda lança `status_invalido`; existe exatamente 1 linha em `respostas`
  - **concorrência:** `Promise.allSettled` de duas chamadas → exatamente uma `fulfilled`, 1 linha em `respostas`
  - post de outro cliente → `nao_encontrado`
  - `postsDoClienteParaVer` não inclui rascunho; separa `aguardando` dos demais

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar.** Transação: `UPDATE posts SET status = $novo WHERE id = $id AND cliente_id = $cid AND status = 'aguardando' RETURNING id`; se nenhuma linha, descobrir o motivo (`nao_encontrado` / `status_invalido`) e lançar; conferir que `versaoNumero` é o máximo (senão lançar, revertendo); inserir resposta. O índice único em `respostas.versao_id` é a segunda barreira.

- [ ] **Step 4: Rodar** — `npm test` → PASS.

- [ ] **Step 5: Commit** — `feat: respostas do cliente`

---

### Task 5: R2 e sessão do admin

**Files:**
- Create: `src/infra/r2.ts`, `src/infra/sessao.ts`
- Test: `tests/infra/sessao.test.ts`, `tests/infra/r2.test.ts`

**Interfaces:**
- Produces:
  - `urlUpload(chave: string, tipoMime: string, tamanhoBytes: number): Promise<string>` — `PutObjectCommand` com `ContentType` e `ContentLength`, expira 3600 s
  - `urlLeitura(chave: string, opcoes?: { download?: string }): Promise<string>` — expira 21600 s; com `download`, define `ResponseContentDisposition: attachment; filename="<nome>"`
  - `gerarChave(postId: string, nomeOriginal: string): string` → `posts/<postId>/<uuid>.<ext>` com extensão minúscula do nome original
  - `criarCookieSessao(segredo: string, agora: number): string` — `<expiraEm>.<hmacSha256Base64url>`
  - `sessaoValida(valor: string | undefined, segredo: string, agora: number): boolean`
  - `senhaConfere(digitada: string, correta: string): boolean` — comparação com `timingSafeEqual` sobre hashes SHA-256
  - `exigirAdmin(): Promise<void>` — lê cookie `admin_sessao` via `cookies()`, chama `redirect('/admin/login')` se inválida

- [ ] **Step 1: Testes que falham**
  - cookie criado agora é válido agora e em +29 dias; inválido em +31 dias
  - cookie com um caractere da assinatura trocado → inválido; com outro segredo → inválido; `undefined` → inválido
  - `senhaConfere('abc','abc')` true; `('abc','abd')` false; `('','abc')` false
  - `gerarChave('p1','Foto Final.JPG')` casa `/^posts\/p1\/[0-9a-f-]{36}\.jpg$/`
  - `urlUpload` (com env falso) contém `X-Amz-Expires=3600`; `urlLeitura` contém `X-Amz-Expires=21600`

- [ ] **Step 2: Rodar e ver falhar.** **Step 3: Implementar** (cliente S3 com `region: 'auto'`, `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`). **Step 4: Rodar → PASS.**

- [ ] **Step 5: Commit** — `feat: URLs do R2 e sessão do admin`

---

### Task 6: Login e lista de clientes no painel

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/(protegido)/layout.tsx`, `src/app/admin/(protegido)/page.tsx`, `src/app/admin/(protegido)/acoes.ts`, `src/componentes/CopiarLink.tsx`

**Interfaces:**
- Consumes: `senhaConfere`, `criarCookieSessao`, `exigirAdmin`, serviços de clientes.
- Produces (em `acoes.ts`, todas começam com `await exigirAdmin()` exceto `entrar`):
  - `entrar(form: FormData)` — espera 1 s se a senha errar; mensagem genérica "Senha incorreta"
  - `sair()`, `acaoCriarCliente(form)`, `acaoRegenerarToken(id)`, `acaoDefinirAtivo(id, ativo)`
  - `<CopiarLink nome={string} url={string} />` — copia o texto:
    `Olá, {nome}! Seus conteúdos para aprovação estão aqui: {url}`

- [ ] **Step 1: Implementar** login, layout protegido (chama `exigirAdmin`, mostra "Sair"), página com tabela de clientes (nome, pendentes, ativo, botões), formulário "Novo cliente", confirmação nativa antes de "Gerar novo link". URL do cliente: `https://conteudo.gruposrv.com.br/c/<token>` (usar `process.env.NEXT_PUBLIC_URL_BASE`, default `http://localhost:3000` em dev).

- [ ] **Step 2: Verificar manualmente** com `npm run dev` + `.env.local` apontando para um Neon de dev: senha errada → mensagem e nenhum cookie; senha certa → lista; criar cliente; copiar mensagem; gerar novo link muda a URL; acessar `/admin` em aba anônima → redireciona ao login.

- [ ] **Step 3: Commit** — `feat: login e clientes no painel`

---

### Task 7: Posts do cliente e editor com upload

**Files:**
- Create: `src/app/admin/(protegido)/clientes/[id]/page.tsx`, `src/app/admin/(protegido)/posts/[id]/editar/page.tsx`, `src/componentes/EditorMidias.tsx`
- Modify: `src/app/admin/(protegido)/acoes.ts`

**Interfaces:**
- Consumes: `listarPosts`, `criarPost`, `salvarEdicao`, `enviarParaAprovacao`, `detalhePost`, `gerarChave`, `urlUpload`, `urlLeitura`, `validarArquivo`.
- Produces (actions):
  - `acaoNovoPost(clienteId, form)` → cria e redireciona ao editor
  - `acaoPedirUpload(postId, { nome, tipoMime, tamanhoBytes }): Promise<{ chave: string; url: string }>` — valida com `validarArquivo` antes de assinar
  - `acaoSalvar(postId, campos: CamposPost, midias: MidiaEntrada[], enviar: boolean)` — salva; se `enviar`, chama `enviarParaAprovacao`; retorna `{ ok: true } | { erro: string }` com mensagem em português por `codigo`
- `EditorMidias` (client component): props `{ postId, iniciais: Array<MidiaEntrada & { urlPreview: string }>, onChange(m: MidiaEntrada[], pendentes: boolean) }`

- [ ] **Step 1: Página do cliente:** lista de posts (data formatada, formato, status com cor, ideia truncada), filtro por status via `?status=`, botão "Novo post" (pede formato e data).

- [ ] **Step 2: Editor:** campos + `EditorMidias`. Upload por `XMLHttpRequest` PUT com `Content-Type` igual ao tipo do arquivo, barra de progresso por arquivo, botão "tentar de novo" na falha, reordenar com botões ↑/↓ (sem biblioteca de drag), remover. Botões "Salvar rascunho" (só em `rascunho`), "Enviar para aprovação" (em `rascunho`) e "Salvar" (demais status), desabilitados enquanto `pendentes`. Em `ajuste`/`aprovado`, aviso: "Salvar cria a versão N+1 e envia de novo para o cliente."

- [ ] **Step 3: Configurar CORS no bucket de dev** e verificar manualmente: subir 1 vídeo de ~200 MB (progresso anda), carrossel de 3 imagens reordenado, tentar GIF → mensagem de tipo inválido, enviar sem mídia → mensagem "Adicione ao menos uma mídia".

- [ ] **Step 4: Commit** — `feat: editor de posts com upload ao R2`

---

### Task 8: Detalhe do post com histórico (admin)

**Files:**
- Create: `src/app/admin/(protegido)/posts/[id]/page.tsx`, `src/componentes/VisualizadorMidia.tsx`

**Interfaces:**
- Consumes: `detalhePost`, `urlLeitura`, `formatarData`, rótulos.
- Produces: `<VisualizadorMidia midias={Array<{ tipo: TipoMidia; url: string; urlDownload: string }>} />` — moldura de celular 9:16 (Stories/Reels/TikTok) ou 4:5 (Feed); vídeo com `controls playsInline preload="metadata"`; carrossel com `scroll-snap` horizontal e indicador "2/5"; abaixo de vídeo, link "Não carregou? Baixar o vídeo" (`urlDownload`). Reutilizado na Task 9.

- [ ] **Step 1: Implementar** página: cabeçalho (cliente, formato, data, status, botão "Editar"), versão atual com mídia e textos (`whitespace-pre-wrap`), e lista das versões anteriores recolhíveis, cada uma com a resposta (decisão, comentário, nome, data/hora em `America/Belem`).

- [ ] **Step 2: Verificar manualmente** com um post que tenha 2 versões (criar resposta direto no banco de dev ou aguardar Task 9).

- [ ] **Step 3: Commit** — `feat: detalhe e histórico do post`

---

### Task 9: Telas do cliente

**Files:**
- Create: `src/app/c/[token]/page.tsx`, `src/app/c/[token]/p/[id]/page.tsx`, `src/app/c/[token]/acoes.ts`, `src/app/c/[token]/not-found.tsx`, `src/componentes/FormResposta.tsx`

**Interfaces:**
- Consumes: `buscarClientePorToken`, `postsDoClienteParaVer`, `postParaCliente`, `responder`, `VisualizadorMidia`, `urlLeitura`.
- Produces:
  - `acaoResponder(token, postId, versaoNumero, decisao, comentario, nome): Promise<{ ok: true } | { erro: string }>` — revalida token; `versao_desatualizada` → "Este post foi atualizado. Recarregue a página para ver a versão nova."; `status_invalido` → "Este post já foi respondido."
  - `FormResposta` (client): botões **Aprovar** / **Pedir ajuste**; ajuste abre campo de comentário obrigatório; pede "Seu nome" se não houver em `localStorage['srv_nome']` (acesso em `try/catch`); desabilita os botões no primeiro clique até a resposta voltar.

- [ ] **Step 1: Implementar** as páginas. Token inválido/inativo → `notFound()` com página "Link indisponível. Fale com a agência." (sem citar cliente). Lista: "Aguardando sua aprovação" (cards com mídia em miniatura, formato, data) e "Já respondidos". Página do post: `VisualizadorMidia`, formato, data, ideia, objetivo, legenda; `FormResposta` só se `aguardando`; senão mostra a resposta dada. Layout mobile-first, largura máx. 480 px.

- [ ] **Step 2: Verificar manualmente no celular (rede local, `npm run dev -- -H 0.0.0.0`):** aprovar; pedir ajuste sem comentário (bloqueado); duplo toque rápido em Aprovar (uma resposta só); token alterado → "Link indisponível"; legenda com quebras e emojis idêntica; vídeo `.mov` do iPhone aberto no Android → se não tocar, link de download funciona.

- [ ] **Step 3: Commit** — `feat: telas de aprovação do cliente`

---

### Task 10: Implantação

**Files:**
- Create: `README.md` (passos de implantação e variáveis), `.env.example`

- [ ] **Step 1 (humano, guiado):** criar conta Cloudflare → R2 → bucket `srv-conteudo` (privado) → token de API "Object Read & Write" restrito ao bucket → CORS:
```json
[{ "AllowedOrigins": ["https://conteudo.gruposrv.com.br", "http://localhost:3000"],
   "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
```
- [ ] **Step 2:** criar projeto Vercel `grupo-srv-conteudo` (deploy via `npx vercel` a partir da pasta), adicionar Neon pelo Marketplace (preenche `DATABASE_URL`), rodar `npx drizzle-kit migrate` contra ele.
- [ ] **Step 3:** cadastrar as variáveis de ambiente (`ADMIN_SENHA` forte, `SESSAO_SEGREDO` com `openssl rand -base64 48`, R2, `NEXT_PUBLIC_URL_BASE=https://conteudo.gruposrv.com.br`).
- [ ] **Step 4:** adicionar domínio `conteudo.gruposrv.com.br` ao projeto e confirmar certificado.
- [ ] **Step 5: Roteiro manual da spec em produção:** criar cliente → post carrossel → enviar → abrir link no celular real → pedir ajuste → editar (versão 2) → aprovar → conferir histórico → gerar novo link e confirmar que o antigo dá "Link indisponível". Conferir `https://conteudo.gruposrv.com.br/robots.txt`.
- [ ] **Step 6: Commit** — `docs: guia de implantação`
