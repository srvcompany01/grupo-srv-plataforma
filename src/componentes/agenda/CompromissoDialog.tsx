'use client'

import { Check, Plus } from 'lucide-react'
import { useState, useTransition, type CSSProperties, type ReactNode } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { cancelarOcorrenciaAcao, criarEtiquetaAcao, excluirCompromissoAcao, salvarCompromissoAcao } from '@/app/(app)/agenda/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { REPETICOES, VISIBILIDADES, paraEntrada, type Compromisso, type EntradaCompromisso, type TagAgenda } from '@/dominio/agenda'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'

type Props = {
  compromisso?: Compromisso
  equipe: { id: string; nome: string }[]
  clientes: { id: string; nome: string }[]
  tags: TagAgenda[]
  categorias: TagAgenda[]
  /** Admin e gestor criam para a equipe ou para pessoas escolhidas. */
  podeCompartilhar: boolean
  /** Quem criou (ou o admin) edita; os demais só veem. */
  podeEditar?: boolean
  hoje: string
  className?: string
  estilo?: CSSProperties
  children?: ReactNode
  /** Dia (AAAA-MM-DD) da ocorrência clicada: permite cancelar só ele num compromisso fixo. */
  dia?: string
}

const vazio = (hoje: string): Required<EntradaCompromisso> => ({ titulo: '', descricao: '', data: hoje, horaInicio: '09:00', horaFim: '10:00', diaInteiro: false, visibilidade: 'privado', pessoas: [], repetir: 'nunca', repetirAte: null, clienteId: null, tags: [], categoriaId: null })

