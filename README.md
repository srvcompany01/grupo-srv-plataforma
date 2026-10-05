# Aprovação de Conteúdo — Grupo SRV

Sistema em `conteudo.gruposrv.com.br`: a agência cadastra posts (ideia, objetivo,
legenda, data, formato e mídia) e cada cliente aprova ou pede ajuste por um link
secreto. Especificação em `docs/superpowers/specs/`.

## Rodar localmente (sem Neon nem R2)

```bash
npm install
cp .env.example .env.local   # descomente as duas linhas do modo local e defina ADMIN_SENHA/SESSAO_SEGREDO
npm run dev                  # http://localhost:3000/admin
```

O modo local guarda o banco e as mídias em `.dados/` e se recusa a rodar em produção.

## Comandos

```bash
npm test           # testes (domínio + serviços contra Postgres em memória)
npm run typecheck
npm run build
npx drizzle-kit generate --name <nome>   # nova migração após mudar src/db/schema.ts
DATABASE_URL=... npx drizzle-kit migrate # aplica migrações no Neon
```

## Implantação

1. **Cloudflare R2** — passo a passo abaixo, em [Etapa Cloudflare](#etapa-cloudflare-r2).
2. **Vercel**: crie o projeto `grupo-srv-conteudo` a partir desta pasta (`npx vercel`).
3. **Neon**: no projeto, Storage → Neon → criar banco. Isso preenche `DATABASE_URL`.
   Rode as migrações: `DATABASE_URL=<url> npx drizzle-kit migrate`.
4. **Variáveis de ambiente** (Production): `ADMIN_SENHA` (forte), `SESSAO_SEGREDO`
   (`openssl rand -base64 48`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=srv-conteudo`,
   `NEXT_PUBLIC_URL_BASE=https://conteudo.gruposrv.com.br`.
   **Nunca** defina `ARMAZENAMENTO_LOCAL` em produção.
5. **Domínio**: adicione `conteudo.gruposrv.com.br` ao projeto (o DNS já está na Vercel).
6. **Roteiro de aceite** em produção: criar cliente → post carrossel → enviar →
   abrir o link num celular real → pedir ajuste → editar (versão 2) → aprovar →
   conferir histórico → gerar novo link e confirmar que o antigo mostra
   "Link indisponível". Testar também um Reels com vídeo `.mov` gravado no iPhone
   aberto num Android. Conferir `/robots.txt`.

## Trocar a senha do painel

Altere `ADMIN_SENHA` na Vercel e reimplante. Para derrubar todas as sessões abertas,
troque também `SESSAO_SEGREDO`.

---

## Etapa Cloudflare (R2)

Onde ficam as fotos e os vídeos. Plano gratuito: 10 GB armazenados, download sempre grátis.
Os nomes dos menus podem variar um pouco; o caminho é este.

### ☐ 1. Criar a conta

- Acesse **https://dash.cloudflare.com/sign-up**, crie a conta e confirme o e-mail.
- Se pedir para adicionar um site/domínio, **pule** — não é necessário.

### ☐ 2. Ativar o R2

- Menu lateral → **R2 Object Storage**.
- Ele pede um **cartão de crédito** para ativar, mesmo no plano gratuito.
  Só há cobrança acima de 10 GB armazenados.

### ☐ 3. Criar o bucket

- **Create bucket**
  - Nome: `srv-conteudo`
  - Location: **Automatic**
  - Storage class: **Standard**
- **Create bucket**.
- ⚠️ **Não** ative "Public access" nem domínio público. O bucket fica privado.

### ☐ 4. Configurar o CORS

Permite que o navegador envie o arquivo direto para o R2.

- Dentro do bucket → **Settings** → **CORS Policy** → **Add CORS policy**.
- Apague o que estiver no campo, cole o texto abaixo e salve:

```json
[
  {
    "AllowedOrigins": ["https://conteudo.gruposrv.com.br", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

### ☐ 5. Gerar a chave de acesso

- Página inicial do R2 → **Manage API tokens** (ou "API" → "Manage R2 API Tokens").
- **Create API token**:
  - Permissions: **Object Read & Write**
  - Specify bucket: **Apply to specific buckets only** → `srv-conteudo`
  - TTL: **Forever**
- **Create**.
- A tela seguinte mostra **Access Key ID** e **Secret Access Key**.
  ⚠️ **Copie os dois agora** — o Secret aparece uma única vez.
- Anote também o **Account ID**. ⚠️ O painel tem vários códigos de 32 caracteres parecidos.
  O certo é o trecho antes de `.r2.cloudflarestorage.com` no campo **S3 API** do bucket
  (Settings), o mesmo que aparece em `dash.cloudflare.com/<ACCOUNT_ID>/r2/...`.
  Com o ID errado, a conexão falha com "SSL handshake failure".

### ☐ 6. Colocar as chaves no projeto

⚠️ Não cole o Secret em chat, e-mail ou WhatsApp.

Abra o arquivo **`.env.local`** (na raiz deste projeto — **não** este README) e:

1. **Apague** a linha `ARMAZENAMENTO_LOCAL=1`.
2. **Adicione** no final, trocando pelos seus valores:

```
R2_ACCOUNT_ID=seu-account-id
R2_ACCESS_KEY_ID=sua-access-key-id
R2_SECRET_ACCESS_KEY=seu-secret
R2_BUCKET=srv-conteudo
```

O banco continua local por enquanto (`DATABASE_URL=pglite:...`).

### ☐ 7. Testar

Avise o Claude que terminou: ele sobe o sistema localmente e faz um upload real de
foto e vídeo para o R2. Os mesmos quatro valores do passo 6 vão depois para as
variáveis de ambiente da Vercel.

---

## Etapa Vercel

Coloca o sistema no ar em `conteudo.gruposrv.com.br`. Os passos marcados **(Claude)**
o Claude executa pelo terminal; os marcados **(você)** precisam do seu clique ou de
um dado que só você deve digitar.

O servidor roda em **São Paulo** (`gru1`, fixado em `vercel.json`). O banco precisa
ficar na mesma região, senão cada página faz várias viagens até os EUA.

### ☐ 1. Entrar na Vercel pelo terminal — (Claude + você)

- O Claude roda `npx vercel login`.
- Abre uma página da Vercel no navegador: confirme com a conta
  **srvcompany.oficial@gmail.com** (a mesma do domínio `gruposrv.com.br`).

### ☐ 2. Criar o projeto e o primeiro deploy — (Claude)

- Projeto `grupo-srv-conteudo`, no time **srvcompanyoficial-4435's projects**.
- O primeiro deploy vai **falhar ao abrir** as páginas (ainda sem banco e sem
  variáveis). É esperado.

### ☐ 3. Criar o banco Neon — (você)

- Abra **https://vercel.com** → projeto **grupo-srv-conteudo** → aba **Storage**.
- **Create Database** → **Neon** (Serverless Postgres) → **Continue**.
- Região: **São Paulo (sa-east-1)**. Se não aparecer, escolha **Washington, D.C. (iad1)**
  e avise o Claude, que muda a região do servidor para combinar.
- Plano: **Free**. Nome do banco: `srv-conteudo`.
- Em "Environments", marque **Production**, **Preview** e **Development** → **Connect**.
- Isso cria a variável `DATABASE_URL` sozinho.

### ☐ 4. Criar as tabelas — (Claude)

- O Claude baixa a `DATABASE_URL` (`npx vercel env pull`) e roda as migrações.

### ☐ 5. Senha do painel — (você)

Só você deve conhecer essa senha, então digite-a direto na Vercel:

- Projeto → **Settings** → **Environment Variables** → **Add**.
  - Key: `ADMIN_SENHA`
  - Value: uma senha forte (12+ caracteres, misture letras, números e símbolos)
  - Environments: **Production** (e Preview, se quiser testar previews)
- **Save**.

### ☐ 6. Demais variáveis — (Claude)

O Claude cadastra, sem exibir os valores:

| Variável | Origem |
|---|---|
| `SESSAO_SEGREDO` | gerado na hora (`openssl rand -base64 48`) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | copiados do seu `.env.local` |
| `NEXT_PUBLIC_URL_BASE` | `https://conteudo.gruposrv.com.br` |

⚠️ Se você ainda vai **trocar a chave do R2** (recomendado), faça antes deste passo e
atualize o `.env.local`.

### ☐ 7. Domínio — (Claude)

- Adiciona `conteudo.gruposrv.com.br` ao projeto. O DNS já está na Vercel, então o
  certificado sai em poucos minutos.

### ☐ 8. Deploy de produção e teste — (Claude + você)

- O Claude faz o deploy e confere: login, `/robots.txt`, link inválido → "Link indisponível",
  e o teste de vazamento do painel sem login.
- **Você:** cadastre um cliente de teste, suba um post, abra o link **no seu celular**,
  peça ajuste, edite (versão 2) e aprove.

### ☐ 9. Limpeza — (Claude)

- `npx vercel logout` se você não quiser deixar o terminal conectado.
