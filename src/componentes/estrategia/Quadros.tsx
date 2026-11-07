'use client'

import { Check, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ARQUETIPOS, CAMPOS_ETAPA_RECEITA, CIRCULO, CONSCIENCIA, DECLARACAO, EMPATIA, ETAPAS_JORNADA, ETAPAS_RECEITA, JTBD, NUMEROS_RECEITA, PERSONA, PROBLEMAS, SWOT, TOM, TOWS,
  idDoCheck, numero, type DadosEstrategia, type Metodo, type NivelChecklist,
} from '@/dominio/estrategia'
import { Editor, Escala, Lista, Texto, useEstrategia, useMarcados } from './edicao'

/** O quadro visual de um método, editável (aba Estratégia) ou só leitura (página do cliente). */
export function QuadroEstrategia({ metodo, clienteId, inicial, leitura = false }: { metodo: Metodo; clienteId: string; inicial: DadosEstrategia; leitura?: boolean }) {
  const Quadro = { publico: Publico, jornada: Jornada, posicionamento: Posicionamento, receita: Receita, swot: Swot }[metodo]
  return (
    <Editor key={`${clienteId}-${metodo}`} clienteId={clienteId} metodo={metodo} inicial={inicial} leitura={leitura}>
      <div className="est">
        <Quadro />
      </div>
    </Editor>
  )
}

function Bloco({ titulo, sub, children, className = '' }: { titulo: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`est-bloco ${className}`}>
      <header>
        <h2>{titulo}</h2>
        {sub && <p>{sub}</p>}
      </header>
      {children}
    </section>
  )
}

const tinta = (cor: string, pct = 12) => `color-mix(in oklab, ${cor} ${pct}%, transparent)`

// ───────────────────────────── Estudo de público ─────────────────────────────

function Publico() {
  const { d } = useEstrategia()
  const nome = d.textos['persona.nome'] ?? ''
  const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'
  const [pensa, ve, ouve, fala, dores, ganhos] = EMPATIA
  const quadrante = (c: (typeof EMPATIA)[number], cor: string, canto: string) => (
    <div className={`est-quadrante ${canto}`} style={{ background: tinta(cor, 10) }}>
      <h3 style={{ color: cor }}>{c.rotulo}</h3>
      <p className="est-ajuda">{c.pergunta}</p>
      <Lista k={c.chave} cor={cor} />
    </div>
  )
  return (
    <>
      <Bloco titulo="Persona" sub="Quem é a pessoa que mais compra (ou que queremos que compre).">
        <div className="est-persona">
          <div className="est-avatar" aria-hidden>{iniciais}</div>
          <div className="min-w-0 flex-1 space-y-2">
            <Texto k="persona.nome" ph="Nome da persona (ex.: Ana, a mãe empreendedora)" className="est-grande" />
            <div className="border-l-2 border-[#8b5cf6] pl-3 text-texto-2"><Texto k="persona.frase" ph="Uma frase que ela diria…" className="italic" /></div>
          </div>
        </div>
        <div className="est-fichas">
          {PERSONA.filter((c) => !['persona.nome', 'persona.frase', 'persona.rotina'].includes(c.chave)).map((c) => (
            <label key={c.chave}><span>{c.rotulo}</span><Texto k={c.chave} ph="—" /></label>
          ))}
        </div>
        <label className="est-rotulado"><span>Rotina e estilo de vida</span><Texto k="persona.rotina" ph="Como é o dia dela, o que consome, do que gosta…" /></label>
      </Bloco>

      <Bloco titulo="Mapa de empatia" sub="Coloque-se no lugar da persona: o que ela pensa, vê, ouve e faz.">
        <div className="est-empatia">
          {quadrante(pensa, '#8b5cf6', 'tl')}
          {quadrante(ve, '#3b82f6', 'tr')}
          {quadrante(ouve, '#f59e0b', 'bl')}
          {quadrante(fala, '#14b8a6', 'br')}
          <div className="est-cabeca" aria-hidden><span>{iniciais}</span><small>{nome || 'Persona'}</small></div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {quadrante(dores, '#ef4444', '')}
          {quadrante(ganhos, '#22c55e', '')}
        </div>
      </Bloco>

      <Bloco titulo="Dores, problemas e desafios" sub="Do que dói hoje até o que impede a compra.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PROBLEMAS.map((c) => (
            <div key={c.chave} className="est-cartao" style={{ borderTopColor: c.cor }}>
              <h3>{c.rotulo}</h3>
              <p className="est-ajuda">{c.ajuda}</p>
              <Lista k={c.chave} cor={c.cor} />
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Jobs to be done" sub="O “trabalho” que a pessoa contrata o produto para fazer.">
        <div className="grid gap-3 md:grid-cols-3">
          {JTBD.map((c, i) => (
            <div key={c.chave} className="est-cartao" style={{ borderTopColor: ['#0ea5e9', '#ec4899', '#f97316'][i] }}>
              <h3>{c.rotulo}</h3>
              <p className="est-ajuda">{c.ajuda}</p>
              <Lista k={c.chave} />
            </div>
          ))}
        </div>
      </Bloco>

      <Consciencia />

      <Bloco titulo="Comportamento" sub="O que faz decidir, onde encontrar e como falar com ela.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="est-cartao"><h3>Gatilhos de compra</h3><p className="est-ajuda">O que faz decidir agora.</p><Lista k="gatilhos" /></div>
          <div className="est-cartao"><h3>Onde está</h3><p className="est-ajuda">Redes, sites, lugares, influenciadores.</p><Lista k="canais" chips /></div>
          <div className="est-cartao"><h3>Como fala</h3><p className="est-ajuda">Palavras e expressões que usa.</p><Lista k="linguagem" chips /></div>
        </div>
      </Bloco>
    </>
  )
}

