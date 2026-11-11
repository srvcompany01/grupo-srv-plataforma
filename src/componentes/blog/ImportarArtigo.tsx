'use client'

import { Download, FileUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { importarArquivoAcao } from '@/app/(app)/editor-blog/acoes'
import { SeloTom } from '@/componentes/insights/tom'
import { avisar } from '@/componentes/tarefas/avisar'

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
    return <button type="button" onClick={() => setAberto(true)}><FileUp /> Importar arquivo</button>
  }
  return (
    <div role="dialog" aria-label="Importar artigo de arquivo" onClick={() => !pendente && setAberto(false)}>
      <div onClick={(e) => e.stopPropagation()}>
        <div>
          <h2>Criar post a partir de um arquivo</h2>
          <p>Baixe o modelo, preencha a ficha (ou peça para uma IA preencher) e escreva o artigo depois da linha <code>=== ARTIGO ===</code>. Depois anexe aqui: a plataforma lê tudo e cria o rascunho.</p>
        </div>
        {!resultado ? (
          <>
            <div>
              <a href="/editor-blog/modelo-artigo.docx"><Download /> Modelo em Word (.docx)</a>
              <a href="/editor-blog/modelo-artigo.md"><Download /> Modelo em texto (.md)</a>
            </div>
            <button type="button" onClick={() => entrada.current?.click()} disabled={pendente}>
              <FileUp />
              <span>{pendente ? 'Lendo o arquivo…' : 'Anexar o modelo preenchido'}</span>
              <span>Word (.docx), Markdown (.md) ou texto (.txt), até 3 MB. No Google Docs: Arquivo → Fazer download → .docx.</span>
            </button>
            <input ref={entrada} type="file" accept=".docx,.md,.markdown,.txt" className="hidden" onChange={(e) => { importar(e.target.files?.[0]); e.target.value = '' }} />
          </>
        ) : (
          <div>
            <div><SeloTom tom="bom" rotulo="Rascunho criado" /><SeloTom tom={resultado.nota >= 80 ? 'bom' : resultado.nota >= 50 ? 'atencao' : 'ruim'} rotulo={`Qualidade ${resultado.nota}`} /></div>
            {resultado.avisos.length > 0 && (
              <div><p>Não usado do arquivo</p><ul>{resultado.avisos.map((a) => <li key={a}>• {a}</li>)}</ul></div>
            )}
            {resultado.pendencias.length > 0 && (
              <div><p>Para conferir no editor</p><ul>{resultado.pendencias.map((a) => <li key={a}>• {a}</li>)}</ul></div>
            )}
            <p>A capa não vem no arquivo: envie na aba Capa. Depois, revisão humana e publicação.</p>
          </div>
        )}
        <div>
          <button type="button" onClick={() => { setAberto(false); setResultado(null) }} disabled={pendente}>Fechar</button>
          {resultado && <button type="button" onClick={() => router.push(`/editor-blog/${resultado.id}`)}>Abrir no editor</button>}
        </div>
      </div>
    </div>
  )
}
