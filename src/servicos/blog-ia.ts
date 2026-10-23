import 'server-only'
import { LANDING_PADRAO, slugify } from '@/dominio/blog'
import { configIA } from '@/ia/modelo'

export type Rascunho = { titulo: string; seoTitulo: string; resumo: string; slug: string; conteudo: string }

/**
 * Rascunho de artigo pela IA da plataforma (mesmo provedor do painel de IA), pensado para SEO: título com a
 * palavra-chave, descrição de 120–160 caracteres, introdução que responde direto, H2 em forma de pergunta,
 * 1.000–1.500 palavras, links para a landing e para outros artigos. A equipe sempre revisa antes de publicar.
 */
export async function gerarRascunho(p: { tema: string; palavraChave: string; categoria: string; publico: string; outros: { titulo: string; slug: string }[] }): Promise<Rascunho> {
  const config = configIA()
  if (!config) throw new Error('A IA da plataforma não está configurada (IA_API_KEY na Vercel).')
  const sistema = `Você é redator sênior de SEO da Grupo SRV, agência brasileira de marketing e vendas (tráfego pago, redes sociais, conteúdo, Google e presença local, máquina de vendas).
Escreva em português do Brasil, tom claro, prático e confiante, para donos e gestores de pequenas e médias empresas. Nada de promessas exageradas nem números inventados: quando citar dado, diga que é estimativa ou cite a fonte de forma genérica ("segundo o Google", "dados do Meta").
Responda SOMENTE com um JSON: {"titulo": "...", "seoTitulo": "...", "resumo": "...", "slug": "...", "conteudo": "..."}.
Regras:
- titulo: até 70 caracteres, com a palavra-chave no começo quando possível.
- seoTitulo: 30 a 60 caracteres, com a palavra-chave.
- resumo: meta description de 120 a 160 caracteres, com a palavra-chave e um benefício claro.
- slug: curto, minúsculo, com hífens, contendo a palavra-chave, sem acentos.
- conteudo: Markdown com 1.000 a 1.500 palavras. Comece com uma introdução de 2 a 3 frases que responde a pergunta principal de forma direta e já usa a palavra-chave. Depois 4 a 6 seções "## " (subtítulos, de preferência em forma de pergunta, pelo menos um com a palavra-chave), com "### " quando ajudar, listas e passos práticos. Termine com "## Perguntas frequentes" (3 perguntas em "### " com respostas curtas) e um parágrafo final com chamada para ação.
- Não use o título como "# " no conteúdo (o título já aparece na página). Não use HTML.
- Inclua 1 ou 2 links no texto para a página "${LANDING_PADRAO}" (ex.: [fale com um especialista da Grupo SRV](${LANDING_PADRAO})), de forma natural.
- Quando fizer sentido, inclua 1 a 2 links internos para estes artigos do blog: ${p.outros.length ? p.outros.map((o) => `[${o.titulo}](/blog/${o.slug})`).join('; ') : '(ainda não há outros artigos: não invente links internos)'}.`
  const pedido = `Tema: ${p.tema}\nPalavra-chave foco: ${p.palavraChave}\nCategoria: ${p.categoria}\nPúblico: ${p.publico || 'donos e gestores de pequenas e médias empresas'}`

  let ultimoErro = 'A IA não respondeu.'
  for (const modelo of config.modelos) {
    let r: Response
    try {
      r = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
        body: JSON.stringify({ model: modelo, temperature: 0.6, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sistema }, { role: 'user', content: pedido }], ...(config.desligarPensar ? { thinking: { type: 'disabled' } } : {}) }),
        signal: AbortSignal.timeout(120_000),
      })
    } catch {
      ultimoErro = 'A IA demorou demais para responder. Tente de novo.'
      continue
    }
    if (!r.ok) {
      console.error('Blog IA', modelo, r.status, (await r.text().catch(() => '')).slice(0, 800))
      ultimoErro = r.status === 429 ? 'Limite da IA atingido. Espere um pouco e tente de novo.' : `A IA respondeu com erro (${r.status}).`
      if (r.status === 401 || r.status === 403) break
      continue
    }
    const corpo = (await r.json()) as { choices?: { message?: { content?: string } }[] }
    const texto = corpo.choices?.[0]?.message?.content ?? ''
    const json = texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)
    try {
      const d = JSON.parse(json) as Partial<Rascunho>
      if (!d.conteudo || !d.titulo) throw new Error('incompleto')
      return {
        titulo: String(d.titulo).slice(0, 160),
        seoTitulo: String(d.seoTitulo ?? '').slice(0, 80),
        resumo: String(d.resumo ?? '').slice(0, 300),
        slug: slugify(String(d.slug || d.titulo)),
        conteudo: String(d.conteudo).replace(/^#\s+.+\n+/, ''),
      }
    } catch {
      ultimoErro = 'A IA devolveu um texto fora do formato. Tente de novo.'
    }
  }
  throw new Error(ultimoErro)
}
