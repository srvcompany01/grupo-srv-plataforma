'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Archive, Folder, List } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { rotuloMes } from '@/dominio/formatar'
import type { Estrutura as Dados } from '@/servicos/estrutura'
import { arquivarAcao, criarListaAcao, criarPastaAcao, renomearAcao } from './acoes'
import { NomeCliente } from '@/componentes/NomeCliente'

type Opcao = { id: string; nome: string }

function Nome({ tabela, id, nome }: { tabela: 'folders' | 'lists'; id: string; nome: string }) {
  const [valor, setValor] = useState(nome)
  const [, iniciar] = useTransition()
  return (
    <input
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => valor.trim() && valor !== nome && iniciar(async () => void avisar(await renomearAcao(tabela, id, valor)))}
      aria-label="Nome"
    />
  )
}

function Arquivar({ tabela, id, nome }: { tabela: 'folders' | 'lists'; id: string; nome: string }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  return (
    <button
      aria-label={`Arquivar ${nome}`}
      disabled={pendente}
      onClick={async () => (await confirmar({ titulo: `Arquivar "${nome}"?`, confirmar: 'Arquivar', perigo: true })) && iniciar(async () => void avisar(await arquivarAcao(tabela, id), true))}
    >
      <Archive />
    </button>
  )
}

export function Estrutura({ espacoId, dados, clientes }: { espacoId: string; dados: Dados; clientes: Opcao[] }) {
  const [estado, acao, criando] = useActionState(criarListaAcao.bind(null, espacoId), null)
  const [pasta, setPasta] = useState('')
  const [pendente, iniciar] = useTransition()

  const linhaLista = (l: Dados['listas'][number]) => (
    <div key={l.id}>
      <List />
      <Nome tabela="lists" id={l.id} nome={l.nome} />
      <span>
        {l.clienteNome && <NomeCliente nome={l.clienteNome} />}
        {l.mes && ` · ${rotuloMes(l.mes)}`}
      </span>
      <Link href={`/listas/${l.id}`}>
        abrir
      </Link>
      <Arquivar tabela="lists" id={l.id} nome={l.nome} />
    </div>
  )

  return (
    <div>
      <form action={acao}>
        <label>
          <span>Nova lista</span>
          <input name="nome" required placeholder="Ex.: Conteúdo Estratégico" />
        </label>
        <label>
          <span>Tag do cliente</span>
          <select name="clienteId" required defaultValue="">
            <option value="" disabled>
              Escolha a tag…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                @{c.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Pasta</span>
          <select name="pastaId" defaultValue="">
            <option value="">— nenhuma</option>
            {dados.pastas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Mês (opcional)</span>
          <input name="mes" type="month" />
        </label>
        <div>
          <button disabled={criando}>
            Criar lista
          </button>
          {estado?.erro && <p>{estado.erro}</p>}
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          iniciar(async () => {
            if (avisar(await criarPastaAcao(espacoId, pasta), true)) setPasta('')
          })
        }}
      >
        <input value={pasta} onChange={(e) => setPasta(e.target.value)} placeholder="Nova pasta (ex.: nome do cliente)" />
        <button disabled={pendente || !pasta.trim()}>
          Criar pasta
        </button>
      </form>

      <div>
        {dados.pastas.map((p) => (
          <div key={p.id}>
            <div>
              <Folder />
              <Nome tabela="folders" id={p.id} nome={p.nome} />
              <Arquivar tabela="folders" id={p.id} nome={p.nome} />
            </div>
            {dados.listas.filter((l) => l.pastaId === p.id).map(linhaLista)}
          </div>
        ))}
        {dados.listas.filter((l) => !l.pastaId).map(linhaLista)}
        {!dados.pastas.length && !dados.listas.length && <p>Nenhuma pasta ou lista ainda.</p>}
      </div>
    </div>
  )
}
