import { Coins, ExternalLink, HardDrive } from 'lucide-react'
import { Modulo } from '@/componentes/Modulo'
import { tamanho } from '@/dominio/ciclo-arquivos'
import { ROTULO_SITUACAO, SERVICOS_DE_CUSTO, type SituacaoCusto } from '@/dominio/custos'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { situacaoArmazenamento } from '@/servicos/ciclo-arquivos'

const COR: Record<SituacaoCusto, string> = { gratis: 'var(--ok)', gratis_ate_limite: '#e08a00', pago: 'var(--red)', depende_do_plano: 'var(--client)' }
const LIMITE_R2 = 10e9

/** Custos e usos: cada serviço que a plataforma usa, o que é grátis e até onde, e o consumo que dá para medir daqui. */
export default async function Custos() {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const [armazenamento, caixa] = await Promise.all([
    situacaoArmazenamento().catch(() => null),
    sb.from('content_inbox').select('size_bytes').neq('status', 'usado').then((r) => r.data ?? []),
  ])
  const emUso = armazenamento?.uso.reduce((t, u) => t + u.bytes, 0) ?? 0
  const naCaixa = caixa.reduce((t, c) => t + Number(c.size_bytes), 0)
  const r2 = emUso + naCaixa
  const pct = Math.min(100, (r2 / LIMITE_R2) * 100)
  const contagem = (s: SituacaoCusto) => SERVICOS_DE_CUSTO.filter((x) => x.situacao === s).length

  return (
    <div>
      <p>
        Os limites abaixo são <strong>valores de referência</strong> de cada fornecedor e mudam com o tempo. Eu não consigo ver o seu plano nem a sua fatura: para o valor real, abra o painel de cada serviço pelo link.
      </p>

      <div>
        {(Object.keys(ROTULO_SITUACAO) as SituacaoCusto[]).map((s) => (
          <div key={s}>
            <p>{ROTULO_SITUACAO[s]}</p>
            <p style={{ color: COR[s] }}>{contagem(s)} serviço(s)</p>
          </div>
        ))}
      </div>

      <Modulo icone={HardDrive} titulo="O que dá para medir daqui: armazenamento (Cloudflare R2)" descricao="Posts, anexos, criativos e a caixa de entrada, contra os 10 GB grátis de referência">
        <div>
          <div>
            <span><strong>{tamanho(r2)}</strong> em uso de ~10 GB grátis ({pct.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%)</span>
            <span>arquivos dos posts e anexos: {tamanho(emUso)} · caixa de entrada: {tamanho(naCaixa)}</span>
          </div>
          <div><div style={{ width: `${pct}%`, background: pct > 80 ? 'var(--red)' : pct > 60 ? '#e08a00' : 'var(--ok)' }} /></div>
          <p>O áudio extraído dos vídeos e as cópias de segurança não entram nessa conta. Os outros serviços não têm medidor aqui: use o painel de cada um.</p>
        </div>
      </Modulo>

      <Modulo icone={Coins} titulo="Todos os serviços da plataforma" descricao="O que é grátis, até onde, e o que passa a custar">
        <div>
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Situação</th>
                <th>O que é grátis</th>
                <th>Depois do limite</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {SERVICOS_DE_CUSTO.map((s) => (
                <tr key={s.id}>
                  <td><p>{s.nome}</p><p>{s.paraQue}</p></td>
                  <td><span style={{ color: COR[s.situacao], background: `color-mix(in srgb, ${COR[s.situacao]} 14%, transparent)` }}>{ROTULO_SITUACAO[s.situacao]}</span></td>
                  <td>{s.gratis}</td>
                  <td>{s.depois}</td>
                  <td><a href={s.painel} target="_blank" rel="noreferrer">Painel <ExternalLink /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modulo>
    </div>
  )
}
