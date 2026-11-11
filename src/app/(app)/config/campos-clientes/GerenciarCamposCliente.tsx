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
    <div>
      <p>Opções que cada cliente pode ter neste campo</p>
      {opcoes.length === 0 && <p>Nenhuma opção ainda. Adicione a primeira.</p>}
      {opcoes.map((o, i) => (
        <div key={i}>
          <input type="color" value={o.cor} onChange={(e) => trocar(i, { cor: e.target.value })} aria-label={`Cor de ${o.nome || 'opção'}`} />
          <input value={o.nome} onChange={(e) => trocar(i, { nome: e.target.value })} maxLength={40} placeholder="Nome da opção" autoComplete="off" />
          <button type="button" aria-label="Remover opção" onClick={() => setOpcoes(opcoes.filter((_, k) => k !== i))}><Trash2 /></button>
        </div>
      ))}
      <div>
        <button type="button" onClick={() => setOpcoes([...opcoes, { nome: '', cor: COR_OPCAO_PADRAO }])} disabled={opcoes.length >= 20}><Plus /> Adicionar opção</button>
        <button type="button" disabled={!mudou || pendente} onClick={() => iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { opcoes: opcoes.filter((o) => o.nome.trim()) }), true))}>Salvar opções</button>
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
    <li>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onBlur={salvarNome}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`Nome do campo ${campo.nome}`}
        maxLength={60}
        autoComplete="off"
      />
      <span>{rotuloTipo(campo.tipo)}</span>
      <label>
        <input
          type="checkbox"
          checked={campo.naCapa}
          disabled={pendente}
          onChange={(e) => iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { naCapa: e.target.checked }), true))}
        />
        Mostrar na galeria
      </label>
      <button
        type="button"
        disabled={pendente}
        onClick={async () => (await confirmar({ titulo: `Excluir o campo "${campo.nome}"?`, descricao: 'Os valores preenchidos nos clientes também serão apagados.', confirmar: 'Excluir', perigo: true })) && iniciar(async () => void avisar(await excluirCampoClienteAcao(campo.id), true))}
        aria-label={`Excluir campo ${campo.nome}`}
      >
        <Trash2 aria-hidden="true" />
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
    <section>
      <div>
        <h2>Campos de cliente</h2>
        <p>Crie os campos que quiser (por exemplo, Plano, Responsável ou Início do contrato). Os marcados aparecem no cartão de cada cliente na galeria. Os valores são preenchidos na página do cliente.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          iniciar(async () => {
            if (avisar(await criarCampoClienteAcao(nome, tipo, naCapa), true)) setNome('')
          })
        }}
      >
        <label>
          <span>Nome do campo</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="off" placeholder="Ex.: Plano contratado…" />
        </label>
        <label>
          <span>Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_CAMPO_CLIENTE.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={naCapa} onChange={(e) => setNaCapa(e.target.checked)} />
          Mostrar na galeria
        </label>
        <button disabled={pendente || !nome.trim()}>
          {pendente ? 'Criando…' : 'Criar campo'}
        </button>
      </form>

      {campos.length === 0 ? (
        <p>Nenhum campo criado ainda.</p>
      ) : (
        <ul>
          {campos.map((c) => (
            <LinhaCampo key={c.id} campo={c} />
          ))}
        </ul>
      )}
    </section>
  )
}
