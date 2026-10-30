'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisoDeVideoGrande, formatarTamanho, ROTULO_TIPO_VIDEO, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import type { ArquivoDrive } from '@/servicos/google-drive'
import { buscarDriveAcao, importarDriveAcao } from './acoes'

/** Procura vídeos na pasta do cliente no Google Drive e copia os escolhidos para a caixa de entrada. */
export function PainelDrive({ clienteId, configurado, emailDaConta }: { clienteId: string; configurado: boolean; emailDaConta: string | null }) {
  const confirmar = useConfirmar()
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<'todos' | 'organico' | 'anuncio'>('todos')
  const [achados, setAchados] = useState<ArquivoDrive[] | null>(null)
  const [erro, setErro] = useState('')
  const [pendente, iniciar] = useTransition()
  const [enviados, setEnviados] = useState<Set<string>>(new Set())

  const procurar = () => iniciar(async () => {
    setErro('')
    const r = await buscarDriveAcao(clienteId, busca, tipo)
    if ('erro' in r) { setErro(r.erro); setAchados(null); return }
    setAchados(r.arquivos)
  })
  const importar = async (a: ArquivoDrive) => {
    const aviso = avisoDeVideoGrande(a.tamanho, a.nome)
    if (aviso && !(await confirmar({ titulo: 'Vídeo acima de 1 GB', descricao: aviso, confirmar: 'Importar mesmo assim' }))) return
    iniciar(async () => {
      if (avisar(await importarDriveAcao(clienteId, a.id, a.tipo, true), true)) setEnviados((s) => new Set(s).add(a.id))
    })
  }

  return (
    <section>
      {!configurado ? (
        <p className="p-3 text-[13px] text-texto-2">A integração com o Google Drive ainda não foi ligada. Falta cadastrar a chave da conta de serviço (<code>GOOGLE_DRIVE_SA_JSON</code>) no servidor. {emailDaConta}</p>
      ) : (
        <div className="space-y-2 p-3">
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); procurar() }}>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do vídeo (opcional)" aria-label="Nome do vídeo" className="h-8 min-w-48 flex-1 rounded-md border border-borda bg-white px-2 text-[13px] outline-none focus:border-[var(--focus)]" />
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} aria-label="Tipo" className="h-8 rounded-md border border-borda bg-white px-2 text-[13px]"><option value="todos">Todos</option><option value="organico">Orgânico</option><option value="anuncio">Anúncio</option></select>
            <button disabled={pendente} className="b-pri" style={{ padding: '0 12px' }}><Ic n="search" s={16} />{pendente ? 'Buscando…' : 'Buscar no Drive'}</button>
          </form>
          {erro && <p className="text-[13px] text-[var(--red)]">{erro} {erro.includes('pasta do Google Drive') && <Link href="/caixa-de-entrada/configuracoes" className="underline">Abrir configurações</Link>}</p>}
          {achados && achados.length === 0 && <p className="text-[13px] text-texto-3">Nenhum vídeo encontrado.</p>}
          {achados && achados.length > 0 && (
            <ul className="max-h-80 overflow-y-auto rounded-md border border-borda">
              {achados.map((a) => (
                <li key={a.id} className="flex items-center gap-3 border-b border-[var(--border-soft)] px-3 py-1.5 text-[13px] last:border-b-0">
                  <Ic n="movie" s={16} style={{ color: 'var(--text-3)' }} />
                  <span className="min-w-0 flex-1"><span className="block truncate">{a.nome}</span><span className="block truncate text-[12px] text-texto-3">{a.caminho || 'pasta do cliente'}</span></span>
                  <span className="rounded bg-[var(--bg-active)] px-1.5 text-[11px] text-texto-2">{ROTULO_TIPO_VIDEO[a.tipo as TipoDoVideo]}</span>
                  <span className="w-16 text-right text-[12px] tabular-nums text-texto-3">{formatarTamanho(a.tamanho)}</span>
                  <button type="button" disabled={pendente || enviados.has(a.id)} onClick={() => importar(a)} className="b-out" style={{ height: 24, padding: '0 8px', fontSize: 12 }}>{enviados.has(a.id) ? 'Importando…' : 'Importar'}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
