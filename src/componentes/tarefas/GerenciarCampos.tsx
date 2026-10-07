'use client'

import { Check, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { adicionarCampoExistente, criarCampoPersonalizado, removerCampoDaLista } from '@/app/(app)/acoes-campos'
import { IconeVisual } from '@/componentes/IconeVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import {
  CATALOGO_CAMPOS,
  configuracaoPadrao,
  type ConfigCampo,
  type DefinicaoCampo,
  type ItemCatalogoCampo,
} from '@/dominio/personalizacao'
import { EditorOpcoes } from './EditorOpcoes'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'

const TIPOS_NUMERICOS = new Set(['number', 'money', 'rating', 'progress_auto', 'progress_manual', 'vote', 'formula'])

export function ConfiguracaoCampo({ item, config, onChange, campos }: { item: ItemCatalogoCampo; config: ConfigCampo; onChange: (config: ConfigCampo) => void; campos: DefinicaoCampo[] }) {
  if (item.tipo === 'money') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1"><span className={rotulo}>Moeda</span><select className={campo} value={config.currency ?? 'BRL'} onChange={(e) => onChange({ ...config, currency: e.target.value, locale: e.target.value === 'BRL' ? 'pt-BR' : 'en-US' })}><option value="BRL">Real (R$)</option><option value="USD">Dólar (US$)</option><option value="EUR">Euro (€)</option><option value="GBP">Libra (£)</option></select></label>
        <label className="space-y-1"><span className={rotulo}>Casas decimais</span><input className={campo} type="number" min={0} max={4} value={config.decimals ?? 2} onChange={(e) => onChange({ ...config, decimals: Number(e.target.value) })} /></label>
      </div>
    )
  }
  if (item.tipo === 'dropdown' || item.tipo === 'labels') {
    return <div className="space-y-1"><span className={rotulo}>Opções</span><EditorOpcoes config={config} onChange={onChange} /></div>
  }
  if (item.tipo === 'rating') {
    return <label className="block space-y-1"><span className={rotulo}>Nota máxima</span><input className={campo} type="number" min={2} max={10} value={config.max ?? 5} onChange={(e) => onChange({ ...config, max: Number(e.target.value) })} /></label>
  }
  if (item.tipo === 'button') {
    return <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1"><span className={rotulo}>Texto do botão</span><input className={campo} value={config.buttonLabel ?? 'Abrir'} onChange={(e) => onChange({ ...config, buttonLabel: e.target.value })} /></label><label className="space-y-1"><span className={rotulo}>URL da ação</span><input className={campo} type="url" value={config.buttonUrl ?? 'https://'} onChange={(e) => onChange({ ...config, buttonUrl: e.target.value })} /></label></div>
  }
  if (item.tipo === 'formula') {
    const fontes = campos.filter((x) => TIPOS_NUMERICOS.has(x.tipo) && x.tipo !== 'formula')
    return (
      <div className="space-y-3">
        <label className="block space-y-1"><span className={rotulo}>Operação</span><select className={campo} value={config.operation ?? 'sum'} onChange={(e) => onChange({ ...config, operation: e.target.value as ConfigCampo['operation'] })}><option value="sum">Somar</option><option value="average">Média</option><option value="difference">Subtrair em sequência</option><option value="product">Multiplicar</option></select></label>
        <fieldset className="space-y-1"><legend className={rotulo}>Campos numéricos usados</legend>{fontes.length === 0 ? <p className="rounded-lg bg-fundo p-3 text-xs text-texto-3">Crie primeiro um campo de número, dinheiro, avaliação ou progresso.</p> : fontes.map((fonte) => { const marcado = (config.sourceFields ?? []).includes(fonte.id); return <label key={fonte.id} className="flex items-center gap-2 rounded-lg border border-borda px-3 py-2 text-sm"><input type="checkbox" checked={marcado} onChange={() => onChange({ ...config, sourceFields: marcado ? (config.sourceFields ?? []).filter((id) => id !== fonte.id) : [...(config.sourceFields ?? []), fonte.id] })} />{fonte.nome}</label> })}</fieldset>
      </div>
    )
  }
  return <label className="block space-y-1"><span className={rotulo}>Texto de ajuda (opcional)</span><input className={campo} value={config.placeholder ?? ''} onChange={(e) => onChange({ ...config, placeholder: e.target.value })} placeholder="O que a equipe deve preencher?" /></label>
}

