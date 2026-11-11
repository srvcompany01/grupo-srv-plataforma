'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { ArrowDown, ArrowUp, Archive, X } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'
import { avisar } from '../usuarios/ControlesUsuario'
import type { EspacoComMembros } from '@/servicos/espacos'
import { adicionarMembroEspaco, arquivarEspaco, criarEspaco, moverEspaco, removerMembroEspaco, renomearEspaco } from './acoes'

type Pessoa = { id: string; nome: string }

export function FormNovoEspaco({ pais }: { pais: Pessoa[] }) {
  const [estado, acao, enviando] = useActionState(criarEspaco, null)
  return (
    <form action={acao}>
      <label>
        <span>Novo departamento</span>
        <input name="nome" required placeholder="Ex.: Design" />
      </label>
      <label>
        <span>Dentro de</span>
        <select name="paiId" defaultValue="">
          <option value="">— (principal)</option>
          {pais.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Cor</span>
        <input name="cor" type="color" defaultValue="#7b68ee" />
      </label>
      <button disabled={enviando}>
        Criar
      </button>
      {estado?.erro && <p>{estado.erro}</p>}
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
    <div>
      <div>
        <span style={{ background: espaco.cor }} />
        {fixo ? (
          <p>{espaco.nome}</p>
        ) : (
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => nome !== espaco.nome && rodar(() => renomearEspaco(espaco.id, nome))}
            aria-label="Nome do departamento"
          />
        )}
        {!fixo && <button aria-label="Subir" disabled={pendente} onClick={() => rodar(() => moverEspaco(espaco.id, -1))}>
          <ArrowUp />
        </button>}
        {!fixo && <button aria-label="Descer" disabled={pendente} onClick={() => rodar(() => moverEspaco(espaco.id, 1))}>
          <ArrowDown />
        </button>}
        {!fixo && <button
          aria-label="Arquivar"
          disabled={pendente}
          onClick={async () => (await confirmar({ titulo: `Arquivar "${espaco.nome}"?`, descricao: 'Ele some da navegação.', confirmar: 'Arquivar', perigo: true })) && rodar(() => arquivarEspaco(espaco.id))}
        >
          <Archive />
        </button>}
      </div>
      {fixo && <p>Área fixa, aberta a toda a equipe. Gestores (papel) já gerenciam; use os membros abaixo para promover mais alguém a gestor desta área.</p>}
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
      <div>
        {espaco.membros.length === 0 && <span>Sem membros.</span>}
        {espaco.membros.map((m) => (
          <span key={m.id}>
            {m.nome}
            {m.papel === 'gestor' && <span>· gestor</span>}
            {(podePromover || m.papel === 'membro') && (
              <button
                aria-label={`Remover ${m.nome}`}
                disabled={pendente}
                onClick={() => rodar(() => removerMembroEspaco(espaco.id, m.id))}
              >
                <X />
              </button>
            )}
          </span>
        ))}
      </div>
      {fora.length > 0 && (
        <div>
          <select value={novo} onChange={(e) => setNovo(e.target.value)} aria-label="Pessoa">
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
          >
            Adicionar
          </button>
        </div>
      )}
    </>
  )
}
