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
    <span>
      <span title="Visualizações"><Eye />{n(m.visualizacoes)}</span>
      <span title="Alcance"><Radar />{n(m.alcance)}</span>
      <span title="Interações"><Heart />{n(m.interacoes)}</span>
      <span title="Engajamento sobre o alcance">{engajamento(m).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
    </span>
  )
}

function Numero({ icone: Icone, cor, rotulo, valor, media }: { icone: LucideIcon; cor: string; rotulo: string; valor: string; media?: string }) {
  return (
    <div>
      <p><Icone style={{ color: cor }} />{rotulo}</p>
      <p>{valor}</p>
      {media && <p>perfil: {media}</p>}
    </div>
  )
}

function Bloco({ titulo, icone: Icone, tom, itens }: { titulo: string; icone: LucideIcon; tom: string; itens: string[] }) {
  if (!itens.length) return null
  return (
    <div>
      <p><Icone />{titulo}</p>
      <ul>{itens.map((i) => <li key={i}>{i}</li>)}</ul>
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
    <div>
      <div>
        <div>
          <p>Insight do post</p>
          <h2>{p.titulo}</h2>
          <p>
            {p.cliente && <NomeCliente nome={p.cliente.nome} href={`/clientes/${p.cliente.id}`} />}
            <span>{ROTULO_FORMATO[p.formato]}</span>
            {p.publicadoEm && <span>publicado em {new Date(p.publicadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>}
            {p.link && <a href={p.link} target="_blank" rel="noreferrer">Ver no Instagram <ExternalLink /></a>}
          </p>
        </div>
        <Link href={fechar} aria-label="Fechar"><X /></Link>
      </div>

      {p.erro && <p>{p.erro}</p>}

      {m && r && p.nota && (
        <>
          <div>
            <SeloNota nota={p.nota} />
            <span>números atualizados a cada 5 minutos{r.posts ? ` · comparado com ${r.posts} posts dos últimos 90 dias` : ''}</span>
          </div>
          <div>
            <Numero icone={Eye} cor="#2a78d6" rotulo="Visualizações" valor={n(m.visualizacoes)} media={r.posts ? n(r.visualizacoes) : undefined} />
            <Numero icone={Radar} cor="#1baf7a" rotulo="Alcance" valor={n(m.alcance)} media={r.posts ? n(r.alcance) : undefined} />
            <Numero icone={Target} cor="#6250d6" rotulo="Engajamento" valor={`${engajamento(m).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} media={r.posts ? `${r.engajamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : undefined} />
            <Numero icone={Heart} cor="#e87ba4" rotulo="Curtidas" valor={n(m.curtidas)} />
            <Numero icone={MessageCircle} cor="#eb6834" rotulo="Comentários" valor={n(m.comentarios)} />
            <Numero icone={Send} cor="#0866ff" rotulo="Compartilhamentos" valor={n(m.compartilhamentos)} media={r.posts ? n(r.compartilhamentos) : undefined} />
            <Numero icone={Bookmark} cor="#eda100" rotulo="Salvamentos" valor={n(m.salvamentos)} media={r.posts ? n(r.salvamentos) : undefined} />
            {m.tempoMedioSeg ? <Numero icone={Clock} cor="#52514e" rotulo="Tempo médio assistido" valor={`${m.tempoMedioSeg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`} /> : <Numero icone={Repeat2} cor="#52514e" rotulo="Interações" valor={n(m.interacoes)} />}
          </div>
          <ul>{p.motivos.map((x) => <li key={x}>• {x}</li>)}</ul>
        </>
      )}

      <div>
        <div>
          <p><Sparkles /> Análise da IA</p>
          {m && <BotaoAnalisar id={p.id} refazer={!!a} />}
        </div>
        {!a ? (
          <p>{m ? 'A IA assiste o post (vídeo ou imagem), cruza com os números e diz o que deu certo, o que não deu e o que replicar.' : 'A análise fica disponível quando o post tiver métricas.'}</p>
        ) : (
          <>
            <div>
              <SeloNota nota={a.nota} />
              {a.tipo && <span>{a.tipo}</span>}
              <span>{a.assistiuVideo ? 'assistiu o arquivo' : 'sem o arquivo (só números e legenda)'} · {new Date(a.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}</span>
            </div>
            <p>{a.resumo}</p>
            <div>
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
