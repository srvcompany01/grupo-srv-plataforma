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

1. **Cloudflare R2**
   - Crie a conta → R2 → bucket `srv-conteudo` (privado, sem domínio público).
   - Gere um token de API "Object Read & Write" restrito a esse bucket.
     Anote Account ID, Access Key ID e Secret Access Key.
   - Em Settings → CORS policy do bucket:
     ```json
     [{ "AllowedOrigins": ["https://conteudo.gruposrv.com.br", "http://localhost:3000"],
        "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
     ```
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
