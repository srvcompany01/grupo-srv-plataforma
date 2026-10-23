import { Megaphone, PlugZap } from 'lucide-react'
import Link from 'next/link'
import { ConexaoGoogle } from '@/componentes/anuncios/ConexaoGoogle'
import { Modulo } from '@/componentes/Modulo'
import { lerPeriodoAnuncios, totaisAnuncios } from '@/dominio/anuncios-meta'
import { totaisCampanhas } from '@/dominio/google'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { campanhasGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { anunciosAtivos } from '@/servicos/meta-anuncios'

export const maxDuration = 60

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

const AVISO_GOOGLE: Record<string, string> = {
  ok: 'Google da agência conectado.',
  cancelado: 'Conexão com o Google cancelada.',
  erro: 'Não foi possível conectar o Google. Tente de novo.',
  'sem-config': 'Falta o app do Google (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET) na Vercel.',
}

type Linha = { id: string; nome: string; meta: { gasto: number; impressoes: number; cliques: number; ctr: number; ativos: number } | { erro: string } | null; google: { custo: number; cliques: number; conversoes: number } | { erro: string } | null }

/** Anúncios de todos os clientes: Meta (anúncios ativos) e Google Ads (campanhas ativas) no mesmo período. */
export default async function Anuncios({ searchParams }: PageProps<'/anuncios'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const dias = lerPeriodoAnuncios(typeof sp.dias === 'string' ? sp.dias : undefined)
  const aviso = typeof sp.google === 'string' ? AVISO_GOOGLE[sp.google] : undefined
  const sb = await criarClienteServidor()
  const [clientes, google] = await Promise.all([listarClientes(sb), situacaoGoogle()])
  const comAnuncios = clientes.filter((c) => !c.interno && c.status !== 'encerrado' && (c.metaContaId || c.googleAdsId))

  const linhas: Linha[] = await Promise.all(
    comAnuncios.map(async (c) => {
      const [meta, ads] = await Promise.all([
        c.metaContaId ? anunciosAtivos(c.metaContaId, dias) : null,
        c.googleAdsId && google.conectado ? campanhasGoogle(c.googleAdsId, dias) : null,
      ])
      return {
        id: c.id,
        nome: c.nome,
        meta: !meta ? null : 'erro' in meta ? meta : { ...totaisAnuncios(meta.anuncios), ativos: meta.anuncios.length },
        google: !ads ? null : 'erro' in ads ? ads : totaisCampanhas(ads.campanhas),
      }
    }),
  )
  const valor = <T,>(x: T | { erro: string } | null): T | null => (x && !('erro' in (x as object)) ? (x as T) : null)
  const total = linhas.reduce((s, l) => s + (valor(l.meta)?.gasto ?? 0) + (valor(l.google)?.custo ?? 0), 0)
  const totalMeta = linhas.reduce((s, l) => s + (valor(l.meta)?.gasto ?? 0), 0)
  const totalGoogle = linhas.reduce((s, l) => s + (valor(l.google)?.custo ?? 0), 0)
  const chip = (ativo: boolean) => `rounded-md px-2.5 py-1 text-rotulo font-semibold ${ativo ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`
  const erro = (e: { erro: string }) => <span className="text-perigo" title={e.erro}>erro</span>

  return (
    <div className="page-shell">
      <div>
        <p className="eyebrow">Tráfego pago</p>
        <h1 className="page-title mt-1">Anúncios</h1>
      </div>
      {aviso && <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}

      <Modulo
        icone={Megaphone}
        titulo="Investimento e resultados por cliente"
        descricao={`Meta (anúncios ativos) e Google Ads (campanhas ativas) · últimos ${dias} dias`}
        acoes={
          <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Período">
            {([7, 30] as const).map((d) => <Link key={d} href={d === 7 ? '/anuncios' : `/anuncios?dias=${d}`} className={chip(d === dias)}>Últimos {d} dias</Link>)}
          </nav>
        }
      >
        <div className="mb-3 grid grid-cols-3 gap-2">
          {([['Total investido', total], ['Meta', totalMeta], ['Google Ads', totalGoogle]] as const).map(([r, v]) => (
            <div key={r} className="rounded-xl border border-borda bg-white p-2.5">
              <p className="text-micro text-texto-3">{r}</p>
              <p className="text-destaque font-bold tabular-nums text-texto">{reais.format(v)}</p>
            </div>
          ))}
        </div>
        {linhas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum cliente com conta de anúncios no cadastro. Preencha a conta do Meta e/ou do Google Ads na página do cliente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta investido</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta cliques</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta CTR</th>
                  <th className="py-2 pr-3 text-right font-medium">Google investido</th>
                  <th className="py-2 pr-3 text-right font-medium">Google cliques</th>
                  <th className="py-2 pr-3 text-right font-medium">Google conversões</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const m = valor(l.meta)
                  const g = valor(l.google)
                  const vazio = <span className="text-texto-3">—</span>
                  return (
                    <tr key={l.id} className="border-b border-borda/60 last:border-0">
                      <td className="py-2 pr-3"><Link href={`/clientes/${l.id}`} className="font-medium text-texto hover:underline">{l.nome}</Link>{m && <p className="text-micro text-texto-3">{m.ativos} anúncios ativos no Meta</p>}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? reais.format(m.gasto) : l.meta ? erro(l.meta as { erro: string }) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? numero.format(m.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m ? pct(m.ctr) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? reais.format(g.custo) : l.google ? erro(l.google as { erro: string }) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? numero.format(g.cliques) : vazio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{g ? g.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : vazio}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{reais.format((m?.gasto ?? 0) + (g?.custo ?? 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-legenda text-texto-3">Passe o mouse em &quot;erro&quot; para ver o motivo. Clique no cliente para ver os anúncios e campanhas um a um.</p>
      </Modulo>

      <Modulo icone={PlugZap} titulo="Conexão com o Google" descricao="Uma conta Google da agência acessa a MCC do Google Ads e os perfis do Meu Negócio dos clientes">
        <div className="space-y-2 text-rotulo">
          <p>{google.conectado ? <>Conectado como <strong>{google.email || 'conta Google'}</strong>.</> : 'Ainda não conectado.'}</p>
          {google.conectado && !google.adsPronto && <p className="text-aviso-forte">Google Ads: falta GOOGLE_ADS_DEVELOPER_TOKEN e/ou GOOGLE_ADS_LOGIN_CUSTOMER_ID na Vercel.</p>}
          {eu.papel === 'admin' ? <ConexaoGoogle email={google.conectado ? google.email || 'conta Google' : null} /> : !google.conectado && <p className="text-texto-3">Peça ao admin para conectar.</p>}
        </div>
      </Modulo>
    </div>
  )
}
