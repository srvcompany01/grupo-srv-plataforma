'use client'

import { Check, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ARQUETIPOS, CAMPOS_ETAPA_RECEITA, CIRCULO, CONSCIENCIA, DECLARACAO, EMPATIA, ETAPAS_JORNADA, ETAPAS_RECEITA, JTBD, NUMEROS_RECEITA, PERSONA, PROBLEMAS, SWOT, TOM, TOWS,
  idDoCheck, numero, textosDosNumerosReais, type DadosEstrategia, type Metodo, type NivelChecklist, type NumerosReais,
} from '@/dominio/estrategia'
import { rotuloMesLongo } from '@/dominio/performance'
import { Button } from '@/componentes/ui/button'
import { Editor, Escala, Lista, Texto, useEstrategia, useMarcados } from './edicao'

/** O quadro visual de um método, editável (aba Estratégia) ou só leitura (página do cliente). */
export function QuadroEstrategia({ metodo, clienteId, inicial, leitura = false, reais = null }: { metodo: Metodo; clienteId: string; inicial: DadosEstrategia; leitura?: boolean; /** Números reais do último mês (só a receita usa). */ reais?: NumerosReais | null }) {
  const Quadro = { publico: Publico, jornada: Jornada, posicionamento: Posicionamento, receita: Receita, swot: Swot }[metodo]
  return (
    <Editor key={`${clienteId}-${metodo}`} clienteId={clienteId} metodo={metodo} inicial={inicial} leitura={leitura}>
      <div>
        {metodo === 'receita' ? <Receita reais={reais} /> : <Quadro />}
      </div>
    </Editor>
  )
}

