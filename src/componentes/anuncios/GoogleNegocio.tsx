import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modulo } from '@/componentes/Modulo'
import { rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { metricasDoNegocio } from '@/servicos/google-agencia'
import { VincularPerfilGoogle } from './VincularPerfilGoogle'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

/** Google Meu Negócio do cliente: descoberta, ações, avaliações e termos usados para encontrar o perfil. */
export async function GoogleNegocio({ clienteId, perfil, perfilNome, periodo, seletor, podeGerir }: { clienteId: string; perfil: string | null; perfilNome: string | null; periodo: PeriodoAnuncios; seletor: ReactNode; podeGerir: boolean }) {
  if (!perfil) {
    if (!podeGerir) return null
    return (
      <Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Ligue o perfil do cliente para ver as métricas e publicar posts no Google">
        <VincularPerfilGoogle clienteId={clienteId} ligado={false} />
      </Modulo>
    )
  }
  const r = await metricasDoNegocio(perfil, periodo.de, periodo.ate)
  return (
    <Modulo icone={MapPin} titulo="Google Meu Negócio" descricao={`${perfilNome ?? 'Perfil'} · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      <div>
        {'erro' in r ? (
          <p>{r.erro}</p>
        ) : (
          <>
            <div>
              {([
                ['Visualizações', r.visualizacoes, `${numero.format(r.buscas)} na busca · ${numero.format(r.mapas)} no Maps`],
                ['Ligações', r.ligacoes, null],
                ['Cliques no site', r.site, null],
                ['Pedidos de rota', r.rotas, null],
                ['Mensagens', r.mensagens, null],
                ['Ações no total', r.ligacoes + r.site + r.rotas + r.mensagens + r.reservas + r.pedidosComida + r.cliquesCardapio, null],
              ] as const).map(([rot, v, extra]) => (
                <div key={rot}>
                  <p>{rot}</p>
                  <p>{numero.format(v)}</p>
                  {extra && <p>{extra}</p>}
                </div>
              ))}
            </div>
            {r.porDia.length > 1 && (
              <div>
                <p>Visualizações por dia</p>
                <div>
                  {r.porDia.map((d) => {
                    const maior = Math.max(1, ...r.porDia.map((x) => x.visualizacoes))
                    return <span key={d.dia} title={`${diaCurto.format(new Date(`${d.dia}T00:00:00Z`))}: ${d.visualizacoes} visualizações, ${d.acoes} ações`} style={{ height: `${Math.max(4, (d.visualizacoes / maior) * 100)}%` }} />
                  })}
                </div>
              </div>
            )}
            {r.avaliacoes && (
              <div>
                <p>Avaliações no período</p>
                <p>{numero.format(r.avaliacoes.novas)} novas</p>
                <p>{r.avaliacoes.notaMedia === null ? 'Sem nota no período' : `Média ★ ${r.avaliacoes.notaMedia.toLocaleString('pt-BR')}`} · {numero.format(r.avaliacoes.respondidas)} respondidas · {numero.format(r.avaliacoes.semResposta)} sem resposta</p>
              </div>
            )}
            {r.palavrasChave?.length ? (
              <div>
                <p>Termos que levaram ao perfil</p>
                <p>Dados mensais de {r.palavrasPeriodo?.de} a {r.palavrasPeriodo?.ate}</p>
                <ol>
                  {r.palavrasChave.map((p) => <li key={p.termo}><span>{p.termo}</span><strong>{p.abaixoDe ? '< ' : ''}{numero.format(p.visualizacoes)}</strong></li>)}
                </ol>
              </div>
            ) : null}
            {[r.reservas ? `${numero.format(r.reservas)} reservas` : '', r.pedidosComida ? `${numero.format(r.pedidosComida)} pedidos de comida` : '', r.cliquesCardapio ? `${numero.format(r.cliquesCardapio)} cliques no cardápio` : ''].filter(Boolean).length > 0 && <p>{[r.reservas ? `${numero.format(r.reservas)} reservas` : '', r.pedidosComida ? `${numero.format(r.pedidosComida)} pedidos de comida` : '', r.cliquesCardapio ? `${numero.format(r.cliquesCardapio)} cliques no cardápio` : ''].filter(Boolean).join(' · ')}</p>}
            {r.avisos?.map((a) => <p key={a}>{a}</p>)}
            <p>{periodo.atalho === 'hoje' ? 'Consulta feita agora, sem cache. O Google Meu Negócio costuma fechar os números com alguns dias de atraso.' : 'Dados do Google atualizados a cada hora; o Google costuma fechar os números com alguns dias de atraso.'}</p>
          </>
        )}
        {podeGerir && <VincularPerfilGoogle clienteId={clienteId} ligado />}
      </div>
    </Modulo>
  )
}
