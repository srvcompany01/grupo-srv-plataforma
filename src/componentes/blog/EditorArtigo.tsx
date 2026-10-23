'use client'

import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BadgeCheck, Bold, Trash2, CalendarClock, ClipboardPaste, Copy, ExternalLink, Heading2, Heading3, ImagePlus, Italic, Link as IconeLink, List, ListOrdered, Quote, Redo2, Save, Send, ShieldCheck, Sparkles, Undo2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { enviarImagemAcao, excluirPostAcao, gerarRascunhoAcao, publicacaoAcao, revisaoAcao, salvarPostAcao, validarAcao } from '@/app/(app)/editor-blog/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { ESTILO_TOM, SeloTom } from '@/componentes/insights/tom'
import { avisar } from '@/componentes/tarefas/avisar'
import { CAMPOS_BRIEFING, bloqueiosDePublicacao, checklistSeo, contarPalavras, lerMetadados, limparBriefing, slugify, type Briefing, type CampoBriefing } from '@/dominio/blog'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { Autor, Categoria, Desempenho, PostEquipe } from '@/servicos/blog'
import type { Verificacao } from '@/servicos/blog-validacao'

type Situacao = 'Rascunho' | 'Em revisão' | 'Agendado' | 'Publicado'
type Props = {
  post: PostEquipe | null
  categorias: Categoria[]
  autores: Autor[]
  iaPronta: boolean
  /** Calculada no servidor (agendado = publicado com data futura). */
  situacao: Situacao
  /** Outros artigos: relacionados e canibalização de palavra-chave. */
  outros: { id: string; titulo: string; palavraChave: string }[]
  desempenho: Desempenho | null
}

/** Envia uma imagem ao armazenamento e devolve a chave (blog/<id>.jpg). */
async function enviar(arquivo: File): Promise<string | null> {
  const preparo = await enviarImagemAcao(arquivo.type, arquivo.size)
  if ('erro' in preparo) {
    avisar(preparo)
    return null
  }
  const r = await fetch(preparo.url, { method: 'PUT', headers: { 'Content-Type': arquivo.type }, body: arquivo })
  if (!r.ok) {
    avisar({ erro: 'Falha ao enviar a imagem.' })
    return null
  }
  return preparo.chave
}

function BotaoBarra({ ativo, aoClicar, titulo, children }: { ativo?: boolean; aoClicar: () => void; titulo: string; children: React.ReactNode }) {
  return <button type="button" title={titulo} aria-label={titulo} onClick={aoClicar} className={`rounded p-1.5 ${ativo ? 'bg-petroleo-100 text-petroleo' : 'text-texto-2 hover:bg-hover'}`}>{children}</button>
}