export function CompromissoDialog({ compromisso, equipe, clientes, tags, categorias, podeCompartilhar, podeEditar = true, hoje, className, estilo, children, dia }: Props) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(() => (compromisso ? paraEntrada(compromisso) : vazio(hoje)))
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const mudar = (p: Partial<EntradaCompromisso>) => setF((v) => ({ ...v, ...p }))
  const alternarPessoa = (id: string) => mudar({ pessoas: f.pessoas.includes(id) ? f.pessoas.filter((p) => p !== id) : [...f.pessoas, id] })
  const alternarTag = (id: string) => mudar({ tags: f.tags.includes(id) ? f.tags.filter((t) => t !== id) : [...f.tags, id] })
  // Tags criadas aqui aparecem na hora (a página só atualiza depois).
  const [novas, setNovas] = useState<TagAgenda[]>([])
  const todasTags = [...tags, ...novas.filter((n) => !tags.some((t) => t.id === n.id))]
  const [nomeTag, setNomeTag] = useState('')
  const [corTag, setCorTag] = useState<string>(CORES_PERSONALIZACAO[7])
  const criarTag = () =>
    iniciar(async () => {
      const r = await criarEtiquetaAcao('tag', nomeTag, corTag)
      if (!avisar(r) || !r?.item) return
      setNovas((v) => [...v, r.item!])
      mudar({ tags: [...f.tags, r.item.id] })
      setNomeTag('')
    })

  const salvar = () =>
    iniciar(async () => {
      if (!avisar(await salvarCompromissoAcao(compromisso?.id ?? null, f), true)) return
      setAberto(false)
      if (!compromisso) setF(vazio(hoje))
    })
  // Confirma ANTES da transição: dentro dela o diálogo de confirmação só apareceria no fim (e o fim espera a resposta).
  const excluir = async () => {
    if (!(await confirmar({ titulo: `Excluir "${compromisso!.titulo}"?`, descricao: 'Sai da agenda de todos que o veem e do Google Agenda deles. Se for fixo, todas as repetições somem.', confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await excluirCompromissoAcao(compromisso!.id), true)) setAberto(false)
    })
  }
  const cancelarDia = async () => {
    const quando = dia!.split('-').reverse().join('/')
    if (!(await confirmar({ titulo: `Cancelar só ${quando}?`, descricao: 'Este dia some da agenda (e do Google Agenda); as outras repetições continuam.', confirmar: 'Cancelar este dia', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await cancelarOcorrenciaAcao(compromisso!.id, dia!), true)) setAberto(false)
    })
  }
  // Quem não é admin/gestor ainda vê a visibilidade de um compromisso compartilhado com ela, só sem mudar.
  const visibilidades = podeCompartilhar ? VISIBILIDADES : VISIBILIDADES.filter((v) => v.valor === f.visibilidade)

  return (
    <Dialog open={aberto} onOpenChange={(a) => { setAberto(a); if (a && compromisso) setF(paraEntrada(compromisso)) }}>
      {compromisso ? (
        <DialogTrigger style={estilo}>{children}</DialogTrigger>
      ) : (
        <DialogTrigger><Plus /> Novo compromisso</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{compromisso ? (podeEditar ? 'Editar compromisso' : 'Compromisso') : 'Novo compromisso'}</DialogTitle>
          <DialogDescription>{podeEditar ? 'Quem vê o compromisso também o recebe no Google Agenda, se tiver conectado.' : 'Só quem criou pode alterar este compromisso.'}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={!podeEditar || pendente}>
          <input value={f.titulo} onChange={(e) => mudar({ titulo: e.target.value })} placeholder="Título (ex.: Reunião de pauta)" maxLength={120} autoFocus aria-label="Título" />
          <div>
          <label>
            Categoria
            <select value={f.categoriaId ?? ''} onChange={(e) => mudar({ categoriaId: e.target.value || null })}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label>
            Cliente (opcional)
            <select value={f.clienteId ?? ''} onChange={(e) => mudar({ clienteId: e.target.value || null })}>
              <option value="">Nenhum</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          </div>
          <div>
            <p>Tags</p>
            {todasTags.length > 0 && (
              <div>
                {todasTags.map((t) => {
                  const marcada = f.tags.includes(t.id)
                  return (
                    <button key={t.id} type="button" onClick={() => alternarTag(t.id)} aria-pressed={marcada} style={marcada ? { background: t.cor } : undefined}>
                      {marcada ? <Check /> : <span style={{ background: t.cor }} />} {t.nome}
                    </button>
                  )
                })}
              </div>
            )}
            {podeEditar && (
              <div>
                <input value={nomeTag} onChange={(e) => setNomeTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nomeTag.trim()) { e.preventDefault(); criarTag() } }} placeholder="Nova tag" maxLength={40} aria-label="Nome da nova tag" />
                <div role="radiogroup" aria-label="Cor da nova tag">
                  {CORES_PERSONALIZACAO.map((cor) => (
                    <button key={cor} type="button" role="radio" aria-checked={corTag === cor} aria-label={`Cor ${cor}`} onClick={() => setCorTag(cor)} style={{ background: cor }} />
                  ))}
                </div>
                <button type="button" onClick={criarTag} disabled={!nomeTag.trim()}>Criar</button>
              </div>
            )}
          </div>
          <div>
            <label>
              Data
              <input type="date" value={f.data} onChange={(e) => mudar({ data: e.target.value })} />
            </label>
            {!f.diaInteiro && (
              <>
                <label>
                  Início
                  <input type="time" value={f.horaInicio} onChange={(e) => mudar({ horaInicio: e.target.value })} />
                </label>
                <label>
                  Fim
                  <input type="time" value={f.horaFim} onChange={(e) => mudar({ horaFim: e.target.value })} />
                </label>
              </>
            )}
          </div>
          <label>
            <input type="checkbox" checked={f.diaInteiro} onChange={(e) => mudar({ diaInteiro: e.target.checked })} /> Dia inteiro
          </label>
          <div>
            <label>
              Repetir (compromisso fixo)
              <select value={f.repetir} onChange={(e) => mudar({ repetir: e.target.value as EntradaCompromisso['repetir'] })}>
                {REPETICOES.map((r) => <option key={r.valor} value={r.valor}>{r.rotulo}</option>)}
              </select>
            </label>
            {f.repetir !== 'nunca' && (
              <label>
                Até (opcional)
                <input type="date" value={f.repetirAte ?? ''} min={f.data} onChange={(e) => mudar({ repetirAte: e.target.value || null })} />
              </label>
            )}
          </div>
          <div>
            <p>Quem vê</p>
            <div role="group" aria-label="Quem vê">
              {visibilidades.map((v) => (
                <button key={v.valor} type="button" onClick={() => mudar({ visibilidade: v.valor })} aria-pressed={f.visibilidade === v.valor}>
                  {v.rotulo}
                </button>
              ))}
            </div>
            {!podeCompartilhar && !compromisso && <p>Compromissos para a equipe são criados pelo admin ou gestor.</p>}
          </div>
          {f.visibilidade === 'selecionados' && (
            <div>
              {equipe.map((p) => (
                <label key={p.id}>
                  <input type="checkbox" checked={f.pessoas.includes(p.id)} onChange={() => alternarPessoa(p.id)} /> {p.nome}
                </label>
              ))}
            </div>
          )}
          <textarea value={f.descricao} onChange={(e) => mudar({ descricao: e.target.value })} placeholder="Descrição, link da reunião…" maxLength={2000} aria-label="Descrição" />
        </fieldset>
        {podeEditar && (
          <div>
            {compromisso ? (
              <div>
                <button type="button" disabled={pendente} onClick={excluir}>{compromisso.repetir === 'nunca' ? 'Excluir' : 'Excluir todos'}</button>
                {compromisso.repetir !== 'nunca' && dia && <button type="button" disabled={pendente} onClick={cancelarDia}>Cancelar só este dia</button>}
              </div>
            ) : <span />}
            <div>
              <button type="button" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="button" disabled={pendente} onClick={salvar}>Salvar</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
