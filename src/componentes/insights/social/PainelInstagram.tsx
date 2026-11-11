'use client'

import { useState, type ReactNode } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { CartaoMetrica, ChipDelta, type Metrica } from './Metricas'

export type PostLista = { id: string; titulo: string; formato: string; engajamento: number | null; alcance: number; link: string }
export type Interacao = { nome: string; valor: number }

const inteiro = new Intl.NumberFormat('pt-BR')
const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const diaMes = (d: string) => `${Number(d.slice(8, 10))} ${MESES[Number(d.slice(5, 7)) - 1]}`

const Secao = ({ children }: { children: ReactNode }) => <section>{children}</section>

/** Barras hachuradas com a bolinha vazada no topo; a barra do pico fica sólida em vermelho, com o valor num balão escuro. Mais de 31 dias viram 12 grupos. */
function Barras({ dias, valores }: { dias: string[]; valores: number[] }) {
  if (dias.length < 1) return <p style={{ color: 'var(--ins-suave)' }}>Sem dados por dia no período.</p>
  const grupos = dias.length > 31 ? 12 : dias.length
  const passo = Math.ceil(dias.length / grupos)
  const barras = Array.from({ length: grupos }, (_, g) => {
    const ini = g * passo
    const fatia = valores.slice(ini, ini + passo)
    return { rotulo: diaMes(dias[ini]), valor: fatia.reduce((a, b) => a + b, 0) }
  })
  const maior = Math.max(1, ...barras.map((b) => b.valor))
  const pico = barras.findIndex((b) => b.valor === maior)
  const grade = [1, 0.75, 0.5, 0.25, 0]
  return (
    <div>
      <div>
        <div style={{ width: 48, height: 210 }}>
          {grade.map((f) => <span key={f} style={{ top: `${(1 - f) * 100}%`, color: 'var(--ins-suave)' }}>{numero.format(maior * f)}</span>)}
        </div>
        <div style={{ height: 210, gap: barras.length > 20 ? 4 : 8, paddingTop: 30 }}>
          {barras.map((b, i) => (
            <div key={i} title={`${b.rotulo}: ${inteiro.format(b.valor)}`}>
              <div style={{ height: `${Math.max(4, (b.valor / maior) * 100)}%`, borderRadius: '10px 10px 4px 4px', background: i === pico ? 'linear-gradient(180deg, #e8262b, #d80d12)' : 'repeating-linear-gradient(135deg, var(--hachura) 0 2px, transparent 2px 6px)' }}>
                <span style={{ top: -5, background: 'var(--bg)', border: `2px solid ${i === pico ? '#d80d12' : 'var(--text-3)'}` }} />
                {i === pico && b.valor > 0 && <span style={{ top: -34, height: 22, display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'var(--on-primary)' }}>{inteiro.format(b.valor)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ paddingLeft: 58, gap: barras.length > 20 ? 4 : 8 }}>
        {barras.map((b, i) => <span key={i} style={{ color: 'var(--ins-suave)' }}>{barras.length > 16 && i % 2 ? '' : b.rotulo}</span>)}
      </div>
    </div>
  )
}

type Ordem = { col: 'titulo' | 'alcance' | 'engajamento'; asc: boolean }

/**
 * Corpo do Instagram no padrão do Claude Design: cartões de métrica (o clique escolhe a métrica do gráfico), evolução em barras
 * hachuradas, "como as pessoas interagem" e a tabela de posts de melhor desempenho (colunas ordenáveis).
 */
export function PainelInstagram({ saude, metricas, dias, interacoes, totalInteracoes, posts }: { saude: ReactNode; metricas: Metrica[]; dias: string[]; interacoes: Interacao[]; totalInteracoes: number; posts: PostLista[] }) {
  const comSerie = metricas.filter((m) => m.serie && m.serie.length === dias.length)
  const [id, setId] = useState(comSerie[0]?.id ?? '')
  const [ordem, setOrdem] = useState<Ordem>({ col: 'alcance', asc: false })
  const atual = comSerie.find((m) => m.id === id) ?? comSerie[0]
  const maior = Math.max(1, ...interacoes.map((i) => i.valor))
  const ordenados = [...posts].sort((a, b) => {
    const va = ordem.col === 'titulo' ? a.titulo.toLowerCase() : ordem.col === 'alcance' ? a.alcance : (a.engajamento ?? -1)
    const vb = ordem.col === 'titulo' ? b.titulo.toLowerCase() : ordem.col === 'alcance' ? b.alcance : (b.engajamento ?? -1)
    return (va < vb ? -1 : va > vb ? 1 : 0) * (ordem.asc ? 1 : -1)
  })
  const ordenar = (col: Ordem['col']) => setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : col === 'titulo' }))
  const cab = (col: Ordem['col'], rotulo: string) => <button type="button" onClick={() => ordenar(col)}>{rotulo}<Ic n="unfold_more" s={13} /></button>
  const total = atual?.serie?.reduce((a, b) => a + b, 0) ?? 0
  return (
    <div>
      <div>
        {saude}
        {metricas.map((m) => {
          const clicavel = !!m.serie && m.serie.length === dias.length
          return <CartaoMetrica key={m.id} m={m} dias={dias.length} ativo={atual?.id === m.id} aoEscolher={clicavel ? () => setId(m.id) : undefined} />
        })}
      </div>
      <div>
        <Secao>
          <div>
            <div>
              <p style={{ color: 'var(--text-2)' }}>{atual ? `${atual.rotulo} · evolução` : 'Evolução'}</p>
              {atual && (
                <p>
                  <span>{inteiro.format(total)}</span>
                  {atual.delta !== undefined && <ChipDelta delta={atual.delta} />}
                  {atual.delta !== undefined && <span style={{ color: 'var(--ins-suave)' }}>vs. últimos {dias.length} dias</span>}
                </p>
              )}
            </div>
            <Ic n="info" s={15} style={{ color: 'var(--ins-suave)' }} />
          </div>
          {atual?.serie ? <Barras dias={dias} valores={atual.serie} /> : <p style={{ color: 'var(--ins-suave)' }}>A Meta não entrega nenhuma métrica por dia para esta conta no período.</p>}
          <p style={{ color: 'var(--ins-suave)' }}>Escolha a métrica nos cartões acima.</p>
        </Secao>
        <div>
          <Secao>
            <div>
              <div><b>Como as pessoas interagem</b><p style={{ color: 'var(--ins-suave)' }}>Soma dos últimos {dias.length} dias</p></div>
              <b>{inteiro.format(totalInteracoes)}</b>
            </div>
            <ul>
              {interacoes.map((i) => (
                <li key={i.nome}>
                  <p><span style={{ color: 'var(--text-2)' }}>{i.nome}</span><b>{inteiro.format(i.valor)}</b></p>
                  <div><span style={{ width: `${Math.max(2, (i.valor / maior) * 100)}%`, background: 'linear-gradient(90deg, #e08a00, #d80d12)' }} /></div>
                </li>
              ))}
            </ul>
          </Secao>
          {posts.length > 0 && (
            <Secao>
              <div><span>Posts de melhor desempenho</span><span style={{ color: 'var(--ins-suave)' }}>{dias.length} dias</span></div>
              <div style={{ background: 'var(--bg)' }}>
                <div style={{ color: 'var(--ins-suave)' }}>{cab('titulo', 'Post')}{cab('alcance', 'Alcance')}{cab('engajamento', 'Engajamento')}</div>
                {ordenados.map((p) => (
                  <a key={p.id} href={p.link} target="_blank" rel="noreferrer">
                    <span><span>{p.titulo}</span><span style={{ color: 'var(--ins-suave)' }}>{p.formato}</span></span>
                    <b>{numero.format(p.alcance)}</b>
                    <span>
                      <span style={{ ['--nota' as string]: `${Math.min(100, (p.engajamento ?? 0) * 11)}%` }} />
                      <span>{p.engajamento === null ? '—' : `${p.engajamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</span>
                    </span>
                  </a>
                ))}
              </div>
            </Secao>
          )}
        </div>
      </div>
    </div>
  )
}
