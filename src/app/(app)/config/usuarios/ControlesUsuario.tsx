'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import type { PapelUsuario } from '@/dominio/acesso'
import { botaoFantasma, campo } from '@/lib/ui'
import type { Resultado } from '@/servicos/acao'
import { alterarPapel, definirAtivo } from './acoes'

export function avisar(r: Resultado) {
  if (r?.erro) toast.error(r.erro)
  else if (r?.ok) toast.success(r.ok)
}

export function ControlesUsuario({ id, papel, ativo }: { id: string; papel: PapelUsuario; ativo: boolean }) {
  const [pendente, iniciar] = useTransition()
  return (
    <div className="flex items-center justify-end gap-2">
      {papel !== 'cliente' && (
        <select
          aria-label="Papel"
          defaultValue={papel}
          disabled={pendente}
          onChange={(e) => iniciar(async () => avisar(await alterarPapel(id, e.target.value as PapelUsuario)))}
          className={`${campo} h-8 w-28 py-0 text-[13px]`}
        >
          <option value="admin">Admin</option>
          <option value="gestor">Gestor</option>
          <option value="membro">Membro</option>
        </select>
      )}
      <button
        disabled={pendente}
        onClick={() => iniciar(async () => avisar(await definirAtivo(id, !ativo)))}
        className={botaoFantasma}
      >
        {ativo ? 'Desativar' : 'Reativar'}
      </button>
    </div>
  )
}
