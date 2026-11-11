'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { avisar } from '@/componentes/tarefas/avisar'
import { MAXIMO_PERGUNTAS, QUIZ_PADRAO, TEXTO_PADRAO_BOTAO, type AparenciaQuiz, type Pergunta } from '@/dominio/bio-quiz'
import { adicionarLinkBioAcao, configurarLinkBioAcao, iniciarUploadLogoBioAcao, removerLinkBioAcao, salvarLogoBioAcao, salvarQuizBioAcao, salvarResultadoMesAcao } from './acoes'

const moeda = (n: number | null) => (n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/** Faturamento, número de vendas e observação do mês (só a equipe lança). */
export function LancarMes({ clienteId, mes, faturamento, vendas, notas }: { clienteId: string; mes: string; faturamento: number | null; vendas: number | null; notas: string }) {
  const [v, setV] = useState({ faturamento: moeda(faturamento), vendas: vendas === null ? '' : String(vendas), notas })
  const [pendente, iniciar] = useTransition()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { avisar(await salvarResultadoMesAcao(clienteId, mes, v), true) })
      }}
    >
      <div>
        <label>
          <span>Faturamento do mês (R$) · obrigatório</span>
          <input inputMode="decimal" required placeholder="25.000,00" value={v.faturamento} onChange={(e) => setV({ ...v, faturamento: e.target.value })} />
        </label>
        <label>
          <span>Número de vendas (opcional)</span>
          <input inputMode="numeric" placeholder="12" value={v.vendas} onChange={(e) => setV({ ...v, vendas: e.target.value })} />
        </label>
      </div>
      <label>
        <span>Observação (opcional)</span>
        <textarea rows={2} maxLength={500} placeholder="Ex.: promoção de aniversário, feriado, estoque baixo…" value={v.notas} onChange={(e) => setV({ ...v, notas: e.target.value })} />
      </label>
      <button type="submit" disabled={pendente}>Salvar o mês</button>
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
    <div>
      {!whatsapp && <p>Sem o WhatsApp de atendimento no cadastro do cliente (página do cliente → Cadastro), a página não terá o botão do WhatsApp, só os botões extras.</p>}
      {url && (
        <div>
          {urls.map((u) => (
            <div key={u.rotulo}>
              <span>{u.rotulo}</span>
              <code>{u.url}</code>
              <CopiarTexto texto={u.url} rotulo="Copiar" />
            </div>
          ))}
          <p>Na bio use o link da bio; nos stories e nos anúncios use os outros, para saber de onde vem cada clique.</p>
        </div>
      )}
      <div>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" />
        ) : (
          <span>sem logo</span>
        )}
        <label>
          {logo ? 'Trocar logo' : 'Enviar logo'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={pendente} onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarLogo(f); e.target.value = '' }} />
        </label>
        {logo && <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await salvarLogoBioAcao(clienteId, null), true) })}>Remover logo</button>}
        <span>JPG, PNG ou WebP, até 5 MB. É a mesma logo da galeria de clientes; a página da bio mostra só ela e o nome do cliente.</span>
      </div>
      <label>
        <span>Mensagem que já chega escrita no WhatsApp de atendimento{whatsapp ? ` (${whatsapp})` : ''}</span>
        <input maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await configurarLinkBioAcao(clienteId, texto), true) })}>
        {url ? 'Salvar mensagem' : 'Criar link da bio'}
      </button>
      {url && (
        <div>
          <p>Botões extras da página</p>
          {links.length === 0 && <p>Nenhum. Ex.: site, localização no Maps, catálogo.</p>}
          <ul>
            {links.map((l) => (
              <li key={l.id}>
                <strong>{l.rotulo}</strong>
                <span>{l.url}</span>
                <button type="button" aria-label={`Remover ${l.rotulo}`} disabled={pendente} onClick={() => iniciar(async () => { avisar(await removerLinkBioAcao(clienteId, l.id), true) })}><Trash2 /></button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              iniciar(async () => { if (avisar(await adicionarLinkBioAcao(clienteId, novo.rotulo, novo.url), true)) setNovo({ rotulo: '', url: '' }) })
            }}
          >
            <label>
              <span>Nome do botão</span>
              <input maxLength={40} placeholder="Nosso site" value={novo.rotulo} onChange={(e) => setNovo({ ...novo, rotulo: e.target.value })} />
            </label>
            <label>
              <span>Endereço</span>
              <input maxLength={500} placeholder="https://www.site.com.br" value={novo.url} onChange={(e) => setNovo({ ...novo, url: e.target.value })} />
            </label>
            <button type="submit" disabled={pendente}>Adicionar botão</button>
          </form>
        </div>
      )}
      {(resumo.porOrigem.length > 0 || resumo.porBotao.length > 0) && (
        <div>
          <div>
            <p>Visitas no mês, por origem</p>
            <ul>{resumo.porOrigem.map((o) => <li key={o.origem}><span>{o.origem}</span><strong>{o.cliques}</strong></li>)}</ul>
          </div>
          <div>
            <p>Toques no mês, por botão</p>
            <ul>{resumo.porBotao.length ? resumo.porBotao.map((b) => <li key={b.botao}><span>{b.botao}</span><strong>{b.cliques}</strong></li>) : <li>Nenhum toque ainda.</li>}</ul>
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
    <div>
      <div>
        <p>Botão do WhatsApp</p>
        <div>
          <label>
            <span>Texto do botão</span>
            <input maxLength={40} placeholder={TEXTO_PADRAO_BOTAO} value={ap.botaoTexto} onChange={(e) => mudar('botaoTexto', e.target.value)} />
          </label>
          <label>
            <span>Cor do botão</span>
            <input type="color" value={fundo} onChange={(e) => mudar('botaoFundo', e.target.value)} />
          </label>
          <label>
            <span>Cor da letra</span>
            <input type="color" value={letra} onChange={(e) => mudar('botaoLetra', e.target.value)} />
          </label>
        </div>
        <div>
          <span style={{ backgroundColor: fundo, color: letra, borderColor: fundo }}>{ap.botaoTexto || TEXTO_PADRAO_BOTAO}</span>
          {(ap.botaoFundo || ap.botaoLetra) && <button type="button" onClick={() => setAp({ ...ap, botaoFundo: '', botaoLetra: '' })}>Voltar às cores padrão</button>}
          <span>Prévia. Sem escolher cores, o botão segue o padrão preto e branco da página.</span>
        </div>
      </div>
      <div>
        <label>
          <span>Título do quiz (opcional)</span>
          <input maxLength={80} placeholder="Antes de falar com a gente" value={ap.titulo} onChange={(e) => mudar('titulo', e.target.value)} />
        </label>
        <label>
          <span>Descrição (opcional)</span>
          <textarea rows={2} maxLength={200} placeholder="Responda 2 perguntas rápidas para a gente te atender melhor." value={ap.descricao} onChange={(e) => mudar('descricao', e.target.value)} />
        </label>
      </div>
      <div>
        <p>
          A pessoa responde a essas perguntas antes de o WhatsApp abrir; só aí conta um lead orgânico (uma vez por pessoa por dia), e as respostas vão na mensagem. Até {MAXIMO_PERGUNTAS} perguntas, de 2 a 4 opções cada, uma por linha.
          {perguntas.length === 0 && ' Enquanto estiver vazio, a página usa o quiz padrão: ' + QUIZ_PADRAO.map((q) => `"${q.pergunta}"`).join(' e ') + '.'}
        </p>
        {quiz.map((q, i) => (
          <div key={i}>
            <label>
              <span>Pergunta {i + 1}</span>
              <input maxLength={80} placeholder={i === 0 ? 'Qual serviço você procura?' : ''} value={q.pergunta} onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, pergunta: e.target.value } : x)))} />
            </label>
            <label>
              <span>Opções (uma por linha)</span>
              <textarea rows={3} placeholder={i === 0 ? 'Opção A\nOpção B\nOpção C' : undefined} value={q.opcoes} onChange={(e) => setQuiz(quiz.map((x, j) => (j === i ? { ...x, opcoes: e.target.value } : x)))} />
            </label>
          </div>
        ))}
      </div>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await salvarQuizBioAcao(clienteId, quiz, ap), true) })}>Salvar</button>
    </div>
  )
}
