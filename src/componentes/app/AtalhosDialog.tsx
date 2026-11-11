'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { ATALHOS_DE_NAVEGACAO } from '@/dominio/paleta'

const Tecla = ({ children }: { children: React.ReactNode }) => <kbd>{children}</kbd>

const GRUPOS: { titulo: string; itens: { rotulo: string; teclas: string[] }[] }[] = [
  { titulo: 'Em qualquer tela', itens: [{ rotulo: 'Abrir a paleta de comandos (pesquisar)', teclas: ['⌘', 'K'] }, { rotulo: 'Abrir ou recolher a barra de espaços', teclas: ['⌘', '\\'] }, { rotulo: 'Mostrar esta lista', teclas: ['?'] }, { rotulo: 'Fechar janela ou menu', teclas: ['Esc'] }] },
  { titulo: 'Navegação (uma tecla, fora de campos de texto)', itens: ATALHOS_DE_NAVEGACAO.map((a) => ({ rotulo: a.rotulo, teclas: [a.tecla.toUpperCase()] })) },
  { titulo: 'Menu lateral', itens: [{ rotulo: 'Reorganizar os atalhos da faixa de ícones', teclas: ['Arrastar'] }] },
]

/** Lista dos atalhos de teclado que a plataforma tem hoje (aparece com "?" e pelo menu do perfil). */
export function AtalhosDialog({ aberto, aoMudar }: { aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>No Windows, use Ctrl no lugar de ⌘.</DialogDescription>
        </DialogHeader>
        <div>
          {GRUPOS.map((g) => (
            <section key={g.titulo}>
              <h3>{g.titulo}</h3>
              <ul>
                {g.itens.map((i) => (
                  <li key={i.rotulo}>
                    <span>{i.rotulo}</span>
                    <span>{i.teclas.map((t) => <Tecla key={t}>{t}</Tecla>)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