function Bloco({ titulo, sub, children, className = '' }: { titulo: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section>
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
    <div style={{ background: tinta(cor, 10) }}>
      <h3 style={{ color: cor }}>{c.rotulo}</h3>
      <p>{c.pergunta}</p>
      <Lista k={c.chave} cor={cor} />
    </div>
  )
  return (
    <>
      <Bloco titulo="Persona" sub="Quem é a pessoa que mais compra (ou que queremos que compre).">
        <div>
          <div aria-hidden>{iniciais}</div>
          <div>
            <Texto k="persona.nome" ph="Nome da persona (ex.: Ana, a mãe empreendedora)" />
            <div><Texto k="persona.frase" ph="Uma frase que ela diria…" /></div>
          </div>
        </div>
        <div>
          {PERSONA.filter((c) => !['persona.nome', 'persona.frase', 'persona.rotina'].includes(c.chave)).map((c) => (
            <label key={c.chave}><span>{c.rotulo}</span><Texto k={c.chave} ph="—" /></label>
          ))}
        </div>
        <label><span>Rotina e estilo de vida</span><Texto k="persona.rotina" ph="Como é o dia dela, o que consome, do que gosta…" /></label>
      </Bloco>

      <Bloco titulo="Mapa de empatia" sub="Coloque-se no lugar da persona: o que ela pensa, vê, ouve e faz.">
        <div>
          {quadrante(pensa, '#8b5cf6', 'tl')}
          {quadrante(ve, '#3b82f6', 'tr')}
          {quadrante(ouve, '#f59e0b', 'bl')}
          {quadrante(fala, '#14b8a6', 'br')}
          <div aria-hidden><span>{iniciais}</span><small>{nome || 'Persona'}</small></div>
        </div>
        <div>
          {quadrante(dores, '#ef4444', '')}
          {quadrante(ganhos, '#22c55e', '')}
        </div>
      </Bloco>

      <Bloco titulo="Dores, problemas e desafios" sub="Do que dói hoje até o que impede a compra.">
        <div>
          {PROBLEMAS.map((c) => (
            <div key={c.chave} style={{ borderTopColor: c.cor }}>
              <h3>{c.rotulo}</h3>
              <p>{c.ajuda}</p>
              <Lista k={c.chave} cor={c.cor} />
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Jobs to be done" sub="O “trabalho” que a pessoa contrata o produto para fazer.">
        <div>
          {JTBD.map((c, i) => (
            <div key={c.chave} style={{ borderTopColor: ['#0ea5e9', '#ec4899', '#f97316'][i] }}>
              <h3>{c.rotulo}</h3>
              <p>{c.ajuda}</p>
              <Lista k={c.chave} />
            </div>
          ))}
        </div>
      </Bloco>

      <Consciencia />

      <Bloco titulo="Comportamento" sub="O que faz decidir, onde encontrar e como falar com ela.">
        <div>
          <div><h3>Gatilhos de compra</h3><p>O que faz decidir agora.</p><Lista k="gatilhos" /></div>
          <div><h3>Onde está</h3><p>Redes, sites, lugares, influenciadores.</p><Lista k="canais" chips /></div>
          <div><h3>Como fala</h3><p>Palavras e expressões que usa.</p><Lista k="linguagem" chips /></div>
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
      <div role="radiogroup" aria-label="Nível de consciência">
        {CONSCIENCIA.map((c, i) => (
          <button key={c.id} type="button" role="radio" aria-checked={atual === c.id} disabled={leitura} style={{ height: `${44 + i * 22}px` }} onClick={() => mudar((x) => ({ ...x, textos: { ...x.textos, consciencia: x.textos.consciencia === c.id ? '' : c.id } }))}>
            <b>{i + 1}</b>
            <span>{c.nome}</span>
          </button>
        ))}
      </div>
      {escolhido ? (
        <p><b>{escolhido.nome}:</b> {escolhido.desc} <span>Como comunicar: {escolhido.comunicar}</span></p>
      ) : (
        <p>Nenhum degrau escolhido.</p>
      )}
    </Bloco>
  )
}

// ───────────────────────────── Jornada de compra ─────────────────────────────

function Jornada() {
  const linha = (rotulo: ReactNode, celula: (e: (typeof ETAPAS_JORNADA)[number], i: number) => ReactNode, classe = '') => (
    <>
      <div>{rotulo}</div>
      {ETAPAS_JORNADA.map((e, i) => <div key={e.id}>{celula(e, i)}</div>)}
    </>
  )
  return (
    <Bloco titulo="Como uma venda acontece?" sub="As cinco etapas da jornada. Escreva como acontece com este cliente, como influenciar e marque o que já existe.">
      <div>
        <div>
          <div />
          {ETAPAS_JORNADA.map((e) => <div key={e.id}>{e.nome}</div>)}
          {linha('O que representa?', (e) => <p>{e.representa}</p>)}
          {linha('Impressão do consumidor', (e, i) => (
            <div>
              <span>{e.impressao}</span>
              {i < ETAPAS_JORNADA.length - 1 && (
                <span title={`Conversão de "${e.impressao}" para "${ETAPAS_JORNADA[i + 1].impressao}"`}>
                  <b>↑</b><Texto k={`conv.${e.id}`} ph="%" />
                </span>
              )}
            </div>
          ), 'est-j-meio')}
          {linha('Como acontece?', (e) => <Lista k={`acontece.${e.id}`} ph={`Ex.: ${e.acontece[0]}`} />)}
          {linha('Como você influencia?', (e) => <Lista k={`influencia.${e.id}`} ph={`Ex.: ${e.influencia[0]}`} />)}
          {linha(<>Checklist de um projeto simples <b>−R$</b></>, (e) => <Checklist nivel="simples" etapa={e.id} padrao={e.simples} />)}
          {linha(<>Checklist de um projeto complexo <b>+R$</b></>, (e) => <Checklist nivel="complexo" etapa={e.id} padrao={e.complexo} />)}
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
    <div>
      <div title={`${feitos} de ${itens.length}`}><span style={{ width: `${itens.length ? (feitos / itens.length) * 100 : 0}%` }} /></div>
      <ul>
        {itens.map(({ t, extra }) => {
          const id = idDoCheck(nivel, etapa, t)
          return (
            <li key={id}>
              <button type="button" role="checkbox" aria-checked={tem(id)} disabled={leitura} onClick={() => alternar(id)}>{tem(id) && <Check />}</button>
              <span>{t}</span>
              {extra && !leitura && (
                <button type="button" aria-label="Remover item" onClick={() => mudar((x) => ({ ...x, listas: { ...x.listas, [chave]: (x.listas[chave] ?? []).filter((y) => y !== t) }, marcados: x.marcados.filter((m) => m !== id) }))}><X /></button>
              )}
            </li>
          )
        })}
      </ul>
      {!leitura && <input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} onBlur={adicionar} maxLength={500} placeholder="+ item" aria-label="Novo item do checklist" />}
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
        <div>
          <Texto k="bigidea" ph="Escreva a big idea da marca…" />
          <Texto k="bigidea.explica" ph="Por que essa ideia? De onde ela vem?" />
        </div>
      </Bloco>

      <Bloco titulo="Círculo dourado" sub="Simon Sinek: comece pelo porquê. Clique num anel para escrever.">
        <div>
          <div aria-hidden={leitura}>
            {[...CIRCULO].reverse().map((c, i) => (
              <button key={c.chave} type="button" disabled={leitura} onClick={() => focar(`campo-${c.chave}`)} style={{ inset: `${i * 18}%`, background: tinta(CORES_CIRCULO[2 - i], 22 + i * 10), borderColor: CORES_CIRCULO[2 - i] }}>
                <span style={{ color: CORES_CIRCULO[2 - i] }}>{c.rotulo}</span>
              </button>
            ))}
          </div>
          <div>
            {CIRCULO.map((c, i) => (
              <div key={c.chave} style={{ borderTopColor: CORES_CIRCULO[i] }}>
                <h3>{c.rotulo}</h3>
                <p>{c.ajuda}</p>
                <Texto k={c.chave} id={`campo-${c.chave}`} />
              </div>
            ))}
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Declaração de posicionamento" sub="Preencha as lacunas: a frase que diz para quem a marca existe e por que é diferente.">
        <p>
          {DECLARACAO.map((c) => (
            <span key={c.chave}>
              {c.antes !== ',' && <>{c.antes} </>}{c.antes === ',' && ', '}
              <span><Texto k={c.chave} ph={c.rotulo.toLowerCase()} /></span>{' '}
            </span>
          ))}
          .
        </p>
      </Bloco>

      <div>
        <Bloco titulo="Proposta de valor"><Texto k="proposta" ph="O que o cliente ganha, para quem e por que só aqui." /></Bloco>
        <Bloco titulo="Slogan / assinatura"><Texto k="slogan" ph="Ex.: Pense diferente." /></Bloco>
        <Bloco titulo="Manifesto"><Texto k="manifesto" ph="A crença da marca em poucas linhas…" /></Bloco>
      </div>

      <Bloco titulo="Arquétipo" sub={arqs.length ? <>Principal: <b>{arqs[0].nome}</b>{arqs[1] && <> · secundário: <b>{arqs[1].nome}</b></>}</> : 'Os 12 arquétipos de marca. Clique para escolher o principal e, se quiser, um secundário.'}>
        <div>
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
        <div>
          {TOM.map((t) => <Escala key={t.chave} k={t.chave} esq={t.esq} dir={t.dir} />)}
        </div>
        <div><h3>Exemplos de frases no tom</h3><Lista k="tom.exemplos" ph="Uma frase como a marca falaria" /></div>
      </Bloco>

      <div>
        <Bloco titulo="Personalidade e valores">
          <h3>Personalidade (adjetivos)</h3>
          <Lista k="personalidade" chips cor="#8b5cf6" ph="+ adjetivo" />
          <h3>Valores</h3>
          <Lista k="valores" chips cor="#0ea5e9" ph="+ valor" />
        </Bloco>
        <Bloco titulo="Somos / não somos">
          <div>
            <div><h3>Somos</h3><Lista k="somos" cor="#22c55e" /></div>
            <div><h3>Não somos</h3><Lista k="naosomos" cor="#ef4444" /></div>
          </div>
        </Bloco>
      </div>

      <div>
        <Bloco titulo="Pilares de comunicação" sub="Os grandes temas da marca."><Lista k="pilares" /></Bloco>
        <Bloco titulo="Mensagens-chave" sub="O que todo conteúdo deve reforçar."><Lista k="mensagens" /></Bloco>
      </div>

      <Bloco titulo="Universo de palavras" sub="O vocabulário da marca: o que usamos e o que nunca dizemos.">
        <h3>Usamos</h3>
        <Lista k="palavras.usar" chips cor="#22c55e" ph="+ palavra" />
        <h3>Evitamos</h3>
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
    <svg viewBox="0 0 1000 250" role="group" aria-label="Gravata-borboleta da receita">
      {fatias.map(({ e, pontos, cx }, i) => {
        const cor = COR_LADO[e.lado]
        const sel = ativa === e.id
        const vol = d.textos[`volume.${e.id}`]
        const conv = d.textos[`conversao.${e.id}`]
        return (
          <g key={e.id} role="button" tabIndex={0} aria-pressed={sel} aria-label={e.nome} onClick={() => escolher(e.id)} onKeyDown={(k) => (k.key === 'Enter' || k.key === ' ') && (k.preventDefault(), escolher(e.id))}>
            <polygon points={pontos} fill={e.lado === 'centro' ? 'var(--text)' : cor} fillOpacity={sel ? 1 : e.lado === 'centro' ? 0.9 : 0.25 + (e.lado === 'aquisicao' ? (3 - i) : i - 3) * 0.12} stroke={sel ? 'var(--text)' : 'none'} strokeWidth={3} />
            <text x={cx} y={meio - 6} textAnchor="middle" fill={sel || e.lado === 'centro' ? 'var(--bg)' : 'var(--text)'}>{e.nome}</text>
            <text x={cx} y={meio + 14} textAnchor="middle" fill={sel || e.lado === 'centro' ? 'var(--bg)' : 'var(--text-2)'}>{vol || '—'}</text>
            {i < ETAPAS_RECEITA.length - 1 && <text x={cx + (i === 3 ? 60 : 73)} y={i < 3 ? 236 : 236} textAnchor="middle">{conv ? `→ ${conv.replace(/%?$/, '%')}` : ''}</text>}
          </g>
        )
      })}
      <text x={220} y={14} textAnchor="middle">Aquisição (Marketing e Vendas)</text>
      <text x={780} y={14} textAnchor="middle">Retenção e expansão (Sucesso do cliente)</text>
    </svg>
  )
}

function Receita({ reais = null }: { reais?: NumerosReais | null }) {
  const { d, leitura, mudar } = useEstrategia()
  const reaisItens = reais ? textosDosNumerosReais(reais) : []
  const [ativa, setAtiva] = useState<string>(ETAPAS_RECEITA[0].id)
  const e = ETAPAS_RECEITA.find((x) => x.id === ativa)!
  const ltv = numero(d.textos['num.ltv'])
  const cac = numero(d.textos['num.cac'])
  const razao = ltv !== null && cac ? ltv / cac : null
  const meta = numero(d.textos['num.meta'])
  const rec = numero(d.textos['num.recorrente'])
  return (
    <>
      {!leitura && reais && reaisItens.length > 0 && (
        <Bloco titulo={`Números reais de ${rotuloMesLongo(reais.mes)}`} sub="Vêm dos anúncios (Meta e Google), do link da bio e do resultado lançado em Performance. O botão copia estes valores para os campos da gravata e substitui o que estiver neles.">
          <div>
            {reaisItens.map((i) => <div key={i.chave}><span>{i.rotulo}</span><p>{i.valor}</p></div>)}
          </div>
          <Button type="button" size="sm" onClick={() => mudar((x) => ({ ...x, textos: { ...x.textos, ...Object.fromEntries(reaisItens.map((i) => [i.chave, i.valor])) } }))}>Preencher a gravata com estes números</Button>
        </Bloco>
      )}

      <Bloco titulo="Gravata-borboleta da receita" sub="Revenue Architecture (Winning by Design): a receita não acaba na venda. Clique numa etapa para preencher volume, conversão, tempo e ações.">
        <div><div><Gravata ativa={ativa} escolher={setAtiva} /></div></div>
        {!leitura && (
          <div style={{ borderColor: COR_LADO[e.lado] }}>
            <div>
              <h3>{e.nome} <span>({e.original})</span></h3>
              <span style={{ background: tinta(COR_LADO[e.lado], 18) }}>{e.resp}</span>
            </div>
            <p>{e.desc} O que contar: {e.conta}.</p>
            <div>
              {CAMPOS_ETAPA_RECEITA.map((c) => <label key={c.sufixo}><span>{c.rotulo}</span><Texto k={`${c.sufixo}.${e.id}`} ph={c.ajuda || '—'} /></label>)}
            </div>
            <h3>Ações nesta etapa</h3>
            <Lista k={`acoes.${e.id}`} cor={COR_LADO[e.lado]} ph="O que fazemos para mover as pessoas daqui para a próxima etapa" />
          </div>
        )}
      </Bloco>

      <Bloco titulo="Etapas em números" sub="Volume por mês, conversão para a etapa seguinte e tempo médio.">
        <div>
          <table>
            <thead><tr><th>Etapa</th><th>Responsável</th><th>Volume</th><th>Conversão</th><th>Tempo</th><th>Ações</th></tr></thead>
            <tbody>
              {ETAPAS_RECEITA.map((x) => (
                <tr key={x.id} onClick={() => setAtiva(x.id)} data-ativa={ativa === x.id && !leitura ? '' : undefined}>
                  <td><i style={{ background: COR_LADO[x.lado] }} /> {x.nome}</td>
                  <td>{x.resp}</td>
                  <td>{d.textos[`volume.${x.id}`] || '—'}</td>
                  <td>{d.textos[`conversao.${x.id}`] || '—'}</td>
                  <td>{d.textos[`tempo.${x.id}`] || '—'}</td>
                  <td>{(d.listas[`acoes.${x.id}`] ?? []).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco titulo="Números do modelo" sub="A saúde da receita: quanto custa trazer um cliente e quanto ele deixa.">
        <div>
          {NUMEROS_RECEITA.map((c) => <label key={c.chave}><span>{c.rotulo}</span><Texto k={c.chave} ph="—" /></label>)}
        </div>
        <div>
          <div data-tom={razao === null ? '' : razao >= 3 ? 'bom' : razao >= 1 ? 'medio' : 'ruim'}>
            <span>LTV ÷ CAC</span>
            <b>{razao === null ? '—' : `${razao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`}</b>
            <small>{razao === null ? 'Preencha LTV e CAC' : razao >= 3 ? 'Saudável (3× ou mais)' : razao >= 1 ? 'Apertado: abaixo de 3×' : 'Prejuízo: cada cliente custa mais do que deixa'}</small>
          </div>
          {meta !== null && rec !== null && (
            <div data-tom={rec >= meta ? 'bom' : 'medio'}>
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
        <div>
          <span style={{ gridArea: 'a' }}>Ajuda</span>
          <span style={{ gridArea: 'b' }}>Atrapalha</span>
          <span style={{ gridArea: 'i' }}>Interno</span>
          <span style={{ gridArea: 'e' }}>Externo</span>
          {SWOT.map((s, i) => (
            <div key={s.chave} style={{ gridArea: ['s', 'w', 'o', 't'][i], background: tinta(s.cor, 11), borderColor: tinta(s.cor, 45) }}>
              <span style={{ color: s.cor }} aria-hidden>{s.letra}</span>
              <h3 style={{ color: s.cor }}>{s.rotulo}</h3>
              <p>{s.ajuda}</p>
              <Lista k={s.chave} cor={s.cor} />
            </div>
          ))}
        </div>
      </Bloco>
      <Bloco titulo="Estratégias cruzadas" sub="Matriz TOWS: o que fazer com o SWOT.">
        <div>
          {TOWS.map((t, i) => (
            <div key={t.chave} style={{ borderTopColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'][i] }}>
              <h3>{t.rotulo}</h3>
              <p>{t.ajuda}</p>
              <Lista k={t.chave} />
            </div>
          ))}
        </div>
      </Bloco>
    </>
  )
}
