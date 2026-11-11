'use client'

import { Ic } from '@/componentes/app/Ic'
import { Check, Plus, Search, X } from 'lucide-react'
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
import { AparenciaCampo } from './AparenciaCampo'
import { EditorOpcoes } from './EditorOpcoes'

const TIPOS_NUMERICOS = new Set(['number', 'money', 'rating', 'progress_auto', 'progress_manual', 'vote', 'formula'])

export function ConfiguracaoCampo({ item, config, onChange, campos }: { item: ItemCatalogoCampo; config: ConfigCampo; onChange: (config: ConfigCampo) => void; campos: DefinicaoCampo[] }) {
  if (item.tipo === 'money') {
    return (
      <div>
        <label><span>Moeda</span><select value={config.currency ?? 'BRL'} onChange={(e) => onChange({ ...config, currency: e.target.value, locale: e.target.value === 'BRL' ? 'pt-BR' : 'en-US' })}><option value="BRL">Real (R$)</option><option value="USD">Dólar (US$)</option><option value="EUR">Euro (€)</option><option value="GBP">Libra (£)</option></select></label>
        <label><span>Casas decimais</span><input type="number" min={0} max={4} value={config.decimals ?? 2} onChange={(e) => onChange({ ...config, decimals: Number(e.target.value) })} /></label>
      </div>
    )
  }
  if (item.tipo === 'dropdown' || item.tipo === 'labels') {
    return <div><span>Opções</span><EditorOpcoes config={config} onChange={onChange} /></div>
  }
  if (item.tipo === 'rating') {
    return <label><span>Nota máxima</span><input type="number" min={2} max={10} value={config.max ?? 5} onChange={(e) => onChange({ ...config, max: Number(e.target.value) })} /></label>
  }
  if (item.tipo === 'button') {
    return <div><label><span>Texto do botão</span><input value={config.buttonLabel ?? 'Abrir'} onChange={(e) => onChange({ ...config, buttonLabel: e.target.value })} /></label><label><span>URL da ação</span><input type="url" value={config.buttonUrl ?? 'https://'} onChange={(e) => onChange({ ...config, buttonUrl: e.target.value })} /></label></div>
  }
  if (item.tipo === 'formula') {
    const fontes = campos.filter((x) => TIPOS_NUMERICOS.has(x.tipo) && x.tipo !== 'formula')
    return (
      <div>
        <label><span>Operação</span><select value={config.operation ?? 'sum'} onChange={(e) => onChange({ ...config, operation: e.target.value as ConfigCampo['operation'] })}><option value="sum">Somar</option><option value="average">Média</option><option value="difference">Subtrair em sequência</option><option value="product">Multiplicar</option></select></label>
        <fieldset><legend>Campos numéricos usados</legend>{fontes.length === 0 ? <p>Crie primeiro um campo de número, dinheiro, avaliação ou progresso.</p> : fontes.map((fonte) => { const marcado = (config.sourceFields ?? []).includes(fonte.id); return <label key={fonte.id}><input type="checkbox" checked={marcado} onChange={() => onChange({ ...config, sourceFields: marcado ? (config.sourceFields ?? []).filter((id) => id !== fonte.id) : [...(config.sourceFields ?? []), fonte.id] })} />{fonte.nome}</label> })}</fieldset>
      </div>
    )
  }
  return <label><span>Texto de ajuda (opcional)</span><input value={config.placeholder ?? ''} onChange={(e) => onChange({ ...config, placeholder: e.target.value })} placeholder="O que a equipe deve preencher?" /></label>
}

