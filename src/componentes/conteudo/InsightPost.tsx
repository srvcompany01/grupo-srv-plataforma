import { Ban, Bookmark, CheckCircle2, Clock, ExternalLink, Eye, Heart, MessageCircle, Radar, Repeat2, Send, Sparkles, Target, X, XCircle, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { SeloTom } from '@/componentes/insights/tom'
import { NomeCliente } from '@/componentes/NomeCliente'
import { ROTULO_FORMATO } from '@/dominio/conteudo'
import type { Tom } from '@/dominio/insights'
import { engajamento, ROTULO_NOTA, type MetricasPost, type Nota } from '@/dominio/insights-post'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { insightDoPost } from '@/servicos/insights-post'
import { BotaoAnalisar } from './BotaoAnalisar'

export const TOM_DA_NOTA: Record<Nota, Tom> = { bom: 'bom', mediano: 'atencao', ruim: 'ruim' }
const n = (v: number) => v.toLocaleString('pt-BR', { notation: v >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 })

export function SeloNota({ nota }: { nota: Nota }) {
  return <SeloTom tom={TOM_DA_NOTA[nota]} rotulo={ROTULO_NOTA[nota]} />
}

/** Números do post numa linha (lista e Kanban). */
export function MetricasMini({ m }: { m: MetricasPost }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-legenda tabular-nums text-texto-2">
      <span className="inline-flex items-center gap-1" title="Visualizações"><Eye className="h-3 w-3 text-[#2a78d6]" />{n(m.visualizacoes)}</span>
      <span className="inline-flex items-center gap-1" title="Alcance"><Radar className="h-3 w-3 text-[#1baf7a]" />{n(m.alcance)}</span>
      <span className="inline-flex items-center gap-1" title="Interações"><Heart className="h-3 w-3 text-[#e87ba4]" />{n(m.interacoes)}</span>
      <span title="Engajamento sobre o alcance">{engajamento(m).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
    </span>
  )
}

function Numero({ icone: Icone, cor, rotulo, valor, media }: { icone: LucideIcon; cor: string; rotulo: string; valor: string; media?: string }) {
  return (
    <div className="rounded-lg border border-borda bg-white px-2.5 py-2">
      <p className="flex items-center gap-1 text-micro text-texto-3"><Icone className="h-3 w-3" style={{ color: cor }} />{rotulo}</p>
      <p className="text-corpo font-bold tabular-nums text-texto">{valor}</p>
      {media && <p className="text-micro text-texto-3">perfil: {media}</p>}
    </div>
  )
}

function Bloco({ titulo, icone: Icone, tom, itens }: { titulo: string; icone: LucideIcon; tom: string; itens: string[] }) {
  if (!itens.length) return null
  return (
    <div className={`rounded-lg border p-3 ${tom}`}>
      <p className="mb-1.5 flex items-center gap-1.5 text-rotulo font-semibold"><Icone className="h-4 w-4" />{titulo}</p>
      <ul className="list-disc space-y-1 pl-5 text-rotulo text-texto">{itens.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}

/** Painel lateral com as métricas ao vivo do post, a comparação com o perfil e a análise da IA. */
export async function PainelInsight({ id, fechar }: { id: string; fechar: string }) {
  const p = await insightDoPost(await criarClienteServidor(), id)
  const m = p.metricas
  const r = p.referencia
  const a = p.analise
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Insight do post</p>
          <h2 className="mt-0.5 text-destaque font-bold text-texto">{p.titulo}</h2>
          <p className="flex flex-wrap items-center gap-x-2 text-legenda text-texto-3">
            {p.cliente && <NomeCliente nome={p.cliente.nome} href={`/clientes/${p.cliente.id}`} />}
            <span>{ROTULO_FORMATO[p.formato]}</span>
            {p.publicadoEm && <span>publicado em {new Date(p.publicadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>}
            {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">Ver no Instagram <ExternalLink className="h-3 w-3" /></a>}
          </p>
        </div>
        <Link href={fechar} aria-label="Fechar" className="rounded-lg p-1.5 text-texto-3 hover:bg-hover hover:text-texto"><X className="h-4 w-4" /></Link>
      </div>

      {p.erro && <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">{p.erro}</p>}

      {m && r && p.nota && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SeloNota nota={p.nota} />
            <span className="text-legenda text-texto-3">números atualizados a cada 5 minutos{r.posts ? ` · comparado com ${r.posts} posts dos últimos 90 dias` : ''}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Numero icone={Eye} cor="#2a78d6" rotulo="Visualizações" valor={n(m.visualizacoes)} media={r.posts ? n(r.visualizacoes) : undefined} />
            <Numero icone={Radar} cor="#1baf7a" rotulo="Alcance" valor={n(m.alcance)} media={r.posts ? n(r.alcance) : undefined} />
            <Numero icone={Target} cor="#6250d6" rotulo="Engajamento" valor={`${engajamento(m).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} media={r.posts ? `${r.engajamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : undefined} />
            <Numero icone={Heart} cor="#e87ba4" rotulo="Curtidas" valor={n(m.curtidas)} />
            <Numero icone={MessageCircle} cor="#eb6834" rotulo="Comentários" valor={n(m.comentarios)} />
            <Numero icone={Send} cor="#0866ff" rotulo="Compartilhamentos" valor={n(m.compartilhamentos)} media={r.posts ? n(r.compartilhamentos) : undefined} />
            <Numero icone={Bookmark} cor="#eda100" rotulo="Salvamentos" valor={n(m.salvamentos)} media={r.posts ? n(r.salvamentos) : undefined} />
            {m.tempoMedioSeg ? <Numero icone={Clock} cor="#52514e" rotulo="Tempo médio assistido" valor={`${m.tempoMedioSeg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`} /> : <Numero icone={Repeat2} cor="#52514e" rotulo="Interações" valor={n(m.interacoes)} />}
          </div>
          <ul className="space-y-0.5 text-legenda text-texto-2">{p.motivos.map((x) => <li key={x}>• {x}</li>)}</ul>
        </>
      )}

      <div className="space-y-3 rounded-lg border border-borda bg-fundo/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-rotulo font-semibold text-texto"><Sparkles className="h-4 w-4 text-[#6250d6]" /> Análise da IA</p>
          {m && <BotaoAnalisar id={p.id} refazer={!!a} />}
        </div>
        {!a ? (
          <p className="text-rotulo text-texto-3">{m ? 'A IA assiste o post (vídeo ou imagem), cruza com os números e diz o que deu certo, o que não deu e o que replicar.' : 'A análise fica disponível quando o post tiver métricas.'}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <SeloNota nota={a.nota} />
              {a.tipo && <span className="rounded-full bg-white px-2 py-0.5 text-micro font-semibold text-texto-2">{a.tipo}</span>}
              <span className="text-micro text-texto-3">{a.assistiuVideo ? 'assistiu o arquivo' : 'sem o arquivo (só números e legenda)'} · {new Date(a.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}</span>
            </div>
            <p className="text-rotulo text-texto">{a.resumo}</p>
            <div className="grid gap-2">
              <Bloco titulo="O que deu certo" icone={CheckCircle2} tom="border-sucesso/30 bg-sucesso-fundo/50 text-sucesso-forte" itens={a.deuCerto} />
              <Bloco titulo="O que não deu certo" icone={XCircle} tom="border-perigo/30 bg-perigo-fundo/50 text-perigo-forte" itens={a.naoDeuCerto} />
              <Bloco titulo="Replicar nos próximos" icone={Repeat2} tom="border-[#2a78d6]/30 bg-[#e6f0fb] text-[#2a78d6]" itens={a.replicar} />
              <Bloco titulo="Não replicar" icone={Ban} tom="border-aviso/40 bg-aviso-fundo/50 text-aviso-forte" itens={a.evitar} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