function Consciencia() {
  const { d, leitura, mudar } = useEstrategia()
  const atual = d.textos.consciencia
  const escolhido = CONSCIENCIA.find((c) => c.id === atual)
  return (
    <Bloco titulo="Nível de consciência" sub="Eugene Schwartz: em que degrau está a maior parte do público? Clique no degrau.">
      <div className="est-escada" role="radiogroup" aria-label="Nível de consciência">
        {CONSCIENCIA.map((c, i) => (
          <button key={c.id} type="button" role="radio" aria-checked={atual === c.id} disabled={leitura} style={{ height: `${44 + i * 22}px` }} onClick={() => mudar((x) => ({ ...x, textos: { ...x.textos, consciencia: x.textos.consciencia === c.id ? '' : c.id } }))}>
            <b>{i + 1}</b>
            <span>{c.nome}</span>
          </button>
        ))}
      </div>
      {escolhido ? (
        <p className="mt-3 text-[13px]"><b>{escolhido.nome}:</b> {escolhido.desc} <span className="text-texto-2">Como comunicar: {escolhido.comunicar}</span></p>
      ) : (
        <p className="est-ajuda mt-3">Nenhum degrau escolhido.</p>
      )}
    </Bloco>
  )
}

// ───────────────────────────── Jornada de compra ─────────────────────────────

