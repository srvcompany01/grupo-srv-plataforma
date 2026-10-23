'use client'

import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, CalendarClock, ExternalLink, Heading2, Heading3, ImagePlus, Italic, Link as IconeLink, List, ListOrdered, Quote, Redo2, Save, Send, Sparkles, Undo2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { enviarImagemAcao, gerarRascunhoAcao, publicacaoAcao, salvarPostAcao } from '@/app/(app)/editor-blog/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { SeloTom } from '@/componentes/insights/tom'
import { avisar } from '@/componentes/tarefas/avisar'
import { checklistSeo, contarPalavras, slugify } from '@/dominio/blog'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { Autor, Categoria, PostEquipe } from '@/servicos/blog'

type Props = { post: PostEquipe | null; categorias: Categoria[]; autores: Autor[]; iaPronta: boolean; /** Calculada no servidor (agendado = publicado com data futura). */ situacao: 'Rascunho' | 'Agendado' | 'Publicado' }

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

const local = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Editor de artigo do blog: texto, capa, SEO (checklist ao vivo e prévia no Google), IA e publicação. */
export function EditorArtigo({ post, categorias, autores, iaPronta, situacao }: Props) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [id, setId] = useState(post?.id ?? null)
  const [titulo, setTitulo] = useState(post?.titulo ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!post)
  const [seoTitulo, setSeoTitulo] = useState(post?.seoTitulo ?? '')
  const [resumo, setResumo] = useState(post?.resumo ?? '')
  const [palavraChave, setPalavraChave] = useState(post?.palavraChave ?? '')
  const [categoriaId, setCategoriaId] = useState<string | null>(post?.categoriaId ?? categorias[0]?.id ?? null)
  const [autorId, setAutorId] = useState<string | null>(post?.autorId ?? autores[0]?.id ?? null)
  const [pilar, setPilar] = useState(post?.pilar ?? false)
  const [capaChave, setCapaChave] = useState(post?.capaChave ?? null)
  const [capaAlt, setCapaAlt] = useState(post?.capaAlt && post.capaAlt !== post.titulo ? post.capaAlt : '')
  const [conteudo, setConteudo] = useState(post?.conteudo ?? '')
  const [sujo, setSujo] = useState(false)
  const [agendar, setAgendar] = useState('')
  const [ia, setIa] = useState({ aberto: !post, tema: '', publico: '' })
  const [gerando, setGerando] = useState(false)
  const entradaCapa = useRef<HTMLInputElement>(null)
  const entradaImagem = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image, Markdown, Placeholder.configure({ placeholder: 'Escreva o artigo aqui. Use subtítulos (H2) para cada parte, listas e links para outros artigos e para a landing.' })],
    content: post?.conteudo ?? '',
    contentType: 'markdown',
    immediatelyRender: false,
    editorProps: { attributes: { class: 'artigo-blog min-h-[60vh] px-6 py-5 outline-none' } },
    onUpdate: ({ editor: e }) => {
      setConteudo(e.getMarkdown())
      setSujo(true)
    },
  })

  const marcar = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setSujo(true)
  }
  const mudarTitulo = (v: string) => {
    setTitulo(v)
    if (!slugManual) setSlug(slugify(v))
    setSujo(true)
  }

  const campos = () => ({ titulo, slug: slug || slugify(titulo), seoTitulo, resumo, palavraChave, conteudo: editor?.getMarkdown() ?? conteudo, capaChave, capaAlt, categoriaId, autorId, pilar })
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
  const publicar = (quando: string | null) =>
    iniciar(async () => {
      const salvo = await salvar()
      if (!salvo) return
      if (avisar(await publicacaoAcao(salvo, quando), true)) router.refresh()
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
    if (chave) {
      setCapaChave(chave)
      setSujo(true)
    }
  }
  const inserirImagem = async (arq: File | undefined) => {
    if (!arq || !editor) return
    const chave = await enviar(arq)
    const alt = chave ? window.prompt('Descreva a imagem (texto alternativo, ajuda no Google):', '') ?? '' : ''
    if (chave) editor.chain().focus().setImage({ src: `/blog/imagem/${chave}`, alt }).run()
  }

  const gerar = async () => {
    if (!ia.tema.trim() || !palavraChave.trim()) return void avisar({ erro: 'Informe o tema e a palavra-chave foco.' })
    if (contarPalavras(conteudo) > 30 && !(await confirmar({ titulo: 'Substituir o texto atual?', descricao: 'A IA vai escrever um rascunho novo no lugar do texto, do título e da descrição.', confirmar: 'Gerar e substituir', perigo: true }))) return
    setGerando(true)
    const r = await gerarRascunhoAcao({ tema: ia.tema, palavraChave, categoriaId, publico: ia.publico })
    setGerando(false)
    if ('erro' in r) return void avisar(r)
    setTitulo(r.titulo)
    setSeoTitulo(r.seoTitulo)
    setResumo(r.resumo)
    if (!slugManual) setSlug(r.slug)
    editor?.commands.setContent(r.conteudo, { contentType: 'markdown' })
    setConteudo(r.conteudo)
    setSujo(true)
    setIa((v) => ({ ...v, aberto: false }))
    avisar({ ok: 'Rascunho gerado. Revise, ajuste com a experiência da agência e salve.' }, true)
  }

  const seo = checklistSeo({ titulo, seoTitulo, resumo, palavraChave, conteudo, capa: !!capaChave, capaAlt, slug: slug || slugify(titulo) })
  const tomNota = seo.nota >= 80 ? 'bom' : seo.nota >= 50 ? 'atencao' : 'ruim'

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        {ia.aberto && (
          <section className="space-y-3 rounded-xl border border-[#6250d6]/30 bg-[#6250d6]/5 p-4">
            <h2 className="flex items-center gap-2 text-corpo font-semibold text-texto"><Sparkles className="h-4 w-4 text-[#6250d6]" /> Escrever com IA</h2>
            {!iaPronta && <p className="text-rotulo text-aviso-forte">A IA da plataforma não está configurada (IA_API_KEY na Vercel).</p>}
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2"><span className={rotulo}>Tema do artigo</span><input className={campo} value={ia.tema} onChange={(e) => setIa({ ...ia, tema: e.target.value })} placeholder="Ex.: quanto investir em tráfego pago no primeiro mês" maxLength={300} /></label>
              <label className="space-y-1"><span className={rotulo}>Palavra-chave foco</span><input className={campo} value={palavraChave} onChange={(e) => marcar(setPalavraChave)(e.target.value)} placeholder="Ex.: quanto investir em tráfego pago" maxLength={80} /></label>
              <label className="space-y-1"><span className={rotulo}>Para quem (opcional)</span><input className={campo} value={ia.publico} onChange={(e) => setIa({ ...ia, publico: e.target.value })} placeholder="Ex.: donos de clínicas e lojas" maxLength={200} /></label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={gerar} disabled={gerando || !iaPronta} className={botaoPrimario}><Sparkles className="h-3.5 w-3.5" /> {gerando ? 'Escrevendo… (até 1 minuto)' : 'Gerar rascunho'}</button>
              <button type="button" onClick={() => setIa({ ...ia, aberto: false })} className={botaoFantasma}>Fechar</button>
              <span className="text-legenda text-texto-3">A IA escreve um rascunho otimizado para SEO. Sempre revise e acrescente a experiência real da agência antes de publicar.</span>
            </div>
          </section>
        )}

        <input value={titulo} onChange={(e) => mudarTitulo(e.target.value)} placeholder="Título do artigo" maxLength={160} className="w-full bg-transparent text-2xl font-bold text-texto outline-none placeholder:text-texto-3" />
        <div className="flex flex-wrap items-center gap-2 text-legenda text-texto-3">
          <span>www.gruposrv.com.br/blog/</span>
          <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true); setSujo(true) }} className="min-w-48 flex-1 rounded border border-borda bg-white px-2 py-1 font-mono text-legenda text-texto" />
          {!ia.aberto && <button type="button" onClick={() => setIa({ ...ia, aberto: true })} className="inline-flex items-center gap-1 font-semibold text-[#6250d6] hover:underline"><Sparkles className="h-3 w-3" /> Escrever com IA</button>}
        </div>

        <div className="overflow-hidden rounded-xl border border-borda bg-white">
          {editor && <Barra editor={editor} aoImagem={() => entradaImagem.current?.click()} />}
          <EditorContent editor={editor} />
          <p className="border-t border-borda px-4 py-2 text-legenda text-texto-3">{contarPalavras(conteudo)} palavras · {Math.max(1, Math.round(contarPalavras(conteudo) / 200))} min de leitura</p>
        </div>
        <input ref={entradaImagem} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void inserirImagem(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border border-borda bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-corpo font-semibold">Publicação</h2>
            <SeloTom tom={situacao === 'Publicado' ? 'bom' : situacao === 'Agendado' ? 'atencao' : 'neutro'} rotulo={situacao} />
          </div>
          {post?.publicadoEmBruto && situacao !== 'Rascunho' && <p className="text-legenda text-texto-3">{situacao === 'Agendado' ? 'Vai ao ar em' : 'No ar desde'} {new Date(post.publicadoEmBruto).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={salvarClicando} disabled={pendente} className={botaoSecundario}><Save className="h-3.5 w-3.5" /> Salvar{sujo ? ' *' : ''}</button>
            {situacao === 'Rascunho' ? (
              <button type="button" onClick={() => publicar(new Date().toISOString())} disabled={pendente} className={botaoPrimario}><Send className="h-3.5 w-3.5" /> Publicar agora</button>
            ) : (
              <button type="button" onClick={() => publicar(null)} disabled={pendente} className={botaoFantasma}>Tirar do ar</button>
            )}
          </div>
          <div className="flex gap-2">
            <input type="datetime-local" value={agendar} min={local(new Date().toISOString())} onChange={(e) => setAgendar(e.target.value)} className={`${campo} h-9 flex-1`} aria-label="Data e hora para publicar" />
            <button type="button" disabled={!agendar || pendente} onClick={() => publicar(new Date(agendar).toISOString())} className={botaoSecundario}><CalendarClock className="h-3.5 w-3.5" /> Agendar</button>
          </div>
          {post && situacao === 'Publicado' && <Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex items-center gap-1 text-legenda font-semibold text-petroleo hover:underline">Ver no blog <ExternalLink className="h-3 w-3" /></Link>}
        </section>

        <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-corpo font-semibold">SEO</h2>
            <SeloTom tom={tomNota} rotulo={`Nota ${seo.nota}`} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-fundo"><div className={`h-full ${tomNota === 'bom' ? 'bg-sucesso' : tomNota === 'atencao' ? 'bg-aviso' : 'bg-perigo'}`} style={{ width: `${seo.nota}%` }} /></div>
          <label className="block space-y-1"><span className={rotulo}>Palavra-chave foco</span><input className={campo} value={palavraChave} onChange={(e) => marcar(setPalavraChave)(e.target.value)} maxLength={80} placeholder="O que a pessoa digita no Google" /></label>
          <label className="block space-y-1"><span className={rotulo}>Título para o Google ({(seoTitulo || titulo).length}/60)</span><input className={campo} value={seoTitulo} onChange={(e) => marcar(setSeoTitulo)(e.target.value)} maxLength={80} placeholder={titulo || 'Se vazio, usa o título do artigo'} /></label>
          <label className="block space-y-1"><span className={rotulo}>Descrição ({resumo.length}/160)</span><textarea className={campo} rows={3} value={resumo} onChange={(e) => marcar(setResumo)(e.target.value)} maxLength={300} placeholder="Resumo que aparece no Google e nos cartões do blog" /></label>
          <div className="rounded-lg border border-borda bg-fundo/40 p-3">
            <p className="text-micro text-texto-3">Prévia no Google</p>
            <p className="truncate text-legenda text-[#202124]">www.gruposrv.com.br › blog › {slug || slugify(titulo)}</p>
            <p className="truncate text-[15px] text-[#1a0dab]">{seoTitulo || titulo || 'Título do artigo'} | Blog Grupo SRV</p>
            <p className="line-clamp-2 text-legenda text-[#4d5156]">{resumo || 'A descrição aparece aqui.'}</p>
          </div>
          <ul className="space-y-1">
            {seo.itens.map((i) => (
              <li key={i.texto} className="flex gap-1.5 text-legenda"><span className={i.ok ? 'text-sucesso' : 'text-perigo'} aria-label={i.ok ? 'ok' : 'falta'}>{i.ok ? '✓' : '✗'}</span><span className={i.ok ? 'text-texto-3' : 'text-texto'}>{i.texto}</span></li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 rounded-xl border border-borda bg-white p-4">
          <h2 className="text-corpo font-semibold">Capa e organização</h2>
          <div className="overflow-hidden rounded-lg border border-borda bg-fundo">
            {capaChave ? (
              // eslint-disable-next-line @next/next/no-img-element -- prévia da capa enviada
              <img src={`/blog/imagem/${capaChave}`} alt={capaAlt} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <p className="flex aspect-[16/9] items-center justify-center text-legenda text-texto-3">Sem capa (1200×675 é o ideal)</p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => entradaCapa.current?.click()} className={botaoSecundario}><Upload className="h-3.5 w-3.5" /> {capaChave ? 'Trocar capa' : 'Enviar capa'}</button>
            {capaChave && <button type="button" onClick={() => { setCapaChave(null); setSujo(true) }} className={botaoFantasma}>Tirar</button>}
          </div>
          <input ref={entradaCapa} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void trocarCapa(e.target.files?.[0]); e.target.value = '' }} />
          <label className="block space-y-1"><span className={rotulo}>Descrição da capa (texto alternativo)</span><input className={campo} value={capaAlt} onChange={(e) => marcar(setCapaAlt)(e.target.value)} maxLength={200} placeholder="Ex.: gestor analisando campanha no Gerenciador de Anúncios" /></label>
          <label className="block space-y-1"><span className={rotulo}>Categoria (pilar)</span>
            <select className={campo} value={categoriaId ?? ''} onChange={(e) => marcar(setCategoriaId)(e.target.value || null)}>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </label>
          <label className="block space-y-1"><span className={rotulo}>Autor</span>
            <select className={campo} value={autorId ?? ''} onChange={(e) => marcar(setAutorId)(e.target.value || null)}>{autores.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
          </label>
          <label className="flex items-start gap-2 text-rotulo"><input type="checkbox" checked={pilar} onChange={(e) => marcar(setPilar)(e.target.checked)} className="mt-0.5" /> <span>É o <strong>guia completo</strong> desta categoria (aparece em destaque na página do assunto)</span></label>
        </section>
      </aside>
    </div>
  )
}
