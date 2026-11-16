'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { MAXIMO_PERGUNTAS, QUIZ_PADRAO, TEXTO_PADRAO_BOTAO, type AparenciaQuiz, type Pergunta } from '@/dominio/bio-quiz'
import { adicionarLinkBioAcao, configurarLinkBioAcao, iniciarUploadLogoBioAcao, removerLinkBioAcao, salvarLogoBioAcao, salvarQuizBioAcao, salvarResultadoMesAcao } from './acoes'

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
          <span className={rotulo}>Faturamento do mês (R$) · obrigatório</span>
          <input className={campo} inputMode="decimal" required placeholder="25.000,00" value={v.faturamento} onChange={(e) => setV({ ...v, faturamento: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className={rotulo}>Número de vendas (opcional)</span>
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
        <span className="text-legenda text-texto-3">JPG, PNG ou WebP, até 5 MB. É a mesma logo da galeria de clientes; a página da bio mostra só ela e o nome do cliente.</span>
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

/** Quiz do WhatsApp da página da bio: aparência do botão, título e descrição, e as perguntas. Só vira lead quem termina o quiz. */
export function QuizBio({ clienteId, perguntas, aparencia }: { clienteId: string; perguntas: Pergunta[]; aparencia: AparenciaQuiz }) {
  const [quiz, setQuiz] = useState(() => Array.from({ length: MAXIMO_PERGUNTAS }, (_, i) => ({ pergunta: perguntas[i]?.pergunta ?? '', opcoes: (perguntas[i]?.opcoes ?? []).join('\n') })))
  const [ap, setAp] = useState(aparencia)
  const [pendente, iniciar] = useTransition()
  const fundo = ap.botaoFundo || '#000000'
  const letra = ap.botaoLetra || '#ffffff'
  const mudar = (campoAp: keyof AparenciaQuiz, valor: string) => setAp({ ...ap, [campoAp]: valor })
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className={rotulo}>Botão do WhatsApp</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="block space-y-1">
            <span className={rotulo}>Texto do botão</span>
            <input className={campo} maxLength={40} placeholder={TEXTO_PADRAO_BOTAO} value={ap.botaoTexto} onChange={(e) => mudar('botaoTexto', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className={rotulo}>Cor do botão</span>
            <input type="color" className="h-10 w-20 cursor-pointer rounded-lg border border-borda bg-white p-1" value={fundo} onChange={(e) => mudar('botaoFundo', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className={rotulo}>Cor da letra</span>
            <input type="color" className="h-10 w-20 cursor-pointer rounded-lg border border-borda bg-white p-1" value={letra} onChange={(e) => mudar('botaoLetra', e.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md border px-6 py-3 text-base font-medium" style={{ backgroundColor: fundo, color: letra, borderColor: fundo }}>{ap.botaoTexto || TEXTO_PADRAO_BOTAO}</span>
          {(ap.botaoFundo || ap.botaoLetra) && <button type="button" className={botaoFantasma} onClick={() => setAp({ ...ap, botaoFundo: '', botaoLetra: '' })}>Voltar às cores padrão</button>}
          <span className="text-legenda text-texto-3">Prévia. Sem escolher cores, o botão segue o padrão preto e branco da página.</span>
        </div>
      </div>
      <div className="grid gap-3 border-t border-borda pt-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={rotulo}>Título do quiz (opcional)</span>
          <input className={campo} maxLength={80} placeholder="Antes de falar com a gente" value={ap.titulo} onChange={(e) => mudar('titulo', e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className={rotulo}>Descrição (opcional)</span>
          <textarea className={campo} rows={2} maxLength={200} placeholder="Responda 2 perguntas rápidas para a gente te atender melhor." value={ap.descricao} onChange={(e) => mudar('descricao', e.target.value)} />
        </label>
      </div>
      <div className="space-y-3 border-t border-borda pt-3">
        <p className="text-legenda text-texto-3">
          A pessoa responde a essas perguntas antes de o WhatsApp abrir; só aí conta um lead orgânico (uma vez por pessoa por dia), e as respostas vão na mensagem. Até {MAXIMO_PERGUNTAS} perguntas, de 2 a 4 opções cada, uma por linha.
          {perguntas.length === 0 && ' Enquanto estiver vazio, a página usa o quiz padrão: ' + QUIZ_PADRAO.map((q) => `"${q.pergunta}"`).join(' e ') + '.'}
        </p>
        {quiz.map((q, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className={rotulo}>Pergunta {i + 1}</span>
              <input className={campo} maxLength={80} placeholder={i === 0 ? 'Qual serviço você procura?' : ''} value={q.pergunta} onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, pergunta: e.target.value } : x)))} />
            </label>
            <label className="block space-y-1">
              <span className={rotulo}>Opções (uma por linha)</span>
              <textarea className={campo} rows={3} placeholder={i === 0 ? 'Opção A\nOpção B\nOpção C' : undefined} value={q.opcoes} onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, opcoes: e.target.value } : x)))} />
            </label>
          </div>
        ))}
      </div>
      <button type="button" disabled={pendente} className={botaoPrimario} onClick={() => iniciar(async () => { avisar(await salvarQuizBioAcao(clienteId, quiz, ap), true) })}>Salvar</button>
    </div>
  )
}
