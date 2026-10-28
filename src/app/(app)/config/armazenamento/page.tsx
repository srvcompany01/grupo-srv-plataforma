import { Archive, CalendarClock, Download, HardDrive, Recycle } from 'lucide-react'
import { Modulo } from '@/componentes/Modulo'
import { NUNCA_APAGADOS, TIPOS_ARQUIVO, tamanho, type TipoArquivo } from '@/dominio/ciclo-arquivos'
import { urlLeitura } from '@/infra/r2'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { situacaoArmazenamento } from '@/servicos/ciclo-arquivos'

const rotulo = (t: string) => TIPOS_ARQUIVO[t as TipoArquivo]?.rotulo ?? t
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })

/** Armazenamento: espaço em uso, o que o ciclo de renovação já liberou e o que sai nos próximos 30 dias. */
export default async function Armazenamento() {
  await exigirAdmin()
  let s
  try {
    s = await situacaoArmazenamento()
  } catch {
    return <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Falta rodar a migração do ciclo de arquivos (20261024000058_ciclo_arquivos.sql) no Supabase.</p>
  }
  const emUso = s.uso.reduce((t, u) => t + u.bytes, 0)
  const liberado = s.liberado.reduce((t, u) => t + u.bytes, 0)
  const proximos = await Promise.all(s.proximos.slice(0, 100).map(async (p) => ({ ...p, url: await urlLeitura(p.chave, { download: p.nome }) })))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao icone={HardDrive} cor="#2a78d6" rotulo="Em uso (posts, anexos e criativos)" valor={tamanho(emUso)} />
        <Cartao icone={Recycle} cor="#1baf7a" rotulo="Já liberado pelo ciclo" valor={tamanho(liberado)} />
        <Cartao icone={CalendarClock} cor="#eda100" rotulo="Sai nos próximos 7 dias" valor={`${s.semana.arquivos} arquivo(s) · ${tamanho(s.semana.bytes)}`} />
      </div>

      <Modulo icone={Recycle} titulo="Ciclo de renovação" descricao="Todo dia de madrugada a plataforma apaga os arquivos vencidos; o registro fica, com a marca de arquivado">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-rotulo">
            <thead>
              <tr className="border-b border-borda text-left text-legenda text-texto-3">
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Quando é apagado</th>
                <th className="py-2 pr-3 text-right font-medium">Em uso</th>
                <th className="py-2 text-right font-medium">Liberado</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(TIPOS_ARQUIVO) as TipoArquivo[]).map((t) => {
                const u = s.uso.find((x) => x.tipo === t)
                const l = s.liberado.find((x) => x.tipo === t)
                return (
                  <tr key={t} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3 font-semibold">{TIPOS_ARQUIVO[t].rotulo}</td>
                    <td className="py-2 pr-3 text-texto-2">{TIPOS_ARQUIVO[t].regra}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{u ? `${tamanho(u.bytes)} · ${u.arquivos}` : '—'}</td>
                    <td className="py-2 text-right tabular-nums text-sucesso-forte">{l ? tamanho(l.bytes) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-legenda text-texto-3">{NUNCA_APAGADOS} Toda segunda-feira admin e gestor recebem no sino o que sai na semana. O total exato do armazenamento (com blog e capas) fica no painel da Cloudflare → R2 → Metrics.</p>
      </Modulo>

      <Modulo icone={Archive} titulo="Saem nos próximos 30 dias" descricao="Baixe o que precisar guardar antes da data">
        {proximos.length === 0 ? (
          <p className="py-4 text-center text-rotulo text-texto-3">Nada para arquivar nos próximos 30 dias.</p>
        ) : (
          <ul className="divide-y divide-borda/60 text-rotulo">
            {proximos.map((p) => (
              <li key={`${p.tipo}${p.id}`} className="flex items-center gap-3 py-1.5">
                <span className="w-20 shrink-0 tabular-nums text-legenda text-texto-3">{data(p.venceEm)}</span>
                <span className="w-36 shrink-0 truncate text-legenda text-texto-2">{rotulo(p.tipo)}</span>
                <span className="min-w-0 flex-1 truncate" title={p.nome}>{p.nome}</span>
                <span className="tabular-nums text-legenda text-texto-3">{tamanho(p.bytes)}</span>
                <a href={p.url} className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto" aria-label={`Baixar ${p.nome}`} title="Baixar"><Download className="h-3.5 w-3.5" /></a>
              </li>
            ))}
          </ul>
        )}
        {s.proximos.length > proximos.length && <p className="mt-2 text-legenda text-texto-3">Mostrando os 100 primeiros de {s.proximos.length}.</p>}
      </Modulo>
    </div>
  )
}

function Cartao({ icone: Icone, cor, rotulo, valor }: { icone: typeof HardDrive; cor: string; rotulo: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-borda bg-white p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${cor}1f`, color: cor }}><Icone className="h-4 w-4" /></span>
      <div>
        <p className="text-micro text-texto-3">{rotulo}</p>
        <p className="text-destaque font-bold tabular-nums">{valor}</p>
      </div>
    </div>
  )
}
