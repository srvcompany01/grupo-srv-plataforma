'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import type { CronometroAtivo } from '@/servicos/tempo'
import { Ic } from './Ic'
import { IndicadorCronometro } from './IndicadorCronometro'
import type { ItemPainel, PainelModulo } from './paineis'

type Props = {
  painel: PainelModulo
  papel: string
  canais?: { id: string; nome: string; naoLidas: number; privado: boolean }[]
  chatNaoLidas?: number
  cronometro: CronometroAtivo | null
  /** Botão de fixar/desafixar do painel (só no desktop). */
  acaoTopo?: ReactNode
}

/** Painel de um módulo: título, as opções e atalhos dele (paineis.ts) e, no Chat, os canais. */
export function PainelAtalhos({ painel, papel, canais = [], chatNaoLidas = 0, cronometro, acaoTopo }: Props) {
  const caminho = usePathname()
  const visaoAtual = useSearchParams().get('visao') ?? 'semana'
  const visiveis = (itens: ItemPainel[]) => itens.filter((i) => !i.admin || papel === 'admin')
  const secoes = painel.secoes.map((s) => ({ ...s, itens: visiveis(s.itens) })).filter((s) => s.itens.length > 0)

  // O item ativo é o que casa com o caminho mais longo (ex.: /clientes/relatorio ganha de /clientes).
  const todos = secoes.flatMap((s) => s.itens)
  const casa = (i: ItemPainel) => {
    const rota = i.href.split('?')[0]
    return (caminho === rota || (!i.exato && caminho.startsWith(`${rota}/`))) && (!i.visao || i.visao === visaoAtual)
  }
  const ativo = todos.filter(casa).sort((a, b) => b.href.split('?')[0].length - a.href.split('?')[0].length)[0]

  const link = (i: ItemPainel, contador = 0) => (
    <Link key={i.rotulo} href={i.href} draggable={false} aria-current={ativo === i ? 'page' : undefined}>
      <Ic n={i.icone} s={18} />
      <span>{i.rotulo}</span>
      {contador > 0 && <span className="cs-selo">{contador > 99 ? '99+' : contador}</span>}
    </Link>
  )

  return (
    <div className="cs-espacos" data-painel={painel.id}>
      <div className="cs-esp-topo">
        <span className="cs-esp-titulo">{painel.titulo}</span>
        {acaoTopo}
      </div>
      <div className="cs-esp-corpo">
        {painel.canais && (
          <>
            <div className="cs-secao"><span>Canais</span></div>
            {canais.map((c) => (
              <Link key={c.id} href={`/chat/${c.nome}`} aria-current={caminho === `/chat/${c.nome}` ? 'page' : undefined}>
                <Ic n={c.privado ? 'lock' : 'tag'} s={18} />
                <span>{c.nome}</span>
                {c.naoLidas > 0 && <span className="cs-selo">{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
              </Link>
            ))}
            <Link href="/chat" className="cs-mais"><Ic n="add" s={18} />Adicionar canal</Link>
          </>
        )}
        {secoes.map((s, n) => (
          <div key={s.titulo ?? n} className="cs-grupo">
            {s.titulo && <div className="cs-secao"><span>{s.titulo}</span></div>}
            {s.itens.map((i) => link(i, i.href === '/chat' ? chatNaoLidas : 0))}
          </div>
        ))}
      </div>
      <div className="cs-esp-pe">
        <IndicadorCronometro cronometro={cronometro} />
      </div>
    </div>
  )
}
