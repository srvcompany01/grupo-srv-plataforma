'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisoDeVideoGrande, problemaDoVideo, ROTULO_TIPO_VIDEO, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import { confirmarEnvioCaixaAcao, prepararEnvioCaixaAcao } from './acoes'

type Envio = { chave: string; nome: string; pct: number; erro?: string; pronto?: boolean }

/** Arrastar e soltar (ou escolher) vários vídeos: cada um vai direto para o armazenamento, com barra de progresso. */
export function EnviarVideos({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [envios, setEnvios] = useState<Envio[]>([])
  const [tipo, setTipo] = useState<TipoDoVideo>('indefinido')
  const [sobre, setSobre] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  const mudar = (chave: string, p: Partial<Envio>) => setEnvios((a) => a.map((e) => (e.chave === chave ? { ...e, ...p } : e)))

  const enviarUm = async (arquivo: File, chave: string) => {
    const problema = problemaDoVideo({ mime: arquivo.type, tamanho: arquivo.size })
    if (problema) return mudar(chave, { erro: problema })
    const prep = await prepararEnvioCaixaAcao({ clienteId, nome: arquivo.name, mime: arquivo.type, tamanho: arquivo.size, tipo, confirmarGrande: true })
    if ('erro' in prep) return mudar(chave, { erro: prep.erro })
    try {
      await new Promise<void>((ok, falha) => {
        const x = new XMLHttpRequest()
        x.open('PUT', prep.urlEnvio)
        x.setRequestHeader('Content-Type', arquivo.type)
        x.upload.onprogress = (e) => e.lengthComputable && mudar(chave, { pct: Math.round((e.loaded / e.total) * 100) })
        x.onload = () => (x.status >= 200 && x.status < 300 ? ok() : falha(new Error(`O armazenamento recusou o envio (${x.status}).`)))
        x.onerror = () => falha(new Error('A conexão caiu durante o envio.'))
        x.send(arquivo)
      })
      const r = await confirmarEnvioCaixaAcao(prep.id)
      if (!avisar(r)) return mudar(chave, { erro: 'O arquivo não chegou. Tente de novo.' })
      mudar(chave, { pct: 100, pronto: true })
    } catch (e) {
      mudar(chave, { erro: e instanceof Error ? e.message : 'Falha no envio.' })
    }
  }

  const tentarIniciar = (arquivos: FileList | File[]) => {
    if (!clienteId) return avisar({ erro: 'Escolha o cliente deste material antes de enviar.' })
    if (tipo === 'indefinido') return avisar({ erro: 'Marque se o material é Conteúdo ou Criativo antes de enviar.' })
    return iniciar(arquivos)
  }

  const iniciar = async (arquivos: FileList | File[]) => {
    let lista = Array.from(arquivos)
    // Acima de 1 GB: a plataforma não comprime, mas a Meta pode recusar ou recomprimir. A pessoa precisa saber antes de enviar.
    const grandes = lista.filter((f) => avisoDeVideoGrande(f.size))
    if (grandes.length) {
      const nomes = grandes.map((f) => `${f.name} (${(f.size / 1024 ** 3).toFixed(2).replace('.', ',')} GB)`).join('; ')
      const ok = await confirmar({ titulo: grandes.length === 1 ? 'Vídeo acima de 1 GB' : `${grandes.length} vídeos acima de 1 GB`, descricao: `${nomes}. A plataforma NÃO comprime nem reduz a qualidade: o vídeo é guardado exatamente como está. Mas o envio demora mais e o Instagram/Meta pode recusar o arquivo ou recomprimi-lo ao publicar. Se a qualidade for importante, confira o post depois de publicado.`, confirmar: 'Enviar mesmo assim' })
      if (!ok) lista = lista.filter((f) => !avisoDeVideoGrande(f.size))
    }
    if (!lista.length) return
    const novos = lista.map((f, i) => ({ chave: `${Date.now()}-${i}-${f.name}`, nome: f.name, pct: 0 }))
    setEnvios((a) => [...novos, ...a])
    // Um de cada vez: vídeos grandes disputam a mesma conexão.
    for (const [i, f] of lista.entries()) await enviarUm(f, novos[i].chave)
    router.refresh()
  }

  return (
    <section>
      <div role="radiogroup" aria-label="O que você está enviando" className="flex items-center gap-2 px-3 pt-3 text-[13px]">
        <span className="text-texto-3">Este material é:</span>
        {(['organico', 'anuncio'] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)} className={tipo === t ? 'b-pri' : 'b-out'} style={{ height: 28, padding: '0 10px' }}>{ROTULO_TIPO_VIDEO[t]}</button>
        ))}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => { e.preventDefault(); setSobre(false); if (e.dataTransfer.files.length) void tentarIniciar(e.dataTransfer.files) }}
        className="m-3 flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center"
        style={{ borderColor: sobre ? 'var(--focus)' : 'var(--border-strong)', background: sobre ? 'var(--sel)' : 'transparent', opacity: clienteId ? 1 : 0.6 }}
      >
        <Ic n="upload_file" s={28} style={{ color: 'var(--text-3)' }} />
        <p className="text-[14px]">{clienteId ? 'Arraste os vídeos aqui ou' : 'Escolha o cliente acima e arraste os vídeos aqui, ou'} <button type="button" onClick={() => (clienteId ? entrada.current?.click() : avisar({ erro: 'Escolha o cliente primeiro.' }))} className="font-semibold text-[var(--client)] hover:underline">escolha no computador</button></p>
        <p className="text-[12px] text-texto-3">MP4 ou MOV, até 4 GB cada, sem compressão (acima de 1 GB a plataforma avisa antes). Vários de uma vez.</p>
        <input ref={entrada} type="file" multiple accept="video/mp4,video/quicktime,.mp4,.mov" hidden onChange={(e) => { if (e.target.files?.length) void tentarIniciar(e.target.files); e.target.value = '' }} />
      </div>
      {envios.length > 0 && (
        <ul className="border-t border-borda-fraca">
          {envios.map((e) => (
            <li key={e.chave} className="flex items-center gap-3 border-b border-[var(--border-soft)] px-3 py-2 text-[13px] last:border-b-0">
              <Ic n={e.erro ? 'error' : e.pronto ? 'check_circle' : 'upload'} s={16} style={{ color: e.erro ? 'var(--red)' : e.pronto ? 'var(--ok)' : 'var(--text-3)' }} />
              <span className="min-w-0 flex-1 truncate">{e.nome}</span>
              {e.erro ? <span className="max-w-[55%] truncate text-[12px] text-[var(--red)]" title={e.erro}>{e.erro}</span> : (
                <span className="flex w-40 items-center gap-2"><span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-active)]"><span className="block h-full bg-[var(--text)]" style={{ width: `${e.pct}%` }} /></span><span className="w-9 text-right text-[12px] tabular-nums text-texto-3">{e.pct}%</span></span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
