'use client'

import { Check, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { SeletorCor } from '@/componentes/tarefas/SeletorCor'
import { PREDEFINICOES, ROTULO_COR_TEMA, TEMA_PADRAO, validarTema, variaveisTema, type Tema } from '@/dominio/tema'
import { botaoPrimario, botaoSecundario } from '@/lib/ui'
import { salvarTemaAcao } from './acoes'

const CHAVES = Object.keys(ROTULO_COR_TEMA) as (keyof Tema)[]
const igual = (a: Tema, b: Tema) => CHAVES.every((k) => a[k] === b[k])

export function EditorTema({ atual }: { atual: Tema }) {
  const [tema, setTema] = useState(atual)
  // Muda só quando o tema é trocado de fora (predefinição, restaurar), para recriar os seletores sem roubar o foco ao digitar.
  const [versao, setVersao] = useState(0)
  const [pendente, iniciar] = useTransition()
  const validacao = validarTema(tema)
  const erros = 'erros' in validacao ? validacao.erros : []
  const alterado = !igual(tema, atual)

  // Pré-visualização ao vivo no app inteiro; ao sair da página volta para o tema salvo.
  useEffect(() => {
    const raiz = document.documentElement
    const vars = variaveisTema(tema)
    for (const [k, v] of Object.entries(vars)) raiz.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(vars)) raiz.style.removeProperty(k)
    }
  }, [tema])

  const aplicar = (novo: Tema) => {
    setTema(novo)
    setVersao((v) => v + 1)
  }
  const salvar = () => iniciar(async () => void avisar(await salvarTemaAcao(tema), true))

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-destaque font-semibold">Predefinições</h2>
          <p className="text-rotulo text-texto-3">Comece por uma combinação pronta e ajuste as cores abaixo, se quiser.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PREDEFINICOES.map((p) => {
            const ativa = igual(p.tema, tema)
            return (
              <button key={p.nome} type="button" onClick={() => aplicar(p.tema)} aria-pressed={ativa} className={`rounded-lg border p-3 text-left transition hover:shadow-cartao ${ativa ? 'border-marca ring-2 ring-marca/20' : 'border-borda'}`} style={{ background: p.tema.superficie }}>
                <span className="flex gap-1" aria-hidden="true">
                  {CHAVES.map((k) => <span key={k} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: p.tema[k] }} />)}
                </span>
                <span className="mt-2 flex items-center gap-1 text-rotulo font-semibold" style={{ color: '#261b19' }}>{ativa && <Check className="h-3.5 w-3.5" />}{p.nome}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h2 className="text-destaque font-semibold">Cores</h2>
          {CHAVES.map((k) => (
            <div key={`${k}-${versao}`} className="space-y-1.5 rounded-lg border border-borda bg-white p-3">
              <p className="text-corpo font-semibold">{ROTULO_COR_TEMA[k].nome} <span className="font-normal text-texto-3">· {ROTULO_COR_TEMA[k].dica}</span></p>
              <SeletorCor cor={tema[k]} onChange={(cor) => setTema((t) => ({ ...t, [k]: cor }))} />
            </div>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <h2 className="text-destaque font-semibold">Prévia</h2>
          <div className="space-y-3 rounded-lg border border-borda bg-fundo p-4">
            <p className="page-title !text-[28px]">Painel</p>
            <div className="flex flex-wrap gap-2">
              <span className={botaoPrimario}><Plus className="h-4 w-4" /> Nova tarefa</span>
              <span className={botaoSecundario}>Compartilhar</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-marca px-3 py-1 text-rotulo font-semibold text-claro">Todas as tarefas</span>
              <span className="rounded-full border border-borda bg-white px-3 py-1 text-rotulo">Minhas tarefas</span>
            </div>
            <div className="rounded-lg border border-borda bg-white p-3 shadow-cartao">
              <span className="rounded-full bg-marca-fundo px-2 py-0.5 text-legenda font-semibold text-marca">Marketing</span>
              <p className="mt-1.5 text-corpo font-medium">Revisar calendário editorial</p>
              <p className="text-legenda text-texto-3">14/09 · Amanda</p>
            </div>
            <div className="rounded-lg bg-marca-fundo px-3 py-2 text-corpo font-semibold text-marca">Item ativo na navegação</div>
          </div>
          <p className="text-legenda text-texto-3">A prévia já está aplicada na tela toda. Só vale para a equipe depois de salvar.</p>
        </aside>
      </section>

      {erros.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-perigo-borda bg-perigo-fundo p-3 text-rotulo text-perigo-forte" role="alert">
          {erros.map((e) => <li key={e} className="flex gap-2"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{e}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-borda pt-4">
        {!igual(tema, TEMA_PADRAO) && <button type="button" className={botaoSecundario} onClick={() => aplicar(TEMA_PADRAO)}>Restaurar padrão</button>}
        {alterado && <button type="button" className={botaoSecundario} onClick={() => aplicar(atual)}>Descartar</button>}
        <button type="button" className={botaoPrimario} disabled={pendente || !alterado || erros.length > 0} onClick={salvar}>{pendente ? 'Salvando…' : 'Salvar para a equipe'}</button>
      </div>
    </div>
  )
}
