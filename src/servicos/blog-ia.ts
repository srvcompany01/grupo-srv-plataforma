import 'server-only'
import { CAMPOS_BRIEFING, LANDING_PADRAO, limparBriefing, slugify, type Briefing } from '@/dominio/blog'
import { configIA } from '@/ia/modelo'
import type { ContextoMarca } from './blog'

export type Rascunho = {
  titulo: string; subtitulo: string; seoTitulo: string; resumo: string; slug: string; conteudo: string
  tags: string[]; palavrasSecundarias: string[]; entidades: string[]; ogTitulo: string; ogDescricao: string; capaAlt: string
  ctaLabel: string; ctaContexto: string; briefing: Briefing
}

const textoDoBriefing = (b: Briefing) =>
  CAMPOS_BRIEFING.filter((c) => b[c.chave]).map((c) => `- ${c.rotulo}: ${Array.isArray(b[c.chave]) ? (b[c.chave] as string[]).join('; ') : b[c.chave]}`).join('\n')

const textoDaMarca = (m: ContextoMarca) =>
  Object.entries(m).filter(([k, v]) => typeof v === 'string' && v && !['institutional_email', 'institutional_phone', 'same_as'].includes(k)).map(([k, v]) => `- ${k}: ${v}`).join('\n')

const lista = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : [])

/**
 * Rascunho de artigo pela IA da plataforma, seguindo o "modelo mestre" do Grupo SRV: contexto da marca, briefing,
 * resposta direta no início, H2 descritivos, limites e ressalvas, FAQ, CTA que nasce do assunto e todos os
 * metadados. Não inventa cases, números nem garantias. A equipe sempre revisa antes de publicar.
 */