export function Catalogo({ busca, onSelect }: { busca: string; onSelect: (item: ItemCatalogoCampo) => void }) {
  const itens = CATALOGO_CAMPOS.filter((item) => `${item.nome} ${item.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')))
  return (
    <div>
      {!busca && <p>Popular</p>}
      <div>
        {itens.map((item) => (
          <button key={item.tipo} type="button" onClick={() => onSelect(item)}>
            <span style={{ color: item.cor }}><IconeVisual icone={item.icone} /></span>
            <span><span>{item.nome}</span><span>{item.descricao}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

export type PropsGerenciarCampos = { listaId: string; espacoId: string | null; camposDaLista: DefinicaoCampo[]; camposDoEspaco: DefinicaoCampo[] }

/** Sem `aberto`, mostra o próprio botão; com `aberto`/`aoMudarAberto`, é controlado de fora (ex.: o "+" do cabeçalho). */
export function GerenciarCampos({ listaId, espacoId, camposDaLista, camposDoEspaco, aberto: abertoExterno, aoMudarAberto, colunasPadrao = [], aoAlternarColuna }: PropsGerenciarCampos & {
  aberto?: boolean
  aoMudarAberto?: (aberto: boolean) => void
  /** Colunas nativas da lista (Status, Prazo…) com a visibilidade atual; só a lista informa. */
  colunasPadrao?: { id: string; nome: string; visivel: boolean }[]
  aoAlternarColuna?: (id: string) => void
}) {
  const [abertoInterno, setAbertoInterno] = useState(false)
  const aberto = abertoExterno ?? abertoInterno
  const setAberto = aoMudarAberto ?? setAbertoInterno
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<ItemCatalogoCampo | null>(null)
  const [nome, setNome] = useState('')
  const [corNova, setCorNova] = useState('#70262d')
  const [iconeNovo, setIconeNovo] = useState('')
  const [config, setConfig] = useState<ConfigCampo>({})
  const [pendente, iniciar] = useTransition()
  const vinculados = useMemo(() => new Set(camposDaLista.map((x) => x.id)), [camposDaLista])

  const escolher = (item: ItemCatalogoCampo) => {
    setSelecionado(item)
    setNome(item.nome)
    setCorNova(item.cor)
    setIconeNovo(item.icone)
    setConfig(configuracaoPadrao(item.tipo))
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {abertoExterno === undefined && <DialogTrigger asChild><button><Ic n="view_column" s={16} />Campos</button></DialogTrigger>}
      <DialogContent>
        <DialogHeader><DialogTitle>Campos personalizados</DialogTitle><DialogDescription>Crie dados tipados para tarefas. Números, moedas e datas ficam prontos para filtros, métricas e relatórios.</DialogDescription></DialogHeader>
        {selecionado ? (
          <form onSubmit={(e) => { e.preventDefault(); iniciar(async () => { const resultado = await criarCampoPersonalizado({ espacoId, listaId, nome, tipo: selecionado.tipo, configuracao: config, cor: corNova, icone: iconeNovo || selecionado.icone }); if (!avisar(resultado)) return; setSelecionado(null); setAberto(false) }) }}>
            <button type="button" onClick={() => setSelecionado(null)}>← Voltar aos tipos</button>
            <div><span style={{ color: corNova }}>{(iconeNovo || selecionado.icone) === 'nenhum' ? <span>{nome.trim().charAt(0).toUpperCase() || 'A'}</span> : <IconeVisual icone={iconeNovo || selecionado.icone} />}</span><div><p>{selecionado.nome}</p><p>{selecionado.descricao}</p></div></div>
            <label><span>Nome do campo</span><input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} /></label>
            <ConfiguracaoCampo item={selecionado} config={config} onChange={setConfig} campos={camposDoEspaco} />
            <AparenciaCampo cor={corNova} aoMudarCor={setCorNova} icone={iconeNovo} aoMudarIcone={setIconeNovo} iconePadrao={selecionado.icone} />
            <div><button type="button" onClick={() => setSelecionado(null)}>Cancelar</button><button disabled={pendente || !nome.trim()}>{pendente ? 'Criando…' : 'Criar e adicionar'}</button></div>
          </form>
        ) : (
          <Tabs defaultValue="novo">
            <TabsList><TabsTrigger value="novo">Criar novo</TabsTrigger><TabsTrigger value="existente">Adicionar existente</TabsTrigger>{colunasPadrao.length > 0 && <TabsTrigger value="padrao">Campos existentes</TabsTrigger>}<TabsTrigger value="lista">Na lista ({camposDaLista.length})</TabsTrigger></TabsList>
            <div><Search /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar campos de tarefa" /></div>
            <TabsContent value="novo"><Catalogo busca={busca} onSelect={escolher} /></TabsContent>
            <TabsContent value="existente">
              {camposDoEspaco.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map((item) => {
                const adicionado = vinculados.has(item.id)
                return <button key={item.id} type="button" disabled={adicionado || pendente} onClick={() => iniciar(async () => { if (avisar(await adicionarCampoExistente(listaId, item.id))) setAberto(false) })}><span style={{ color: item.cor }}><IconeVisual icone={item.icone} /></span><span>{item.nome}</span>{adicionado ? <><Check /><span>Adicionado</span></> : <Plus />}</button>
              })}
              {camposDoEspaco.length === 0 && <p>Ainda não há campos reutilizáveis neste espaço.</p>}
            </TabsContent>
            <TabsContent value="padrao">
              <p>Campos que toda tarefa já tem. Escolha quais aparecem como coluna na lista.</p>
              {colunasPadrao.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map((item) => (
                <button key={item.id} type="button" onClick={() => aoAlternarColuna?.(item.id)}>
                  <span>{item.nome}</span>
                  {item.visivel ? <><Check /><span>Na lista</span></> : <><Plus /><span>Mostrar</span></>}
                </button>
              ))}
            </TabsContent>
            <TabsContent value="lista">
              {camposDaLista.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map((item) => (
                <div key={item.id}>
                  <span style={{ color: item.cor }}><IconeVisual icone={item.icone} /></span>
                  <span><span>{item.nome}</span><span>{CATALOGO_CAMPOS.find((catalogo) => catalogo.tipo === item.tipo)?.nome ?? item.tipo}</span></span>
                  <button
                    type="button"
                    disabled={pendente}
                    aria-label={`Remover ${item.nome} da lista`}
                    title="Remover da lista"
                    onClick={() => iniciar(async () => void avisar(await removerCampoDaLista(listaId, item.id)))}
                  >
                    <X />
                  </button>
                </div>
              ))}
              {camposDaLista.length === 0 && <p>Nenhum campo foi adicionado a esta lista.</p>}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