function Jornada() {
  const linha = (rotulo: ReactNode, celula: (e: (typeof ETAPAS_JORNADA)[number], i: number) => ReactNode, classe = '') => (
    <>
      <div className="est-j-rotulo">{rotulo}</div>
      {ETAPAS_JORNADA.map((e, i) => <div key={e.id} className={`est-j-celula ${classe}`}>{celula(e, i)}</div>)}
    </>
  )
  return (
    <Bloco titulo="Como uma venda acontece?" sub="As cinco etapas da jornada. Escreva como acontece com este cliente, como influenciar e marque o que já existe.">
      <div className="overflow-x-auto pb-2">
        <div className="est-jornada">
          <div />
          {ETAPAS_JORNADA.map((e) => <div key={e.id} className="est-seta">{e.nome}</div>)}
          {linha('O que representa?', (e) => <p className="est-ajuda !text-[12.5px] !text-texto-2">{e.representa}</p>)}
          {linha('Impressão do consumidor', (e, i) => (
            <div className="est-j-impressao">
              <span className="est-bola">{e.impressao}</span>
              {i < ETAPAS_JORNADA.length - 1 && (
                <span className="est-conv" title={`Conversão de "${e.impressao}" para "${ETAPAS_JORNADA[i + 1].impressao}"`}>
                  <b>↑</b><Texto k={`conv.${e.id}`} ph="%" />
                </span>
              )}
            </div>
          ), 'est-j-meio')}
          {linha('Como acontece?', (e) => <Lista k={`acontece.${e.id}`} ph={`Ex.: ${e.acontece[0]}`} />)}
          {linha('Como você influencia?', (e) => <Lista k={`influencia.${e.id}`} ph={`Ex.: ${e.influencia[0]}`} />)}
          {linha(<>Checklist de um projeto simples <b className="text-[var(--red)]">−R$</b></>, (e) => <Checklist nivel="simples" etapa={e.id} padrao={e.simples} />)}
          {linha(<>Checklist de um projeto complexo <b className="text-[#16a34a]">+R$</b></>, (e) => <Checklist nivel="complexo" etapa={e.id} padrao={e.complexo} />)}
        </div>
      </div>
    </Bloco>
  )
}

function Checklist({ nivel, etapa, padrao }: { nivel: NivelChecklist; etapa: string; padrao: readonly string[] }) {
  const { d, mudar } = useEstrategia()
  const { tem, alternar, leitura } = useMarcados()
  const chave = `extra.${nivel}.${etapa}`
  const extras = d.listas[chave] ?? []
  const [novo, setNovo] = useState('')
  const itens = [...padrao.map((t) => ({ t, extra: false })), ...extras.map((t) => ({ t, extra: true }))]
  const feitos = itens.filter((i) => tem(idDoCheck(nivel, etapa, i.t))).length
  const adicionar = () => {
    const t = novo.trim()
    if (!t) return
    mudar((x) => ({ ...x, listas: { ...x.listas, [chave]: [...(x.listas[chave] ?? []), t] } }))
    setNovo('')
  }
  return (
    <div className="space-y-1.5">
      <div className="est-prog" title={`${feitos} de ${itens.length}`}><span style={{ width: `${itens.length ? (feitos / itens.length) * 100 : 0}%` }} /></div>
      <ul className="est-check">
        {itens.map(({ t, extra }) => {
          const id = idDoCheck(nivel, etapa, t)
          return (
            <li key={id}>
              <button type="button" role="checkbox" aria-checked={tem(id)} disabled={leitura} onClick={() => alternar(id)}>{tem(id) && <Check className="h-3 w-3" />}</button>
              <span className={tem(id) ? 'text-texto' : 'text-texto-2'}>{t}</span>
              {extra && !leitura && (
                <button type="button" className="est-x" aria-label="Remover item" onClick={() => mudar((x) => ({ ...x, listas: { ...x.listas, [chave]: (x.listas[chave] ?? []).filter((y) => y !== t) }, marcados: x.marcados.filter((m) => m !== id) }))}><X className="h-3.5 w-3.5" /></button>
              )}
            </li>
          )
        })}
      </ul>
      {!leitura && <input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} onBlur={adicionar} maxLength={500} placeholder="+ item" aria-label="Novo item do checklist" className="est-campo text-[12px]" />}
    </div>
  )
}

// ───────────────────────────── Posicionamento e marca ─────────────────────────────

const CORES_CIRCULO = ['#f59e0b', '#3b82f6', '#64748b']

