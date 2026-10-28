'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Plus, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { COR_OPCAO_PADRAO, TIPOS_CAMPO_CLIENTE, type OpcaoCampoCliente } from '@/dominio/clientes-galeria'
import type { CampoCliente } from '@/servicos/clientes-galeria'
import { atualizarCampoClienteAcao, criarCampoClienteAcao, excluirCampoClienteAcao } from './acoes'

const rotuloTipo = (tipo: string) => TIPOS_CAMPO_CLIENTE.find((t) => t.tipo === tipo)?.rotulo ?? tipo

/** Opções de um campo de seleção (por exemplo, os níveis de risco de churn): nome e cor de cada uma. */
function EditorOpcoes({ campo }: { campo: CampoCliente }) {
  const [opcoes, setOpcoes] = useState<OpcaoCampoCliente[]>(campo.opcoes)
  const [pendente, iniciar] = useTransition()
  const mudou = JSON.stringify(opcoes) !== JSON.stringify(campo.opcoes)
  const trocar = (i: number, parte: Partial<OpcaoCampoCliente>) => setOpcoes(opcoes.map((o, k) => (k === i ? { ...o, ...parte } : o)))
  return (
    <div className="basis-full space-y-2 rounded-lg bg-fundo/60 p-3">
      <p className="text-legenda font-semibold text-texto-2">Opções que cada cliente pode ter neste campo</p>
      {opcoes.length === 0 && <p className="text-legenda text-texto-3">Nenhuma opção ainda. Adicione a primeira.</p>}
      {opcoes.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="color" value={o.cor} onChange={(e) => trocar(i, { cor: e.target.value })} aria-label={`Cor de ${o.nome || 'opção'}`} className="h-8 w-8 cursor-pointer rounded border border-borda bg-white p-0.5" />
          <input value={o.nome} onChange={(e) => trocar(i, { nome: e.target.value })} maxLength={40} placeholder="Nome da opção" autoComplete="off" className="h-8 min-w-0 flex-1 rounded-md border border-borda bg-white px-2 text-rotulo outline-none focus-visible:border-marca" />
          <button type="button" aria-label="Remover opção" onClick={() => setOpcoes(opcoes.filter((_, k) => k !== i))} className="rounded-md p-1.5 text-texto-3 hover:bg-perigo-fundo hover:text-perigo"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpcoes([...opcoes, { nome: '', cor: COR_OPCAO_PADRAO }])} disabled={opcoes.length >= 20} className="inline-flex h-8 items-center gap-1 rounded-md border border-borda bg-white px-2.5 text-legenda font-semibold text-texto-2 hover:bg-hover"><Plus className="h-3.5 w-3.5" /> Adicionar opção</button>
        <button type="button" disabled={!mudou || pendente} onClick={() => iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { opcoes: opcoes.filter((o) => o.nome.trim()) }), true))} className="h-8 rounded-md bg-marca px-3 text-legenda font-semibold text-claro hover:bg-marca-escura disabled:opacity-40">Salvar opções</button>
      </div>
    </div>
  )
}

function LinhaCampo({ campo }: { campo: CampoCliente }) {
  const [nome, setNome] = useState(campo.nome)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const salvarNome = () => {
    if (nome.trim() === campo.nome) return
    iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { nome }), true))
  }
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-borda px-3 py-2.5 first:border-t-0">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onBlur={salvarNome}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`Nome do campo ${campo.nome}`}
        maxLength={60}
        autoComplete="off"
        className="h-8 min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 text-corpo font-medium outline-none hover:border-borda focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20"
      />
      <span className="rounded-full bg-hover px-2 py-0.5 text-legenda text-texto-2">{rotuloTipo(campo.tipo)}</span>
      <label className="flex cursor-pointer items-center gap-2 text-legenda text-texto-2">
        <input
          type="checkbox"
          checked={campo.naCapa}
          disabled={pendente}
          onChange={(e) => iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { naCapa: e.target.checked }), true))}
          className="h-3.5 w-3.5 cursor-pointer accent-marca"
        />
        Mostrar na galeria
      </label>
      <button
        type="button"
        disabled={pendente}
        onClick={async () => (await confirmar({ titulo: `Excluir o campo "${campo.nome}"?`, descricao: 'Os valores preenchidos nos clientes também serão apagados.', confirmar: 'Excluir', perigo: true })) && iniciar(async () => void avisar(await excluirCampoClienteAcao(campo.id), true))}
        aria-label={`Excluir campo ${campo.nome}`}
        className="rounded-md p-1.5 text-texto-3 transition-colors hover:bg-perigo-fundo hover:text-perigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      {campo.tipo === 'selecao' && <EditorOpcoes campo={campo} />}
    </li>
  )
}

export function GerenciarCamposCliente({ campos }: { campos: CampoCliente[] }) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('texto')
  const [naCapa, setNaCapa] = useState(true)
  const [pendente, iniciar] = useTransition()

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-destaque font-semibold">Campos de cliente</h2>
        <p className="mt-1 text-rotulo text-texto-2">Crie os campos que quiser (por exemplo, Plano, Responsável ou Início do contrato). Os marcados aparecem no cartão de cada cliente na galeria. Os valores são preenchidos na página do cliente.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          iniciar(async () => {
            if (avisar(await criarCampoClienteAcao(nome, tipo, naCapa), true)) setNome('')
          })
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-borda p-3"
      >
        <label className="block min-w-48 flex-1">
          <span className="mb-1 block text-legenda font-semibold text-texto-2">Nome do campo</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="off" placeholder="Ex.: Plano contratado…" className="h-9 w-full rounded-lg border border-borda bg-white px-3 text-rotulo outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20" />
        </label>
        <label className="block">
          <span className="mb-1 block text-legenda font-semibold text-texto-2">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-9 rounded-lg border border-borda bg-white px-2 text-rotulo outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20">
            {TIPOS_CAMPO_CLIENTE.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex h-9 cursor-pointer items-center gap-2 text-legenda text-texto-2">
          <input type="checkbox" checked={naCapa} onChange={(e) => setNaCapa(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-marca" />
          Mostrar na galeria
        </label>
        <button disabled={pendente || !nome.trim()} className="h-9 rounded-lg bg-marca px-4 text-rotulo font-semibold text-claro transition-colors hover:bg-marca-escura disabled:opacity-40">
          {pendente ? 'Criando…' : 'Criar campo'}
        </button>
      </form>

      {campos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda px-4 py-8 text-center text-rotulo text-texto-3">Nenhum campo criado ainda.</p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-borda bg-white">
          {campos.map((c) => (
            <LinhaCampo key={c.id} campo={c} />
          ))}
        </ul>
      )}
    </section>
  )
}
