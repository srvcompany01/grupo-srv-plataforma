import { BarChart3, Smile, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/componentes/Avatar'
import { Modulo } from '@/componentes/Modulo'
import { AtualizarSozinho, MeuStatus } from '@/componentes/time/MeuStatus'
import { somarDias } from '@/dominio/agenda'
import { dataDeHoje } from '@/dominio/filtros'
import { EMOJI_STATUS_TIME, ROTULO_STATUS_TIME, duracao, minutosDesde, situacao, type Situacao } from '@/dominio/time'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { atividadeDesde, quadroDoTime, type Membro } from '@/servicos/time'

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
const COR: Record<Situacao, string> = { ativo: 'bg-sucesso', ocioso: 'bg-aviso', offline: 'bg-texto-3/40' }

function linhaSituacao(m: Membro, agora: Date): string {
  const s = situacao(m, agora)
  if (s === 'ativo') return 'Ativo agora'
  const inativo = minutosDesde(m.ativoEm ?? m.vistoEm, agora)
  if (inativo === null) return 'Ainda não entrou na plataforma'
  return s === 'ocioso' ? `Site aberto, sem mexer há ${duracao(inativo)}` : `Offline · inativo há ${duracao(inativo)}`
}

/** Time: quem está ativo agora, o status de cada um e (admin/gestor) o relatório de tempo ativo. */
export default async function Time({ searchParams }: PageProps<'/time'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const dias = sp.dias === '30' ? 30 : 7
  const sb = await criarClienteServidor()
  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const gerente = eu.papel === 'admin' || eu.papel === 'gestor'
  const de = somarDias(hoje, -(dias - 1))
  const [quadro, atividade] = await Promise.all([quadroDoTime(sb, hoje), gerente ? atividadeDesde(sb, de) : Promise.resolve([])])

  if (!quadro) {
    return (
      <div className="page-shell">
        <h1 className="page-title">Time</h1>
        <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Falta rodar a migração do Time (20261022000049_time_e_collab.sql) no Supabase.</p>
      </div>
    )
  }

  const ordem: Record<Situacao, number> = { ativo: 0, ocioso: 1, offline: 2 }
  const equipe = [...quadro].sort((a, b) => ordem[situacao(a, agora)] - ordem[situacao(b, agora)] || a.nome.localeCompare(b.nome))
  const meu = quadro.find((m) => m.id === eu.id)
  const ativosAgora = equipe.filter((m) => situacao(m, agora) === 'ativo').length
  const listaDias = Array.from({ length: dias }, (_, i) => somarDias(de, i))
  const relatorio = quadro
    .map((m) => {
      const porDia = new Map(atividade.filter((a) => a.usuarioId === m.id).map((a) => [a.dia, a.minutos]))
      const total = [...porDia.values()].reduce((s, n) => s + n, 0)
      return { m, porDia, total, diasAtivos: porDia.size }
    })
    .sort((a, b) => b.total - a.total)
  const maiorDia = Math.max(1, ...atividade.map((a) => a.minutos))

  return (
    <div className="page-shell">
      <AtualizarSozinho />
      <div>
        <p className="eyebrow">Equipe</p>
        <h1 className="page-title mt-1">Time</h1>
      </div>

      <Modulo icone={Smile} titulo="Meu status" descricao="Avise o time quando estiver em reunião, no intervalo ou fora; com prazo, volta sozinho para Disponível">
        <MeuStatus status={meu?.status ?? 'disponivel'} texto={meu?.statusTexto ?? ''} />
      </Modulo>

      <Modulo icone={UsersRound} titulo="Quem está ativo" descricao={`${ativosAgora} de ${equipe.length} ativos agora · atualiza a cada minuto`}>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {equipe.map((m) => {
            const s = situacao(m, agora)
            return (
              <li key={m.id} className="flex items-start gap-3 rounded-lg border border-borda p-3">
                <span className="relative">
                  <Avatar nome={m.nome} tamanho="h-9 w-9 text-xs" />
                  <span className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white ${COR[s]}`} title={s} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-corpo font-semibold text-texto">{m.nome}{m.id === eu.id && <span className="font-normal text-texto-3"> (você)</span>}</p>
                  <p className="text-legenda text-texto-2">
                    {EMOJI_STATUS_TIME[m.status]} {ROTULO_STATUS_TIME[m.status]}
                    {m.statusTexto && ` · ${m.statusTexto}`}
                    {m.statusAte && ` · até ${hora.format(new Date(m.statusAte))}`}
                  </p>
                  <p className="text-legenda text-texto-3">{linhaSituacao(m, agora)}</p>
                  <p className="text-legenda text-texto-3">Hoje: {duracao(m.minutosHoje)} ativo</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Modulo>

      {gerente && (
        <Modulo
          icone={BarChart3}
          titulo="Relatório de tempo ativo"
          descricao="Minutos com a plataforma aberta e alguém mexendo nela (5 min sem mexer não contam)"
          acoes={
            <div className="flex gap-1">
              {[7, 30].map((n) => (
                <Link key={n} href={`/time?dias=${n}`} className={`rounded-md px-2.5 py-1 text-rotulo ${dias === n ? 'bg-petroleo text-white' : 'text-texto-2 hover:bg-hover'}`}>{n} dias</Link>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Pessoa</th>
                  <th className="py-2 pr-3 font-medium">Total</th>
                  <th className="py-2 pr-3 font-medium">Média/dia</th>
                  <th className="py-2 pr-3 font-medium">Dias ativos</th>
                  <th className="py-2 font-medium">Por dia ({diaCurto.format(new Date(`${de}T00:00:00Z`))} → hoje)</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ m, porDia, total, diasAtivos }) => (
                  <tr key={m.id} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3 font-medium text-texto">{m.nome}</td>
                    <td className="py-2 pr-3 tabular-nums">{duracao(total)}</td>
                    <td className="py-2 pr-3 tabular-nums">{diasAtivos ? duracao(total / diasAtivos) : '—'}</td>
                    <td className="py-2 pr-3 tabular-nums">{diasAtivos}/{dias}</td>
                    <td className="py-2">
                      <div className="flex h-8 items-end gap-px">
                        {listaDias.map((d) => {
                          const min = porDia.get(d) ?? 0
                          return <span key={d} title={`${diaCurto.format(new Date(`${d}T00:00:00Z`))}: ${duracao(min)}`} className={`w-full min-w-1 rounded-sm ${min ? 'bg-petroleo' : 'bg-fundo'}`} style={{ height: `${Math.max(8, (min / maiorDia) * 100)}%` }} />
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modulo>
      )}
    </div>
  )
}
