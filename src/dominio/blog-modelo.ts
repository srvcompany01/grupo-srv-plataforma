import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { CAMPOS_BRIEFING, lerMetadados, slugify, type Briefing, type Metadados } from './blog'

/**
 * Modelo de documento para criar um artigo do blog a partir de um arquivo (Word .docx, .md ou .txt): uma FICHA com
 * "Campo: valor" (os mesmos rótulos que a leitura de metadados entende) e, depois da linha ARTIGO, o texto em Markdown.
 * O modelo é gerado a partir dos campos do sistema, então nunca fica desatualizado.
 */

export const DELIMITADOR = '=== ARTIGO ==='
const DELIM = /^\s*(?:={3,}\s*ARTIGO\s*={3,}|-{3,}\s*ARTIGO\s*-{3,}|#{1,3}\s*ARTIGO\s*$)\s*$/im

type Linha = { tipo: 'titulo' | 'secao' | 'campo' | 'nota' | 'texto' | 'lista'; texto: string; dica?: string }

/** O modelo, linha a linha (vira .md ou .docx). */
export function linhasDoModelo(categorias: string[], autores: string[]): Linha[] {
  const briefing = (grupo: string) => CAMPOS_BRIEFING.filter((c) => c.grupo === grupo).map((c): Linha => ({ tipo: c.tipo === 'lista' ? 'lista' : 'campo', texto: c.rotulo, dica: c.opcoes ? `uma destas: ${c.opcoes.join(', ')}` : c.ajuda }))
  return [
    { tipo: 'titulo', texto: 'Ficha do artigo — Blog Grupo SRV' },
    { tipo: 'nota', texto: 'Preencha depois dos dois-pontos. Pode apagar as dicas entre colchetes e deixar em branco o que não tiver. Listas: um item por linha, começando com "- ". Não mude o texto antes dos dois-pontos.' },
    { tipo: 'secao', texto: 'Essencial' },
    { tipo: 'campo', texto: 'Título', dica: 'o H1 do artigo' },
    { tipo: 'campo', texto: 'Subtítulo' },
    { tipo: 'campo', texto: 'Tema' },
    { tipo: 'campo', texto: 'Para quem é', dica: 'público-alvo' },
    { tipo: 'campo', texto: 'Categoria', dica: `uma destas: ${categorias.join(', ')}` },
    { tipo: 'campo', texto: 'Autor', dica: autores.join(', ') },
    { tipo: 'campo', texto: 'Palavra-chave foco' },
    { tipo: 'campo', texto: 'Palavras-chave secundárias', dica: 'separe por vírgula' },
    { tipo: 'campo', texto: 'Tags', dica: '3 a 7, separe por vírgula' },
    { tipo: 'secao', texto: 'SEO' },
    { tipo: 'campo', texto: 'Título SEO', dica: '30 a 60 caracteres, com a palavra-chave' },
    { tipo: 'campo', texto: 'Meta description', dica: '120 a 160 caracteres' },
    { tipo: 'campo', texto: 'Slug', dica: 'ex.: trafego-pago-guia' },
    { tipo: 'campo', texto: 'Breadcrumb', dica: 'título curto' },
    { tipo: 'campo', texto: 'Entidades', dica: 'pessoas, marcas e conceitos citados, separe por vírgula' },
    { tipo: 'secao', texto: 'Briefing editorial' },
    ...briefing('Briefing'),
    { tipo: 'secao', texto: 'Estratégia de busca' },
    ...briefing('Busca'),
    { tipo: 'secao', texto: 'Chamada para ação' },
    { tipo: 'campo', texto: 'CTA principal', dica: 'ex.: Faça o pré-diagnóstico' },
    { tipo: 'campo', texto: 'Link do CTA', dica: 'ex.: /maquinadevendas' },
    { tipo: 'campo', texto: 'Contexto do CTA', dica: 'por que o CTA faz sentido depois deste artigo' },
    { tipo: 'campo', texto: 'Posição do CTA', dica: 'meio, final ou ambos' },
    { tipo: 'campo', texto: 'CTA secundário' },
    { tipo: 'campo', texto: 'Link do CTA secundário' },
    { tipo: 'secao', texto: 'Capa' },
    { tipo: 'campo', texto: 'Texto alternativo da capa' },
    { tipo: 'campo', texto: 'Legenda da capa' },
    { tipo: 'campo', texto: 'Crédito da imagem' },
    ...briefing('Capa'),
    { tipo: 'secao', texto: 'Redes sociais e newsletter' },
    { tipo: 'campo', texto: 'Título para redes' },
    { tipo: 'campo', texto: 'Descrição para redes' },
    ...briefing('Distribuição'),
    { tipo: 'secao', texto: 'Publicação' },
    { tipo: 'campo', texto: 'Aviso editorial', dica: 'ex.: produzido com apoio de IA e revisado por Fabrício Saraiva' },
    { tipo: 'campo', texto: 'Revisar em', dica: 'AAAA-MM-DD' },
    { tipo: 'texto', texto: DELIMITADOR },
    { tipo: 'nota', texto: 'Escreva o artigo abaixo. Comece pela resposta direta (40 a 80 palavras). Subtítulos com "## " (ou estilo Título 2 no Word) e "### " (Título 3). Não repita o título. Termine com "## Perguntas frequentes" e cada pergunta em "### ". Links: [texto](/maquinadevendas).' },
    { tipo: 'texto', texto: 'Resposta direta em 40 a 80 palavras…' },
    { tipo: 'texto', texto: '## Primeiro subtítulo' },
    { tipo: 'texto', texto: 'Texto…' },
    { tipo: 'texto', texto: '## Perguntas frequentes' },
    { tipo: 'texto', texto: '### Primeira pergunta?' },
    { tipo: 'texto', texto: 'Resposta curta.' },
  ]
}

/** Modelo em Markdown (.md / .txt). */
export function modeloMarkdown(categorias: string[], autores: string[]): string {
  return linhasDoModelo(categorias, autores)
    .map((l) => {
      if (l.tipo === 'titulo') return `# ${l.texto}\n`
      if (l.tipo === 'secao') return `\n## ${l.texto}\n`
      if (l.tipo === 'nota') return `> ${l.texto}\n`
      if (l.tipo === 'campo') return `${l.texto}: ${l.dica ? `[${l.dica}]` : ''}`
      if (l.tipo === 'lista') return `${l.texto}:\n- `
      return l.texto === DELIMITADOR ? `\n${l.texto}\n` : `${l.texto}\n`
    })
    .join('\n')
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Modelo em Word (.docx) feito à mão: só parágrafos, títulos e negrito (abre no Word e no Google Docs). */
export function modeloDocx(categorias: string[], autores: string[]): Uint8Array {
  const p = (texto: string, estilo?: string, negrito?: string) =>
    `<w:p>${estilo ? `<w:pPr><w:pStyle w:val="${estilo}"/></w:pPr>` : ''}${negrito ? `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xml(negrito)}</w:t></w:r>` : ''}<w:r><w:t xml:space="preserve">${xml(texto)}</w:t></w:r></w:p>`
  const corpo = linhasDoModelo(categorias, autores)
    .map((l) => {
      if (l.tipo === 'titulo') return p(l.texto, 'Heading1')
      if (l.tipo === 'secao') return p(l.texto, 'Heading2')
      if (l.tipo === 'nota') return p(l.texto, 'Nota')
      if (l.tipo === 'campo') return p(l.dica ? ` [${l.dica}]` : ' ', undefined, `${l.texto}:`)
      if (l.tipo === 'lista') return p('', undefined, `${l.texto}:`) + p('- ')
      return p(l.texto)
    })
    .join('')
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="D80D12"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Nota"><w:name w:val="Nota"/><w:rPr><w:i/><w:color w:val="656565"/></w:rPr></w:style></w:styles>`
  return zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/_rels/document.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
    'word/styles.xml': strToU8(estilos),
    'word/document.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo}<w:sectPr/></w:body></w:document>`),
  })
}

const desxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

/**
 * Word (.docx) → texto em Markdown: estilos de título viram "#", "##", "###"; itens de lista viram "- "; negrito vira
 * **…**; links viram [texto](url). Imagens e tabelas ficam de fora.
 */
export function docxParaTexto(bytes: Uint8Array): string {
  const arquivos = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' || f.name === 'word/_rels/document.xml.rels' })
  const doc = arquivos['word/document.xml']
  if (!doc) throw new Error('Arquivo Word inválido.')
  const rels = arquivos['word/_rels/document.xml.rels'] ? strFromU8(arquivos['word/_rels/document.xml.rels']) : ''
  const alvo = (id: string) => desxml(rels.match(new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`))?.[1] ?? rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${id}"`))?.[1] ?? '')
  const corpo = strFromU8(doc)
  const paragrafos = corpo.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []
  return paragrafos
    .map((par) => {
      const estilo = par.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? ''
      const nivel = /^(Heading|Titulo|Título|Ttulo)1$/i.test(estilo) || /^Title$/i.test(estilo) ? 1 : /^(Heading|Titulo|Título|Ttulo)2$/i.test(estilo) ? 2 : /^(Heading|Titulo|Título|Ttulo)3$/i.test(estilo) ? 3 : 0
      const lista = /<w:numPr>/.test(par) || /List/i.test(estilo)
      const partes = par.match(/<w:hyperlink[\s\S]*?<\/w:hyperlink>|<w:r[ >][\s\S]*?<\/w:r>/g) ?? []
      const texto = partes
        .map((pt) => {
          const t = (pt.match(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>/g) ?? []).map((x) => desxml(x.replace(/<[^>]+>/g, ''))).join('') + (/<w:(br|tab)\/>/.test(pt) ? ' ' : '')
          if (!t) return ''
          if (pt.startsWith('<w:hyperlink')) {
            const id = pt.match(/r:id="([^"]+)"/)?.[1]
            const url = id ? alvo(id) : ''
            return url ? `[${t}](${url})` : t
          }
          return /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(pt) && t.trim() ? `**${t.trim()}** ` : t
        })
        .join('')
        .replace(/\*\*\s*\*\*/g, '')
        .replace(/\s+$/g, '')
      if (!texto.trim()) return ''
      return nivel ? `${'#'.repeat(nivel)} ${texto.replace(/\*\*/g, '').trim()}` : lista && !texto.trimStart().startsWith('-') ? `- ${texto.trim()}` : texto
    })
    .join('\n')
}

