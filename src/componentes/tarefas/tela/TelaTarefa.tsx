'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa, StatusLista } from '@/dominio/tarefas'
import type { NomesAtividade } from '@/dominio/atividade'
import { rotulo } from '@/lib/ui'
import type { Comentario } from '@/servicos/comentarios'
import type { ItemAtividade, TarefaCompleta } from '@/servicos/tarefas'
import type { CronometroAtivo, RegistroTempo } from '@/servicos/tempo'
import { SecaoRecorrencia } from './SecaoRecorrencia'
import type { Recorrencia } from '@/dominio/recorrencia'
import { SecaoConteudo } from '@/componentes/conteudo/SecaoConteudo'
import type { ConteudoDaTarefa, PublicacaoDoPost } from '@/servicos/conteudo'
import type { ContaMeta } from '@/componentes/conteudo/BlocoPublicacao'
import { EditorDescricao } from '../EditorDescricao'
import { CabecalhoTarefa } from './CabecalhoTarefa'
import { GradePropriedades } from './GradePropriedades'
import { CaixaComentario } from './CaixaComentario'
import { PainelAtividade } from './PainelAtividade'
import { RastrearTempo } from './RastrearTempo'
import { SecaoCampos } from './SecaoCampos'
import { SecaoSubtarefas } from './SecaoSubtarefas'

export type Opcao = { id: string; nome: string; cor: string }
export type ListaOpcao = { id: string; nome: string; mes: string | null; clienteId: string; clienteNome: string; espacoNome: string }

export type PropsTela = {
  tarefa: TarefaCompleta
  status: StatusLista[]
  equipe: Pessoa[]
  tags: Opcao[]
  tagsCliente: Opcao[]
  listas: ListaOpcao[]
  comentarios: Comentario[]
  atividade: ItemAtividade[]
  camposPersonalizados: DefinicaoCampo[]
  euId: string
  podeGerir: boolean
  hoje: string
  tempo: RegistroTempo[]
  cronometro: CronometroAtivo | null
  pessoas: { id: string; nome: string; avatar: string | null }[]
  emJanela: boolean
  /** Dados do post quando a tarefa é um post de conteúdo. */
  conteudo: ConteudoDaTarefa | null
  publicacao?: PublicacaoDoPost | null
  contaMeta?: ContaMeta
  recorrencia: Recorrencia | null
}

/** Tela da tarefa: coluna principal rolável + coluna Atividade (400px; aba abaixo de lg). */
export function TelaTarefa(p: PropsTela) {
  const t = p.tarefa
  const nomes: NomesAtividade = {
    status: Object.fromEntries(p.status.map((s) => [s.id, s.nome])),
    usuarios: Object.fromEntries(p.equipe.map((u) => [u.id, u.nome])),
    tags: Object.fromEntries(p.tags.map((g) => [g.id, g.nome])),
    campos: Object.fromEntries(p.camposPersonalizados.map((c) => [c.id, { nome: c.nome, tipo: c.tipo, configuracao: c.configuracao }])),
  }
  const [aba, setAba] = useState<'detalhes' | 'atividade'>('detalhes')
  return (
    <div className="@container flex h-full min-h-0 w-full flex-col bg-white">
      <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)} className="shrink-0 border-b border-borda px-3 pt-2 @4xl:hidden">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid min-h-0 flex-1 @4xl:grid-cols-[1fr_400px]">
        <div className={`min-h-0 space-y-6 overflow-y-auto p-4 @2xl:px-6 ${aba === 'detalhes' ? '' : 'hidden @4xl:block'}`}>
          <CabecalhoTarefa tarefa={t} listas={p.listas} status={p.status} podeGerir={p.podeGerir} emJanela={p.emJanela} />
          <GradePropriedades tarefa={t} status={p.status} equipe={p.equipe} tags={p.tags} tagsCliente={p.tagsCliente} podeGerir={p.podeGerir} hoje={p.hoje}>
            <RastrearTempo tarefaId={t.id} registros={p.tempo} cronometro={p.cronometro} euId={p.euId} podeGerir={p.podeGerir} />
          </GradePropriedades>
          <SecaoRecorrencia key={`${t.id}-${p.recorrencia?.cada}-${p.recorrencia?.frequencia}-${p.recorrencia?.ativa}`} tarefaId={t.id} prazo={t.prazo} hoje={p.hoje} regra={p.recorrencia} />
          {p.conteudo && <SecaoConteudo key={`${t.id}-${p.conteudo.versaoAtual}-${p.publicacao?.status}`} tarefaId={t.id} conteudo={p.conteudo} podeEditar publicacao={p.publicacao} conta={p.contaMeta} hoje={p.hoje} />}
          <div className="space-y-1">
            <span className={rotulo}>Descrição</span>
            <EditorDescricao key={t.id} tarefaId={t.id} inicial={t.descricao} />
          </div>
          <SecaoCampos tarefaId={t.id} campos={p.camposPersonalizados} equipe={p.equipe} />
          <SecaoSubtarefas tarefa={t} status={p.status} euId={p.euId} hoje={p.hoje} />
        </div>
        <aside className={`min-h-0 flex-col overflow-hidden border-l border-borda bg-fundo ${aba === 'atividade' ? 'flex' : 'hidden @4xl:flex'}`}>
          <PainelAtividade atividade={p.atividade} comentarios={p.comentarios} nomes={nomes} euId={p.euId} rodape={<CaixaComentario tarefaId={t.id} pessoas={p.pessoas} />} />
        </aside>
      </div>
    </div>
  )
}