export async function gerarRascunho(p: { tema: string; palavraChave: string; categoria: string; publico: string; secundarias: string[]; briefing: Briefing; marca: ContextoMarca; outros: { titulo: string; slug: string }[] }): Promise<Rascunho> {
  const config = configIA()
  if (!config) throw new Error('A IA da plataforma não está configurada (IA_API_KEY na Vercel).')
  const sistema = `Você é o estrategista editorial e redator sênior de SEO do Grupo SRV. Escreva em português do Brasil.

CONTEXTO DA MARCA (respeite integralmente):
${textoDaMarca(p.marca) || '- Grupo SRV, agência de marketing e vendas; produto principal: Máquina de Vendas.'}

REGRAS DE REDAÇÃO:
- Comece pela resposta: o primeiro parágrafo é uma resposta autocontida de 40 a 80 palavras para a pergunta principal, já com a palavra-chave.
- Parágrafos curtos; subtítulos "## " descritivos (de preferência perguntas), "### " quando ajudar; explique siglas na primeira vez.
- Relacione o assunto a vendas e receita; diferencie contato, lead e oportunidade quando fizer sentido.
- Traga a tese própria do Grupo SRV e, quando relevante, o mecanismo e as quatro engrenagens na ordem (Contínuo, Previsível, Controlável, Escalável).
- Inclua uma seção de limites/ressalvas (resultados dependem de oferta, investimento, mercado, atendimento e execução).
- Nunca invente cases, números, depoimentos ou garantias. Exemplo hipotético deve ser identificado como "exemplo ilustrativo". Fatos externos: cite a fonte de forma genérica e só se for conhecida.
- Proibido: ${String(p.marca.forbidden_claims || 'garantias, números sem prova, urgência falsa, cases fictícios')}.
- Termine com "## Perguntas frequentes" (3 a 5 perguntas reais em "### " com respostas curtas) e um parágrafo de conclusão com o próximo passo.
- Não use "# " (o título já é o H1 da página). Não use HTML.
- Use a palavra-chave e as secundárias com naturalidade, sem repetição mecânica.
- Inclua 1 ou 2 links para "${LANDING_PADRAO}" com âncoras descritivas (ex.: [faça o pré-diagnóstico da sua operação](${LANDING_PADRAO})).
- Links internos possíveis (use 1 a 2 se fizer sentido, nunca invente outros): ${p.outros.length ? p.outros.map((o) => `[${o.titulo}](/blog/${o.slug})`).join('; ') : 'nenhum ainda'}.
- CTAs permitidos: "Faça o pré-diagnóstico", "Descubra seu principal gargalo", "Avalie a estrutura da sua empresa", "Veja onde sua receita está vazando", "Entenda a Máquina de Vendas", "Solicite uma análise".

RESPONDA SOMENTE COM UM JSON:
{"titulo": "...", "subtitulo": "...", "seoTitulo": "30 a 60 caracteres com a palavra-chave", "resumo": "meta description de 120 a 160 caracteres", "slug": "...",
 "conteudo": "Markdown de 1.000 a 1.500 palavras", "tags": ["3 a 7"], "palavrasSecundarias": ["3 a 6"], "entidades": ["pessoas, marcas, conceitos e processos citados"],
 "ogTitulo": "...", "ogDescricao": "...", "capaAlt": "descrição da capa sugerida", "ctaLabel": "um dos CTAs permitidos", "ctaContexto": "1 frase: por que o CTA faz sentido depois deste artigo",
 "briefing": {"reader_question": "...", "direct_answer": "a resposta do 1º parágrafo", "search_intent": "Informacional|Diagnóstico|Comercial|Navegacional", "related_questions": ["..."],
   "unique_point_of_view": "...", "offer_connection": "...", "content_format": "...", "cover_concept": "metáfora visual (branco, preto e vermelho, grade técnica, estética operacional)",
   "cover_headline": "texto curto da capa", "cover_prompt": "prompt para gerar a capa, sem marcas de terceiros", "linkedin_post_copy": "...", "instagram_caption": "...", "newsletter_subject": "...", "newsletter_preview": "..."}}`
  const pedido = `Tema: ${p.tema}
Palavra-chave foco: ${p.palavraChave}
Palavras-chave secundárias: ${p.secundarias.join(', ') || '(sugira 3 a 6)'}
Categoria (pilar): ${p.categoria}
Para quem é: ${p.publico || 'donos e decisores de pequenas e médias empresas'}
${textoDoBriefing(p.briefing) ? `Briefing:\n${textoDoBriefing(p.briefing)}` : ''}`

  let ultimoErro = 'A IA não respondeu.'
  for (const modelo of config.modelos) {
    let r: Response
    try {
      r = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
        body: JSON.stringify({ model: modelo, temperature: 0.6, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sistema }, { role: 'user', content: pedido }], ...(config.desligarPensar ? { thinking: { type: 'disabled' } } : {}) }),
        signal: AbortSignal.timeout(150_000),
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
    try {
      const d = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as Record<string, unknown>
      if (!d.conteudo || !d.titulo) throw new Error('incompleto')
      const s = (k: string, max: number) => String(d[k] ?? '').trim().slice(0, max)
      return {
        titulo: s('titulo', 160), subtitulo: s('subtitulo', 200), seoTitulo: s('seoTitulo', 80), resumo: s('resumo', 300), slug: slugify(String(d.slug || d.titulo)),
        conteudo: String(d.conteudo).replace(/^#\s+.+\n+/, ''), tags: lista(d.tags, 7), palavrasSecundarias: lista(d.palavrasSecundarias, 15), entidades: lista(d.entidades, 20),
        ogTitulo: s('ogTitulo', 100), ogDescricao: s('ogDescricao', 300), capaAlt: s('capaAlt', 200), ctaLabel: s('ctaLabel', 80), ctaContexto: s('ctaContexto', 300),
        briefing: limparBriefing(d.briefing),
      }
    } catch {
      ultimoErro = 'A IA devolveu um texto fora do formato. Tente de novo.'
    }
  }
  throw new Error(ultimoErro)
}
