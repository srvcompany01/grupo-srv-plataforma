'use client'

import { Pencil, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarLancamentoAcao, criarLancamentoAcao } from '@/app/(app)/financeiro/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { CATEGORIAS, ROTULO_TIPO, TIPOS_LANCAMENTO, type Lancamento, type TipoLancamento } from '@/dominio/financeiro'

const valorEmTexto = (centavos: number) => (centavos / 100).toFixed(2).replace('.', ',')

/** Cria um lançamento (ou edita, quando recebe `lancamento`). Despesas fixas podem repetir todo mês. */
export function LancamentoDialog({ lancamento, clientes, hoje, tipoInicial = 'entrada' }: { lancamento?: Lancamento; clientes: { id: string; nome: string }[]; hoje: string; tipoInicial?: TipoLancamento }) {
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<TipoLancamento>(lancamento?.tipo ?? tipoInicial)
  const [categoria, setCategoria] = useState(lancamento?.categoria ?? CATEGORIAS[lancamento?.tipo ?? tipoInicial][0])
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '')
  const [valor, setValor] = useState(lancamento ? valorEmTexto(lancamento.centavos) : '')
  const [data, setData] = useState(lancamento?.data ?? hoje)
  const [pago, setPago] = useState(lancamento?.pago ?? true)
  const [clienteId, setClienteId] = useState(lancamento?.clienteId ?? '')
  const [meses, setMeses] = useState(1)
  const [pendente, iniciar] = useTransition()

  const trocarTipo = (novo: TipoLancamento) => {
    setTipo(novo)
    if (!CATEGORIAS[novo].includes(categoria)) setCategoria(CATEGORIAS[novo][0])
  }
  const salvar = () =>
    iniciar(async () => {
      const dados = { tipo, categoria, descricao, valor, data, pago, clienteId: clienteId || null, repetirMeses: meses }
      const r = lancamento ? await atualizarLancamentoAcao(lancamento.id, dados) : await criarLancamentoAcao(dados)
      if (!avisar(r, true)) return
      setAberto(false)
      if (!lancamento) {
        setDescricao('')
        setValor('')
        setMeses(1)
      }
    })
  const categorias = CATEGORIAS[tipo].includes(categoria) ? CATEGORIAS[tipo] : [categoria, ...CATEGORIAS[tipo]]

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {lancamento ? (
        <DialogTrigger aria-label="Editar lançamento" title="Editar"><Pencil /></DialogTrigger>
      ) : (
        <DialogTrigger><Plus /> Novo lançamento</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lancamento ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          <DialogDescription>Entradas, despesas, custo de equipe, tráfego pago e o que mais entrar no caixa.</DialogDescription>
        </DialogHeader>
        <div>
          <div role="group" aria-label="Tipo">
            {TIPOS_LANCAMENTO.map((t) => (
              <button key={t} type="button" onClick={() => trocarTipo(t)} aria-pressed={tipo === t}>
                {ROTULO_TIPO[t]}
              </button>
            ))}
          </div>
          <div>
            <label>
              Valor (R$)
              <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1.500,00" autoFocus />
            </label>
            <label>
              Data
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </label>
          </div>
          <div>
            <label>
              Categoria
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Cliente (opcional)
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Nenhum</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          </div>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (ex.: Meta Ads — Padaria)" maxLength={200} />
          <label>
            <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} /> {tipo === 'entrada' ? 'Já recebido' : 'Já pago'}
          </label>
          {!lancamento && (
            <label>
              Repetir por
              <input type="number" min={1} max={36} value={meses} onChange={(e) => setMeses(Math.min(36, Math.max(1, Number(e.target.value) || 1)))} aria-label="Meses" />
              {meses > 1 ? 'meses (os próximos ficam pendentes)' : 'mês (sem repetir)'}
            </label>
          )}
        </div>
        <div>
          <button type="button" onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" disabled={pendente} onClick={salvar}>Salvar</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
