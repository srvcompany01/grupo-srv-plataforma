import { BarChart3, ExternalLink, MapPin, MessageSquareText, QrCode, Radar, Search, Target, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { BotaoMonitor, LigarLugar, NovaVarredura } from '@/componentes/gmn/FormulariosGmn'
import { MapaGrade } from '@/componentes/gmn/MapaGrade'
import { CartaoLugar, ItensSaude, Placar, tomNota } from '@/componentes/gmn/PerfilGmn'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { ESTILO_TOM, SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarSaude, concorrentesDaGrade, liderDaGrade, linkAvaliacao, pctPrimeiro, telefoneDivergente, textoProposta, type ColunaComparativo, type ItemSaude } from '@/dominio/gmn'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import * as places from '@/servicos/places'

// O geogrid 9×9 faz até 243 buscas.
export const maxDuration = 300

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const n = (v: number) => v.toLocaleString('pt-BR')

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
    <div>
      <div>
        <div>
          <p>Google Meu Negócio</p>
          <h1>GMN</h1>
        </div>
        <SeletorCliente base={aba === 'geogrid' || aba === 'prospeccao' ? `/gmn?aba=${aba}` : '/gmn'} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo="" />
      </div>
      {!places.placesConfigurado() && <p>Falta a chave da Places API do Google na Vercel (GOOGLE_PLACES_API_KEY). Ative a &quot;Places API (New)&quot; no Google Cloud, crie a chave e coloque na Vercel.</p>}
      <nav aria-label="Abas do GMN">
        {abas.map(([a, rot, Icone]) => (
          <Link key={a} href={a === 'panorama' ? '/gmn' : link(a)}>
            <Icone /> {rot}
          </Link>
        ))}
      </nav>

      <Suspense key={`${aba}-${escolhido?.id}-${texto(sp.varredura)}-${texto(sp.busca)}-${texto(sp.lugar)}`} fallback={<Modulo icone={MapPin} titulo="GMN" descricao="Buscando no Google…"><p>Carregando…</p></Modulo>}>
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
  return <p>{e instanceof Error ? e.message : 'Não foi possível falar com o Google agora.'}</p>
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
  const divergente = telefoneDivergente(s.detalhes.telefone, [cliente.whatsapp, cliente.whatsappAtendimento])
  const d = s.detalhes
  const avaliar = linkAvaliacao(placeId)
  return (
    <>
      <div>
        <Modulo icone={BarChart3} titulo="Análise de saúde do perfil" descricao={<><NomeCliente nome={cliente.nome} /> · o que qualquer pessoa vê no Google · atualizado a cada 24 h</>}>
          <div>
            {divergente && <p>{divergente}</p>}
            <Placar nota={s.nota} itens={s.itens} />
            <ItensSaude itens={s.itens} />
            <p>Com a aprovação da API do Google Meu Negócio entram também postagens, vídeos, respostas às avaliações e o que só o dono vê.</p>
          </div>
        </Modulo>
        <CartaoLugar d={d} />
      </div>

      <Suspense fallback={null}>
        <Comparativo cliente={cliente} placeId={placeId} saudeCliente={s.nota} perfilCliente={d.perfil} />
      </Suspense>

      {evolucao.length >= 2 && (
        <Modulo icone={BarChart3} titulo="Evolução das avaliações" descricao="Foto diária do perfil (nota e número de avaliações)">
          <GraficoDiario titulo="Número de avaliações" dias={evolucao.map((e) => e.dia)} series={[{ nome: 'Avaliações', valores: evolucao.map((e) => e.avaliacoes ?? 0) }]} formato={(v) => n(Math.round(v))} />
        </Modulo>
      )}

      <div>
        <Modulo icone={MessageSquareText} titulo="Avaliações em destaque" descricao="As que o Google mostra primeiro (até 5)">
          {d.avaliacoesRecentes.length === 0 ? <p>Sem avaliações visíveis.</p> : (
            <ul>
              {d.avaliacoesRecentes.map((a, i) => (
                <li key={i}>
                  <p><strong>{a.autor || 'Cliente'}</strong><span>{'★'.repeat(a.nota ?? 0)}</span><span>{a.quando}</span></p>
                  {a.texto && <p>{a.texto}</p>}
                </li>
              ))}
            </ul>
          )}
        </Modulo>
        <Modulo icone={QrCode} titulo="Card de avaliação" descricao="Link e QR Code que abrem direto a janela de avaliar no Google">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR público do link de avaliação */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(avaliar)}`} alt="QR Code para avaliar no Google" />
            <div>
              <p>Mande no WhatsApp depois do atendimento ou imprima no balcão: o cliente cai direto na tela de dar estrelas.</p>
              <div><code>{avaliar}</code><CopiarTexto texto={avaliar} rotulo="Copiar link" /></div>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=20&format=png&data=${encodeURIComponent(avaliar)}`} target="_blank" rel="noreferrer">Baixar QR em alta <ExternalLink /></a>
            </div>
          </div>
        </Modulo>
      </div>
    </>
  )
}

