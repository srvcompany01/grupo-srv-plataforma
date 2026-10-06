'use client'

import { useActionState, useState } from 'react'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import { convidarUsuario } from './acoes'

type Opcao = { id: string; nome: string }

export function FormConvite({ clientes, espacos, clienteFixo }: { clientes: Opcao[]; espacos: Opcao[]; clienteFixo?: string }) {
  const [estado, acao, enviando] = useActionState(convidarUsuario, null)
  const [papel, setPapel] = useState(clienteFixo ? 'cliente' : 'membro')

  return (
    <form action={acao} className="space-y-3 rounded-lg border border-borda bg-white p-4">
      <h2 className="text-sm font-semibold">{clienteFixo ? 'Convidar usuário do cliente' : 'Convidar pessoa'}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className={rotulo}>Nome</span>
          <input name="nome" required className={campo} />
        </label>
        <label className="space-y-1">
          <span className={rotulo}>E-mail</span>
          <input name="email" type="email" required className={campo} />
        </label>
        {clienteFixo ? (
          <>
            <input type="hidden" name="papel" value="cliente" />
            <input type="hidden" name="clienteId" value={clienteFixo} />
          </>
        ) : (
          <label className="space-y-1">
            <span className={rotulo}>Papel</span>
            <select name="papel" value={papel} onChange={(e) => setPapel(e.target.value)} className={campo}>
              <option value="membro">Membro</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
              <option value="cliente">Cliente (portal)</option>
            </select>
          </label>
        )}
      </div>

      {!clienteFixo && papel === 'cliente' && (
        <label className="block space-y-1">
          <span className={rotulo}>Cliente</span>
          <select name="clienteId" required className={campo} defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {papel !== 'cliente' && papel !== 'admin' && (
        <fieldset className="space-y-1">
          <legend className={rotulo}>Departamentos</legend>
          <div className="grid gap-1 md:grid-cols-2">
            {espacos.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-[13px]">
                <select name="espaco" defaultValue="" className={`${campo} h-8 w-32 py-0 text-[13px]`}>
                  <option value="">—</option>
                  <option value={`${e.id}:membro`}>Membro</option>
                  <option value={`${e.id}:gestor`}>Gestor</option>
                </select>
                {e.nome}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {estado?.erro && <p className="text-sm text-rose-600">{estado.erro}</p>}
      {estado?.ok && <p className="text-sm text-emerald-700">{estado.ok}</p>}
      <button disabled={enviando} className={botaoPrimario}>
        {enviando ? 'Enviando…' : 'Enviar convite'}
      </button>
    </form>
  )
}
