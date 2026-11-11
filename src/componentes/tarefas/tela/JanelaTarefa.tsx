'use client'

import { ChevronsRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog as Janela } from 'radix-ui'

/**
 * Painel lateral flutuante (580px) para a rota interceptada da tarefa: a lista continua interativa atrás.
 * Esc ou o botão fecham e voltam para a página de origem; no celular ocupa a tela toda.
 */
export function JanelaTarefa({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <Janela.Root open modal={false} onOpenChange={(aberto) => !aberto && router.back()}>
      <Janela.Portal>
        <Janela.Content
          // Clicar na lista atrás não fecha o painel (abrir outra tarefa só troca o conteúdo).
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Janela.Title className="sr-only">Tarefa</Janela.Title>
          <Janela.Description className="sr-only">Detalhes e atividade da tarefa</Janela.Description>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar tarefa"
            title="Fechar (Esc)"
          >
            <ChevronsRight />
          </button>
          {children}
        </Janela.Content>
      </Janela.Portal>
    </Janela.Root>
  )
}
