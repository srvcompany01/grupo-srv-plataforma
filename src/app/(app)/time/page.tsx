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
      <div>
        <h1>Time</h1>
        <p>Falta rodar a migração do Time (20261022000049_time_e_collab.sql) no Supabase.</p>
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
    <div>
      <AtualizarSozinho />
      <div>
        <p>Equipe</p>
        <h1>Time</h1>
      </div>

      <Modulo icone={Smile} titulo="Meu status" descricao="Avise o time quando estiver em reunião, no intervalo ou fora; com prazo, volta sozinho para Disponível">
        <MeuStatus status={meu?.status ?? 'disponivel'} texto={meu?.statusTexto ?? ''} />
      </Modulo>

      <Modulo icone={UsersRound} titulo="Quem está ativo" descricao={`${ativosAgora} de ${equipe.length} ativos agora · atualiza a cada minuto`}>
        <ul>
          {equipe.map((m) => {
            const s = situacao(m, agora)
            return (
              <li key={m.id}>
                <span>
                  <Avatar nome={m.nome} tamanho="h-9 w-9 text-xs" />
                  <span title={s} />
                </span>
                <div>
                  <p>{m.nome}{m.id === eu.id && <span> (você)</span>}</p>
                  <p>
                    {EMOJI_STATUS_TIME[m.status]} {ROTULO_STATUS_TIME[m.status]}
                    {m.statusTexto && ` · ${m.statusTexto}`}
                    {m.statusAte && ` · até ${hora.format(new Date(m.statusAte))}`}
                  </p>
                  <p>{linhaSituacao(m, agora)}</p>
                  <p>Hoje: {duracao(m.minutosHoje)} ativo</p>
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
            <div>
              {[7, 30].map((n) => (
                <Link key={n} href={`/time?dias=${n}`}>{n} dias</Link>
              ))}
            </div>
          }
        >
          <div>
            <table>
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Total</th>
                  <th>Média/dia</th>
                  <th>Dias ativos</th>
                  <th>Por dia ({diaCurto.format(new Date(`${de}T00:00:00Z`))} → hoje)</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ m, porDia, total, diasAtivos }) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{duracao(total)}</td>
                    <td>{diasAtivos ? duracao(total / diasAtivos) : '—'}</td>
                    <td>{diasAtivos}/{dias}</td>
                    <td>
                      <div>
                        {listaDias.map((d) => {
                          const min = porDia.get(d) ?? 0
                          return <span key={d} title={`${diaCurto.format(new Date(`${d}T00:00:00Z`))}: ${duracao(min)}`} style={{ height: `${Math.max(8, (min / maiorDia) * 100)}%` }} />
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