/** Separa a ficha (metadados) do texto do artigo. Sem a linha ARTIGO, tenta achar onde o texto começa. */
export function separarArquivo(texto: string): { ficha: string; artigo: string } {
  const limpo = texto.replace(/\r\n?/g, '\n')
  const m = limpo.match(DELIM)
  if (m && m.index !== undefined) return { ficha: limpo.slice(0, m.index), artigo: limpo.slice(m.index + m[0].length) }
  // Sem delimitador: a ficha vai até o primeiro "## " que não seja seção conhecida da ficha.
  const linhas = limpo.split('\n')
  const secoesFicha = /^#{1,3}\s*(ficha|essencial|seo|briefing|estrat[eé]gia|chamada|cta|capa|redes|publica)/i
  const i = linhas.findIndex((l, n) => n > 0 && /^##\s/.test(l) && !secoesFicha.test(l))
  return i < 0 ? { ficha: limpo, artigo: '' } : { ficha: linhas.slice(0, i).join('\n'), artigo: linhas.slice(i).join('\n') }
}

/** Tira dicas que ficaram do modelo ("[…]") e notas ("> …") do texto do artigo. */
export function limparArtigo(artigo: string): string {
  return artigo
    .split('\n')
    .filter((l) => !/^>\s*Escreva o artigo abaixo/i.test(l.trim()) && !/^Escreva o artigo abaixo/i.test(l.trim()))
    .join('\n')
    .replace(/^\s*#\s+.+\n/, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Lê o arquivo preenchido: metadados, briefing, texto do artigo e o que não foi reconhecido. */
export function lerArquivoDeArtigo(texto: string): { dados: Metadados; briefing: Briefing; artigo: string; titulo: string | null; ignorados: string[] } {
  const { ficha, artigo } = separarArquivo(texto)
  // Dicas do modelo que ficaram sem preencher ("[…]") não contam como valor.
  const fichaLimpa = ficha.split('\n').map((l) => l.replace(/\[[^\]]*\]\s*$/, '').replace(/^\s*>.*$/, '')).join('\n')
  const { dados, briefing, ignorados } = lerMetadados(fichaLimpa)
  const corpo = limparArtigo(artigo)
  const h1 = artigo.replace(/\r/g, '').trim().match(/^#\s+(.+)/)?.[1]?.trim() ?? null
  return { dados, briefing, artigo: corpo, titulo: dados.titulo ?? h1, ignorados: ignorados.filter((i) => !/^ficha do artigo/i.test(i)) }
}

export const slugDoArquivo = (titulo: string) => slugify(titulo)

type Ref = { id: string; nome: string; slug?: string }

/** Campos do artigo a partir do arquivo lido (categoria e autor pelo nome). `avisos`: o que não deu para usar. */
export function camposDoArquivo(l: ReturnType<typeof lerArquivoDeArtigo>, categorias: Ref[], autores: Ref[]) {
  const d = l.dados
  const avisos = [...l.ignorados]
  const lista = (s?: string) => (s ?? '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean)
  const url = (s?: string) => (s && /^(\/|https:\/\/)/.test(s.trim()) ? s.trim() : '')
  const categoria = d.categoria ? categorias.find((c) => slugify(c.nome) === slugify(d.categoria!) || c.slug === slugify(d.categoria!) || slugify(c.nome).startsWith(slugify(d.categoria!))) : undefined
  if (d.categoria && !categoria) avisos.push(`Categoria "${d.categoria}" não existe (ficou a primeira)`)
  const autor = d.autor ? autores.find((a) => slugify(a.nome) === slugify(d.autor!)) : undefined
  if (d.autor && !autor) avisos.push(`Autor "${d.autor}" não está cadastrado (cadastre em Blog → Autores)`)
  const posicao = (['meio', 'final', 'ambos'] as const).find((p) => slugify(d.ctaPosicao ?? '').includes(p === 'final' ? 'fim' : p)) ?? (slugify(d.ctaPosicao ?? '').includes('final') ? 'final' : 'ambos')
  const titulo = (l.titulo ?? '').trim()
  return {
    avisos,
    campos: {
      titulo, slug: d.slug ?? '', seoTitulo: d.seoTitulo ?? '', resumo: d.resumo ?? '', palavraChave: d.palavraChave ?? '', publico: d.publico ?? '', tema: d.tema ?? '',
      palavrasSecundarias: lista(d.palavrasSecundarias), conteudo: l.artigo, capaChave: null, capaAlt: d.capaAlt ?? '', categoriaId: categoria?.id ?? categorias[0]?.id ?? null,
      autorId: autor?.id ?? autores[0]?.id ?? null, pilar: false, subtitulo: d.subtitulo ?? '', tags: lista(d.tags), breadcrumb: d.breadcrumb ?? '', canonical: url(d.canonical).startsWith('https://') ? url(d.canonical) : '',
      ogTitulo: d.ogTitulo ?? '', ogDescricao: d.ogDescricao ?? '', capaLegenda: d.capaLegenda ?? '', capaCredito: d.capaCredito ?? '',
      cta: { label: d.ctaLabel ?? '', url: url(d.ctaUrl), contexto: d.ctaContexto ?? '', label2: d.cta2Label ?? '', url2: url(d.cta2Url), posicao },
      entidades: lista(d.entidades), briefing: l.briefing, aviso: d.aviso ?? '', notaAtualizacao: d.notaAtualizacao ?? '', revisarEm: /^\d{4}-\d{2}-\d{2}$/.test(d.revisarEm ?? '') ? d.revisarEm! : null,
    },
  }
}
