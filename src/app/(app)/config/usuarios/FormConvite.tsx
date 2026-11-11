'use client'

import { useActionState, useState } from 'react'
import { convidarUsuario } from './acoes'

type Opcao = { id: string; nome: string }

export function FormConvite({ clientes, espacos, clienteFixo }: { clientes: Opcao[]; espacos: Opcao[]; clienteFixo?: string }) {
  const [estado, acao, enviando] = useActionState(convidarUsuario, null)
  const [papel, setPapel] = useState(clienteFixo ? 'cliente' : 'membro')

  return (
    <form action={acao}>
      <h2>{clienteFixo ? 'Convidar usuário do cliente' : 'Convidar pessoa'}</h2>
      <div>
        <label>
          <span>Nome</span>
          <input name="nome" required />
        </label>
        <label>
          <span>E-mail</span>
          <input name="email" type="email" required />
        </label>
        {clienteFixo ? (
          <>
            <input type="hidden" name="papel" value="cliente" />
            <input type="hidden" name="clienteId" value={clienteFixo} />
          </>
        ) : (
          <label>
            <span>Papel</span>
            <select name="papel" value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option value="membro">Membro</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
              <option value="cliente">Cliente (portal)</option>
            </select>
          </label>
        )}
      </div>

      {!clienteFixo && papel === 'cliente' && (
        <label>
          <span>Cliente</span>
          <select name="clienteId" required defaultValue="">
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
        <fieldset>
          <legend>Departamentos</legend>
          <div>
            {espacos.map((e) => (
              <label key={e.id}>
                <select name="espaco" defaultValue="">
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

      {estado?.erro && <p>{estado.erro}</p>}
      {estado?.ok && <p>{estado.ok}</p>}
      <button disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar convite'}
      </button>
    </form>
  )
}