function Posicionamento() {
  const { d } = useEstrategia()
  const { definir, leitura } = useMarcados()
  const arqs = d.marcados.filter((m) => m.startsWith('arq.')).map((m) => ARQUETIPOS.find((a) => `arq.${a.id}` === m)).filter((a) => !!a)
  const marcarArquetipo = (id: string) =>
    definir((m) => {
      const chave = `arq.${id}`
      if (m.includes(chave)) return m.filter((x) => x !== chave)
      const atuais = m.filter((x) => x.startsWith('arq.'))
      const outros = m.filter((x) => !x.startsWith('arq.'))
      return [...outros, ...(atuais.length >= 2 ? [atuais[0]] : atuais), chave]
    })
  const focar = (id: string) => document.getElementById(id)?.focus()
  return (
    <>
      <Bloco titulo="Big idea" sub="A ideia central que conecta toda a comunicação, em uma frase.">
        <div className="est-bigidea">
          <Texto k="bigidea" ph="Escreva a big idea da marca…" className="est-enorme" />
          <Texto k="bigidea.explica" ph="Por que essa ideia? De onde ela vem?" className="text-texto-2" />
        </div>
      </Bloco>

      <Bloco titulo="Círculo dourado" sub="Simon Sinek: comece pelo porquê. Clique num anel para escrever.">
        <div className="est-circulo">
          <div className="est-aneis" aria-hidden={leitura}>
            {[...CIRCULO].reverse().map((c, i) => (
              <button key={c.chave} type="button" disabled={leitura} onClick={() => focar(`campo-${c.chave}`)} style={{ inset: `${i * 18}%`, background: tinta(CORES_CIRCULO[2 - i], 22 + i * 10), borderColor: CORES_CIRCULO[2 - i] }}>
                <span style={{ color: CORES_CIRCULO[2 - i] }}>{c.rotulo}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {CIRCULO.map((c, i) => (
              <div key={c.chave} className="est-cartao" style={{ borderTopColor: CORES_CIRCULO[i] }}>
                <h3>{c.rotulo}</h3>
                <p className="est-ajuda">{c.ajuda}</p>
                <Texto k={c.chave} id={`campo-${c.chave}`} />
              </div>
            ))}
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Declaração de posicionamento" sub="Preencha as lacunas: a frase que diz para quem a marca existe e por que é diferente.">
        <p className="est-frase">
          {DECLARACAO.map((c) => (
            <span key={c.chave}>
              {c.antes !== ',' && <>{c.antes} </>}{c.antes === ',' && ', '}
              <span className="est-lacuna"><Texto k={c.chave} ph={c.rotulo.toLowerCase()} /></span>{' '}
            </span>
          ))}
          .
        </p>
      </Bloco>

      <div className="grid gap-3 md:grid-cols-3">
        <Bloco titulo="Proposta de valor"><Texto k="proposta" ph="O que o cliente ganha, para quem e por que só aqui." /></Bloco>
        <Bloco titulo="Slogan / assinatura"><Texto k="slogan" ph="Ex.: Pense diferente." className="est-grande" /></Bloco>
        <Bloco titulo="Manifesto"><Texto k="manifesto" ph="A crença da marca em poucas linhas…" /></Bloco>
      </div>

      <Bloco titulo="Arquétipo" sub={arqs.length ? <>Principal: <b>{arqs[0].nome}</b>{arqs[1] && <> · secundário: <b>{arqs[1].nome}</b></>}</> : 'Os 12 arquétipos de marca. Clique para escolher o principal e, se quiser, um secundário.'}>
        <div className="est-arquetipos">
          {ARQUETIPOS.map((a) => {
            const pos = arqs.findIndex((x) => x.id === a.id)
            return (
              <button key={a.id} type="button" aria-pressed={pos >= 0} disabled={leitura} onClick={() => marcarArquetipo(a.id)} data-pos={pos >= 0 ? pos : undefined}>
                {pos >= 0 && <em>{pos === 0 ? 'Principal' : 'Secundário'}</em>}
                <b>{a.nome}</b>
                <span>{a.desc}</span>
              </button>
            )
          })}
        </div>
      </Bloco>

      <Bloco titulo="Tom de voz" sub="As quatro dimensões do Nielsen Norman Group: onde a marca fica em cada uma?">
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {TOM.map((t) => <Escala key={t.chave} k={t.chave} esq={t.esq} dir={t.dir} />)}
        </div>
        <div className="mt-4 est-cartao"><h3>Exemplos de frases no tom</h3><Lista k="tom.exemplos" ph="Uma frase como a marca falaria" /></div>
      </Bloco>

      <div className="grid gap-3 md:grid-cols-2">
        <Bloco titulo="Personalidade e valores">
          <h3 className="est-mini">Personalidade (adjetivos)</h3>
          <Lista k="personalidade" chips cor="#8b5cf6" ph="+ adjetivo" />
          <h3 className="est-mini mt-3">Valores</h3>
          <Lista k="valores" chips cor="#0ea5e9" ph="+ valor" />
        </Bloco>
        <Bloco titulo="Somos / não somos">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><h3 className="est-mini text-[#16a34a]">Somos</h3><Lista k="somos" cor="#22c55e" /></div>
            <div><h3 className="est-mini text-[var(--red)]">Não somos</h3><Lista k="naosomos" cor="#ef4444" /></div>
          </div>
        </Bloco>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Bloco titulo="Pilares de comunicação" sub="Os grandes temas da marca."><Lista k="pilares" /></Bloco>
        <Bloco titulo="Mensagens-chave" sub="O que todo conteúdo deve reforçar."><Lista k="mensagens" /></Bloco>
      </div>

      <Bloco titulo="Universo de palavras" sub="O vocabulário da marca: o que usamos e o que nunca dizemos.">
        <h3 className="est-mini text-[#16a34a]">Usamos</h3>
        <Lista k="palavras.usar" chips cor="#22c55e" ph="+ palavra" />
        <h3 className="est-mini mt-3 text-[var(--red)]">Evitamos</h3>
        <Lista k="palavras.evitar" chips riscado cor="#ef4444" ph="+ palavra" />
      </Bloco>
    </>
  )
}

// ───────────────────────────── Arquitetura de Receita ─────────────────────────────

const COR_LADO = { aquisicao: '#3b82f6', centro: '#0f172a', expansao: '#22c55e' } as const

/** Gravata-borboleta: 3 fatias à esquerda afunilando, o nó no meio e 3 fatias abrindo à direita. */
function Gravata({ ativa, escolher }: { ativa: string; escolher: (id: string) => void }) {
  const { d } = useEstrategia()
  const meio = 120
  const altura = (x: number) => (x <= 440 ? 110 - (85 * x) / 440 : x >= 560 ? 25 + (85 * (x - 560)) / 440 : 25)
  const fatias = ETAPAS_RECEITA.map((e, i) => {
    const [x0, x1] = i < 3 ? [i * 146.7, (i + 1) * 146.7] : i === 3 ? [440, 560] : [560 + (i - 4) * 146.7, 560 + (i - 3) * 146.7]
    const g = 2
    const [a, b] = [x0 + g, x1 - g]
    const pontos = `${a},${meio - altura(a)} ${b},${meio - altura(b)} ${b},${meio + altura(b)} ${a},${meio + altura(a)}`
    return { e, pontos, cx: (a + b) / 2 }
  })
  return (
    <svg viewBox="0 0 1000 250" className="est-gravata" role="group" aria-label="Gravata-borboleta da receita">
      {fatias.map(({ e, pontos, cx }, i) => {
        const cor = COR_LADO[e.lado]
        const sel = ativa === e.id
        const vol = d.textos[`volume.${e.id}`]
        const conv = d.textos[`conversao.${e.id}`]
        return (
          <g key={e.id} role="button" tabIndex={0} aria-pressed={sel} aria-label={e.nome} onClick={() => escolher(e.id)} onKeyDown={(k) => (k.key === 'Enter' || k.key === ' ') && (k.preventDefault(), escolher(e.id))} className="cursor-pointer">
            <polygon points={pontos} fill={e.lado === 'centro' ? 'var(--text)' : cor} fillOpacity={sel ? 1 : e.lado === 'centro' ? 0.9 : 0.25 + (e.lado === 'aquisicao' ? (3 - i) : i - 3) * 0.12} stroke={sel ? 'var(--text)' : 'none'} strokeWidth={3} />
            <text x={cx} y={meio - 6} textAnchor="middle" className="est-g-nome" fill={sel || e.lado === 'centro' ? 'var(--bg)' : 'var(--text)'}>{e.nome}</text>
            <text x={cx} y={meio + 14} textAnchor="middle" className="est-g-vol" fill={sel || e.lado === 'centro' ? 'var(--bg)' : 'var(--text-2)'}>{vol || '—'}</text>
            {i < ETAPAS_RECEITA.length - 1 && <text x={cx + (i === 3 ? 60 : 73)} y={i < 3 ? 236 : 236} textAnchor="middle" className="est-g-conv">{conv ? `→ ${conv.replace(/%?$/, '%')}` : ''}</text>}
          </g>
        )
      })}
      <text x={220} y={14} textAnchor="middle" className="est-g-lado">Aquisição (Marketing e Vendas)</text>
      <text x={780} y={14} textAnchor="middle" className="est-g-lado">Retenção e expansão (Sucesso do cliente)</text>
    </svg>
  )
}

function Receita() {
  const { d, leitura } = useEstrategia()
  const [ativa, setAtiva] = useState<string>(ETAPAS_RECEITA[0].id)
  const e = ETAPAS_RECEITA.find((x) => x.id === ativa)!
  const ltv = numero(d.textos['num.ltv'])
  const cac = numero(d.textos['num.cac'])
  const razao = ltv !== null && cac ? ltv / cac : null
  const meta = numero(d.textos['num.meta'])
  const rec = numero(d.textos['num.recorrente'])
  return (
    <>
      <Bloco titulo="Gravata-borboleta da receita" sub="Revenue Architecture (Winning by Design): a receita não acaba na venda. Clique numa etapa para preencher volume, conversão, tempo e ações.">
        <div className="overflow-x-auto"><div className="min-w-[640px]"><Gravata ativa={ativa} escolher={setAtiva} /></div></div>
        {!leitura && (
          <div className="est-etapa" style={{ borderColor: COR_LADO[e.lado] }}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-[16px] font-bold">{e.nome} <span className="font-normal text-texto-3">({e.original})</span></h3>
              <span className="est-selo" style={{ background: tinta(COR_LADO[e.lado], 18) }}>{e.resp}</span>
            </div>
            <p className="est-ajuda">{e.desc} O que contar: {e.conta}.</p>
            <div className="est-fichas">
              {CAMPOS_ETAPA_RECEITA.map((c) => <label key={c.sufixo}><span>{c.rotulo}</span><Texto k={`${c.sufixo}.${e.id}`} ph={c.ajuda || '—'} /></label>)}
            </div>
            <h3 className="est-mini mt-2">Ações nesta etapa</h3>
            <Lista k={`acoes.${e.id}`} cor={COR_LADO[e.lado]} ph="O que fazemos para mover as pessoas daqui para a próxima etapa" />
          </div>
        )}
      </Bloco>

      <Bloco titulo="Etapas em números" sub="Volume por mês, conversão para a etapa seguinte e tempo médio.">
        <div className="overflow-x-auto">
          <table className="est-tabela">
            <thead><tr><th>Etapa</th><th>Responsável</th><th>Volume</th><th>Conversão</th><th>Tempo</th><th>Ações</th></tr></thead>
            <tbody>
              {ETAPAS_RECEITA.map((x) => (
                <tr key={x.id} onClick={() => setAtiva(x.id)} className={!leitura ? 'cursor-pointer' : ''} data-ativa={ativa === x.id && !leitura ? '' : undefined}>
                  <td><i className="est-ponto" style={{ background: COR_LADO[x.lado] }} /> {x.nome}</td>
                  <td>{x.resp}</td>
                  <td>{d.textos[`volume.${x.id}`] || '—'}</td>
                  <td>{d.textos[`conversao.${x.id}`] || '—'}</td>
                  <td>{d.textos[`tempo.${x.id}`] || '—'}</td>
                  <td className="max-w-[320px]">{(d.listas[`acoes.${x.id}`] ?? []).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco titulo="Números do modelo" sub="A saúde da receita: quanto custa trazer um cliente e quanto ele deixa.">
        <div className="est-fichas">
          {NUMEROS_RECEITA.map((c) => <label key={c.chave}><span>{c.rotulo}</span><Texto k={c.chave} ph="—" /></label>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="est-kpi" data-tom={razao === null ? '' : razao >= 3 ? 'bom' : razao >= 1 ? 'medio' : 'ruim'}>
            <span>LTV ÷ CAC</span>
            <b>{razao === null ? '—' : `${razao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`}</b>
            <small>{razao === null ? 'Preencha LTV e CAC' : razao >= 3 ? 'Saudável (3× ou mais)' : razao >= 1 ? 'Apertado: abaixo de 3×' : 'Prejuízo: cada cliente custa mais do que deixa'}</small>
          </div>
          {meta !== null && rec !== null && (
            <div className="est-kpi" data-tom={rec >= meta ? 'bom' : 'medio'}>
              <span>Distância da meta</span>
              <b>{(meta - rec).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</b>
              <small>{rec >= meta ? 'Meta batida' : `${Math.round((rec / meta) * 100)}% da meta por mês`}</small>
            </div>
          )}
        </div>
      </Bloco>
    </>
  )
}

// ───────────────────────────── SWOT ─────────────────────────────

function Swot() {
  return (
    <>
      <Bloco titulo="Análise SWOT" sub="Forças e fraquezas são internas (dependem do cliente); oportunidades e ameaças vêm de fora.">
        <div className="est-swot">
          <span className="est-eixo" style={{ gridArea: 'a' }}>Ajuda</span>
          <span className="est-eixo" style={{ gridArea: 'b' }}>Atrapalha</span>
          <span className="est-eixo est-eixo-v" style={{ gridArea: 'i' }}>Interno</span>
          <span className="est-eixo est-eixo-v" style={{ gridArea: 'e' }}>Externo</span>
          {SWOT.map((s, i) => (
            <div key={s.chave} className="est-q" style={{ gridArea: ['s', 'w', 'o', 't'][i], background: tinta(s.cor, 11), borderColor: tinta(s.cor, 45) }}>
              <span className="est-letra" style={{ color: s.cor }} aria-hidden>{s.letra}</span>
              <h3 style={{ color: s.cor }}>{s.rotulo}</h3>
              <p className="est-ajuda">{s.ajuda}</p>
              <Lista k={s.chave} cor={s.cor} />
            </div>
          ))}
        </div>
      </Bloco>
      <Bloco titulo="Estratégias cruzadas" sub="Matriz TOWS: o que fazer com o SWOT.">
        <div className="grid gap-3 md:grid-cols-2">
          {TOWS.map((t, i) => (
            <div key={t.chave} className="est-cartao" style={{ borderTopColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'][i] }}>
              <h3>{t.rotulo}</h3>
              <p className="est-ajuda">{t.ajuda}</p>
              <Lista k={t.chave} />
            </div>
          ))}
        </div>
      </Bloco>
    </>
  )
}
