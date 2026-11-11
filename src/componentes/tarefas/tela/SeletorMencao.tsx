'use client'

import { Avatar } from '@/componentes/Avatar'

export type PessoaMencao = { id: string; nome: string; avatar: string | null }

/** Remove acentos e caixa para comparar nomes. */
export function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filtrarPessoas(pessoas: PessoaMencao[], consulta: string): PessoaMencao[] {
  const q = semAcento(consulta)
  return pessoas.filter((p) => semAcento(p.nome).includes(q)).slice(0, 6)
}

/** Lista flutuante; o teclado (setas/Enter/Esc) é tratado pela caixa, que mantém o foco na textarea. */
export function SeletorMencao({ pessoas, indice, aoEscolher }: { pessoas: PessoaMencao[]; indice: number; aoEscolher: (p: PessoaMencao) => void }) {
  return (
    <ul role="listbox" aria-label="Mencionar pessoa">
      {pessoas.length === 0 && <li>Ninguém encontrado</li>}
      {pessoas.map((p, i) => (
        <li key={p.id} role="option" aria-selected={i === indice}>
          <button
            type="button"
            // mousedown evita tirar o foco da textarea antes do clique.
            onMouseDown={(e) => {
              e.preventDefault()
              aoEscolher(p)
            }}
          >
            <Avatar nome={p.nome} tamanho="h-5 w-5 text-legenda" />
            <span>{p.nome}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
