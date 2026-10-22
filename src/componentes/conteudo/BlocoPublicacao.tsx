'use client'

import { CalendarClock, ExternalLink, Send, TriangleAlert, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { agendarPostAcao, cancelarAgendamentoAcao, publicarAgoraAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { dataLocal, horaLocal } from '@/dominio/agenda'
import type { Aprovacao, Formato } from '@/dominio/conteudo'
import { ROTULO_ALVO, situacaoPublicacao, type Alvo } from '@/dominio/publicacao'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { PublicacaoDoPost } from '@/servicos/conteudo'

export type ContaMeta = { pagina: string; instagram: { id: string; usuario: string } | null } | { erro: string } | null

const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Agendar / publicar o post no Instagram e no Facebook, com ou sem a aprovação do cliente no portal. */
export function BlocoPublicacao({ tarefaId, p, conta, formato, aprovacao, hoje }: { tarefaId: string; p: PublicacaoDoPost; conta: ContaMeta; formato: Formato; aprovacao: Aprovacao; hoje: string }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const temIg = !!conta && !('erro' in conta) && !!conta.instagram
  const temFb = !!conta && !('erro' in conta)
  const [data, setData] = useState(p.em ? dataLocal(p.em) : p.dataPrevista ?? hoje)
  const [hora, setHora] = useState(p.em ? horaLocal(p.em) : '18:00')
  const [alvos, setAlvos] = useState<Alvo[]>(p.alvos.length ? p.alvos : [...(temIg ? ['instagram' as const] : []), ...(temFb && formato !== 'stories' ? ['facebook' as const] : [])])
  const situacao = situacaoPublicacao({ status: p.status, em: p.em, modo: p.modo, aprovacao }, new Date())
  const agendado = p.status === 'agendado' || p.status === 'publicando'
  const alternar = (a: Alvo) => setAlvos((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]))

  const rodar = (fn: () => Promise<{ ok?: string; erro?: string } | null>) => iniciar(async () => { if (avisar(await fn(), true)) router.refresh() })
  const agendar = (modo: 'aprovacao' | 'direto') => rodar(() => agendarPostAcao(tarefaId, { data, hora, alvos, modo }))
  const agora = async () => {
    if (!(await confirmar({ titulo: 'Publicar agora?', descricao: `O post sai já em ${alvos.map((a) => ROTULO_ALVO[a]).join(' e ')}, sem esperar a aprovação do cliente.`, confirmar: 'Publicar agora' }))) return
    rodar(() => publicarAgoraAcao(tarefaId, alvos))
  }

  const cor = p.status === 'publicado' ? 'bg-sucesso-fundo text-sucesso-forte' : p.status === 'falhou' ? 'bg-perigo-fundo text-perigo-forte' : agendado ? 'bg-aviso-fundo text-aviso-forte' : 'bg-hover text-texto-2'

  return (
    <div className="space-y-3 rounded-xl border border-borda p-3">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock className="h-4 w-4 text-texto-2" />
        <h3 className="text-corpo font-semibold">Publicação no Instagram e Facebook</h3>
        <span className={`rounded-full px-2 py-0.5 text-legenda font-semibold ${cor}`}>{situacao}</span>
      </div>

      {!p.cliente?.paginaId ? (
        <p className="flex items-start gap-2 rounded-lg bg-aviso-fundo px-3 py-2 text-rotulo text-aviso-forte">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{p.cliente ? <>O cliente <Link href={`/clientes/${p.cliente.id}`} className="font-semibold underline">{p.cliente.nome}</Link> ainda não tem a Página do Facebook no cadastro (campo &quot;Biblioteca de anúncios do Meta&quot;).</> : 'Este post não tem cliente.'}</span>
        </p>
      ) : conta && 'erro' in conta ? (
        <p className="rounded-lg bg-perigo-fundo/50 px-3 py-2 text-rotulo text-perigo-forte">Não consegui ler a Página do cliente na Meta: {conta.erro}</p>
      ) : conta ? (
        <p className="text-legenda text-texto-2">Facebook: <strong>{conta.pagina}</strong> · Instagram: {conta.instagram ? <strong>@{conta.instagram.usuario}</strong> : <span className="text-perigo">não ligado à Página</span>}</p>
      ) : null}

      {p.status === 'publicado' ? (
        <div className="space-y-1 text-rotulo">
          {p.publicadoEm && <p className="text-texto-2">Publicado {quando.format(new Date(p.publicadoEm))}.</p>}
          <div className="flex flex-wrap gap-3">
            {p.igLink && <a href={p.igLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">Ver no Instagram <ExternalLink className="h-3 w-3" /></a>}
            {p.fbLink && <a href={p.fbLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">Ver no Facebook <ExternalLink className="h-3 w-3" /></a>}
          </div>
        </div>
      ) : (
        <>
          {p.status === 'falhou' && p.erro && <p className="rounded-lg border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{p.erro}</p>}
          {agendado && p.em && <p className="text-rotulo text-texto-2">Marcado para <strong>{quando.format(new Date(p.em))}</strong> em {p.alvos.map((a) => ROTULO_ALVO[a]).join(' e ')}{p.modo === 'aprovacao' ? ', depois da aprovação do cliente' : ', sem aprovação'}.</p>}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="space-y-1"><span className={rotulo}>Dia</span><input type="date" className={`${campo} h-9`} value={data} onChange={(e) => setData(e.target.value)} /></label>
            <label className="space-y-1"><span className={rotulo}>Hora</span><input type="time" className={`${campo} h-9`} value={hora} onChange={(e) => setHora(e.target.value)} /></label>
            <div className="space-y-1">
              <span className={rotulo}>Onde</span>
              <div className="flex h-9 items-center gap-3">
                {(['instagram', 'facebook'] as const).map((a) => (
                  <label key={a} className="flex items-center gap-1.5 text-rotulo"><input type="checkbox" checked={alvos.includes(a)} onChange={() => alternar(a)} disabled={a === 'facebook' && formato === 'stories'} /> {ROTULO_ALVO[a]}</label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={botaoPrimario} disabled={pendente} onClick={() => agendar('aprovacao')}>
              <Send className="h-3.5 w-3.5" /> {aprovacao === 'aprovado' ? 'Agendar (já aprovado)' : aprovacao === 'aguardando' ? 'Salvar horário (aguardando o cliente)' : 'Enviar para aprovação e agendar'}
            </button>
            <button type="button" className={botaoSecundario} disabled={pendente} onClick={() => agendar('direto')}><CalendarClock className="h-3.5 w-3.5" /> Agendar sem aprovação</button>
            <button type="button" className={botaoSecundario} disabled={pendente} onClick={agora}><Zap className="h-3.5 w-3.5" /> Publicar agora</button>
            {(agendado || p.status === 'falhou') && <button type="button" className={botaoFantasma} disabled={pendente} onClick={() => rodar(() => cancelarAgendamentoAcao(tarefaId))}>Cancelar agendamento</button>}
          </div>
          <p className="text-legenda text-texto-3">Com aprovação, o post aparece no portal do cliente com o dia e a hora; quando ele aprovar, sai no horário (ou na hora, se o horário já passou).</p>
        </>
      )}
    </div>
  )
}
