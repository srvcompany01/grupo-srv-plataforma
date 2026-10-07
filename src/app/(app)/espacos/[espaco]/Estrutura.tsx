'use client'

import { Archive, Folder, List } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { rotuloMes } from '@/dominio/formatar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { Estrutura as Dados } from '@/servicos/estrutura'
import { arquivarAcao, criarListaAcao, criarPastaAcao, renomearAcao } from './acoes'

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
      className="min-w-0 flex-1 rounded px-1 outline-none hover:bg-hover focus:bg-hover"
    />
  )
}

function Arquivar({ tabela, id, nome }: { tabela: 'folders' | 'lists'; id: string; nome: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button
      aria-label={`Arquivar ${nome}`}
      disabled={pendente}
      onClick={() => confirm(`Arquivar "${nome}"?`) && iniciar(async () => void avisar(await arquivarAcao(tabela, id), true))}
      className={botaoFantasma}
    >
      <Archive className="h-4 w-4" />
    </button>
  )
}

export function Estrutura({ espacoId, dados, clientes }: { espacoId: string; dados: Dados; clientes: Opcao[] }) {
  const [estado, acao, criando] = useActionState(criarListaAcao.bind(null, espacoId), null)
  const [pasta, setPasta] = useState('')
  const [pendente, iniciar] = useTransition()

  const linhaLista = (l: Dados['listas'][number]) => (
    <div key={l.id} className="flex items-center gap-2 border-t border-borda px-3 py-1.5 text-corpo">
      <List className="h-3.5 w-3.5 text-texto-3" />
      <Nome tabela="lists" id={l.id} nome={l.nome} />
      <span className="text-rotulo text-texto-3">
        {l.clienteNome}
        {l.mes && ` · ${rotuloMes(l.mes)}`}
      </span>
      <Link href={`/listas/${l.id}`} className="text-rotulo text-marca hover:underline">
        abrir
      </Link>
      <Arquivar tabela="lists" id={l.id} nome={l.nome} />
    </div>
  )

  return (
    <div className="space-y-4">
      <form action={acao} className="grid gap-3 rounded-lg border border-borda bg-white p-4 md:grid-cols-5">
        <label className="space-y-1 md:col-span-2">
          <span className={rotulo}>Nova lista</span>
          <input name="nome" required placeholder="Ex.: Conteúdo Estratégico" className={campo} />
        </label>
        <label className="space-y-1">
          <span className={rotulo}>Tag do cliente</span>
          <select name="clienteId" required defaultValue="" className={campo}>
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
        <label className="space-y-1">
          <span className={rotulo}>Pasta</span>
          <select name="pastaId" defaultValue="" className={campo}>
            <option value="">— nenhuma</option>
            {dados.pastas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotulo}>Mês (opcional)</span>
          <input name="mes" type="month" className={campo} />
        </label>
        <div className="flex items-center gap-3 md:col-span-5">
          <button disabled={criando} className={botaoPrimario}>
            Criar lista
          </button>
          {estado?.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          iniciar(async () => {
            if (avisar(await criarPastaAcao(espacoId, pasta), true)) setPasta('')
          })
        }}
        className="flex items-center gap-2"
      >
        <input value={pasta} onChange={(e) => setPasta(e.target.value)} placeholder="Nova pasta (ex.: nome do cliente)" className={`${campo} max-w-xs`} />
        <button disabled={pendente || !pasta.trim()} className={botaoSecundario}>
          Criar pasta
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-borda bg-white">
        {dados.pastas.map((p) => (
          <div key={p.id}>
            <div className="flex items-center gap-2 border-t border-borda bg-hover px-3 py-1.5 text-corpo font-medium first:border-t-0">
              <Folder className="h-3.5 w-3.5 text-texto-3" />
              <Nome tabela="folders" id={p.id} nome={p.nome} />
              <Arquivar tabela="folders" id={p.id} nome={p.nome} />
            </div>
            {dados.listas.filter((l) => l.pastaId === p.id).map(linhaLista)}
          </div>
        ))}
        {dados.listas.filter((l) => !l.pastaId).map(linhaLista)}
        {!dados.pastas.length && !dados.listas.length && <p className="px-3 py-2.5 text-corpo text-texto-3">Nenhuma pasta ou lista ainda.</p>}
      </div>
    </div>
  )
}