function Barra({ editor, aoImagem }: { editor: Editor; aoImagem: () => void }) {
  const link = () => {
    const anterior = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Endereço do link (ex.: /blog/outro-artigo ou /maquinadevendas)', anterior ?? '')
    if (url === null) return
    if (!url) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-borda bg-white px-2 py-1">
      <BotaoBarra titulo="Subtítulo (H2)" ativo={editor.isActive('heading', { level: 2 })} aoClicar={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Subtítulo menor (H3)" ativo={editor.isActive('heading', { level: 3 })} aoClicar={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Negrito" ativo={editor.isActive('bold')} aoClicar={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Itálico" ativo={editor.isActive('italic')} aoClicar={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Lista" ativo={editor.isActive('bulletList')} aoClicar={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Lista numerada" ativo={editor.isActive('orderedList')} aoClicar={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Citação" ativo={editor.isActive('blockquote')} aoClicar={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Link" ativo={editor.isActive('link')} aoClicar={link}><IconeLink className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Imagem" aoClicar={aoImagem}><ImagePlus className="h-4 w-4" /></BotaoBarra>
      <span className="mx-1 h-5 w-px bg-borda" />
      <BotaoBarra titulo="Desfazer" aoClicar={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></BotaoBarra>
      <BotaoBarra titulo="Refazer" aoClicar={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></BotaoBarra>
    </div>
  )
}

const separar = (s: string) => s.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean)
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')

type Formulario = {
  titulo: string; subtitulo: string; slug: string; seoTitulo: string; resumo: string; palavraChave: string; secundarias: string; publico: string; tema: string; tags: string
  categoriaId: string | null; autorId: string | null; pilar: boolean; capaChave: string | null; capaAlt: string; capaLegenda: string; capaCredito: string
  breadcrumb: string; canonical: string; indexar: boolean; ogTitulo: string; ogDescricao: string; ctaLabel: string; ctaUrl: string; ctaContexto: string; cta2Label: string; cta2Url: string
  ctaPosicao: 'meio' | 'final' | 'ambos'; relacionadosIds: string[]; entidades: string; aviso: string; notaAtualizacao: string; revisarEm: string; briefing: Briefing
}

function inicial(post: PostEquipe | null, categorias: Categoria[], autores: Autor[]): Formulario {
  return {
    titulo: post?.titulo ?? '', subtitulo: post?.subtitulo ?? '', slug: post?.slug ?? '', seoTitulo: post?.seoTitulo ?? '', resumo: post?.resumo ?? '', palavraChave: post?.palavraChave ?? '',
    secundarias: (post?.palavrasSecundarias ?? []).join(', '), publico: post?.publico ?? '', tema: post?.tema ?? '', tags: (post?.tags ?? []).join(', '),
    categoriaId: post?.categoriaId ?? categorias[0]?.id ?? null, autorId: post?.autorId ?? autores[0]?.id ?? null, pilar: post?.pilar ?? false,
    capaChave: post?.capaChave ?? null, capaAlt: post?.capaAlt && post.capaAlt !== post.titulo ? post.capaAlt : '', capaLegenda: post?.capaLegenda ?? '', capaCredito: post?.capaCredito ?? '',
    breadcrumb: post?.breadcrumb ?? '', canonical: post?.canonical ?? '', indexar: post?.indexar ?? true, ogTitulo: post?.ogTitulo ?? '', ogDescricao: post?.ogDescricao ?? '',
    ctaLabel: post?.cta.label ?? '', ctaUrl: post?.cta.url ?? '', ctaContexto: post?.cta.contexto ?? '', cta2Label: post?.cta.label2 ?? '', cta2Url: post?.cta.url2 ?? '', ctaPosicao: post?.cta.posicao ?? 'ambos',
    relacionadosIds: post?.relacionadosIds ?? [], entidades: (post?.entidades ?? []).join(', '), aviso: post?.aviso ?? '', notaAtualizacao: post?.notaAtualizacao ?? '', revisarEm: post?.revisarEm ?? '',
    briefing: post?.briefing ?? {},
  }
}

function CampoDoBriefing({ c, valor, aoMudar }: { c: CampoBriefing; valor: string | string[] | undefined; aoMudar: (v: string | string[]) => void }) {
  const texto = Array.isArray(valor) ? valor.join('\n') : (valor ?? '')
  return (
    <label className="block space-y-1">
      <span className={rotulo}>{c.rotulo}</span>
      {c.tipo === 'opcao' ? (
        <select className={campo} value={texto} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">—</option>
          {c.opcoes!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : c.tipo === 'texto' ? (
        <input className={campo} value={texto} onChange={(e) => aoMudar(e.target.value)} maxLength={2000} />
      ) : (
        <textarea className={campo} rows={3} value={texto} onChange={(e) => aoMudar(c.tipo === 'lista' ? e.target.value.split('\n') : e.target.value)} placeholder={c.tipo === 'lista' ? 'Um item por linha' : undefined} />
      )}
      {c.ajuda && <span className="block text-legenda text-texto-3">{c.ajuda}</span>}
    </label>
  )
}

const ABAS = ['Publicar', 'SEO', 'Briefing', 'CTA e social', 'Capa'] as const

/**
 * Editor de artigo do blog no "modelo mestre": texto, briefing, SEO (checklist ao vivo, prévias), CTA e social, capa,
 * revisão humana, publicação, validação técnica e desempenho. A IA e o "colar metadados" preenchem os campos.
 */
export function EditorArtigo({ post, categorias, autores, iaPronta, situacao, outros, desempenho }: Props) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [id, setId] = useState(post?.id ?? null)
  const [f, setF] = useState<Formulario>(() => inicial(post, categorias, autores))
  const [slugManual, setSlugManual] = useState(!!post)
  const [conteudo, setConteudo] = useState(post?.conteudo ?? '')
  const [sujo, setSujo] = useState(false)
  const [agendar, setAgendar] = useState('')
  const [aba, setAba] = useState<(typeof ABAS)[number]>('Publicar')
  const [ia, setIa] = useState({ aberto: !post })
  const [colar, setColar] = useState({ aberto: false, metadados: '', artigo: '' })
  const [gerando, setGerando] = useState(false)
  const [validacao, setValidacao] = useState<Verificacao[] | null>(null)
  const entradaCapa = useRef<HTMLInputElement>(null)
  const entradaImagem = useRef<HTMLInputElement>(null)

  const muda = <K extends keyof Formulario>(k: K, v: Formulario[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    setSujo(true)
  }
  const mudaBriefing = (chave: string, v: string | string[]) => muda('briefing', { ...f.briefing, [chave]: v })

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image, Markdown, Placeholder.configure({ placeholder: 'Escreva o artigo aqui. Comece pela resposta direta (40 a 80 palavras), use subtítulos (H2), termine com "Perguntas frequentes".' })],
    content: post?.conteudo ?? '',
    contentType: 'markdown',
    immediatelyRender: false,
    editorProps: { attributes: { class: 'artigo-blog min-h-[60vh] px-6 py-5 outline-none' } },
    onUpdate: ({ editor: e }) => {
      setConteudo(e.getMarkdown())
      setSujo(true)
    },
  })

  const mudarTitulo = (v: string) => {
    setF((x) => ({ ...x, titulo: v, slug: slugManual ? x.slug : slugify(v) }))
    setSujo(true)
  }

  const campos = () => ({
    titulo: f.titulo, slug: f.slug || slugify(f.titulo), seoTitulo: f.seoTitulo, resumo: f.resumo, palavraChave: f.palavraChave, publico: f.publico, tema: f.tema,
    palavrasSecundarias: separar(f.secundarias), conteudo: editor?.getMarkdown() ?? conteudo, capaChave: f.capaChave, capaAlt: f.capaAlt, categoriaId: f.categoriaId, autorId: f.autorId, pilar: f.pilar,
    subtitulo: f.subtitulo, tags: separar(f.tags), breadcrumb: f.breadcrumb, canonical: f.canonical, indexar: f.indexar, ogTitulo: f.ogTitulo, ogDescricao: f.ogDescricao,
    capaLegenda: f.capaLegenda, capaCredito: f.capaCredito, cta: { label: f.ctaLabel, url: f.ctaUrl, contexto: f.ctaContexto, label2: f.cta2Label, url2: f.cta2Url, posicao: f.ctaPosicao },
    relacionadosIds: f.relacionadosIds, entidades: separar(f.entidades), briefing: limparBriefing(f.briefing), aviso: f.aviso, notaAtualizacao: f.notaAtualizacao, revisarEm: f.revisarEm || null,
  })
  const salvar = async (): Promise<string | null> => {
    const r = await salvarPostAcao(id, campos())
    if ('erro' in r) {
      avisar(r)
      return null
    }
    setSujo(false)
    if (!id) {
      setId(r.id)
      router.replace(`/editor-blog/${r.id}`)
    }
    return r.id
  }
  const salvarClicando = () => iniciar(async () => { if (await salvar()) avisar({ ok: 'Salvo.' }, true) })
  const publicar = (quando: string | 'revisao' | null) =>
    iniciar(async () => {
      const salvo = await salvar()
      if (!salvo) return
      if (avisar(await publicacaoAcao(salvo, quando), true)) router.refresh()
    })
  const revisar = (aprovado: boolean) =>
    iniciar(async () => {
      const salvo = await salvar()
      if (!salvo) return
      if (avisar(await revisaoAcao(salvo, aprovado), true)) router.refresh()
    })
  const excluir = async () => {
    if (!id) return
    if (!(await confirmar({ titulo: 'Excluir este artigo?', descricao: 'Ele some da plataforma de vez, com as métricas de leitura. Não dá para desfazer.', confirmar: 'Excluir artigo', perigo: true }))) return
    iniciar(async () => {
      if (!avisar(await excluirPostAcao(id), true)) return
      setSujo(false)
      router.push('/editor-blog')
    })
  }
  const validar = () =>
    iniciar(async () => {
      if (!id) return
      const r = await validarAcao(id)
      if ('erro' in r) return void avisar(r)
      setValidacao(r)
    })

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        salvarClicando()
      }
    }
    const sair = (e: BeforeUnloadEvent) => {
      if (sujo) e.preventDefault()
    }
    window.addEventListener('keydown', atalho)
    window.addEventListener('beforeunload', sair)
    return () => {
      window.removeEventListener('keydown', atalho)
      window.removeEventListener('beforeunload', sair)
    }
  })

  const trocarCapa = async (arq: File | undefined) => {
    if (!arq) return
    const chave = await enviar(arq)
    if (chave) muda('capaChave', chave)
  }
  const inserirImagem = async (arq: File | undefined) => {
    if (!arq || !editor) return
    const chave = await enviar(arq)
    const alt = chave ? window.prompt('Descreva a imagem (texto alternativo, ajuda no Google):', '') ?? '' : ''
    if (chave) editor.chain().focus().setImage({ src: `/blog/imagem/${chave}`, alt }).run()
  }

  const gerar = async () => {
    if (!f.tema.trim() || !f.palavraChave.trim()) return void avisar({ erro: 'Informe o tema e a palavra-chave foco.' })
    if (contarPalavras(conteudo) > 30 && !(await confirmar({ titulo: 'Substituir o texto atual?', descricao: 'A IA vai escrever um rascunho novo no lugar do texto e dos metadados.', confirmar: 'Gerar e substituir', perigo: true }))) return
    setGerando(true)
    const r = await gerarRascunhoAcao({ tema: f.tema, palavraChave: f.palavraChave, categoriaId: f.categoriaId, publico: f.publico, secundarias: separar(f.secundarias), briefing: limparBriefing(f.briefing) })
    setGerando(false)
    if ('erro' in r) return void avisar(r)
    setF((x) => ({
      ...x, titulo: r.titulo, subtitulo: r.subtitulo || x.subtitulo, seoTitulo: r.seoTitulo, resumo: r.resumo, slug: slugManual ? x.slug : r.slug,
      tags: r.tags.length ? r.tags.join(', ') : x.tags, secundarias: x.secundarias || r.palavrasSecundarias.join(', '), entidades: r.entidades.length ? r.entidades.join(', ') : x.entidades,
      ogTitulo: r.ogTitulo || x.ogTitulo, ogDescricao: r.ogDescricao || x.ogDescricao, capaAlt: x.capaAlt || r.capaAlt, ctaLabel: r.ctaLabel || x.ctaLabel, ctaContexto: r.ctaContexto || x.ctaContexto,
      briefing: { ...r.briefing, ...limparBriefing(x.briefing) },
    }))
    editor?.commands.setContent(r.conteudo, { contentType: 'markdown' })
    setConteudo(r.conteudo)
    setSujo(true)
    setIa({ aberto: false })
    avisar({ ok: 'Rascunho gerado com os metadados. Revise, acrescente a experiência real e salve.' }, true)
  }

  /** Preenche os campos com o que outra IA entregou (texto, YAML do modelo ou JSON) e, se veio, o artigo. */
  const aplicarColados = async () => {
    const { dados, briefing, ignorados } = lerMetadados(colar.metadados)
    let artigo = colar.artigo.trim()
    // O título costuma vir como "# Título" na primeira linha: vira o título do artigo, não um subtítulo.
    const h1 = artigo.match(/^#\s+(.+)\n+/)
    if (h1) artigo = artigo.slice(h1[0].length)
    if (artigo && contarPalavras(conteudo) > 30 && !(await confirmar({ titulo: 'Substituir o texto atual?', descricao: 'O artigo colado entra no lugar do texto que está no editor.', confirmar: 'Substituir', perigo: true }))) return
    const novo: Partial<Formulario> = {}
    const preenchidos: string[] = []
    const por = (k: keyof Formulario, v: string | undefined, nome: string, max = 300) => {
      if (!v) return
      ;(novo as Record<string, unknown>)[k] = v.slice(0, max)
      preenchidos.push(nome)
    }
    const titulo = dados.titulo ?? h1?.[1].trim()
    por('titulo', titulo, 'título', 160)
    por('subtitulo', dados.subtitulo, 'subtítulo', 200)
    por('seoTitulo', dados.seoTitulo, 'título para o Google', 80)
    por('resumo', dados.resumo, 'descrição')
    por('palavraChave', dados.palavraChave, 'palavra-chave', 80)
    por('secundarias', dados.palavrasSecundarias, 'palavras-chave secundárias', 2000)
    por('tema', dados.tema, 'tema')
    por('publico', dados.publico, 'para quem é', 200)
    por('tags', dados.tags, 'tags', 500)
    por('entidades', dados.entidades, 'entidades', 2000)
    por('capaAlt', dados.capaAlt, 'alt da capa', 200)
    por('capaLegenda', dados.capaLegenda, 'legenda da capa', 200)
    por('capaCredito', dados.capaCredito, 'crédito da capa', 120)
    por('breadcrumb', dados.breadcrumb, 'breadcrumb', 60)
    por('ogTitulo', dados.ogTitulo, 'título para redes', 100)
    por('ogDescricao', dados.ogDescricao, 'descrição para redes')
    por('ctaLabel', dados.ctaLabel, 'CTA', 80)
    por('ctaContexto', dados.ctaContexto, 'contexto do CTA')
    por('cta2Label', dados.cta2Label, 'CTA secundário', 80)
    por('aviso', dados.aviso, 'aviso editorial')
    if (dados.ctaUrl && /^(\/|https:\/\/)/.test(dados.ctaUrl)) por('ctaUrl', dados.ctaUrl, 'link do CTA')
    if (dados.cta2Url && /^(\/|https:\/\/)/.test(dados.cta2Url)) por('cta2Url', dados.cta2Url, 'link do CTA secundário')
    if (dados.canonical && /^https:\/\//.test(dados.canonical)) por('canonical', dados.canonical, 'canonical')
    if (dados.slug) {
      novo.slug = dados.slug
      setSlugManual(true)
      preenchidos.push('slug')
    } else if (titulo && !slugManual) novo.slug = slugify(titulo)
    if (dados.categoria) {
      const alvo = slugify(dados.categoria)
      const c = categorias.find((x) => slugify(x.nome) === alvo || x.slug === alvo || slugify(x.nome).startsWith(alvo) || alvo.startsWith(x.slug))
      if (c) por('categoriaId', c.id, 'categoria')
      else ignorados.push(`Categoria "${dados.categoria}" (não existe aqui)`)
    }
    if (dados.autor) {
      const a = autores.find((x) => slugify(x.nome) === slugify(dados.autor!))
      if (a) por('autorId', a.id, 'autor')
      else ignorados.push(`Autor "${dados.autor}" (cadastre em Autores)`)
    }
    if (Object.keys(briefing).length) {
      novo.briefing = { ...f.briefing, ...briefing }
      preenchidos.push(`briefing (${Object.keys(briefing).length} campos)`)
    }
    if (artigo) {
      editor?.commands.setContent(artigo, { contentType: 'markdown' })
      setConteudo(artigo)
      preenchidos.push('texto do artigo')
    }
    if (!preenchidos.length) return void avisar({ erro: 'Não reconheci nenhum metadado. Use linhas como "Meta description: …", o YAML do modelo ou um JSON.' })
    setF((x) => ({ ...x, ...novo }))
    setSujo(true)
    setColar({ aberto: false, metadados: '', artigo: '' })
    avisar({ ok: `Preenchido: ${preenchidos.join(', ')}.${ignorados.length ? ` Não usado: ${ignorados.slice(0, 12).join(', ')}${ignorados.length > 12 ? '…' : ''}.` : ''} Confira e salve.` }, true)
  }

  const listaSecundarias = separar(f.secundarias)
  const listaTags = separar(f.tags)
  const seo = checklistSeo({
    titulo: f.titulo, seoTitulo: f.seoTitulo, resumo: f.resumo, palavraChave: f.palavraChave, palavrasSecundarias: listaSecundarias, publico: f.publico, conteudo, capa: !!f.capaChave, capaAlt: f.capaAlt,
    slug: f.slug || slugify(f.titulo), tags: listaTags, ctaLabel: f.ctaLabel, ctaUrl: f.ctaUrl, revisado: !!post?.revisadoEm,
    outrasPalavrasChave: outros.filter((o) => o.id !== id).map((o) => o.palavraChave), textosExtras: [f.subtitulo, f.ogTitulo, f.ogDescricao, f.ctaContexto, f.aviso],
  })
  const bloqueios = bloqueiosDePublicacao(seo)
  const tomNota = seo.nota >= 80 ? 'bom' : seo.nota >= 50 ? 'atencao' : 'ruim'
  const conflito = f.palavraChave.trim() ? outros.find((o) => o.id !== id && o.palavraChave.trim().toLowerCase() === f.palavraChave.trim().toLowerCase()) : undefined
  const copiar = (t: string) => void navigator.clipboard.writeText(t).then(() => avisar({ ok: 'Copiado.' }, true))

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-3">
        {ia.aberto && (
          <section className="space-y-3 rounded-xl border border-[#6250d6]/30 bg-[#6250d6]/5 p-4">
            <h2 className="flex items-center gap-2 text-corpo font-semibold text-texto"><Sparkles className="h-4 w-4 text-[#6250d6]" /> Escrever com IA</h2>
            {!iaPronta && <p className="text-rotulo text-aviso-forte">A IA da plataforma não está configurada (IA_API_KEY na Vercel).</p>}
            <p className="text-legenda text-texto-3">A IA usa o contexto da marca, o tema, a palavra-chave, o público e tudo o que estiver na aba <strong>Briefing</strong>. Quanto mais completo o briefing (problema, tese, exemplos reais), melhor o texto.</p>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2"><span className={rotulo}>Tema do artigo</span><input className={campo} value={f.tema} onChange={(e) => muda('tema', e.target.value)} placeholder="Ex.: por que os leads somem depois do primeiro contato" maxLength={300} /></label>
              <label className="space-y-1"><span className={rotulo}>Palavra-chave foco</span><input className={campo} value={f.palavraChave} onChange={(e) => muda('palavraChave', e.target.value)} maxLength={80} /></label>
              <label className="space-y-1"><span className={rotulo}>Para quem é o artigo</span><input className={campo} value={f.publico} onChange={(e) => muda('publico', e.target.value)} maxLength={200} /></label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={gerar} disabled={gerando || !iaPronta} className={botaoPrimario}><Sparkles className="h-3.5 w-3.5" /> {gerando ? 'Escrevendo… (até 2 minutos)' : 'Gerar rascunho'}</button>
              <button type="button" onClick={() => setIa({ aberto: false })} className={botaoFantasma}>Fechar</button>
            </div>
          </section>
        )}

        {colar.aberto && (
          <section className="space-y-3 rounded-xl border border-[#2a78d6]/30 bg-[#2a78d6]/5 p-4">
            <h2 className="flex items-center gap-2 text-corpo font-semibold text-texto"><ClipboardPaste className="h-4 w-4 text-[#2a78d6]" /> Colar artigo e metadados</h2>
            <p className="text-legenda text-texto-3">Cole o que outra IA entregou: linhas (<code>Meta title: …</code>, <code>Público-alvo: …</code>), o <strong>YAML do modelo mestre</strong> (briefing, search_strategy, editorial, cms, seo, cover, social) ou JSON. Briefing, SEO, CTA, capa e social são preenchidos de uma vez.</p>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1"><span className={rotulo}>Metadados</span><textarea className={`${campo} font-mono text-legenda`} rows={12} value={colar.metadados} onChange={(e) => setColar({ ...colar, metadados: e.target.value })} placeholder={'seo:\n  seo_title: …\n  meta_description: …\nbriefing:\n  target_audience: …'} /></label>
              <label className="space-y-1"><span className={rotulo}>Texto do artigo em Markdown (opcional)</span><textarea className={`${campo} font-mono text-legenda`} rows={12} value={colar.artigo} onChange={(e) => setColar({ ...colar, artigo: e.target.value })} placeholder={'# Título\n\nResposta direta…\n\n## Primeiro subtítulo\n…'} /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void aplicarColados()} disabled={!colar.metadados.trim() && !colar.artigo.trim()} className={botaoPrimario}><ClipboardPaste className="h-3.5 w-3.5" /> Preencher os campos</button>
              <button type="button" onClick={() => setColar({ ...colar, aberto: false })} className={botaoFantasma}>Fechar</button>
            </div>
          </section>
        )}

        <input value={f.titulo} onChange={(e) => mudarTitulo(e.target.value)} placeholder="Título do artigo (H1)" maxLength={160} className="w-full bg-transparent text-2xl font-bold text-texto outline-none placeholder:text-texto-3" />
        <input value={f.subtitulo} onChange={(e) => muda('subtitulo', e.target.value)} placeholder="Subtítulo (opcional, aparece abaixo do título)" maxLength={200} className="w-full bg-transparent text-corpo text-texto-2 outline-none placeholder:text-texto-3" />
        <div className="flex flex-wrap items-center gap-2 text-legenda text-texto-3">
          <span>www.gruposrv.com.br/blog/</span>
          <input value={f.slug} onChange={(e) => { muda('slug', slugify(e.target.value)); setSlugManual(true) }} className="min-w-48 flex-1 rounded border border-borda bg-white px-2 py-1 font-mono text-legenda text-texto" />
          {!ia.aberto && <button type="button" onClick={() => setIa({ aberto: true })} className="inline-flex items-center gap-1 font-semibold text-[#6250d6] hover:underline"><Sparkles className="h-3 w-3" /> Escrever com IA</button>}
          {!colar.aberto && <button type="button" onClick={() => setColar({ ...colar, aberto: true })} className="inline-flex items-center gap-1 font-semibold text-[#2a78d6] hover:underline"><ClipboardPaste className="h-3 w-3" /> Colar metadados</button>}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-borda bg-white px-3 py-2">
          <span className="w-40 shrink-0 text-rotulo font-semibold text-texto">Tema</span>
          <input value={f.tema} onChange={(e) => muda('tema', e.target.value)} maxLength={300} placeholder="Ex.: quanto investir em tráfego pago no primeiro mês" className="min-w-0 flex-1 bg-transparent text-rotulo text-texto outline-none placeholder:text-texto-3" />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-borda bg-white px-3 py-2">
          <span className="w-40 shrink-0 text-rotulo font-semibold text-texto">Para quem é este artigo</span>
          <input value={f.publico} onChange={(e) => muda('publico', e.target.value)} maxLength={200} placeholder="Ex.: donos de clínicas e lojas que querem mais clientes pelo Instagram" className="min-w-0 flex-1 bg-transparent text-rotulo text-texto outline-none placeholder:text-texto-3" />
        </label>

        <div className="overflow-hidden rounded-xl border border-borda bg-white">
          {editor && <Barra editor={editor} aoImagem={() => entradaImagem.current?.click()} />}
          <EditorContent editor={editor} />
          <p className="border-t border-borda px-4 py-2 text-legenda text-texto-3">{contarPalavras(conteudo)} palavras · {Math.max(1, Math.round(contarPalavras(conteudo) / 200))} min de leitura</p>
        </div>
        <input ref={entradaImagem} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void inserirImagem(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-borda bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SeloTom tom={situacao === 'Publicado' ? 'bom' : situacao === 'Rascunho' ? 'neutro' : 'atencao'} rotulo={situacao} />
            <SeloTom tom={tomNota} rotulo={`Qualidade ${seo.nota}`} />
          </div>
          <button type="button" onClick={salvarClicando} disabled={pendente} className={botaoSecundario}><Save className="h-3.5 w-3.5" /> Salvar{sujo ? ' *' : ''}</button>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-lg bg-fundo p-1">
          {ABAS.map((a) => <button key={a} type="button" onClick={() => setAba(a)} className={`rounded-md px-2.5 py-1 text-legenda font-semibold ${aba === a ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}>{a}</button>)}
        </nav>

        {aba === 'Publicar' && (
          <div className="space-y-3">
            <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
              <h2 className="flex items-center gap-1.5 text-corpo font-semibold"><ShieldCheck className="h-4 w-4 text-sucesso" /> Revisão humana</h2>
              {post?.revisadoEm ? (
                <p className="text-rotulo text-sucesso-forte">Aprovado por {post.revisadoPor ?? 'alguém da equipe'} em {new Date(post.revisadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.</p>
              ) : (
                <p className="text-rotulo text-texto-2">Obrigatória para publicar: confira fatos, números, exemplos, links e o tom antes de aprovar.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {situacao === 'Rascunho' && <button type="button" onClick={() => publicar('revisao')} disabled={pendente} className={botaoSecundario}>Enviar para revisão</button>}
                {post?.revisadoEm ? <button type="button" onClick={() => revisar(false)} disabled={pendente} className={botaoFantasma}>Desfazer aprovação</button> : <button type="button" onClick={() => revisar(true)} disabled={pendente} className={botaoPrimario}><BadgeCheck className="h-3.5 w-3.5" /> Aprovar revisão</button>}
              </div>
            </section>

            <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
              <h2 className="text-corpo font-semibold">Publicação</h2>
              {post?.publicadoEmBruto && (situacao === 'Publicado' || situacao === 'Agendado') && <p className="text-legenda text-texto-3">{situacao === 'Agendado' ? 'Vai ao ar em' : 'No ar desde'} {new Date(post.publicadoEmBruto).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>}
              {bloqueios.length > 0 && situacao !== 'Publicado' && (
                <ul className={`space-y-1 rounded-lg border px-3 py-2 text-legenda ${ESTILO_TOM.ruim.fundo} ${ESTILO_TOM.ruim.borda} ${ESTILO_TOM.ruim.texto}`}>
                  <li className="font-semibold">Falta para publicar:</li>
                  {bloqueios.map((b) => <li key={b}>• {b}</li>)}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                {situacao === 'Publicado' || situacao === 'Agendado' ? (
                  <button type="button" onClick={() => publicar(null)} disabled={pendente} className={botaoFantasma}>Tirar do ar</button>
                ) : (
                  <button type="button" onClick={() => publicar(new Date().toISOString())} disabled={pendente || bloqueios.length > 0} className={botaoPrimario}><Send className="h-3.5 w-3.5" /> Publicar agora</button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="datetime-local" value={agendar} onChange={(e) => setAgendar(e.target.value)} className={`${campo} h-9 flex-1`} aria-label="Data e hora para publicar" />
                <button type="button" disabled={!agendar || pendente || bloqueios.length > 0} onClick={() => publicar(new Date(agendar).toISOString())} className={botaoSecundario}><CalendarClock className="h-3.5 w-3.5" /> Agendar</button>
              </div>
              {post && situacao === 'Publicado' && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex items-center gap-1 text-legenda font-semibold text-petroleo hover:underline">Ver no blog <ExternalLink className="h-3 w-3" /></Link>
                  <button type="button" onClick={validar} disabled={pendente} className="text-legenda font-semibold text-petroleo hover:underline">Validar publicação</button>
                </div>
              )}
              {validacao && (
                <ul className="space-y-1">
                  {validacao.map((v) => (
                    <li key={v.item} className="flex gap-1.5 text-legenda">
                      <span className={v.situacao === 'aprovado' ? 'text-sucesso' : 'text-perigo'}>{v.situacao === 'aprovado' ? '✓' : '✗'}</span>
                      <span className="text-texto">{v.item}{v.detalhe && <span className="block text-texto-3">{v.detalhe}</span>}</span>
                    </li>
                  ))}
                </ul>
              )}
              <label className="block space-y-1"><span className={rotulo}>Motivo da última atualização (aparece no artigo)</span><input className={campo} value={f.notaAtualizacao} onChange={(e) => muda('notaAtualizacao', e.target.value)} maxLength={300} placeholder="Ex.: dados de custo por lead atualizados para 2026" /></label>
              <label className="block space-y-1"><span className={rotulo}>Revisar o conteúdo de novo em</span><input type="date" className={campo} value={f.revisarEm} onChange={(e) => muda('revisarEm', e.target.value)} /></label>
              <label className="block space-y-1"><span className={rotulo}>Aviso editorial (opcional, aparece no fim)</span><input className={campo} value={f.aviso} onChange={(e) => muda('aviso', e.target.value)} maxLength={300} placeholder="Ex.: produzido com apoio de IA e revisado por Fabrício Saraiva" /></label>
            </section>

            {id && (
              <section className="space-y-2 rounded-xl border border-perigo-borda bg-perigo-fundo/20 p-4">
                <h2 className="text-corpo font-semibold text-perigo-forte">Excluir artigo</h2>
                <p className="text-legenda text-texto-2">{situacao === 'Publicado' || situacao === 'Agendado' ? 'Tire do ar antes de excluir: assim ninguém cai num link quebrado vindo do Google.' : 'Apaga o artigo de vez, com as métricas de leitura.'}</p>
                <button type="button" onClick={() => void excluir()} disabled={pendente || situacao === 'Publicado' || situacao === 'Agendado'} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-perigo px-3 text-rotulo font-semibold text-white hover:bg-perigo-forte disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Excluir artigo</button>
              </section>
            )}

            {desempenho && (
              <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
                <h2 className="text-corpo font-semibold">Desempenho (90 dias)</h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Visitas', String(desempenho.visitas)], ['Leram metade', pct(desempenho.rolagem['50'], desempenho.visitas)], ['Leram 90%', pct(desempenho.rolagem['90'], desempenho.visitas)], ['Leitura engajada', pct(desempenho.leituraEngajada, desempenho.visitas)], ['Cliques no CTA', String(desempenho.cliquesCta + desempenho.cliquesCta2)], ['Taxa do CTA', pct(desempenho.cliquesCta + desempenho.cliquesCta2, desempenho.visitas)]].map(([r, v]) => (
                    <div key={r} className="rounded-lg bg-fundo p-2"><p className="text-micro text-texto-3">{r}</p><p className="text-corpo font-bold tabular-nums">{v}</p></div>
                  ))}
                </div>
                {Object.keys(desempenho.origens).length > 0 && <p className="text-legenda text-texto-2">Origem: {Object.entries(desempenho.origens).sort((a, b) => b[1] - a[1]).map(([o, n]) => `${o} ${n}`).join(' · ')}</p>}
              </section>
            )}
          </div>
        )}

        {aba === 'SEO' && (
          <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
            <div className="h-2 overflow-hidden rounded-full bg-fundo"><div className={`h-full ${tomNota === 'bom' ? 'bg-sucesso' : tomNota === 'atencao' ? 'bg-aviso' : 'bg-perigo'}`} style={{ width: `${seo.nota}%` }} /></div>
            <label className="block space-y-1"><span className={rotulo}>Palavra-chave foco</span><input className={campo} value={f.palavraChave} onChange={(e) => muda('palavraChave', e.target.value)} maxLength={80} placeholder="O que a pessoa digita no Google" /></label>
            {conflito && <p className={`rounded-lg border px-2 py-1 text-legenda ${ESTILO_TOM.atencao.fundo} ${ESTILO_TOM.atencao.borda} ${ESTILO_TOM.atencao.texto}`}>“{conflito.titulo}” já mira esta palavra-chave: escolha outra variação ou ligue os dois artigos.</p>}
            <label className="block space-y-1"><span className={rotulo}>Palavras-chave secundárias ({listaSecundarias.length}/15)</span><textarea className={campo} rows={2} value={f.secundarias} onChange={(e) => muda('secundarias', e.target.value)} placeholder="Separe por vírgula" /></label>
            <label className="block space-y-1"><span className={rotulo}>Título para o Google ({(f.seoTitulo || f.titulo).length}/60)</span><input className={campo} value={f.seoTitulo} onChange={(e) => muda('seoTitulo', e.target.value)} maxLength={80} placeholder={f.titulo || 'Se vazio, usa o título do artigo'} /></label>
            <label className="block space-y-1"><span className={rotulo}>Descrição / resumo ({f.resumo.length}/160)</span><textarea className={campo} rows={3} value={f.resumo} onChange={(e) => muda('resumo', e.target.value)} maxLength={300} /></label>
            <div className="rounded-lg border border-borda bg-fundo/40 p-3">
              <p className="text-micro text-texto-3">Prévia no Google</p>
              <p className="truncate text-legenda text-[#202124]">www.gruposrv.com.br › blog › {f.slug || slugify(f.titulo)}</p>
              <p className="truncate text-[15px] text-[#1a0dab]">{f.seoTitulo || f.titulo || 'Título do artigo'} | Blog Grupo SRV</p>
              <p className="line-clamp-2 text-legenda text-[#4d5156]">{f.resumo || 'A descrição aparece aqui.'}</p>
            </div>
            <label className="block space-y-1"><span className={rotulo}>Tags ({listaTags.length}; ideal 3 a 7)</span><input className={campo} value={f.tags} onChange={(e) => muda('tags', e.target.value)} placeholder="Separe por vírgula" /></label>
            <label className="block space-y-1"><span className={rotulo}>Entidades (pessoas, marcas, conceitos citados)</span><textarea className={campo} rows={2} value={f.entidades} onChange={(e) => muda('entidades', e.target.value)} placeholder="Ex.: Máquina de Vendas, Fabrício Saraiva, CRM, Meta Ads" /></label>
            <label className="block space-y-1"><span className={rotulo}>Título curto no caminho (breadcrumb)</span><input className={campo} value={f.breadcrumb} onChange={(e) => muda('breadcrumb', e.target.value)} maxLength={60} placeholder="Se vazio, usa o título" /></label>
            <label className="block space-y-1"><span className={rotulo}>URL canônica (só se for diferente)</span><input className={campo} value={f.canonical} onChange={(e) => muda('canonical', e.target.value)} placeholder="https://www.gruposrv.com.br/blog/…" /></label>
            <label className="flex items-start gap-2 text-rotulo"><input type="checkbox" checked={f.indexar} onChange={(e) => muda('indexar', e.target.checked)} className="mt-0.5" /> <span>Aparecer no Google (index, follow). Desmarque só com motivo.</span></label>
            {(['SEO', 'Conteúdo', 'Conversão', 'Publicação'] as const).map((g) => (
              <div key={g}>
                <p className="mt-2 text-legenda font-semibold text-texto-2">{g}</p>
                <ul className="space-y-1">
                  {seo.itens.filter((i) => i.grupo === g).map((i) => (
                    <li key={i.texto} className="flex gap-1.5 text-legenda"><span className={i.ok ? 'text-sucesso' : i.bloqueia ? 'text-perigo' : 'text-aviso-forte'}>{i.ok ? '✓' : i.bloqueia ? '✗' : '!'}</span><span className={i.ok ? 'text-texto-3' : 'text-texto'}>{i.texto}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {aba === 'Briefing' && (
          <section className="space-y-3 rounded-xl border border-borda bg-white p-4">
            <p className="text-legenda text-texto-3">Estratégia do artigo (não aparece no site): orienta a IA e a revisão. A resposta direta deve abrir o texto.</p>
            {(['Briefing', 'Busca'] as const).map((g) => (
              <div key={g} className="space-y-2">
                <p className="text-rotulo font-semibold text-texto">{g === 'Busca' ? 'Estratégia de busca' : 'Briefing editorial'}</p>
                {CAMPOS_BRIEFING.filter((c) => c.grupo === g).map((c) => <CampoDoBriefing key={c.chave} c={c} valor={f.briefing[c.chave]} aoMudar={(v) => mudaBriefing(c.chave, v)} />)}
              </div>
            ))}
          </section>
        )}

        {aba === 'CTA e social' && (
          <div className="space-y-3">
            <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
              <h2 className="text-corpo font-semibold">Chamada para ação</h2>
              <label className="block space-y-1"><span className={rotulo}>Texto do CTA principal</span><input className={campo} value={f.ctaLabel} onChange={(e) => muda('ctaLabel', e.target.value)} maxLength={80} placeholder="Ex.: Faça o pré-diagnóstico" /></label>
              <label className="block space-y-1"><span className={rotulo}>Destino (se vazio, Máquina de Vendas)</span><input className={campo} value={f.ctaUrl} onChange={(e) => muda('ctaUrl', e.target.value)} placeholder="/maquinadevendas" /></label>
              <label className="block space-y-1"><span className={rotulo}>Por que o CTA faz sentido depois deste artigo</span><textarea className={campo} rows={2} value={f.ctaContexto} onChange={(e) => muda('ctaContexto', e.target.value)} maxLength={300} /></label>
              <label className="block space-y-1"><span className={rotulo}>Onde aparece</span>
                <select className={campo} value={f.ctaPosicao} onChange={(e) => muda('ctaPosicao', e.target.value as Formulario['ctaPosicao'])}><option value="ambos">No meio e no fim</option><option value="meio">Só no meio</option><option value="final">Só no fim</option></select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1"><span className={rotulo}>CTA secundário</span><input className={campo} value={f.cta2Label} onChange={(e) => muda('cta2Label', e.target.value)} maxLength={80} placeholder="Ex.: Leia o guia completo" /></label>
                <label className="block space-y-1"><span className={rotulo}>Destino</span><input className={campo} value={f.cta2Url} onChange={(e) => muda('cta2Url', e.target.value)} placeholder="/blog/…" /></label>
              </div>
            </section>
            <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
              <h2 className="text-corpo font-semibold">Leia também (2 a 4)</h2>
              <p className="text-legenda text-texto-3">Se não escolher, entram os mais recentes da mesma categoria.</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {outros.filter((o) => o.id !== id).map((o) => (
                  <li key={o.id}><label className="flex items-start gap-2 text-rotulo"><input type="checkbox" className="mt-0.5" checked={f.relacionadosIds.includes(o.id)} disabled={!f.relacionadosIds.includes(o.id) && f.relacionadosIds.length >= 4} onChange={(e) => muda('relacionadosIds', e.target.checked ? [...f.relacionadosIds, o.id] : f.relacionadosIds.filter((x) => x !== o.id))} /> {o.titulo}</label></li>
                ))}
              </ul>
            </section>
            <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
              <h2 className="text-corpo font-semibold">Compartilhamento (WhatsApp, LinkedIn, X)</h2>
              <label className="block space-y-1"><span className={rotulo}>Título para redes</span><input className={campo} value={f.ogTitulo} onChange={(e) => muda('ogTitulo', e.target.value)} maxLength={100} placeholder={f.seoTitulo || f.titulo} /></label>
              <label className="block space-y-1"><span className={rotulo}>Descrição para redes</span><textarea className={campo} rows={2} value={f.ogDescricao} onChange={(e) => muda('ogDescricao', e.target.value)} maxLength={300} placeholder={f.resumo} /></label>
              {CAMPOS_BRIEFING.filter((c) => c.grupo === 'Distribuição').map((c) => (
                <div key={c.chave} className="space-y-1">
                  <CampoDoBriefing c={c} valor={f.briefing[c.chave]} aoMudar={(v) => mudaBriefing(c.chave, v)} />
                  {typeof f.briefing[c.chave] === 'string' && f.briefing[c.chave] && <button type="button" onClick={() => copiar(String(f.briefing[c.chave]))} className="inline-flex items-center gap-1 text-legenda font-semibold text-petroleo hover:underline"><Copy className="h-3 w-3" /> Copiar</button>}
                </div>
              ))}
            </section>
          </div>
        )}

        {aba === 'Capa' && (
          <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
            <div className="overflow-hidden rounded-lg border border-borda bg-fundo">
              {f.capaChave ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia da capa enviada
                <img src={`/blog/imagem/${f.capaChave}`} alt={f.capaAlt} className="aspect-[1200/630] w-full object-cover" />
              ) : (
                <p className="flex aspect-[1200/630] items-center justify-center text-legenda text-texto-3">Sem capa (1200×630, WebP de até 250 KB)</p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => entradaCapa.current?.click()} className={botaoSecundario}><Upload className="h-3.5 w-3.5" /> {f.capaChave ? 'Trocar capa' : 'Enviar capa'}</button>
              {f.capaChave && <button type="button" onClick={() => muda('capaChave', null)} className={botaoFantasma}>Tirar</button>}
            </div>
            <input ref={entradaCapa} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void trocarCapa(e.target.files?.[0]); e.target.value = '' }} />
            <label className="block space-y-1"><span className={rotulo}>Texto alternativo da capa</span><input className={campo} value={f.capaAlt} onChange={(e) => muda('capaAlt', e.target.value)} maxLength={200} placeholder="Descreva a imagem para quem não a vê" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1"><span className={rotulo}>Legenda (opcional)</span><input className={campo} value={f.capaLegenda} onChange={(e) => muda('capaLegenda', e.target.value)} maxLength={200} /></label>
              <label className="block space-y-1"><span className={rotulo}>Crédito</span><input className={campo} value={f.capaCredito} onChange={(e) => muda('capaCredito', e.target.value)} maxLength={120} placeholder="Grupo SRV" /></label>
            </div>
            {CAMPOS_BRIEFING.filter((c) => c.grupo === 'Capa').map((c) => <CampoDoBriefing key={c.chave} c={c} valor={f.briefing[c.chave]} aoMudar={(v) => mudaBriefing(c.chave, v)} />)}
            <label className="block space-y-1"><span className={rotulo}>Categoria (pilar)</span>
              <select className={campo} value={f.categoriaId ?? ''} onChange={(e) => muda('categoriaId', e.target.value || null)}>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
            </label>
            <label className="block space-y-1"><span className={rotulo}>Autor</span>
              <select className={campo} value={f.autorId ?? ''} onChange={(e) => muda('autorId', e.target.value || null)}>{autores.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
            </label>
            <label className="flex items-start gap-2 text-rotulo"><input type="checkbox" checked={f.pilar} onChange={(e) => muda('pilar', e.target.checked)} className="mt-0.5" /> <span>É o <strong>guia completo</strong> desta categoria (página pilar)</span></label>
          </section>
        )}
      </aside>
    </div>
  )
}
