import { BarChart3, ExternalLink, Globe, MapPin, MessageSquareText, Phone, QrCode, Radar, Search, Star, Target, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { LigarLugar, NovaVarredura } from '@/componentes/gmn/FormulariosGmn'
import { MapaGrade, Medidor } from '@/componentes/gmn/MapaGrade'
import { Numeros } from '@/componentes/insights/BlocoAnalise'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { ESTILO_TOM, SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarSaude, concorrentesDaGrade, linkAvaliacao, textoProposta, type ItemSaude } from '@/dominio/gmn'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { botaoPrimario, campo } from '@/lib/ui'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import * as places from '@/servicos/places'

// O geogrid 9×9 faz até 243 buscas.
export const maxDuration = 300

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const n = (v: number) => v.toLocaleString('pt-BR')
const tomNota = (nota: number) => (nota >= 80 ? 'bom' : nota >= 60 ? 'atencao' : 'ruim')
const ROTULO_TOM = { ruim: 'Fraco', atencao: 'Razoável', bom: 'Bom' } as const

/** Google Meu Negócio pelos dados públicos do Google: saúde do perfil, geogrid de ranking e prospecção. */
export default async function Gmn({ searchParams }: PageProps<'/gmn'>) {
  await exigirEquipe()
  const sp = await searchParams
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const aba = ['perfil', 'geogrid', 'prospeccao'].includes(texto(sp.aba)) ? texto(sp.aba) : escolhido ? 'perfil' : 'panorama'
  const link = (a: string) => (escolhido ? `/gmn?cliente=${escolhido.id}&aba=${a}` : `/gmn?aba=${a}`)
  const abas: [string, string, typeof Radar][] = [...(escolhido ? ([['perfil', 'Perfil e saúde', BarChart3], ['geogrid', 'Geogrid de ranking', Radar]] as [string, string, typeof Radar][]) : ([['panorama', 'Todos os clientes', Users]] as [string, string, typeof Radar][])), ['prospeccao', 'Prospecção', Target]]

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Google Meu Negócio</p>
          <h1 className="page-title mt-1">GMN</h1>
        </div>
        <SeletorCliente base={aba === 'geogrid' || aba === 'prospeccao' ? `/gmn?aba=${aba}` : '/gmn'} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo="" />
      </div>
      {!places.placesConfigurado() && <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Falta a chave da Places API do Google na Vercel (GOOGLE_PLACES_API_KEY). Ative a &quot;Places API (New)&quot; no Google Cloud, crie a chave e coloque na Vercel.</p>}
      <nav className="flex flex-wrap gap-1 border-b border-borda" aria-label="Abas do GMN">
        {abas.map(([a, rot, Icone]) => (
          <Link key={a} href={a === 'panorama' ? '/gmn' : link(a)} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${aba === a ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            <Icone className="h-3.5 w-3.5" /> {rot}
          </Link>
        ))}
      </nav>

      <Suspense key={`${aba}-${escolhido?.id}-${texto(sp.varredura)}-${texto(sp.busca)}-${texto(sp.lugar)}`} fallback={<Modulo icone={MapPin} titulo="GMN" descricao="Buscando no Google…"><p className="py-8 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
        {aba === 'prospeccao' ? (
          <Prospeccao busca={texto(sp.busca)} lugar={texto(sp.lugar)} base={escolhido ? `/gmn?cliente=${escolhido.id}&aba=prospeccao` : '/gmn?aba=prospeccao'} />
        ) : !escolhido ? (
          <Panorama clientes={clientes} />
        ) : !escolhido.googlePlaceId ? (
          <Modulo icone={MapPin} titulo="Ligar o perfil do Google" descricao={<><NomeCliente nome={escolhido.nome} /> · procure o negócio como aparece no Google Maps</>}>
            <LigarLugar clienteId={escolhido.id} sugestao={escolhido.nome} />
          </Modulo>
        ) : aba === 'geogrid' ? (
          <Geogrid cliente={escolhido} placeId={escolhido.googlePlaceId} varreduraId={texto(sp.varredura)} />
        ) : (
          <Perfil cliente={escolhido} placeId={escolhido.googlePlaceId} />
        )}
      </Suspense>
    </div>
  )
}

function Erro({ e }: { e: unknown }) {
  return <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{e instanceof Error ? e.message : 'Não foi possível falar com o Google agora.'}</p>
}

/** Itens da análise, do pior para o melhor, com placar Fraco / Razoável / Bom. */
function ItensSaude({ itens }: { itens: ItemSaude[] }) {
  const ordem = { ruim: 0, atencao: 1, bom: 2 } as const
  return (
    <ul className="space-y-1.5">
      {[...itens].sort((a, b) => ordem[a.tom] - ordem[b.tom] || b.peso - a.peso).map((i) => {
        const e = ESTILO_TOM[i.tom]
        const Icone = e.icone
        return (
          <li key={i.titulo} className={`flex gap-2 rounded-lg border px-3 py-2 text-rotulo ${e.fundo} ${e.borda}`}>
            <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${e.texto}`} aria-label={ROTULO_TOM[i.tom]} />
            <span className="min-w-0 flex-1"><strong className="text-texto">{i.titulo}</strong> <span className="text-texto-2">· {i.detalhe}</span></span>
          </li>
        )
      })}
    </ul>
  )
}

function Placar({ nota, itens }: { nota: number; itens: ItemSaude[] }) {
  const conta = (t: ItemSaude['tom']) => itens.filter((i) => i.tom === t).length
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      <div className="text-center">
        <Medidor nota={nota} />
        <SeloTom tom={tomNota(nota)} rotulo={`${ROTULO_TOM[tomNota(nota)]} · pontuação geral`} />
      </div>
      <ul className="space-y-2">
        {(['ruim', 'atencao', 'bom'] as const).map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-corpo font-bold text-white ${ESTILO_TOM[t].forte}`}>{conta(t)}</span>
            <span className={`text-corpo font-semibold ${ESTILO_TOM[t].texto}`}>{ROTULO_TOM[t]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CartaoLugar({ d }: { d: places.Detalhes }) {
  return (
    <div className="overflow-hidden rounded-xl border border-borda bg-white">
      {d.fotos[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- foto do Google pela rota com a chave no servidor
        <img src={`/api/gmn/foto?nome=${encodeURIComponent(d.fotos[0])}`} alt={`Foto de ${d.nome}`} className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="space-y-2 p-3 text-rotulo">
        <p className="text-corpo font-bold text-texto">{d.nome}</p>
        <p className="flex items-center gap-1.5 text-texto-2"><Star className="h-4 w-4 fill-[#eda100] text-[#eda100]" />{d.nota === null ? 'Sem nota' : n(d.nota)} <span className="text-texto-3">({n(d.avaliacoes)} avaliações)</span>{d.categoria && <span className="text-texto-3">· {d.categoria}</span>}</p>
        <p className="flex gap-1.5 text-texto-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{d.endereco}</p>
        {d.telefone && <p className="flex items-center gap-1.5 text-texto-2"><Phone className="h-3.5 w-3.5" />{d.telefone}</p>}
        {d.site && <a href={d.site} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-[#1d6fe0] hover:underline"><Globe className="h-3.5 w-3.5 shrink-0" />{d.site.replace(/^https?:\/\//, '')}</a>}
        {d.mapa && <a href={d.mapa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1d6fe0] hover:underline">Ver no Google Maps <ExternalLink className="h-3 w-3" /></a>}
        {d.horario.length > 0 && <details className="text-legenda text-texto-2"><summary className="cursor-pointer font-semibold">Horário</summary><ul className="mt-1 space-y-0.5">{d.horario.map((h) => <li key={h}>{h}</li>)}</ul></details>}
      </div>
    </div>
  )
}

async function Perfil({ cliente, placeId }: { cliente: Cliente; placeId: string }) {
  const sb = await criarClienteServidor()
  let s
  try {
    s = await places.saudeDoCliente(sb, placeId, dataDeHoje(new Date()), cliente.id)
  } catch (e) {
    return <Erro e={e} />
  }
  const evolucao = await places.evolucaoDoPerfil(sb, cliente.id)
  const d = s.detalhes
  const avaliar = linkAvaliacao(placeId)
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Modulo icone={BarChart3} titulo="Análise de saúde do perfil" descricao={<><NomeCliente nome={cliente.nome} /> · o que qualquer pessoa vê no Google · atualizado a cada 24 h</>}>
          <div className="space-y-4">
            <Placar nota={s.nota} itens={s.itens} />
            <ItensSaude itens={s.itens} />
            <p className="text-legenda text-texto-3">Com a aprovação da API do Google Meu Negócio entram também postagens, vídeos, respostas às avaliações e o que só o dono vê.</p>
          </div>
        </Modulo>
        <CartaoLugar d={d} />
      </div>

      {evolucao.length >= 2 && (
        <Modulo icone={BarChart3} titulo="Evolução das avaliações" descricao="Foto diária do perfil (nota e número de avaliações)">
          <GraficoDiario titulo="Número de avaliações" dias={evolucao.map((e) => e.dia)} series={[{ nome: 'Avaliações', valores: evolucao.map((e) => e.avaliacoes ?? 0) }]} formato={(v) => n(Math.round(v))} />
        </Modulo>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Modulo icone={MessageSquareText} titulo="Avaliações em destaque" descricao="As que o Google mostra primeiro (até 5)">
          {d.avaliacoesRecentes.length === 0 ? <p className="py-4 text-center text-rotulo text-texto-3">Sem avaliações visíveis.</p> : (
            <ul className="space-y-2">
              {d.avaliacoesRecentes.map((a, i) => (
                <li key={i} className="rounded-lg border border-borda px-3 py-2 text-rotulo">
                  <p className="flex items-center gap-2"><strong>{a.autor || 'Cliente'}</strong><span className="text-[#eda100]">{'★'.repeat(a.nota ?? 0)}</span><span className="text-legenda text-texto-3">{a.quando}</span></p>
                  {a.texto && <p className="mt-0.5 line-clamp-3 text-texto-2">{a.texto}</p>}
                </li>
              ))}
            </ul>
          )}
        </Modulo>
        <Modulo icone={QrCode} titulo="Card de avaliação" descricao="Link e QR Code que abrem direto a janela de avaliar no Google">
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR público do link de avaliação */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(avaliar)}`} alt="QR Code para avaliar no Google" className="h-36 w-36 rounded-lg border border-borda" />
            <div className="min-w-0 flex-1 space-y-2 text-rotulo">
              <p className="text-texto-2">Mande no WhatsApp depois do atendimento ou imprima no balcão: o cliente cai direto na tela de dar estrelas.</p>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-borda bg-fundo px-2 py-1.5"><code className="min-w-0 flex-1 truncate text-legenda">{avaliar}</code><CopiarTexto texto={avaliar} rotulo="Copiar link" /></div>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=20&format=png&data=${encodeURIComponent(avaliar)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1d6fe0] hover:underline">Baixar QR em alta <ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>
        </Modulo>
      </div>
    </>
  )
}

async function Geogrid({ cliente, placeId, varreduraId }: { cliente: Cliente; placeId: string; varreduraId: string }) {
  const sb = await criarClienteServidor()
  const lista = await places.varreduras(sb, cliente.id)
  const atual = lista.find((v) => v.id === varreduraId) ?? lista[0] ?? null
  const anterior = atual ? lista.find((v) => v.palavra === atual.palavra && v.em < atual.em) : undefined
  const concorrentes = atual ? concorrentesDaGrade(atual.pontos, placeId, 5) : []
  const nomes = concorrentes.length ? await places.resumoDosLugares(sb, concorrentes.map((c) => c.id)).catch(() => new Map<string, places.LugarResumo>()) : new Map<string, places.LugarResumo>()
  const base = `/gmn?cliente=${cliente.id}&aba=geogrid`
  const delta = atual && anterior ? Math.round((anterior.metricas.posicaoMediaTotal - atual.metricas.posicaoMediaTotal) * 10) / 10 : null
  return (
    <>
      <Modulo icone={Radar} titulo="Nova varredura" descricao={<><NomeCliente nome={cliente.nome} /> · a posição do cliente no Google em cada ponto ao redor do endereço (dados da Places API: próximos do Maps, não idênticos)</>}>
        <NovaVarredura clienteId={cliente.id} base={base} palavraInicial={atual?.palavra ?? ''} />
      </Modulo>
      {!atual ? (
        <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhuma varredura ainda. Rode a primeira acima.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Modulo icone={MapPin} titulo={`"${atual.palavra}"`} descricao={`${atual.grade}×${atual.grade} pontos · raio de ${n(atual.raioKm)} km · ${new Date(atual.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}`}>
            <MapaGrade centro={atual.centro} pontos={atual.pontos} rotulo={`Mapa de posições para ${atual.palavra}`} />
          </Modulo>
          <div className="space-y-4">
            <Numeros
              itens={[
                { rotulo: 'Posição média (onde aparece)', valor: atual.metricas.posicaoMedia === null ? '—' : `${n(atual.metricas.posicaoMedia)}º`, icone: Trophy, cor: '#2a78d6' },
                { rotulo: 'Posição média geral', valor: `${n(atual.metricas.posicaoMediaTotal)}º`, extra: delta === null ? 'fora do top 20 conta 21' : delta >= 0 ? `▲ ${n(delta)} vs anterior` : `▼ ${n(-delta)} vs anterior`, tom: delta === null ? undefined : delta >= 0 ? 'bom' : 'ruim', icone: BarChart3, cor: '#6250d6' },
                { rotulo: 'Pontos no top 3', valor: `${n(atual.metricas.top3)}%`, tom: atual.metricas.top3 >= 50 ? 'bom' : atual.metricas.top3 >= 20 ? 'atencao' : 'ruim', icone: Target, cor: '#1baf7a' },
                { rotulo: 'Aparece em', valor: `${n(atual.metricas.encontrado)}%`, extra: `top 10 em ${n(atual.metricas.top10)}%`, icone: Search, cor: '#eb6834' },
              ]}
            />
            <Modulo icone={Users} titulo="Quem aparece no top 3" descricao="Concorrentes mais frequentes nos pontos da grade">
              {concorrentes.length === 0 ? <p className="text-rotulo text-texto-3">Sem concorrentes no top 3.</p> : (
                <ul className="space-y-1.5 text-rotulo">
                  {concorrentes.map((c) => {
                    const l = nomes.get(c.id)
                    return (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-semibold" title={l?.endereco}>{l?.nome ?? 'Concorrente'}</span>
                        {l?.nota != null && <span className="text-legenda text-texto-3">★ {n(l.nota)} ({n(l.avaliacoes)})</span>}
                        <span className="rounded-full bg-fundo px-1.5 text-micro font-semibold text-texto-2">{c.vezes}/{atual.metricas.pontos}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Modulo>
          </div>
        </div>
      )}
      {lista.length > 0 && (
        <Modulo icone={BarChart3} titulo="Varreduras" descricao="Histórico (clique para abrir)">
          <ul className="divide-y divide-borda/60 text-rotulo">
            {lista.map((v) => (
              <li key={v.id}>
                <Link href={`${base}&varredura=${v.id}`} className={`flex flex-wrap items-center gap-x-3 px-2 py-1.5 hover:bg-hover ${v.id === atual?.id ? 'bg-fundo font-semibold' : ''}`}>
                  <span className="w-28 tabular-nums text-legenda text-texto-3">{new Date(v.em).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>
                  <span className="min-w-0 flex-1 truncate">&quot;{v.palavra}&quot; · {v.grade}×{v.grade} · {n(v.raioKm)} km</span>
                  <span className="tabular-nums text-texto-2">média {n(v.metricas.posicaoMediaTotal)}º · top 3 em {n(v.metricas.top3)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </Modulo>
      )}
    </>
  )
}

async function Panorama({ clientes }: { clientes: Cliente[] }) {
  const sb = await criarClienteServidor()
  const hoje = dataDeHoje(new Date())
  const ligados = clientes.filter((c) => c.googlePlaceId)
  const linhas = await Promise.all(ligados.map(async (c) => {
    try {
      const d = await places.detalhesDoLugar(sb, c.googlePlaceId!)
      const ultima = (await places.varreduras(sb, c.id, 1))[0]
      return { c, d, saude: analisarSaude(d.perfil, hoje).nota, ultima }
    } catch (e) {
      return { c, erro: e instanceof Error ? e.message : 'erro' }
    }
  }))
  const sem = clientes.filter((c) => !c.googlePlaceId)
  return (
    <Modulo icone={MapPin} titulo="Todos os clientes" descricao="Nota, avaliações e saúde do perfil no Google, e a última varredura do geogrid">
      <div className="space-y-4">
        {linhas.length === 0 ? <p className="rounded-xl border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">Nenhum cliente com o perfil do Google ligado. Escolha um cliente no seletor acima para ligar.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 text-right font-medium">Nota</th>
                  <th className="py-2 pr-3 text-right font-medium">Avaliações</th>
                  <th className="py-2 pr-3 font-medium">Saúde</th>
                  <th className="py-2 font-medium">Último geogrid</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.c.id} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3"><NomeCliente nome={l.c.nome} href={`/gmn?cliente=${l.c.id}`} /></td>
                    {'erro' in l ? <td colSpan={4} className="py-2 text-legenda text-perigo">{l.erro}</td> : (
                      <>
                        <td className="py-2 pr-3 text-right tabular-nums">{l.d.nota === null ? '—' : `★ ${n(l.d.nota)}`}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{n(l.d.avaliacoes)}</td>
                        <td className="py-2 pr-3"><SeloTom tom={tomNota(l.saude)} rotulo={`${l.saude}/100`} /></td>
                        <td className="py-2 text-texto-2">{l.ultima ? <Link href={`/gmn?cliente=${l.c.id}&aba=geogrid`} className="hover:underline">&quot;{l.ultima.palavra}&quot; · média {n(l.ultima.metricas.posicaoMediaTotal)}º · top 3 em {n(l.ultima.metricas.top3)}%</Link> : <span className="text-texto-3">—</span>}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sem.length > 0 && (
          <p className="text-legenda text-texto-3">
            Sem perfil do Google ligado: {sem.map((c, i) => <span key={c.id}>{i > 0 && ', '}<NomeCliente nome={c.nome} href={`/gmn?cliente=${c.id}`} /></span>)}.
          </p>
        )}
      </div>
    </Modulo>
  )
}

async function Prospeccao({ busca, lugar, base }: { busca: string; lugar: string; base: string }) {
  const sb = await criarClienteServidor()
  let lista: places.LugarResumo[] = []
  let erro: unknown = null
  if (busca.trim().length >= 3) lista = await places.buscarLugares(busca.trim().slice(0, 120)).catch((e) => { erro = e; return [] })
  let analise: { d: places.Detalhes; nota: number; itens: ItemSaude[] } | null = null
  if (lugar) {
    try {
      const d = await places.detalhesDoLugar(sb, lugar)
      analise = { d, ...analisarSaude(d.perfil, dataDeHoje(new Date())) }
    } catch (e) {
      erro = e
    }
  }
  const comBusca = `${base}&busca=${encodeURIComponent(busca)}`
  return (
    <>
      <Modulo icone={Target} titulo="Buscar leads no Google" descricao="Negócios de um segmento numa cidade, com nota e avaliações: os de perfil fraco são oportunidade">
        <form action="/gmn" className="flex flex-wrap gap-2">
          {base.includes('cliente=') && <input type="hidden" name="cliente" value={new URLSearchParams(base.split('?')[1]).get('cliente') ?? ''} />}
          <input type="hidden" name="aba" value="prospeccao" />
          <input name="busca" defaultValue={busca} className={`${campo} min-w-60 flex-1`} placeholder="ex.: clínica odontológica em Belém" aria-label="Segmento e cidade" />
          <button type="submit" className={botaoPrimario}><Search className="h-4 w-4" /> Buscar</button>
        </form>
      </Modulo>
      {erro ? <Erro e={erro} /> : null}
      {analise && (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Modulo icone={BarChart3} titulo={`Pré-análise: ${analise.d.nome}`} descricao="Pelo que o Google mostra publicamente">
            <div className="space-y-4">
              <Placar nota={analise.nota} itens={analise.itens} />
              <ItensSaude itens={analise.itens} />
              <div className="space-y-1.5 rounded-xl border border-borda bg-fundo/50 p-3">
                <div className="flex items-center justify-between gap-2"><p className="text-rotulo font-semibold">Texto para a abordagem</p><CopiarTexto texto={textoProposta(analise.d.nome, analise)} rotulo="Copiar" /></div>
                <pre className="whitespace-pre-wrap font-sans text-legenda text-texto-2">{textoProposta(analise.d.nome, analise)}</pre>
              </div>
            </div>
          </Modulo>
          <CartaoLugar d={analise.d} />
        </div>
      )}
      {lista.length > 0 && (
        <Modulo icone={Users} titulo={`${lista.length} negócios encontrados`} descricao={`"${busca}" · os de nota mais baixa e menos avaliações primeiro`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Negócio</th>
                  <th className="py-2 pr-3 text-right font-medium">Nota</th>
                  <th className="py-2 pr-3 text-right font-medium">Avaliações</th>
                  <th className="py-2 pr-3 font-medium">Contato</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {[...lista].sort((a, b) => (a.nota ?? 0) * Math.log10(a.avaliacoes + 10) - (b.nota ?? 0) * Math.log10(b.avaliacoes + 10)).map((l) => (
                  <tr key={l.id} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3"><p className="font-semibold">{l.nome}</p><p className="truncate text-legenda text-texto-3">{l.categoria ? `${l.categoria} · ` : ''}{l.endereco}</p></td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${l.nota !== null && l.nota < 4 ? 'font-semibold text-perigo-forte' : ''}`}>{l.nota === null ? '—' : `★ ${n(l.nota)}`}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${l.avaliacoes < 30 ? 'font-semibold text-aviso-forte' : ''}`}>{n(l.avaliacoes)}</td>
                    <td className="py-2 pr-3 text-legenda text-texto-2">{l.telefone ?? '—'}{!l.site && <span className="ml-1 text-aviso-forte">· sem site</span>}</td>
                    <td className="py-2 text-right"><Link href={`${comBusca}&lugar=${encodeURIComponent(l.id)}`} className="font-semibold text-[#1d6fe0] hover:underline">Pré-análise</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modulo>
      )}
    </>
  )
}
