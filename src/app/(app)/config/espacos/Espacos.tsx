'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { ArrowDown, ArrowUp, Archive, X } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'
import { avisar } from '../usuarios/ControlesUsuario'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { EspacoComMembros } from '@/servicos/espacos'
import { adicionarMembroEspaco, arquivarEspaco, criarEspaco, moverEspaco, removerMembroEspaco, renomearEspaco } from './acoes'

type Pessoa = { id: string; nome: string }

export function FormNovoEspaco({ pais }: { pais: Pessoa[] }) {
  const [estado, acao, enviando] = useActionState(criarEspaco, null)
  return (
    <form action={acao} className="flex flex-wrap items-end gap-3 rounded-lg border border-borda bg-white p-4">
      <label className="min-w-48 flex-1 space-y-1">
        <span className={rotulo}>Novo departamento</span>
        <input name="nome" required placeholder="Ex.: Design" className={campo} />
      </label>
      <label className="space-y-1">
        <span className={rotulo}>Dentro de</span>
        <select name="paiId" className={campo} defaultValue="">
          <option value="">— (principal)</option>
          {pais.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className={rotulo}>Cor</span>
        <input name="cor" type="color" defaultValue="#7b68ee" className="block h-9 w-12 rounded border border-borda" />
      </label>
      <button disabled={enviando} className={`${botaoPrimario} h-9`}>
        Criar
      </button>
      {estado?.erro && <p className="w-full text-sm text-perigo">{estado.erro}</p>}
    </form>
  )
}

/** `fixo`: área fixa da plataforma (não renomeia, não reordena, não arquiva). */
export function CartaoEspaco({ espaco, equipe, fixo = false }: { espaco: EspacoComMembros; equipe: Pessoa[]; fixo?: boolean }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const [nome, setNome] = useState(espaco.nome)
  const rodar = (fn: () => Promise<Parameters<typeof avisar>[0]>) => iniciar(async () => avisar(await fn()))

  return (
    <div className="rounded-lg border border-borda bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm" style={{ background: espaco.cor }} />
        {fixo ? (
          <p className="flex-1 px-1 py-0.5 text-sm font-semibold">{espaco.nome}</p>
        ) : (
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => nome !== espaco.nome && rodar(() => renomearEspaco(espaco.id, nome))}
            aria-label="Nome do departamento"
            className="flex-1 rounded px-1 py-0.5 text-sm font-semibold outline-none hover:bg-hover focus:bg-hover"
          />
        )}
        {!fixo && <button aria-label="Subir" disabled={pendente} onClick={() => rodar(() => moverEspaco(espaco.id, -1))} className={botaoFantasma}>
          <ArrowUp className="h-4 w-4" />
        </button>}
        {!fixo && <button aria-label="Descer" disabled={pendente} onClick={() => rodar(() => moverEspaco(espaco.id, 1))} className={botaoFantasma}>
          <ArrowDown className="h-4 w-4" />
        </button>}
        {!fixo && <button
          aria-label="Arquivar"
          disabled={pendente}
          onClick={async () => (await confirmar({ titulo: `Arquivar "${espaco.nome}"?`, descricao: 'Ele some da navegação.', confirmar: 'Arquivar', perigo: true })) && rodar(() => arquivarEspaco(espaco.id))}
          className={botaoFantasma}
        >
          <Archive className="h-4 w-4" />
        </button>}
      </div>
      {fixo && <p className="mt-1 text-rotulo text-texto-3">Área fixa, aberta a toda a equipe. Gestores (papel) já gerenciam; use os membros abaixo para promover mais alguém a gestor desta área.</p>}
      <MembrosEspaco espaco={espaco} equipe={equipe} podePromover />
    </div>
  )
}

export function MembrosEspaco({ espaco, equipe, podePromover }: { espaco: EspacoComMembros; equipe: Pessoa[]; podePromover: boolean }) {
  const [pendente, iniciar] = useTransition()
  const [novo, setNovo] = useState('')
  const [papelNovo, setPapelNovo] = useState<'membro' | 'gestor'>('membro')
  const fora = equipe.filter((p) => !espaco.membros.some((m) => m.id === p.id))
  const rodar = (fn: () => Promise<Parameters<typeof avisar>[0]>) => iniciar(async () => avisar(await fn()))
  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {espaco.membros.length === 0 && <span className="text-corpo text-texto-3">Sem membros.</span>}
        {espaco.membros.map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-rotulo">
            {m.nome}
            {m.papel === 'gestor' && <span className="text-marca">· gestor</span>}
            {(podePromover || m.papel === 'membro') && (
              <button
                aria-label={`Remover ${m.nome}`}
                disabled={pendente}
                onClick={() => rodar(() => removerMembroEspaco(espaco.id, m.id))}
                className="rounded-full p-0.5 hover:bg-ink/10"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {fora.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <select value={novo} onChange={(e) => setNovo(e.target.value)} aria-label="Pessoa" className={`${campo} h-8 py-0 text-corpo`}>
            <option value="">Adicionar pessoa…</option>
            {fora.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {podePromover && (
            <select
              value={papelNovo}
              onChange={(e) => setPapelNovo(e.target.value as 'membro' | 'gestor')}
              aria-label="Papel no departamento"
              className={`${campo} h-8 w-28 py-0 text-corpo`}
            >
              <option value="membro">Membro</option>
              <option value="gestor">Gestor</option>
            </select>
          )}
          <button
            disabled={!novo || pendente}
            onClick={() =>
              rodar(async () => {
                const r = await adicionarMembroEspaco(espaco.id, novo, papelNovo)
                setNovo('')
                return r
              })
            }
            className={botaoSecundario}
          >
            Adicionar
          </button>
        </div>
      )}
    </>
  )
}
