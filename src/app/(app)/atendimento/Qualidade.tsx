import { Sparkles } from 'lucide-react'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { Modulo } from '@/componentes/Modulo'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { rotuloPeriodo } from '@/dominio/periodo-anuncios'
import { analisarQualidade, ROTULO_RESULTADO } from '@/dominio/qualidade-atendimento'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { iaDoAtendimentoConfigurada, qualidadeDoCliente } from '@/servicos/atendimento-ia'
import { AnalisarAgora } from './AnalisarAgora'

const n = (v: number) => v.toLocaleString('pt-BR')
const lista = (itens: { texto: string; conversas: number }[]) => (
  <ul className="space-y-1 text-rotulo">{itens.map((i) => <li key={i.texto} className="flex justify-between gap-3"><span className="text-texto-2">{i.texto}</span><span className="tabular-nums"><strong>{n(i.conversas)}</strong> conversas</span></li>)}</ul>
)

/** Auditoria da IA: nota média, objeções, motivos de perda, ajustes mais repetidos e a lista de conversas analisadas. */
export async function Qualidade({ clienteId, periodo }: { clienteId: string; periodo: PeriodoAnuncios }) {
  const sb = await criarClienteServidor()
  const { resumo: r, conversas } = await qualidadeDoCliente(sb, clienteId, periodo.de, periodo.ate)
  return (
    <>
      <Modulo icone={Sparkles} titulo="Qualidade do atendimento (IA)" descricao={`${rotuloPeriodo(periodo)} · a IA lê as conversas e avalia; o texto já vem sem telefone, CPF e e-mail`} acoes={iaDoAtendimentoConfigurada() ? <AnalisarAgora clienteId={clienteId} /> : undefined}>
        {!r.total ? <p className="rounded-xl border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">Nenhuma conversa analisada neste período. Use &quot;Analisar conversas recentes&quot;; a rotina diária também analisa sozinha.</p> : (
          <div className="space-y-4">
            <Numeros itens={[
              { rotulo: 'Nota média', valor: `${r.notaMedia}/100`, extra: `${n(r.total)} conversas analisadas`, icone: Sparkles, cor: '#6250d6' },
              { rotulo: 'Vendas', valor: n(r.porResultado.venda), extra: `${n(r.porResultado.perdido)} perdidas · ${n(r.porResultado.em_andamento)} em andamento`, icone: Sparkles, cor: '#1baf7a' },
              { rotulo: 'Sem resposta', valor: n(r.porResultado.sem_resposta), icone: Sparkles, cor: '#eb6834' },
            ]} />
            <div className="grid gap-4 md:grid-cols-3">
              <div><h3 className="mb-1.5 text-rotulo font-semibold">Objeções mais comuns</h3>{r.objecoes.length ? lista(r.objecoes) : <p className="text-legenda text-texto-3">Nenhuma registrada.</p>}</div>
              <div><h3 className="mb-1.5 text-rotulo font-semibold">Motivos de perda</h3>{r.motivosDePerda.length ? lista(r.motivosDePerda) : <p className="text-legenda text-texto-3">Nenhum registrado.</p>}</div>
              <div><h3 className="mb-1.5 text-rotulo font-semibold">O que melhorar</h3>{r.melhorias.length ? lista(r.melhorias) : <p className="text-legenda text-texto-3">Nenhuma sugestão repetida.</p>}</div>
            </div>
          </div>
        )}
      </Modulo>
      {r.total > 0 && (
        <>
          <Modulo icone={Sparkles} titulo="Insights da auditoria" descricao="O que a análise mostra e o que fazer"><BlocoAnalise analise={analisarQualidade(r)} /></Modulo>
          <Modulo icone={Sparkles} titulo="Conversas analisadas" descricao="As mais recentes primeiro">
            <ul className="divide-y divide-borda/60">
              {conversas.slice(0, 30).map((c) => (
                <li key={c.talkId} className="space-y-1 py-2.5 text-rotulo">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{new Date(c.conversaEm).toLocaleString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {ROTULO_RESULTADO[c.resultado]}</span>
                    <span className="tabular-nums text-texto-2">nota <strong className="text-texto">{c.nota}</strong> · {c.mensagens} mensagens</span>
                  </div>
                  {c.resumo && <p className="text-texto-2">{c.resumo}</p>}
                  {c.objecoes.length > 0 && <p className="text-legenda text-texto-3">Objeções: {c.objecoes.join(', ')}</p>}
                  {c.melhorias.length > 0 && <p className="text-legenda text-texto-3">Melhorar: {c.melhorias.join('; ')}</p>}
                </li>
              ))}
            </ul>
          </Modulo>
        </>
      )}
    </>
  )
}
