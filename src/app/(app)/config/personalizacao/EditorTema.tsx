'use client'

import { Check, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { SeletorCor } from '@/componentes/tarefas/SeletorCor'
import { PREDEFINICOES, ROTULO_COR_TEMA, TEMA_PADRAO, validarTema, variaveisTema, type Tema } from '@/dominio/tema'
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
    <div>
      <section>
        <div>
          <h2>Predefinições</h2>
          <p>Comece por uma combinação pronta e ajuste as cores abaixo, se quiser.</p>
        </div>
        <div>
          {PREDEFINICOES.map((p) => {
            const ativa = igual(p.tema, tema)
            return (
              <button key={p.nome} type="button" onClick={() => aplicar(p.tema)} aria-pressed={ativa} style={{ background: p.tema.superficie }}>
                <span aria-hidden="true">
                  {CHAVES.map((k) => <span key={k} style={{ background: p.tema[k] }} />)}
                </span>
                <span style={{ color: '#261b19' }}>{ativa && <Check />}{p.nome}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div>
          <h2>Cores</h2>
          {CHAVES.map((k) => (
            <div key={`${k}-${versao}`}>
              <p>{ROTULO_COR_TEMA[k].nome} <span>· {ROTULO_COR_TEMA[k].dica}</span></p>
              <SeletorCor cor={tema[k]} onChange={(cor) => setTema((t) => ({ ...t, [k]: cor }))} />
            </div>
          ))}
        </div>

        <aside>
          <h2>Prévia</h2>
          <div>
            <p>Painel</p>
            <div>
              <span><Plus /> Nova tarefa</span>
              <span>Compartilhar</span>
            </div>
            <div>
              <span>Todas as tarefas</span>
              <span>Minhas tarefas</span>
            </div>
            <div>
              <span>Marketing</span>
              <p>Revisar calendário editorial</p>
              <p>14/09 · Amanda</p>
            </div>
            <div>Item ativo na navegação</div>
          </div>
          <p>A prévia já está aplicada na tela toda. Só vale para a equipe depois de salvar.</p>
        </aside>
      </section>

      {erros.length > 0 && (
        <ul role="alert">
          {erros.map((e) => <li key={e}><TriangleAlert />{e}</li>)}
        </ul>
      )}

      <div>
        {!igual(tema, TEMA_PADRAO) && <button type="button" onClick={() => aplicar(TEMA_PADRAO)}>Restaurar padrão</button>}
        {alterado && <button type="button" onClick={() => aplicar(atual)}>Descartar</button>}
        <button type="button" disabled={pendente || !alterado || erros.length > 0} onClick={salvar}>{pendente ? 'Salvando…' : 'Salvar para a equipe'}</button>
      </div>
    </div>
  )
}
