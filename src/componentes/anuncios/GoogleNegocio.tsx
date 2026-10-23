import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modulo } from '@/componentes/Modulo'
import { rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { metricasDoNegocio } from '@/servicos/google-agencia'
import { VincularPerfilGoogle } from './VincularPerfilGoogle'

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

/** Google Meu Negócio do cliente: visualizações na busca e no Maps, ligações, cliques no site, rotas e conversas. */
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
      <div className="@container space-y-3">
        {'erro' in r ? (
          <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{r.erro}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-6">
              {([
                ['Visualizações', r.visualizacoes, `${numero.format(r.buscas)} na busca · ${numero.format(r.mapas)} no Maps`],
                ['Ligações', r.ligacoes, null],
                ['Cliques no site', r.site, null],
                ['Pedidos de rota', r.rotas, null],
                ['Conversas', r.conversas, null],
                ['Ações no total', r.ligacoes + r.site + r.rotas + r.conversas, null],
              ] as const).map(([rot, v, extra]) => (
                <div key={rot} className="rounded-xl border border-borda bg-white p-2.5">
                  <p className="text-micro text-texto-3">{rot}</p>
                  <p className="text-destaque font-bold tabular-nums text-texto">{numero.format(v)}</p>
                  {extra && <p className="text-micro text-texto-3">{extra}</p>}
                </div>
              ))}
            </div>
            {r.porDia.length > 1 && (
              <div>
                <p className="mb-1 text-legenda text-texto-3">Visualizações por dia</p>
                <div className="flex h-16 items-end gap-px">
                  {r.porDia.map((d) => {
                    const maior = Math.max(1, ...r.porDia.map((x) => x.visualizacoes))
                    return <span key={d.dia} title={`${diaCurto.format(new Date(`${d.dia}T00:00:00Z`))}: ${d.visualizacoes} visualizações, ${d.acoes} ações`} className="w-full min-w-1 rounded-sm bg-[#1a73e8]" style={{ height: `${Math.max(4, (d.visualizacoes / maior) * 100)}%` }} />
                  })}
                </div>
              </div>
            )}
            <p className="text-legenda text-texto-3">Dados do Google (atualizados a cada hora; o Google costuma fechar os números com alguns dias de atraso).</p>
          </>
        )}
        {podeGerir && <VincularPerfilGoogle clienteId={clienteId} ligado />}
      </div>
    </Modulo>
  )
}
