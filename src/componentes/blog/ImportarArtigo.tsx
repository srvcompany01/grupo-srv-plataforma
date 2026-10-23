'use client'

import { Download, FileUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { importarArquivoAcao } from '@/app/(app)/editor-blog/acoes'
import { SeloTom } from '@/componentes/insights/tom'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario } from '@/lib/ui'

type Resultado = { id: string; avisos: string[]; pendencias: string[]; nota: number }

/** Criar um post a partir do modelo preenchido (.docx, .md ou .txt): baixar o modelo, anexar e abrir o rascunho criado. */
export function ImportarArtigo({ compacto }: { compacto?: boolean }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [pendente, iniciar] = useTransition()
  const entrada = useRef<HTMLInputElement>(null)

  const importar = (arquivo: File | undefined) => {
    if (!arquivo) return
    const form = new FormData()
    form.set('arquivo', arquivo)
    iniciar(async () => {
      const r = await importarArquivoAcao(form)
      if ('erro' in r) return void avisar(r)
      setResultado(r)
      avisar({ ok: 'Post criado como rascunho.' }, true)
    })
  }

  if (!aberto) {
    return <button type="button" onClick={() => setAberto(true)} className={compacto ? botaoFantasma : botaoSecundario}><FileUp className="h-3.5 w-3.5" /> Importar arquivo</button>
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-label="Importar artigo de arquivo" onClick={() => !pendente && setAberto(false)}>
      <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-flutuante" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-destaque font-semibold text-texto">Criar post a partir de um arquivo</h2>
          <p className="mt-1 text-rotulo text-texto-2">Baixe o modelo, preencha a ficha (ou peça para uma IA preencher) e escreva o artigo depois da linha <code>=== ARTIGO ===</code>. Depois anexe aqui: a plataforma lê tudo e cria o rascunho.</p>
        </div>
        {!resultado ? (
          <>
            <div className="flex flex-wrap gap-2">
              <a href="/editor-blog/modelo-artigo.docx" className={botaoSecundario}><Download className="h-3.5 w-3.5" /> Modelo em Word (.docx)</a>
              <a href="/editor-blog/modelo-artigo.md" className={botaoFantasma}><Download className="h-3.5 w-3.5" /> Modelo em texto (.md)</a>
            </div>
            <button type="button" onClick={() => entrada.current?.click()} disabled={pendente} className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-borda px-4 py-8 text-center hover:border-petroleo hover:bg-fundo">
              <FileUp className="h-6 w-6 text-texto-2" />
              <span className="text-corpo font-semibold text-texto">{pendente ? 'Lendo o arquivo…' : 'Anexar o modelo preenchido'}</span>
              <span className="text-legenda text-texto-3">Word (.docx), Markdown (.md) ou texto (.txt), até 3 MB. No Google Docs: Arquivo → Fazer download → .docx.</span>
            </button>
            <input ref={entrada} type="file" accept=".docx,.md,.markdown,.txt" className="hidden" onChange={(e) => { importar(e.target.files?.[0]); e.target.value = '' }} />
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><SeloTom tom="bom" rotulo="Rascunho criado" /><SeloTom tom={resultado.nota >= 80 ? 'bom' : resultado.nota >= 50 ? 'atencao' : 'ruim'} rotulo={`Qualidade ${resultado.nota}`} /></div>
            {resultado.avisos.length > 0 && (
              <div><p className="text-legenda font-semibold text-texto-2">Não usado do arquivo</p><ul className="max-h-24 overflow-y-auto text-legenda text-texto-3">{resultado.avisos.map((a) => <li key={a}>• {a}</li>)}</ul></div>
            )}
            {resultado.pendencias.length > 0 && (
              <div><p className="text-legenda font-semibold text-texto-2">Para conferir no editor</p><ul className="max-h-32 overflow-y-auto text-legenda text-texto">{resultado.pendencias.map((a) => <li key={a}>• {a}</li>)}</ul></div>
            )}
            <p className="text-legenda text-texto-3">A capa não vem no arquivo: envie na aba Capa. Depois, revisão humana e publicação.</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setAberto(false); setResultado(null) }} disabled={pendente} className={botaoFantasma}>Fechar</button>
          {resultado && <button type="button" onClick={() => router.push(`/editor-blog/${resultado.id}`)} className={botaoPrimario}>Abrir no editor</button>}
        </div>
      </div>
    </div>
  )
}
