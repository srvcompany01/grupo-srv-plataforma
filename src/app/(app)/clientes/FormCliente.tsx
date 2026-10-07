'use client'

import { useActionState } from 'react'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import type { Resultado } from '@/servicos/acao'
import type { Cliente } from '@/servicos/clientes-plataforma'

type Acao = (estado: Resultado, form: FormData) => Promise<Resultado>

export function FormCliente({ acao, cliente, podeEditar }: { acao: Acao; cliente?: Cliente; podeEditar: boolean }) {
  const [estado, enviar, enviando] = useActionState(acao, null)
  const c = (rotuloCampo: string, nome: string, valor?: string | null, tipo = 'text') => (
    <label className="space-y-1">
      <span className={rotulo}>{rotuloCampo}</span>
      <input name={nome} type={tipo} defaultValue={valor ?? ''} disabled={!podeEditar} className={campo} />
    </label>
  )
  return (
    <form action={enviar} className="space-y-3 rounded-lg border border-borda bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {c('Nome', 'nome', cliente?.nome)}
        {c('Razão social', 'razaoSocial', cliente?.razaoSocial)}
        {c('CNPJ / CPF', 'documento', cliente?.documento)}
        {c('E-mail', 'email', cliente?.email, 'email')}
        {c('Telefone', 'telefone', cliente?.telefone)}
        <label className="space-y-1">
          <span className={rotulo}>Status</span>
          <select name="status" defaultValue={cliente?.status ?? 'ativo'} disabled={!podeEditar} className={campo}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </label>
      </div>
      {estado?.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
      {estado?.ok && <p className="text-sm text-sucesso-forte">{estado.ok}</p>}
      {podeEditar && (
        <button disabled={enviando} className={botaoPrimario}>
          {cliente ? 'Salvar' : 'Cadastrar cliente'}
        </button>
      )}
    </form>
  )
}