/** Cliente lado a lado com os 3 concorrentes que mais aparecem no top 3 do último geogrid. */
async function Comparativo({ cliente, placeId, saudeCliente, perfilCliente }: { cliente: Cliente; placeId: string; saudeCliente: number; perfilCliente: ColunaComparativo['perfil'] }) {
  const c = await places.comparativoDoCliente(await criarClienteServidor(), cliente, placeId, perfilCliente, saudeCliente, dataDeHoje(new Date())).catch(() => null)
  if (!c) {
    return (
      <Modulo icone={Users} titulo="Você contra os concorrentes" descricao="Os concorrentes vêm do geogrid">
        <p>Rode um geogrid na aba <Link href={`/gmn?cliente=${cliente.id}&aba=geogrid`}>Geogrid de ranking</Link> para descobrir quem disputa o top 3 com o cliente.</p>
      </Modulo>
    )
  }
  return (
    <Modulo icone={Users} titulo="Você contra os concorrentes" descricao={`Os 3 que mais aparecem no top 3 de "${c.palavra}" · verde: o cliente ganha ou empata · vermelho: perde para todos`}>
      <div>
        <table>
          <thead>
            <tr>
              <th />
              {c.colunas.map((nome, i) => <th key={nome + i} title={nome}>{i === 0 ? <NomeCliente nome={nome} /> : nome}</th>)}
            </tr>
          </thead>
          <tbody>
            {c.linhas.map((l) => {
              const e = ESTILO_TOM[l.tomCliente]
              return (
                <tr key={l.rotulo}>
                  <td>{l.rotulo}</td>
                  {l.valores.map((v, i) => <td key={i}>{i === 0 ? <span>{v}</span> : v}</td>)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Modulo>
  )
}

async function Geogrid({ cliente, placeId, varreduraId }: { cliente: Cliente; placeId: string; varreduraId: string }) {
  const sb = await criarClienteServidor()
  const [lista, monitores] = await Promise.all([places.varreduras(sb, cliente.id), places.monitoresDoCliente(sb, cliente.id)])
  const atual = lista.find((v) => v.id === varreduraId) ?? lista[0] ?? null
  const anterior = atual ? lista.find((v) => v.palavra === atual.palavra && v.em < atual.em) : undefined
  const concorrentes = atual ? concorrentesDaGrade(atual.pontos, placeId, 5) : []
  const lider = atual ? liderDaGrade(atual.pontos, placeId) : null
  const nomes = concorrentes.length || lider ? await places.resumoDosLugares(sb, [...new Set([...concorrentes.map((c) => c.id), ...(lider ? [lider.id] : [])])]).catch(() => new Map<string, places.LugarResumo>()) : new Map<string, places.LugarResumo>()
  const base = `/gmn?cliente=${cliente.id}&aba=geogrid`
  const delta = atual && anterior ? Math.round((anterior.metricas.posicaoMediaTotal - atual.metricas.posicaoMediaTotal) * 10) / 10 : null
  return (
    <>
      <Modulo icone={Radar} titulo="Nova varredura" descricao={<><NomeCliente nome={cliente.nome} /> · a posição do cliente no Google em cada ponto ao redor do endereço (dados da Places API: próximos do Maps, não idênticos)</>}>
        <NovaVarredura clienteId={cliente.id} base={base} palavraInicial={atual?.palavra ?? ''} gradeInicial={atual?.grade} raioInicial={atual?.raioKm} />
      </Modulo>
      {!atual ? (
        <p>Nenhuma varredura ainda. Rode a primeira acima.</p>
      ) : (
        <Modulo icone={MapPin} titulo={`"${atual.palavra}"`} descricao={`${atual.grade}×${atual.grade} pontos · raio de ${n(atual.raioKm)} km · ${new Date(atual.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Belem' })}`} acoes={monitores.some((m) => m.palavra === atual.palavra) ? <span>Acompanhada toda segunda</span> : <BotaoMonitor clienteId={cliente.id} palavra={atual.palavra} grade={atual.grade} raioKm={atual.raioKm} ligado={false} />}>
          <div>
            <div>
              {[
                { rotulo: 'Posição média (onde aparece)', valor: atual.metricas.posicaoMedia === null ? '—' : `${n(atual.metricas.posicaoMedia)}º`, extra: null, tom: null, icone: Trophy, cor: '#2a78d6' },
                { rotulo: 'Posição média geral', valor: `${n(atual.metricas.posicaoMediaTotal)}º`, extra: delta === null ? 'fora do top 20 conta como 21' : delta >= 0 ? `▲ ${n(delta)} vs a anterior` : `▼ ${n(-delta)} vs a anterior`, tom: delta === null ? null : delta >= 0 ? 'bom' : 'ruim', icone: BarChart3, cor: '#6250d6' },
                { rotulo: 'Pontos no top 3', valor: `${n(atual.metricas.top3)}%`, extra: `em 1º lugar em ${n(pctPrimeiro(atual.pontos))}%${lider ? ` · líder: ${nomes.get(lider.id)?.nome ?? 'concorrente'} (${n(lider.pct)}%)` : ''}`, tom: atual.metricas.top3 >= 50 ? 'bom' : atual.metricas.top3 >= 20 ? 'atencao' : 'ruim', icone: Target, cor: '#1baf7a' },
                { rotulo: 'Aparece em', valor: `${n(atual.metricas.encontrado)}%`, extra: `top 10 em ${n(atual.metricas.top10)}% dos pontos`, tom: null, icone: Search, cor: '#eb6834' },
              ].map((m) => {
                const Icone = m.icone
                return (
                  <div key={m.rotulo}>
                    {m.tom && <span aria-hidden />}
                    <p><span style={{ background: `${m.cor}1f`, color: m.cor }}><Icone /></span>{m.rotulo}</p>
                    <p>{m.valor}</p>
                    <div>
                      {m.tom && <SeloTom tom={m.tom as 'bom'} rotulo={m.tom === 'bom' ? 'Bom' : m.tom === 'atencao' ? 'Razoável' : 'Fraco'} />}
                      {m.extra && <span>{m.extra}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div>
              <MapaGrade centro={atual.centro} pontos={atual.pontos} rotulo={`Mapa de posições para ${atual.palavra}`} />
              <div>
                <p><Users /> Quem aparece no top 3</p>
                <p>Concorrentes mais frequentes nos {atual.metricas.pontos} pontos da grade</p>
                {concorrentes.length === 0 ? <p>Sem concorrentes no top 3.</p> : (
                  <ul>
                    {concorrentes.map((c) => {
                      const l = nomes.get(c.id)
                      return (
                        <li key={c.id}>
                          <span>
                            <span title={l?.nome}>{l?.nome ?? 'Concorrente'}</span>
                            {l?.nota != null && <span>★ {n(l.nota)} · {n(l.avaliacoes)} avaliações</span>}
                          </span>
                          <span title="Pontos em que aparece no top 3">{c.vezes}/{atual.metricas.pontos}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div>
                  {([['#1f8a4c', '1–3'], ['#5cb85c', '4–5'], ['#d9c516', '6–7'], ['#f08a24', '8–10'], ['#d64545', '11–20'], ['#9b9a96', 'fora do top 20']] as const).map(([cor, r]) => (
                    <span key={r}><span style={{ background: cor }} />{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modulo>
      )}
      {monitores.length > 0 && (
        <Modulo icone={Radar} titulo="Acompanhamento semanal" descricao="Toda segunda-feira a plataforma roda estas palavras e avisa no sino se a posição piorar">
          <ul>
            {monitores.map((m) => (
              <li key={m.palavra}>
                <span>&quot;{m.palavra}&quot;</span>
                <span>{m.grade}×{m.grade} · {n(m.raioKm)} km</span>
                <BotaoMonitor clienteId={cliente.id} palavra={m.palavra} grade={m.grade} raioKm={m.raioKm} ligado />
              </li>
            ))}
          </ul>
        </Modulo>
      )}
      {lista.length > 0 && (
        <Modulo icone={BarChart3} titulo="Varreduras" descricao="Histórico (clique para abrir)">
          <ul>
            {lista.map((v) => (
              <li key={v.id}>
                <Link href={`${base}&varredura=${v.id}`}>
                  <span>{new Date(v.em).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>
                  <span>&quot;{v.palavra}&quot; · {v.grade}×{v.grade} · {n(v.raioKm)} km</span>
                  <span>média {n(v.metricas.posicaoMediaTotal)}º · top 3 em {n(v.metricas.top3)}%</span>
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
      <div>
        {linhas.length === 0 ? <p>Nenhum cliente com o perfil do Google ligado. Escolha um cliente no seletor acima para ligar.</p> : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Nota</th>
                  <th>Avaliações</th>
                  <th>Saúde</th>
                  <th>Último geogrid</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.c.id}>
                    <td><NomeCliente nome={l.c.nome} href={`/gmn?cliente=${l.c.id}`} /></td>
                    {'erro' in l ? <td colSpan={4}>{l.erro}</td> : (
                      <>
                        <td>{l.d.nota === null ? '—' : `★ ${n(l.d.nota)}`}</td>
                        <td>{n(l.d.avaliacoes)}</td>
                        <td><SeloTom tom={tomNota(l.saude)} rotulo={`${l.saude}/100`} /></td>
                        <td>{l.ultima ? <Link href={`/gmn?cliente=${l.c.id}&aba=geogrid`}>&quot;{l.ultima.palavra}&quot; · média {n(l.ultima.metricas.posicaoMediaTotal)}º · top 3 em {n(l.ultima.metricas.top3)}%</Link> : <span>—</span>}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sem.length > 0 && (
          <p>
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
        <form action="/gmn">
          {base.includes('cliente=') && <input type="hidden" name="cliente" value={new URLSearchParams(base.split('?')[1]).get('cliente') ?? ''} />}
          <input type="hidden" name="aba" value="prospeccao" />
          <input name="busca" defaultValue={busca} placeholder="ex.: clínica odontológica em Belém" aria-label="Segmento e cidade" />
          <button type="submit"><Search /> Buscar</button>
        </form>
      </Modulo>
      {erro ? <Erro e={erro} /> : null}
      {analise && (
        <div>
          <Modulo icone={BarChart3} titulo={`Pré-análise: ${analise.d.nome}`} descricao="Pelo que o Google mostra publicamente">
            <div>
              <Placar nota={analise.nota} itens={analise.itens} />
              <ItensSaude itens={analise.itens} />
              <div>
                <div><p>Texto para a abordagem</p><CopiarTexto texto={textoProposta(analise.d.nome, analise)} rotulo="Copiar" /></div>
                <pre>{textoProposta(analise.d.nome, analise)}</pre>
              </div>
            </div>
          </Modulo>
          <CartaoLugar d={analise.d} />
        </div>
      )}
      {lista.length > 0 && (
        <Modulo icone={Users} titulo={`${lista.length} negócios encontrados`} descricao={`"${busca}" · os de nota mais baixa e menos avaliações primeiro`}>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Negócio</th>
                  <th>Nota</th>
                  <th>Avaliações</th>
                  <th>Contato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...lista].sort((a, b) => (a.nota ?? 0) * Math.log10(a.avaliacoes + 10) - (b.nota ?? 0) * Math.log10(b.avaliacoes + 10)).map((l) => (
                  <tr key={l.id}>
                    <td><p>{l.nome}</p><p>{l.categoria ? `${l.categoria} · ` : ''}{l.endereco}</p></td>
                    <td>{l.nota === null ? '—' : `★ ${n(l.nota)}`}</td>
                    <td>{n(l.avaliacoes)}</td>
                    <td>{l.telefone ?? '—'}{!l.site && <span>· sem site</span>}</td>
                    <td><Link href={`${comBusca}&lugar=${encodeURIComponent(l.id)}`}>Pré-análise</Link></td>
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
