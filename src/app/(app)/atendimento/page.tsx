import { Clock } from 'lucide-react'
import Link from 'next/link'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { IconeWhatsapp } from '@/componentes/IconeWhatsapp'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataDeHoje } from '@/dominio/filtros'
import { consultaPeriodo, lerPeriodo } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { horarioDoCliente } from '@/servicos/atendimento'
import { HorarioAtendimento } from './HorarioAtendimento'
import { Qualidade } from './Qualidade'

// Analisar conversas com a IA leva alguns segundos por conversa.
export const maxDuration = 120
import { Aviso, AtendimentoCliente } from '../performance/canais'

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Atendimento no WhatsApp de cada cliente (dados do Kommo): tempos de resposta, conversas, vendas e origem. */
export default async function Atendimento({ searchParams }: PageProps<'/atendimento'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const q = consultaPeriodo(periodo)

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">WhatsApp via Kommo</p>
          <h1 className="page-title mt-1">Atendimento</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente base="/atendimento" clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={q} />
          {escolhido && <SeletorPeriodo base={`/atendimento?cliente=${escolhido.id}`} periodo={periodo} hoje={hoje} />}
        </div>
      </div>
      {escolhido ? (
        <>
          <AtendimentoCliente c={escolhido} periodo={periodo} />
          <Qualidade clienteId={escolhido.id} periodo={periodo} />
          <Modulo icone={Clock} titulo="Horário de atendimento" descricao="O tempo de resposta e os avisos de conversa sem resposta contam só dentro deste expediente">
            <HorarioAtendimento key={escolhido.id} clienteId={escolhido.id} horario={await horarioDoCliente(sb, escolhido.id)} podeEditar={eu.papel === 'admin' || eu.papel === 'gestor'} />
          </Modulo>
        </>
      ) : (
        <Modulo icone={IconeWhatsapp} titulo="Escolha um cliente" descricao="Conversas, tempo de resposta, vendas e origem do WhatsApp de cada cliente">
          {clientes.length === 0 ? <Aviso>Nenhum cliente ativo.</Aviso> : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {clientes.map((c) => (
                <li key={c.id}>
                  <Link href={`/atendimento?cliente=${c.id}${q ? `&${q}` : ''}`} className="flex items-center justify-between gap-2 rounded-xl border border-borda bg-white px-3 py-2.5 hover:bg-hover">
                    <NomeCliente nome={c.nome} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Modulo>
      )}
    </div>
  )
}
