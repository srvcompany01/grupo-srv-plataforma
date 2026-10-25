'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { adicionarLinkBioAcao, configurarLinkBioAcao, confirmarLeadAcao, iniciarUploadLogoBioAcao, removerLeadAcao, removerLinkBioAcao, salvarLogoBioAcao, salvarResultadoMesAcao } from './acoes'

const moeda = (n: number | null) => (n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/** Faturamento, número de vendas e observação do mês (só a equipe lança). */
export function LancarMes({ clienteId, mes, faturamento, vendas, notas }: { clienteId: string; mes: string; faturamento: number | null; vendas: number | null; notas: string }) {
  const [v, setV] = useState({ faturamento: moeda(faturamento), vendas: vendas === null ? '' : String(vendas), notas })
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { avisar(await salvarResultadoMesAcao(clienteId, mes, v), true) })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={rotulo}>Faturamento do mês (R$)</span>
          <input className={campo} inputMode="decimal" placeholder="25.000,00" value={v.faturamento} onChange={(e) => setV({ ...v, faturamento: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className={rotulo}>Número de vendas</span>
          <input className={campo} inputMode="numeric" placeholder="12" value={v.vendas} onChange={(e) => setV({ ...v, vendas: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={rotulo}>Observação (opcional)</span>
        <textarea className={campo} rows={2} maxLength={500} placeholder="Ex.: promoção de aniversário, feriado, estoque baixo…" value={v.notas} onChange={(e) => setV({ ...v, notas: e.target.value })} />
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}>Salvar o mês</button>
    </form>
  )
}

/** Página da bio do cliente: só o nome e a logo dele, o botão do WhatsApp (cadastro) e botões extras. Cada visita e cada toque são contados. */
export function LinkBio({ clienteId, url, urls, mensagem, whatsapp, logo, links, resumo }: {
  clienteId: string
  url: string | null
  urls: { rotulo: string; url: string }[]
  mensagem: string
  whatsapp: string | null
  logo: string | null
  links: { id: string; rotulo: string; url: string }[]
  resumo: { porOrigem: { origem: string; cliques: number }[]; porBotao: { botao: string; cliques: number }[] }
}) {
  const [texto, setTexto] = useState(mensagem)
  const [novo, setNovo] = useState({ rotulo: '', url: '' })
  const [pendente, iniciar] = useTransition()
  const enviarLogo = (f: File) =>
    iniciar(async () => {
      const preparo = await iniciarUploadLogoBioAcao(clienteId, f.type, f.size)
      if ('erro' in preparo) return void avisar({ erro: preparo.erro })
      const resp = await fetch(preparo.url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f })
      if (!resp.ok) return void avisar({ erro: 'Falha ao enviar a imagem.' })
      avisar(await salvarLogoBioAcao(clienteId, preparo.chave), true)
    })
  return (
    <div className="space-y-4">
      {!whatsapp && <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Sem o WhatsApp de atendimento no cadastro do cliente (página do cliente → Cadastro), a página não terá o botão do WhatsApp, só os botões extras.</p>}
      {url && (
        <div className="space-y-1.5">
          {urls.map((u) => (
            <div key={u.rotulo} className="flex flex-wrap items-center gap-2 rounded-lg border border-borda bg-fundo px-3 py-2">
              <span className="w-24 shrink-0 text-legenda text-texto-3">{u.rotulo}</span>
              <code className="min-w-0 flex-1 truncate text-rotulo font-semibold text-texto">{u.url}</code>
              <CopiarTexto texto={u.url} rotulo="Copiar" />
            </div>
          ))}
          <p className="text-legenda text-texto-3">Na bio use o link da bio; nos stories e nos anúncios use os outros, para saber de onde vem cada clique.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-14 w-14 rounded-full border border-borda object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-borda text-legenda text-texto-3">sem logo</span>
        )}
        <label className={`${botaoSecundario} cursor-pointer`}>
          {logo ? 'Trocar logo' : 'Enviar logo'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={pendente} onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarLogo(f); e.target.value = '' }} />
        </label>
        {logo && <button type="button" disabled={pendente} className={botaoFantasma} onClick={() => iniciar(async () => { avisar(await salvarLogoBioAcao(clienteId, null), true) })}>Remover logo</button>}
        <span className="text-legenda text-texto-3">JPG, PNG ou WebP, até 5 MB. A página mostra só a logo e o nome do cliente.</span>
      </div>
      <label className="block space-y-1">
        <span className={rotulo}>Mensagem que já chega escrita no WhatsApp de atendimento{whatsapp ? ` (${whatsapp})` : ''}</span>
        <input className={campo} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await configurarLinkBioAcao(clienteId, texto), true) })} className={url ? botaoSecundario : botaoPrimario}>
        {url ? 'Salvar mensagem' : 'Criar link da bio'}
      </button>
      {url && (
        <div className="space-y-2 border-t border-borda pt-3">
          <p className={rotulo}>Botões extras da página</p>
          {links.length === 0 && <p className="text-legenda text-texto-3">Nenhum. Ex.: site, localização no Maps, catálogo.</p>}
          <ul className="space-y-1.5">
            {links.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-lg border border-borda px-3 py-1.5 text-rotulo">
                <strong className="shrink-0">{l.rotulo}</strong>
                <span className="min-w-0 flex-1 truncate text-texto-3">{l.url}</span>
                <button type="button" aria-label={`Remover ${l.rotulo}`} disabled={pendente} className={botaoFantasma} onClick={() => iniciar(async () => { avisar(await removerLinkBioAcao(clienteId, l.id), true) })}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              iniciar(async () => { if (avisar(await adicionarLinkBioAcao(clienteId, novo.rotulo, novo.url), true)) setNovo({ rotulo: '', url: '' }) })
            }}
          >
            <label className="block space-y-1">
              <span className={rotulo}>Nome do botão</span>
              <input className={`${campo} w-44`} maxLength={40} placeholder="Nosso site" value={novo.rotulo} onChange={(e) => setNovo({ ...novo, rotulo: e.target.value })} />
            </label>
            <label className="block min-w-48 flex-1 space-y-1">
              <span className={rotulo}>Endereço</span>
              <input className={campo} maxLength={500} placeholder="https://www.site.com.br" value={novo.url} onChange={(e) => setNovo({ ...novo, url: e.target.value })} />
            </label>
            <button type="submit" disabled={pendente} className={botaoSecundario}>Adicionar botão</button>
          </form>
        </div>
      )}
      {(resumo.porOrigem.length > 0 || resumo.porBotao.length > 0) && (
        <div className="grid gap-3 border-t border-borda pt-3 text-rotulo sm:grid-cols-2">
          <div>
            <p className={rotulo}>Visitas no mês, por origem</p>
            <ul className="mt-1 space-y-0.5">{resumo.porOrigem.map((o) => <li key={o.origem} className="flex justify-between gap-3"><span className="text-texto-2">{o.origem}</span><strong className="tabular-nums">{o.cliques}</strong></li>)}</ul>
          </div>
          <div>
            <p className={rotulo}>Toques no mês, por botão</p>
            <ul className="mt-1 space-y-0.5">{resumo.porBotao.length ? resumo.porBotao.map((b) => <li key={b.botao} className="flex justify-between gap-3"><span className="text-texto-2">{b.botao}</span><strong className="tabular-nums">{b.cliques}</strong></li>) : <li className="text-texto-3">Nenhum toque ainda.</li>}</ul>
          </div>
        </div>
      )}
    </div>
  )
}

/** A equipe confirma cada conversa que chegou pelo link da bio (a mensagem pronta identifica a origem). */
export function ConfirmarLead({ clienteId, hoje }: { clienteId: string; hoje: string }) {
  const [dia, setDia] = useState(hoje)
  const [obs, setObs] = useState('')
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { if (avisar(await confirmarLeadAcao(clienteId, dia, obs), true)) setObs('') })
      }}
    >
      <label className="block space-y-1">
        <span className={rotulo}>Dia</span>
        <input type="date" className={`${campo} w-40`} max={hoje} value={dia} onChange={(e) => setDia(e.target.value)} />
      </label>
      <label className="block min-w-48 flex-1 space-y-1">
        <span className={rotulo}>Quem / observação</span>
        <input className={campo} maxLength={200} placeholder="Ex.: Maria, pediu orçamento de clareamento" value={obs} onChange={(e) => setObs(e.target.value)} />
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}>Confirmar lead</button>
    </form>
  )
}

export function RemoverLead({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} aria-label="Remover lead" title="Remover lead" onClick={() => confirm('Remover este lead confirmado?') && iniciar(async () => { avisar(await removerLeadAcao(id), true) })} className={`${botaoFantasma} h-7 px-2`}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
