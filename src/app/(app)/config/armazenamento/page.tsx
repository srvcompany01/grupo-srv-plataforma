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
    return <p>Falta rodar a migração do ciclo de arquivos (20261024000058_ciclo_arquivos.sql) no Supabase.</p>
  }
  const emUso = s.uso.reduce((t, u) => t + u.bytes, 0)
  const liberado = s.liberado.reduce((t, u) => t + u.bytes, 0)
  const proximos = await Promise.all(s.proximos.slice(0, 100).map(async (p) => ({ ...p, url: await urlLeitura(p.chave, { download: p.nome }) })))

  return (
    <div>
      <div>
        <Cartao icone={HardDrive} cor="#2a78d6" rotulo="Em uso (posts, anexos e criativos)" valor={tamanho(emUso)} />
        <Cartao icone={Recycle} cor="#1baf7a" rotulo="Já liberado pelo ciclo" valor={tamanho(liberado)} />
        <Cartao icone={CalendarClock} cor="#eda100" rotulo="Sai nos próximos 7 dias" valor={`${s.semana.arquivos} arquivo(s) · ${tamanho(s.semana.bytes)}`} />
      </div>

      <Modulo icone={Recycle} titulo="Ciclo de renovação" descricao="Todo dia de madrugada a plataforma apaga os arquivos vencidos; o registro fica, com a marca de arquivado">
        <div>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quando é apagado</th>
                <th>Em uso</th>
                <th>Liberado</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(TIPOS_ARQUIVO) as TipoArquivo[]).map((t) => {
                const u = s.uso.find((x) => x.tipo === t)
                const l = s.liberado.find((x) => x.tipo === t)
                return (
                  <tr key={t}>
                    <td>{TIPOS_ARQUIVO[t].rotulo}</td>
                    <td>{TIPOS_ARQUIVO[t].regra}</td>
                    <td>{u ? `${tamanho(u.bytes)} · ${u.arquivos}` : '—'}</td>
                    <td>{l ? tamanho(l.bytes) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p>{NUNCA_APAGADOS} Toda segunda-feira admin e gestor recebem no sino o que sai na semana. O total exato do armazenamento (com blog e capas) fica no painel da Cloudflare → R2 → Metrics.</p>
      </Modulo>

      <Modulo icone={Archive} titulo="Saem nos próximos 30 dias" descricao="Baixe o que precisar guardar antes da data">
        {proximos.length === 0 ? (
          <p>Nada para arquivar nos próximos 30 dias.</p>
        ) : (
          <ul>
            {proximos.map((p) => (
              <li key={`${p.tipo}${p.id}`}>
                <span>{data(p.venceEm)}</span>
                <span>{rotulo(p.tipo)}</span>
                <span title={p.nome}>{p.nome}</span>
                <span>{tamanho(p.bytes)}</span>
                <a href={p.url} aria-label={`Baixar ${p.nome}`} title="Baixar"><Download /></a>
              </li>
            ))}
          </ul>
        )}
        {s.proximos.length > proximos.length && <p>Mostrando os 100 primeiros de {s.proximos.length}.</p>}
      </Modulo>
    </div>
  )
}

function Cartao({ icone: Icone, cor, rotulo, valor }: { icone: typeof HardDrive; cor: string; rotulo: string; valor: string }) {
  return (
    <div>
      <span style={{ background: `${cor}1f`, color: cor }}><Icone /></span>
      <div>
        <p>{rotulo}</p>
        <p>{valor}</p>
      </div>
    </div>
  )
}
