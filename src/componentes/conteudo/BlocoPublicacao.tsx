'use client'

import { CalendarClock, ExternalLink, Send, TriangleAlert, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { agendarPostAcao, cancelarAgendamentoAcao, publicarAgoraAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { dataLocal, horaLocal } from '@/dominio/agenda'
import type { Aprovacao, Formato } from '@/dominio/conteudo'
import { ALVOS, MAX_COLLABS, ROTULO_ALVO, ROTULO_ESTRATEGIA_TESTE, situacaoPublicacao, type Alvo, type EstrategiaTeste } from '@/dominio/publicacao'
import type { PublicacaoDoPost } from '@/servicos/conteudo'
import { NomeCliente } from '@/componentes/NomeCliente'

export type ContaMeta = { pagina: string; instagram: { id: string; usuario: string } | null } | { erro: string } | null

const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Agendar / publicar o post no Instagram e no Facebook, com ou sem a aprovação do cliente no portal. */
export function BlocoPublicacao({ tarefaId, p, conta, formato, aprovacao, hoje }: { tarefaId: string; p: PublicacaoDoPost; conta: ContaMeta; formato: Formato; aprovacao: Aprovacao; hoje: string }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const temIg = !!conta && !('erro' in conta) && !!conta.instagram
  const temFb = !!conta && !('erro' in conta)
  const [data, setData] = useState(p.em ? dataLocal(p.em) : p.dataPrevista ?? hoje)
  const [hora, setHora] = useState(p.em ? horaLocal(p.em) : '18:00')
  const [alvos, setAlvos] = useState<Alvo[]>(p.alvos.length ? p.alvos : [...(temIg ? ['instagram' as const] : []), ...(temFb && formato !== 'stories' ? ['facebook' as const] : [])])
  const [collabs, setCollabs] = useState(p.collabs.map((c) => `@${c}`).join(' '))
  // Reels de teste: só Reels, só Instagram e sem collab. Marcado, a collab some; sem a marca, a estratégia é esquecida.
  const [teste, setTeste] = useState<EstrategiaTeste | null>(p.teste)
  const podeTeste = formato === 'reels' && alvos.length === 1 && alvos[0] === 'instagram'
  const testeAtivo = podeTeste ? teste : null
  const aceitaCollab = alvos.includes('instagram') && formato !== 'stories' && !testeAtivo
  const situacao = situacaoPublicacao({ status: p.status, em: p.em, modo: p.modo, aprovacao }, new Date())
  const agendado = p.status === 'agendado' || p.status === 'publicando'
  const alternar = (a: Alvo) => setAlvos((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]))

  const rodar = (fn: () => Promise<{ ok?: string; erro?: string } | null>) => iniciar(async () => { if (avisar(await fn(), true)) router.refresh() })
  const agendar = (modo: 'aprovacao' | 'direto') => rodar(() => agendarPostAcao(tarefaId, { data, hora, alvos, modo, collabs: aceitaCollab ? collabs : '', teste: testeAtivo }))
  const agora = async () => {
    if (!(await confirmar({ titulo: 'Publicar agora?', descricao: `O post sai já em ${alvos.map((a) => ROTULO_ALVO[a]).join(' e ')}, sem esperar a aprovação do cliente.`, confirmar: 'Publicar agora' }))) return
    rodar(() => publicarAgoraAcao(tarefaId, alvos, aceitaCollab ? collabs : '', testeAtivo))
  }


  return (
    <div>
      <div>
        <CalendarClock />
        <h3>Publicação no Instagram e Facebook</h3>
        <span>{situacao}</span>
        {p.teste && <span title={ROTULO_ESTRATEGIA_TESTE[p.teste]}>Reels de teste · {p.teste === 'MANUAL' ? 'manual' : 'automático'}</span>}
      </div>

      {p.cliente?.googlePerfil && <p>Google Meu Negócio: <strong>perfil ligado</strong> (vai o texto e a primeira foto)</p>}
      {!p.cliente?.paginaId ? (
        <p>
          <TriangleAlert />
          <span>{p.cliente ? <>O cliente <NomeCliente nome={p.cliente.nome} href={`/clientes/${p.cliente.id}`} /> ainda não tem a Página do Facebook no cadastro (campo &quot;Biblioteca de anúncios do Meta&quot;).</> : 'Este post não tem cliente.'}</span>
        </p>
      ) : conta && 'erro' in conta ? (
        <p>Não consegui ler a Página do cliente na Meta: {conta.erro}</p>
      ) : conta ? (
        <p>Facebook: <strong>{conta.pagina}</strong> · Instagram: {conta.instagram ? <strong>@{conta.instagram.usuario}</strong> : <span>não ligado à Página</span>}</p>
      ) : null}

      {p.status === 'publicado' ? (
        <div>
          {p.publicadoEm && <p>Publicado {quando.format(new Date(p.publicadoEm))}.</p>}
          <div>
            {p.igLink && <a href={p.igLink} target="_blank" rel="noreferrer">Ver no Instagram <ExternalLink /></a>}
            {p.collabs.length > 0 && <span>Collab com {p.collabs.map((c) => `@${c}`).join(', ')}</span>}
            {p.googleLink && <a href={p.googleLink} target="_blank" rel="noreferrer">Ver no Google <ExternalLink /></a>}
            {p.fbLink && <a href={p.fbLink} target="_blank" rel="noreferrer">Ver no Facebook <ExternalLink /></a>}
          </div>
        </div>
      ) : (
        <>
          {p.status === 'falhou' && p.erro && <p>{p.erro}</p>}
          {agendado && p.em && <p>Marcado para <strong>{quando.format(new Date(p.em))}</strong> em {p.alvos.map((a) => ROTULO_ALVO[a]).join(' e ')}{p.collabs.length ? ` (collab com ${p.collabs.map((c) => `@${c}`).join(', ')})` : ''}{p.modo === 'aprovacao' ? ', depois da aprovação do cliente' : ', sem aprovação'}.</p>}
          <div>
            <label><span>Dia</span><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
            <label><span>Hora</span><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></label>
            <div>
              <span>Onde</span>
              <div>
                {ALVOS.filter((a) => a !== 'google' || p.cliente?.googlePerfil || alvos.includes('google')).map((a) => (
                  <label key={a}><input type="checkbox" checked={alvos.includes(a)} onChange={() => alternar(a)} disabled={a !== 'instagram' && formato === 'stories'} /> {ROTULO_ALVO[a]}</label>
                ))}
              </div>
            </div>
          </div>
          {formato === 'reels' && (
            <div>
              <label>
                <input type="checkbox" checked={!!testeAtivo} disabled={!podeTeste} onChange={(e) => setTeste(e.target.checked ? (teste ?? 'MANUAL') : null)} />
                Publicar como Reels de teste
              </label>
              <p>{podeTeste ? 'O Reels aparece primeiro só para quem não te segue, para você ver como se sai antes de mostrar aos seguidores.' : 'Disponível só com o Instagram marcado e nenhuma outra rede.'}</p>
              {testeAtivo && (
                <div>
                  {(['MANUAL', 'SS_PERFORMANCE'] as const).map((e) => (
                    <label key={e}><input type="radio" name={`teste-${tarefaId}`} checked={teste === e} onChange={() => setTeste(e)} />{e === 'MANUAL' ? 'Manual' : 'Automática'}: {ROTULO_ESTRATEGIA_TESTE[e].replace(/^liberação (manual|automática) /, '')}</label>
                  ))}
                  <p>Na liberação manual, quem libera é você, pelo aplicativo do Instagram (a Meta não deixa liberar pela plataforma).</p>
                </div>
              )}
            </div>
          )}
          {aceitaCollab && (
            <label>
              <span>Collab no Instagram (opcional, até {MAX_COLLABS} perfis)</span>
              <input value={collabs} onChange={(e) => setCollabs(e.target.value)} placeholder="@perfil1 @perfil2" />
              <span>O post sai como coautoria: cada perfil recebe o convite no Instagram e, quando aceita, o post aparece nos dois perfis. O perfil convidado precisa ser público.</span>
            </label>
          )}
          <div>
            <button type="button" disabled={pendente} onClick={() => agendar('aprovacao')}>
              <Send /> {aprovacao === 'aprovado' ? 'Agendar (já aprovado)' : aprovacao === 'aguardando' ? 'Salvar horário (aguardando o cliente)' : 'Enviar para aprovação e agendar'}
            </button>
            <button type="button" disabled={pendente} onClick={() => agendar('direto')}><CalendarClock /> Agendar sem aprovação</button>
            <button type="button" disabled={pendente} onClick={agora}><Zap /> Publicar agora</button>
            {(agendado || p.status === 'falhou') && <button type="button" disabled={pendente} onClick={() => rodar(() => cancelarAgendamentoAcao(tarefaId))}>Cancelar agendamento</button>}
          </div>
          <p>Com aprovação, o post aparece no portal do cliente com o dia e a hora; quando ele aprovar, sai no horário (ou na hora, se o horário já passou).</p>
        </>
      )}
    </div>
  )
}