export function Catalogo({ busca, onSelect }: { busca: string; onSelect: (item: ItemCatalogoCampo) => void }) {
  const itens = CATALOGO_CAMPOS.filter((item) => `${item.nome} ${item.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')))
  return (
    <div className="max-h-[52vh] overflow-y-auto pr-1">
      {!busca && <p className="mb-2 px-1 text-xs font-semibold text-texto-3">Popular</p>}
      <div className="grid gap-1 sm:grid-cols-2">
        {itens.map((item) => (
          <button key={item.tipo} type="button" onClick={() => onSelect(item)} className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-hover">
            <span className="mt-0.5" style={{ color: item.cor }}><IconeVisual icone={item.icone} className="h-5 w-5" /></span>
            <span><span className="block text-sm font-medium">{item.nome}</span><span className="block text-[11px] leading-4 text-texto-3">{item.descricao}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

export type PropsGerenciarCampos = { listaId: string; espacoId: string | null; camposDaLista: DefinicaoCampo[]; camposDoEspaco: DefinicaoCampo[] }

/** Sem `aberto`, mostra o próprio botão; com `aberto`/`aoMudarAberto`, é controlado de fora (ex.: o "+" do cabeçalho). */
export function GerenciarCampos({ listaId, espacoId, camposDaLista, camposDoEspaco, aberto: abertoExterno, aoMudarAberto }: PropsGerenciarCampos & { aberto?: boolean; aoMudarAberto?: (aberto: boolean) => void }) {
  const [abertoInterno, setAbertoInterno] = useState(false)
  const aberto = abertoExterno ?? abertoInterno
  const setAberto = aoMudarAberto ?? setAbertoInterno
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<ItemCatalogoCampo | null>(null)
  const [nome, setNome] = useState('')
  const [config, setConfig] = useState<ConfigCampo>({})
  const [pendente, iniciar] = useTransition()
  const vinculados = useMemo(() => new Set(camposDaLista.map((x) => x.id)), [camposDaLista])

  const escolher = (item: ItemCatalogoCampo) => {
    setSelecionado(item)
    setNome(item.nome)
    setConfig(configuracaoPadrao(item.tipo))
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {abertoExterno === undefined && <DialogTrigger asChild><button className={botaoSecundario}><SlidersHorizontal className="h-4 w-4" /> Campos ({camposDaLista.length})</button></DialogTrigger>}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Campos personalizados</DialogTitle><DialogDescription>Crie dados tipados para tarefas. Números, moedas e datas ficam prontos para filtros, métricas e relatórios.</DialogDescription></DialogHeader>
        {selecionado ? (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); iniciar(async () => { const resultado = await criarCampoPersonalizado({ espacoId, listaId, nome, tipo: selecionado.tipo, configuracao: config, cor: selecionado.cor, icone: selecionado.icone }); if (!avisar(resultado)) return; setSelecionado(null); setAberto(false) }) }}>
            <button type="button" className="text-xs font-semibold text-marca hover:underline" onClick={() => setSelecionado(null)}>← Voltar aos tipos</button>
            <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-fundo" style={{ color: selecionado.cor }}><IconeVisual icone={selecionado.icone} className="h-6 w-6" /></span><div><p className="font-semibold">{selecionado.nome}</p><p className="text-xs text-texto-3">{selecionado.descricao}</p></div></div>
            <label className="block space-y-1"><span className={rotulo}>Nome do campo</span><input autoFocus required className={campo} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
            <ConfiguracaoCampo item={selecionado} config={config} onChange={setConfig} campos={camposDoEspaco} />
            <div className="flex justify-end gap-2"><button type="button" className={botaoSecundario} onClick={() => setSelecionado(null)}>Cancelar</button><button disabled={pendente || !nome.trim()} className={botaoPrimario}>{pendente ? 'Criando…' : 'Criar e adicionar'}</button></div>
          </form>
        ) : (
          <Tabs defaultValue="novo">
            <TabsList><TabsTrigger value="novo">Criar novo</TabsTrigger><TabsTrigger value="existente">Adicionar existente</TabsTrigger><TabsTrigger value="lista">Na lista ({camposDaLista.length})</TabsTrigger></TabsList>
            <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" /><input className={`${campo} pl-9`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar campos de tarefa" /></div>
            <TabsContent value="novo" className="pt-3"><Catalogo busca={busca} onSelect={escolher} /></TabsContent>
            <TabsContent value="existente" className="space-y-1 pt-3">
              {camposDoEspaco.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map((item) => {
                const adicionado = vinculados.has(item.id)
                return <button key={item.id} type="button" disabled={adicionado || pendente} onClick={() => iniciar(async () => { if (avisar(await adicionarCampoExistente(listaId, item.id))) setAberto(false) })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-hover disabled:opacity-60"><span style={{ color: item.cor }}><IconeVisual icone={item.icone} className="h-5 w-5" /></span><span className="flex-1 text-sm font-medium">{item.nome}</span>{adicionado ? <><Check className="h-4 w-4 text-emerald-600" /><span className="text-xs text-texto-3">Adicionado</span></> : <Plus className="h-4 w-4" />}</button>
              })}
              {camposDoEspaco.length === 0 && <p className="rounded-xl bg-fundo p-4 text-sm text-texto-3">Ainda não há campos reutilizáveis neste espaço.</p>}
            </TabsContent>
            <TabsContent value="lista" className="space-y-1 pt-3">
              {camposDaLista.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-borda px-3 py-2.5">
                  <span style={{ color: item.cor }}><IconeVisual icone={item.icone} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.nome}</span><span className="block text-[11px] text-texto-3">{CATALOGO_CAMPOS.find((catalogo) => catalogo.tipo === item.tipo)?.nome ?? item.tipo}</span></span>
                  <button
                    type="button"
                    disabled={pendente}
                    aria-label={`Remover ${item.nome} da lista`}
                    title="Remover da lista"
                    onClick={() => iniciar(async () => void avisar(await removerCampoDaLista(listaId, item.id)))}
                    className="rounded-lg p-2 text-texto-3 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {camposDaLista.length === 0 && <p className="rounded-xl bg-fundo p-4 text-sm text-texto-3">Nenhum campo foi adicionado a esta lista.</p>}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
