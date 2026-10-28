'use client'

import { Pencil, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarLancamentoAcao, criarLancamentoAcao } from '@/app/(app)/financeiro/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { CATEGORIAS, ROTULO_TIPO, TIPOS_LANCAMENTO, type Lancamento, type TipoLancamento } from '@/dominio/financeiro'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'

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
        <DialogTrigger aria-label="Editar lançamento" title="Editar" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto"><Pencil className="h-3.5 w-3.5" /></DialogTrigger>
      ) : (
        <DialogTrigger className={botaoPrimario}><Plus className="h-3.5 w-3.5" /> Novo lançamento</DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lancamento ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          <DialogDescription>Entradas, despesas, custo de equipe, tráfego pago e o que mais entrar no caixa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-fundo p-1" role="group" aria-label="Tipo">
            {TIPOS_LANCAMENTO.map((t) => (
              <button key={t} type="button" onClick={() => trocarTipo(t)} aria-pressed={tipo === t} className={`h-8 rounded-md text-rotulo font-semibold ${tipo === t ? (t === 'entrada' ? 'bg-sucesso text-claro' : 'bg-perigo text-claro') : 'text-texto-2 hover:bg-hover'}`}>
                {ROTULO_TIPO[t]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-legenda text-texto-3">
              Valor (R$)
              <input className={`${campo} h-9`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1.500,00" autoFocus />
            </label>
            <label className="space-y-1 text-legenda text-texto-3">
              Data
              <input type="date" className={`${campo} h-9`} value={data} onChange={(e) => setData(e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-legenda text-texto-3">
              Categoria
              <select className={`${campo} h-9`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-legenda text-texto-3">
              Cliente (opcional)
              <select className={`${campo} h-9`} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Nenhum</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          </div>
          <input className={`${campo} h-9`} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (ex.: Meta Ads — Padaria)" maxLength={200} />
          <label className="flex items-center gap-2 text-rotulo">
            <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} /> {tipo === 'entrada' ? 'Já recebido' : 'Já pago'}
          </label>
          {!lancamento && (
            <label className="flex items-center gap-2 text-rotulo text-texto-2">
              Repetir por
              <input type="number" min={1} max={36} value={meses} onChange={(e) => setMeses(Math.min(36, Math.max(1, Number(e.target.value) || 1)))} className={`${campo} h-8 w-16 px-2`} aria-label="Meses" />
              {meses > 1 ? 'meses (os próximos ficam pendentes)' : 'mês (sem repetir)'}
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" className={botaoPrimario} disabled={pendente} onClick={salvar}>Salvar</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
