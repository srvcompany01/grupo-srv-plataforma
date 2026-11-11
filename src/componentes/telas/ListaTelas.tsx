'use client'

import { Plus, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarTelaAcao, excluirTelaAcao } from '@/app/(app)/telas/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import type { ResumoTela, TipoTela } from '@/servicos/telas'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Belem' })
const TEXTOS = {
  quadro: { base: '/quadros', novo: 'Novo quadro', vazio: 'Nenhum quadro ainda. Crie o primeiro para brainstorms, mapas e ideias soltas.', nome: 'Quadro sem título' },
  funil: { base: '/funis', novo: 'Novo funil', vazio: 'Nenhum funil ainda. Comece de um modelo pronto ou em branco.', nome: 'Funil sem título' },
} as const

/** Lista de quadros ou funis, com criar e excluir. Só o dono (ou o admin) consegue excluir: o banco decide. */
export function ListaTelas({ tipo, telas, euId }: { tipo: TipoTela; telas: ResumoTela[]; euId: string }) {
  const t = TEXTOS[tipo]
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [erroCriar, setErroCriar] = useState(false)

  const criar = (modelo: boolean) =>
    iniciar(async () => {
      const r = await criarTelaAcao(tipo, t.nome, modelo)
      setErroCriar(!avisar(r))
      if (r?.id) router.push(`${t.base}/${r.id}`)
    })
  const excluir = async (tela: ResumoTela) => {
    if (!(await confirmar({ titulo: `Excluir "${tela.titulo}"?`, descricao: 'Tudo o que está nele será apagado e não dá para recuperar.', confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await excluirTelaAcao(tipo, tela.id), true)) router.refresh()
    })
  }

  return (
    <>
      <div>
        <button type="button" disabled={pendente} onClick={() => criar(false)}><Plus /> {t.novo}</button>
        {tipo === 'funil' && <button type="button" disabled={pendente} onClick={() => criar(true)}><Sparkles /> Começar de um modelo</button>}
        {erroCriar && <span>Não foi possível criar.</span>}
      </div>
      {telas.length === 0 ? (
        <p>{t.vazio}</p>
      ) : (
        <ul>
          {telas.map((tela) => (
            <li key={tela.id}>
              <Link href={`${t.base}/${tela.id}`}>
                <span>{tela.titulo}</span>
                <span>{tela.donoNome ?? '—'} · atualizado em {dia.format(new Date(tela.atualizadoEm))}</span>
              </Link>
              {(tela.donoId === euId) && (
                <button type="button" disabled={pendente} onClick={() => excluir(tela)} aria-label={`Excluir ${tela.titulo}`} title="Excluir">
                  <Trash2 />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
