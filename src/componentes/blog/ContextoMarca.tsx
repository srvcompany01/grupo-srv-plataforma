'use client'

import { useState, useTransition } from 'react'
import { salvarContextoAcao } from '@/app/(app)/editor-blog/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

/** Contexto da marca (uma vez para todos os artigos): nome, oferta, promessa, tom, o que nunca prometer, contatos. */
export function ContextoMarca({ inicial, campos }: { inicial: Record<string, string | boolean>; campos: { chave: string; rotulo: string; longo?: boolean }[] }) {
  const [v, setV] = useState(inicial)
  const [pendente, iniciar] = useTransition()
  return (
    <div>
      <div>
        {campos.map((c) => (
          <label key={c.chave}>
            <span>{c.rotulo}</span>
            {c.longo ? (
              <textarea rows={2} value={String(v[c.chave] ?? '')} onChange={(e) => setV({ ...v, [c.chave]: e.target.value })} maxLength={1500} />
            ) : (
              <input value={String(v[c.chave] ?? '')} onChange={(e) => setV({ ...v, [c.chave]: e.target.value })} maxLength={300} />
            )}
          </label>
        ))}
      </div>
      <label>
        <input type="checkbox" checked={v.allow_ai_training === true} onChange={(e) => setV({ ...v, allow_ai_training: e.target.checked })} />
        <span>Permitir que robôs que <strong>só treinam IA</strong> (GPTBot, Google-Extended, CCBot…) leiam o blog. Os robôs de <strong>busca</strong> por IA (ChatGPT Search, Perplexity) já estão liberados, porque trazem visitas.</span>
      </label>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await salvarContextoAcao(v), true) })}>Salvar contexto</button>
    </div>
  )
}
