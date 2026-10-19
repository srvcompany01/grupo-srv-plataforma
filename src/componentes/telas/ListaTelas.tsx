'use client'

import { Plus, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarTelaAcao, excluirTelaAcao } from '@/app/(app)/telas/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, botaoSecundario } from '@/lib/ui'
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
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pendente} onClick={() => criar(false)} className={botaoPrimario}><Plus className="h-3.5 w-3.5" /> {t.novo}</button>
        {tipo === 'funil' && <button type="button" disabled={pendente} onClick={() => criar(true)} className={botaoSecundario}><Sparkles className="h-3.5 w-3.5" /> Começar de um modelo</button>}
        {erroCriar && <span className="text-legenda text-perigo">Não foi possível criar.</span>}
      </div>
      {telas.length === 0 ? (
        <p className="py-16 text-center text-corpo text-texto-3">{t.vazio}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {telas.map((tela) => (
            <li key={tela.id} className="group relative rounded-xl border border-borda p-3 transition hover:border-borda-forte hover:shadow-sm">
              <Link href={`${t.base}/${tela.id}`} className="block">
                <span className="block truncate text-corpo font-semibold text-texto">{tela.titulo}</span>
                <span className="mt-1 block truncate text-legenda text-texto-3">{tela.donoNome ?? '—'} · atualizado em {dia.format(new Date(tela.atualizadoEm))}</span>
              </Link>
              {(tela.donoId === euId) && (
                <button type="button" disabled={pendente} onClick={() => excluir(tela)} aria-label={`Excluir ${tela.titulo}`} title="Excluir" className="absolute right-2 top-2 rounded p-1 text-texto-3 opacity-0 hover:bg-hover hover:text-perigo focus-visible:opacity-100 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
