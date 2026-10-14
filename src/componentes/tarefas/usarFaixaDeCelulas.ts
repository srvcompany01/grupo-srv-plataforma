import { useEffect, useState } from 'react'
import { retangulo, type Faixa, type Posicao } from '@/dominio/faixa-celulas'

/** Posição (tarefa × coluna) da célula sob um elemento, lida dos `data-linha` / `data-celula` da lista. */
function posicaoDe(alvo: Element | null): Posicao | null {
  const celula = alvo?.closest('[data-celula]')
  const linha = celula?.closest('[data-linha]')
  return celula && linha ? { linha: linha.getAttribute('data-linha')!, coluna: celula.getAttribute('data-celula')! } : null
}

/** Tarefas na ordem em que aparecem agora na tela (grupos recolhidos e subtarefas fechadas não contam). */
export const linhasVisiveis = (raiz: Element) => [...raiz.querySelectorAll('[data-linha]')].map((n) => n.getAttribute('data-linha')!)

/**
 * Seleção de células por arrasto, como numa planilha: aperta numa célula e arrasta para outra. Enquanto o mouse
 * fica dentro da célula em que apertou, nada muda (clicar, digitar e abrir menus funcionam como sempre).
 * Ao entrar em outra célula começa a faixa; o clique que viria depois do arrasto é engolido.
 */
export function useFaixaDeCelulas(colunasOrdem: string[]) {
  const [el, definirRaiz] = useState<HTMLElement | null>(null)
  const [faixa, setFaixa] = useState<Faixa | null>(null)
  const chaveColunas = colunasOrdem.join('|')

  useEffect(() => {
    if (!el) return
    const colunas = chaveColunas.split('|')
    let origem: Posicao | null = null
    let arrastando = false

    const mover = (e: PointerEvent) => {
      if (!origem) return
      const pos = posicaoDe(document.elementFromPoint(e.clientX, e.clientY))
      if (!pos) return
      if (!arrastando) {
        if (pos.linha === origem.linha && pos.coluna === origem.coluna) return
        arrastando = true
        // Fecha o que o aperto abriu (menu de status, etc.), tira o foco e impede o texto de ser selecionado.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        ;(document.activeElement as HTMLElement | null)?.blur?.()
        window.getSelection()?.removeAllRanges()
        el.classList.add('select-none')
      }
      const f = retangulo(linhasVisiveis(el), colunas, origem, pos)
      if (f) setFaixa(f)
    }

    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
      el.classList.remove('select-none')
      if (arrastando) {
        const engolir = (ev: Event) => ev.stopPropagation()
        window.addEventListener('click', engolir, { capture: true, once: true })
        setTimeout(() => window.removeEventListener('click', engolir, true), 0)
      } else {
        setFaixa(null) // um clique simples numa célula tira a seleção
      }
      origem = null
      arrastando = false
    }

    const apertar = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType !== 'mouse') return
      const alvo = e.target as Element
      if (alvo.closest('[role="separator"], input[type="checkbox"], [data-sem-faixa]')) return
      const pos = posicaoDe(alvo)
      if (!pos) return
      origem = pos
      arrastando = false
      window.addEventListener('pointermove', mover)
      window.addEventListener('pointerup', soltar)
      window.addEventListener('pointercancel', soltar)
    }

    el.addEventListener('pointerdown', apertar, true)
    return () => {
      el.removeEventListener('pointerdown', apertar, true)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [el, chaveColunas])

  return { definirRaiz, faixa, setFaixa }
}
