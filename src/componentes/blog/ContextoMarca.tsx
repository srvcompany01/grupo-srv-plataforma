'use client'

import { useState, useTransition } from 'react'
import { salvarContextoAcao } from '@/app/(app)/editor-blog/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'

/** Contexto da marca (uma vez para todos os artigos): nome, oferta, promessa, tom, o que nunca prometer, contatos. */
export function ContextoMarca({ inicial, campos }: { inicial: Record<string, string | boolean>; campos: { chave: string; rotulo: string; longo?: boolean }[] }) {
  const [v, setV] = useState(inicial)
  const [pendente, iniciar] = useTransition()
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {campos.map((c) => (
          <label key={c.chave} className={`block space-y-1 ${c.longo ? 'md:col-span-2' : ''}`}>
            <span className={rotulo}>{c.rotulo}</span>
            {c.longo ? (
              <textarea className={campo} rows={2} value={String(v[c.chave] ?? '')} onChange={(e) => setV({ ...v, [c.chave]: e.target.value })} maxLength={1500} />
            ) : (
              <input className={campo} value={String(v[c.chave] ?? '')} onChange={(e) => setV({ ...v, [c.chave]: e.target.value })} maxLength={300} />
            )}
          </label>
        ))}
      </div>
      <label className="flex items-start gap-2 text-rotulo">
        <input type="checkbox" className="mt-0.5" checked={v.allow_ai_training === true} onChange={(e) => setV({ ...v, allow_ai_training: e.target.checked })} />
        <span>Permitir que robôs que <strong>só treinam IA</strong> (GPTBot, Google-Extended, CCBot…) leiam o blog. Os robôs de <strong>busca</strong> por IA (ChatGPT Search, Perplexity) já estão liberados, porque trazem visitas.</span>
      </label>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await salvarContextoAcao(v), true) })} className={botaoPrimario}>Salvar contexto</button>
    </div>
  )
}
