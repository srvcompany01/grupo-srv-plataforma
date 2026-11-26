'use client'

import { ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Copy, CopyPlus, Download, Eye, Globe, Monitor, Plus, Save, Smartphone, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, useTransition, type CSSProperties, type ReactNode } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { Button } from '@/componentes/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'
import { Input } from '@/componentes/ui/input'
import { Interruptor } from '@/componentes/ui/interruptor'
import { Textarea } from '@/componentes/ui/textarea'
import { CATALOGO_PERGUNTAS, ConfigFormularioSchema, EntradaFormularioSchema, configuracaoFormulario, urlFormularioBiolytics, type CampoFormulario, type ConfigFormulario, type EntradaFormulario, type RespostasFormulario, type TipoPergunta } from '@/dominio/formularios'
import { LANDINGS_COM_FORMULARIO } from '@/dominio/landings'
import type { DadosFormularios, Formulario, RespostaFormulario } from '@/servicos/formularios'
import { CampoPergunta, FormularioPublico } from '@/app/f/[token]/FormularioPublico'
import { respostasFormularioAcao, salvarFormularioAcao } from './acoes'
import s from './estudio.module.css'

const nomeTipo = (c: CampoFormulario) => CATALOGO_PERGUNTAS.find((t) => t.tipo === (c.tipo ?? (c.key === 'description' ? 'long_text' : 'text')))?.nome ?? 'Resposta curta'
type Aba = 'Editor' | 'Opções' | 'Rastreamento' | 'Compartilhar' | 'Respostas'
export function EstudioFormulario({ formulario, dados, aoFechar }: { formulario: Formulario | null; dados: Pick<DadosFormularios, 'listas' | 'clientes' | 'equipe'>; aoFechar: () => void }) {
  const [id, setId] = useState(formulario?.id ?? null)
  const [token, setToken] = useState(formulario?.token ?? '')
  const [urlPublicada, setUrlPublicada] = useState(formulario?.urlPublica ?? null)
  const [entrada, setEntrada] = useState<EntradaFormulario>(() => ({ nome: formulario?.nome ?? 'Novo formulário', descricao: formulario?.descricao ?? '', listaId: formulario?.listaId ?? '', clienteId: formulario?.clienteId ?? null, responsavelId: formulario?.responsavelId ?? '', landing: formulario?.landing ?? null, campos: formulario?.campos ?? [{ key: 'title', label: 'Como podemos ajudar?', required: true, tipo: 'text' }], configuracao: configuracaoFormulario(formulario?.configuracao ?? { modo: 'conversa' }) }))
  const [aba, setAba] = useState<Aba>('Editor')
  const [selecionada, setSelecionada] = useState(entrada.campos[0].key)
  const [alterado, setAlterado] = useState(false)
  const [rascunho, setRascunho] = useState(formulario?.temRascunho ?? true)
  const [previa, setPrevia] = useState(false)
  const [celular, setCelular] = useState(false)
  const [amostra, setAmostra] = useState<RespostasFormulario>({})
  const [erro, setErro] = useState<string | null>(null)
  const [campoInvalido, setCampoInvalido] = useState<'listaId' | 'responsavelId' | 'clienteId' | 'whatsappFinal' | null>(null)
  const listaRef = useRef<HTMLSelectElement>(null)
  const responsavelRef = useRef<HTMLSelectElement>(null)
  const clienteRef = useRef<HTMLSelectElement>(null)
  const whatsappRef = useRef<HTMLInputElement>(null)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const prefixo = useId()
  useEffect(() => {
    if (aba !== 'Opções' || !campoInvalido) return
    const controle = { listaId: listaRef, responsavelId: responsavelRef, clienteId: clienteRef, whatsappFinal: whatsappRef }[campoInvalido].current
    controle?.focus({ preventScroll: true })
    controle?.scrollIntoView({ block: 'center' })
  }, [aba, campoInvalido])
  const config: ConfigFormulario = { ...configuracaoFormulario(), ...entrada.configuracao }
  const campo = entrada.campos.find((c) => c.key === selecionada) ?? entrada.campos[0]
  const indice = entrada.campos.indexOf(campo)
  const vinculado = /^[0-9a-f-]{36}$/i.test(campo.key)
  const oferecidos = dados.listas.find((l) => l.id === entrada.listaId)?.oferecidos ?? []
  const extras = oferecidos.filter((c) => !entrada.campos.some((e) => e.key === c.key))
  const clienteBiolytics = dados.clientes.find((c) => c.id === entrada.clienteId)
  const urlBiolytics = urlFormularioBiolytics(token, clienteBiolytics?.urlBiolytics)
  const url = urlPublicada ?? (token && typeof window !== 'undefined' ? `${window.location.origin}/f/${token}` : '')
  const mudar = (valores: Partial<EntradaFormulario>) => { setEntrada((a) => ({ ...a, ...valores })); setAlterado(true); setErro(null); setCampoInvalido(null) }
  const configurar = (valores: Partial<ConfigFormulario>) => mudar({ configuracao: { ...config, ...valores } })
  const editar = (valores: Partial<CampoFormulario>) => mudar({ campos: entrada.campos.map((c) => c.key === campo.key ? { ...c, ...valores } : c) })
  const adicionar = (novo: CampoFormulario) => { if (entrada.campos.length >= 40) return; mudar({ campos: [...entrada.campos, novo] }); setSelecionada(novo.key) }
  const adicionarTipo = (tipo: TipoPergunta) => adicionar({ key: `q_${crypto.randomUUID()}`, label: tipo === 'statement' ? 'Uma mensagem para você' : 'Nova pergunta', required: false, tipo, ...(['multiple_choice', 'dropdown'].includes(tipo) ? { opcoes: ['Opção 1', 'Opção 2'] } : {}) })
  const mover = (delta: number) => {
    const proximo = [...entrada.campos], alvo = indice + delta
    if (alvo < 0 || alvo >= proximo.length) return
    ;[proximo[indice], proximo[alvo]] = [proximo[alvo], proximo[indice]]
    mudar({ campos: proximo })
  }
  const retirar = () => {
    if (campo.key === 'title') return
    if (entrada.campos.some((c) => c.condicao?.campo === campo.key)) { setErro('Retire primeiro as condições que dependem desta pergunta.'); return }
    mudar({ campos: entrada.campos.filter((c) => c.key !== campo.key) }); setSelecionada(entrada.campos[0].key)
  }
  const fechar = async () => {
    if (pendente) return
    if (alterado && !(await confirmar({ titulo: 'Sair sem salvar?', descricao: 'As alterações que ainda não foram salvas serão descartadas.', confirmar: 'Sair sem salvar' }))) return
    aoFechar()
  }
  const salvar = (publicar: boolean) => {
    if (config.usarDominioBiolytics && !clienteBiolytics?.urlBiolytics) {
      setPrevia(false); setAba('Opções'); setCampoInvalido('clienteId')
      setErro(entrada.clienteId ? 'Crie primeiro a página deste cliente na área Biolytics.' : 'Selecione um cliente para usar o domínio Biolytics.')
      return
    }
    const validacao = EntradaFormularioSchema.safeParse(entrada)
    if (!validacao.success) {
      const falha = validacao.error.issues[0]
      setPrevia(false)
      setErro(falha.message)
      if (falha.path[0] === 'campos') {
        setAba('Editor')
        const indice = falha.path[1]
        if (typeof indice === 'number' && entrada.campos[indice]) setSelecionada(entrada.campos[indice].key)
      } else {
        const chave = falha.path[0] === 'configuracao' ? falha.path[1] : falha.path[0]
        setAba(RASTREIO.has(String(chave)) ? 'Rastreamento' : 'Opções')
        setCampoInvalido(chave === 'whatsappFinal' || chave === 'listaId' || chave === 'responsavelId' || chave === 'clienteId' ? chave : null)
      }
      return
    }
    iniciar(async () => {
    setErro(null)
    setCampoInvalido(null)
    try {
      const r = await salvarFormularioAcao(id, entrada, publicar)
      if (r.erro) { setErro(r.erro); return }
      if (r.id) setId(r.id)
      if (r.token) setToken(r.token)
      if (r.urlPublica !== undefined) setUrlPublicada(r.urlPublica)
      setAlterado(false); setRascunho(!publicar); avisar(r, true)
    } catch { setErro('Não foi possível salvar agora. Suas alterações continuam no editor.') }
    })
  }
  const alternarPrevia = () => {
    if (previa) { setPrevia(false); return }
    const validacao = ConfigFormularioSchema.safeParse(config)
    if (!validacao.success) {
      setAba(RASTREIO.has(String(validacao.error.issues[0].path[0])) ? 'Rastreamento' : 'Opções'); setErro(validacao.error.issues[0].message)
      setCampoInvalido(validacao.error.issues[0].path[0] === 'whatsappFinal' ? 'whatsappFinal' : null)
      return
    }
    setErro(null); setPrevia(true)
  }
  const copiar = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto); avisar({ ok: 'Copiado.' }, true) }
    catch { avisar({ erro: 'Não foi possível copiar. Selecione o texto e copie manualmente.' }) }
  }
  const perguntasPublicas = entrada.campos.map((c) => {
    const original = oferecidos.find((o) => o.key === c.key)
    return { ...c, tipo: c.tipo ?? original?.tipo ?? (c.key === 'description' ? 'long_text' : 'text') as TipoPergunta, opcoes: c.opcoes ?? original?.opcoes ?? [] }
  })
  return <Dialog open onOpenChange={(aberto) => !aberto && void fechar()}>
    <DialogContent className={s.estudio} showCloseButton={false}>
      <DialogTitle className={s.oculto}>Construtor de formulários</DialogTitle>
      <DialogDescription className={s.oculto}>Edite perguntas, personalize o preenchimento, compartilhe o link e consulte as respostas.</DialogDescription>
      <header className={s.topo}>
        <div className={s.identidade}><Button variant="ghost" size="icon" onClick={fechar} aria-label="Voltar aos formulários"><ArrowLeft /></Button><div><strong>{entrada.nome}</strong><span>{!entrada.listaId || !entrada.responsavelId ? 'Defina lista e responsável em Opções' : alterado ? 'Alterações não salvas' : rascunho ? 'Rascunho' : 'Publicado'}</span></div></div>
        <nav className={s.abas} role="tablist" aria-label="Seções do formulário">{(['Editor', 'Opções', 'Rastreamento', 'Compartilhar', 'Respostas'] as Aba[]).map((a) => <button type="button" role="tab" id={`${prefixo}-${a}`} aria-controls={`${prefixo}-conteudo`} aria-selected={aba === a && !previa} key={a} onClick={() => { setPrevia(false); setAba(a) }}>{a}</button>)}</nav>
        <div className={s.acoes}><Button variant="secondary" onClick={alternarPrevia}><Eye />{previa ? 'Voltar ao editor' : 'Ver prévia'}</Button><Button variant="secondary" disabled={pendente} onClick={() => salvar(false)}><Save />Salvar rascunho</Button><Button disabled={pendente} onClick={() => salvar(true)}><Globe />{pendente ? 'Salvando…' : 'Publicar'}</Button></div>
      </header>
      {erro && <p id={`${prefixo}-erro`} className={s.erro} role="alert">{erro}</p>}
      <div id={`${prefixo}-conteudo`} role="tabpanel" aria-labelledby={`${prefixo}-${aba}`} className={s.corpo} inert={pendente}>
        {previa ? <div className={s.previaCompleta}><div className={s.dispositivos}><Button variant="ghost" aria-pressed={!celular} onClick={() => setCelular(false)}><Monitor />Computador</Button><Button variant="ghost" aria-pressed={celular} onClick={() => setCelular(true)}><Smartphone />Celular</Button></div><div className={s.moldura} data-celular={celular}><FormularioPublico key={JSON.stringify(entrada)} token="previa" previa formulario={{ nome: entrada.nome, descricao: entrada.descricao, campos: perguntasPublicas, configuracao: config }} /></div></div> : aba === 'Editor' ? <div className={s.editor}>
          <aside className={s.perguntas} aria-label="Perguntas do formulário"><div className={s.tituloSecao}><strong>Perguntas</strong><span>{entrada.campos.length}/40</span></div><ol>{entrada.campos.map((c, i) => <li key={c.key}><button type="button" aria-pressed={c.key === campo.key} onClick={() => setSelecionada(c.key)}><span>{i + 1}</span><div><strong>{c.label}</strong><small>{nomeTipo(c)}{c.required ? ' · Obrigatória' : ''}</small></div></button></li>)}</ol>
            <label className={s.campo}><span><Plus />Adicionar pergunta</span><select aria-label="Adicionar pergunta" value="" disabled={entrada.campos.length >= 40} onChange={(e) => adicionarTipo(e.target.value as TipoPergunta)}><option value="" disabled>Escolha um tipo…</option>{CATALOGO_PERGUNTAS.map((t) => <option key={t.tipo} value={t.tipo}>{t.nome}</option>)}</select></label>
            {!!extras.length && <label className={s.campo}>Usar campo da lista<select aria-label="Adicionar campo da lista" value="" disabled={entrada.campos.length >= 40} onChange={(e) => { const c = extras.find((o) => o.key === e.target.value); if (c) adicionar(c) }}><option value="" disabled>Escolha um campo…</option>{extras.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>}
            <div className={s.fimLista}><CheckCircleLabel />Encerramento em Opções</div>
          </aside>
          <section className={s.canvas} aria-label="Prévia da pergunta"><div className={s.tituloSecao}><span>Prévia da pergunta</span><span>{indice + 1} de {entrada.campos.length}</span></div><div className={s.perguntaPrevia} style={{ color: config.corTexto, backgroundColor: config.corFundo, '--form-texto': config.corTexto, '--form-resposta': config.corResposta, '--form-fundo': config.corFundo, '--form-raio': `${config.bordas}px` } as CSSProperties}><CampoPergunta campo={perguntasPublicas[indice]} valor={amostra[campo.key]} aoMudar={(v) => setAmostra((a) => ({ ...a, [campo.key]: v }))} numero={indice + 1} /></div><p className={s.ajuda}>A prévia é interativa. Use “Ver prévia” para testar o formulário inteiro sem gerar tarefas.</p></section>
          <aside className={s.propriedades} aria-label="Configurar pergunta"><div className={s.tituloSecao}><strong>Configurar pergunta</strong><div><Button variant="ghost" size="icon-sm" disabled={indice === 0} onClick={() => mover(-1)} aria-label="Mover pergunta para cima"><ArrowUp /></Button><Button variant="ghost" size="icon-sm" disabled={indice === entrada.campos.length - 1} onClick={() => mover(1)} aria-label="Mover pergunta para baixo"><ArrowDown /></Button></div></div>
            <Rotulo nome="Tipo de pergunta"><select value={campo.tipo ?? 'text'} disabled={vinculado || campo.key === 'title'} onChange={(e) => editar({ tipo: e.target.value as TipoPergunta, opcoes: ['multiple_choice','dropdown'].includes(e.target.value) ? campo.opcoes?.length ? campo.opcoes : ['Opção 1', 'Opção 2'] : undefined })}>{CATALOGO_PERGUNTAS.map((t) => <option key={t.tipo} value={t.tipo}>{t.nome}</option>)}</select></Rotulo>
            {vinculado && <p className={s.ajuda}>Vinculada ao campo “{oferecidos.find((o) => o.key === campo.key)?.label ?? campo.label}” da lista. O tipo e as opções vêm desse campo.</p>}
            <Rotulo nome="Pergunta"><Input value={campo.label} maxLength={120} onChange={(e) => editar({ label: e.target.value })} /></Rotulo>
            <Rotulo nome="Descrição da pergunta"><Textarea rows={3} value={campo.descricao ?? ''} onChange={(e) => editar({ descricao: e.target.value })} /></Rotulo>
            <LinhaSwitch nome="Obrigatória" valor={campo.key === 'title' || campo.required} desabilitado={campo.key === 'title' || campo.tipo === 'statement'} mudar={(v) => editar({ required: v })} />
            <Rotulo nome="Texto de exemplo"><Input value={campo.placeholder ?? ''} onChange={(e) => editar({ placeholder: e.target.value })} /></Rotulo>
            <Rotulo nome="Imagem da pergunta (URL HTTPS)"><Input type="url" value={campo.imagem ?? ''} onChange={(e) => editar({ imagem: e.target.value })} /></Rotulo>
            {['multiple_choice','dropdown'].includes(campo.tipo ?? '') && <><Rotulo nome="Opções (uma por linha)"><Textarea rows={5} disabled={vinculado} value={(campo.opcoes ?? []).join('\n')} onChange={(e) => editar({ opcoes: e.target.value.split('\n') })} /></Rotulo>{campo.tipo === 'multiple_choice' && <LinhaSwitch nome="Permitir múltiplas escolhas" valor={campo.multipla ?? false} mudar={(v) => editar({ multipla: v })} />}
              <details className={s.detalhes}><summary>Pontuação por resposta</summary>{(campo.opcoes ?? []).map((o) => <label key={o} className={s.linhaPontos}><span>{o}</span><Input aria-label={`Pontos de ${o}`} type="number" value={campo.pontos?.[o] ?? 0} min={-10000} max={10000} onChange={(e) => editar({ pontos: { ...campo.pontos, [o]: Number(e.target.value) } })} /></label>)}</details></>}
            {['number','money','rating'].includes(campo.tipo ?? '') ? <div className={s.grade}><Rotulo nome="Mínimo"><Input type="number" value={campo.minimo ?? ''} onChange={(e) => editar({ minimo: e.target.value === '' ? undefined : Number(e.target.value) })} /></Rotulo><Rotulo nome="Máximo"><Input type="number" value={campo.maximo ?? (campo.tipo === 'rating' ? 5 : '')} onChange={(e) => editar({ maximo: e.target.value === '' ? undefined : Number(e.target.value) })} /></Rotulo></div> : <Rotulo nome="Limite de caracteres"><Input type="number" min={1} max={campo.key === 'title' ? 200 : 20000} value={campo.limite ?? ''} onChange={(e) => editar({ limite: e.target.value ? Number(e.target.value) : undefined })} /></Rotulo>}
            {campo.key !== 'title' && <details className={s.detalhes} open={!!campo.condicao}><summary>Lógica condicional</summary><Rotulo nome="Mostrar esta pergunta quando"><select value={campo.condicao?.campo ?? ''} onChange={(e) => editar({ condicao: e.target.value ? { campo: e.target.value, operador: 'igual', valor: '' } : undefined })}><option value="">Sempre mostrar</option>{entrada.campos.slice(0, indice).filter((c) => c.tipo !== 'statement').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Rotulo>{campo.condicao && <><Rotulo nome="Condição"><select value={campo.condicao.operador} onChange={(e) => editar({ condicao: { ...campo.condicao!, operador: e.target.value as NonNullable<CampoFormulario['condicao']>['operador'] } })}><option value="igual">For igual a</option><option value="diferente">For diferente de</option><option value="contem">Contiver</option><option value="preenchido">Estiver preenchida</option></select></Rotulo>{campo.condicao.operador !== 'preenchido' && <Rotulo nome="Resposta esperada"><Input value={campo.condicao.valor} onChange={(e) => editar({ condicao: { ...campo.condicao!, valor: e.target.value } })} /></Rotulo>}</>}</details>}
            <div className={s.ferramentasPergunta}><Button variant="secondary" disabled={entrada.campos.length >= 40} onClick={() => adicionar({ ...campo, key: `q_${crypto.randomUUID()}`, label: `${campo.label.slice(0, 110)} (cópia)`, tipo: campo.tipo ?? 'text', required: false, condicao: undefined })}><CopyPlus />Duplicar</Button><Button variant="destructive" disabled={campo.key === 'title'} onClick={retirar}><Trash2 />Retirar</Button></div>
          </aside>
        </div> : aba === 'Opções' ? <div className={s.opcoes}>
          <Bloco titulo="Informações e destino"><Rotulo nome="Nome do formulário"><Input maxLength={120} value={entrada.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Rotulo><Rotulo nome="Descrição do formulário"><Textarea rows={3} value={entrada.descricao} onChange={(e) => mudar({ descricao: e.target.value })} /></Rotulo><div className={s.grade}><Rotulo nome="Lista de destino"><select ref={listaRef} aria-invalid={campoInvalido === 'listaId'} aria-describedby={campoInvalido === 'listaId' && erro ? `${prefixo}-erro` : undefined} value={entrada.listaId} onChange={(e) => { const lista = dados.listas.find((l) => l.id === e.target.value); mudar({ listaId: e.target.value, campos: entrada.campos.filter((c) => c.key.startsWith('q_') || c.key === 'title' || c.key === 'description' || lista?.oferecidos.some((o) => o.key === c.key)) }) }}><option value="">Selecione uma lista</option>{dados.listas.map((l) => <option key={l.id} value={l.id}>{l.caminho}</option>)}</select></Rotulo><Rotulo nome="Responsável"><select ref={responsavelRef} aria-invalid={campoInvalido === 'responsavelId'} aria-describedby={campoInvalido === 'responsavelId' && erro ? `${prefixo}-erro` : undefined} value={entrada.responsavelId} onChange={(e) => mudar({ responsavelId: e.target.value })}><option value="">Selecione uma pessoa</option>{dados.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></Rotulo></div><Rotulo nome="Cliente"><select ref={clienteRef} aria-invalid={campoInvalido === 'clienteId'} aria-describedby={campoInvalido === 'clienteId' && erro ? `${prefixo}-erro` : undefined} value={entrada.clienteId ?? ''} onChange={(e) => mudar({ clienteId: e.target.value || null })}><option value="">Usar o cliente da lista</option>{dados.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></Rotulo><Rotulo nome="Landing page ligada"><select value={entrada.landing ?? ''} onChange={(e) => mudar({ landing: e.target.value || null })}><option value="">Nenhuma</option>{LANDINGS_COM_FORMULARIO.map((l) => <option key={l.slug} value={l.slug}>{l.nome}</option>)}</select></Rotulo><p className={s.ajuda}>Cada resposta publicada gera uma tarefa. Perguntas independentes são guardadas na resposta e na descrição da tarefa.</p></Bloco>
          <Bloco titulo="Endereço do formulário"><LinhaSwitch nome="Usar domínio Biolytics do cliente" valor={config.usarDominioBiolytics} mudar={(v) => configurar({ usarDominioBiolytics: v })} />{config.usarDominioBiolytics ? <><p className={s.ajuda}>{clienteBiolytics?.urlBiolytics ? `O formulário usará o endereço Biolytics de ${clienteBiolytics.nome}. Publique para aplicar a alteração.` : 'Selecione um cliente acima e crie a página dele em Biolytics para usar este endereço.'}</p>{clienteBiolytics?.urlBiolytics && <Input aria-label="Endereço Biolytics do formulário" readOnly value={urlBiolytics ?? `${clienteBiolytics.urlBiolytics}/f/…`} />}</> : <p className={s.ajuda}>O formulário usa o domínio da plataforma. Ative para usar o endereço Biolytics do cliente selecionado.</p>}</Bloco>
          <Bloco titulo="Aparência"><Rotulo nome="Modo de preenchimento"><select value={config.modo} onChange={(e) => configurar({ modo: e.target.value as ConfigFormulario['modo'] })}><option value="conversa">Uma pergunta por vez</option><option value="pagina">Todos os campos na página</option></select></Rotulo><div className={s.cores}>{(['corBotao','corTexto','corResposta','corFundo'] as const).map((k, i) => <label key={k}>{['Botão','Pergunta','Resposta','Fundo'][i]}<input type="color" value={config[k]} onChange={(e) => configurar({ [k]: e.target.value })} /></label>)}</div><Rotulo nome="Logotipo (URL HTTPS)"><Input type="url" value={config.logo} onChange={(e) => configurar({ logo: e.target.value })} /></Rotulo><Rotulo nome="Imagem de fundo (URL HTTPS)"><Input type="url" value={config.imagemFundo} onChange={(e) => configurar({ imagemFundo: e.target.value })} /></Rotulo><div className={s.grade}><Rotulo nome="Fonte"><select value={config.fonte} onChange={(e) => configurar({ fonte: e.target.value as ConfigFormulario['fonte'] })}><option value="sistema">Sistema</option><option value="serif">Serifada</option><option value="mono">Monoespaçada</option></select></Rotulo><Rotulo nome={`Bordas: ${config.bordas}px`}><input type="range" min={0} max={28} value={config.bordas} onChange={(e) => configurar({ bordas: Number(e.target.value) })} /></Rotulo></div></Bloco>
          <Bloco titulo="Boas-vindas"><LinhaSwitch nome="Exibir tela de boas-vindas" valor={config.boasVindas} mudar={(v) => configurar({ boasVindas: v })} /><Rotulo nome="Título de boas-vindas"><Input value={config.tituloBoasVindas} onChange={(e) => configurar({ tituloBoasVindas: e.target.value })} /></Rotulo><Rotulo nome="Texto de boas-vindas"><Textarea rows={3} value={config.textoBoasVindas} onChange={(e) => configurar({ textoBoasVindas: e.target.value })} /></Rotulo><Rotulo nome="Texto do botão inicial"><Input value={config.botaoInicio} onChange={(e) => configurar({ botaoInicio: e.target.value })} /></Rotulo></Bloco>
          <Bloco titulo="Encerramento">
            <Rotulo nome="Mensagem de agradecimento"><Input value={config.tituloFinal} onChange={(e) => configurar({ tituloFinal: e.target.value })} /></Rotulo>
            <Rotulo nome="Texto de agradecimento"><Textarea rows={3} value={config.textoFinal} onChange={(e) => configurar({ textoFinal: e.target.value })} /></Rotulo>
            <Rotulo nome="Ação do botão final"><select value={config.destinoFinal} onChange={(e) => configurar({ destinoFinal: e.target.value as ConfigFormulario['destinoFinal'] })}><option value="link">Abrir um link</option><option value="whatsapp">Enviar respostas pelo WhatsApp</option></select></Rotulo>
            <Rotulo nome="Texto do botão final"><Input maxLength={50} placeholder={config.destinoFinal === 'whatsapp' ? 'Enviar pelo WhatsApp' : 'Ex.: Continuar'} value={config.botaoFinal} onChange={(e) => configurar({ botaoFinal: e.target.value })} /></Rotulo>
            {config.destinoFinal === 'whatsapp' ? <>
              <Rotulo nome="WhatsApp de destino"><Input ref={whatsappRef} type="tel" inputMode="tel" autoComplete="tel" maxLength={40} placeholder="+55 (91) 99999-9999" aria-invalid={campoInvalido === 'whatsappFinal'} aria-describedby={campoInvalido === 'whatsappFinal' && erro ? `${prefixo}-erro` : undefined} value={config.whatsappFinal} onChange={(e) => configurar({ whatsappFinal: e.target.value })} /></Rotulo>
              <p className={s.ajuda}>Cadastre o número que receberá os contatos. Números brasileiros podem usar apenas DDD e telefone; para outros países, informe +DDI.</p>
              <Rotulo nome="Protocolo no rodapé da mensagem (opcional)"><Input maxLength={120} placeholder="Ex.: Meta Ads" value={config.protocoloFinal} onChange={(e) => configurar({ protocoloFinal: e.target.value })} /></Rotulo>
              <p className={s.ajuda}>Depois de registrar as respostas, o botão abre o WhatsApp com o nome do formulário, perguntas e respostas organizadas, dados de origem disponíveis e o protocolo no rodapé. A pessoa confere a mensagem e confirma o envio no WhatsApp.</p>
            </> : <Rotulo nome="Link do botão final (HTTPS)"><Input type="url" value={config.linkFinal} onChange={(e) => configurar({ linkFinal: e.target.value })} /></Rotulo>}
            <LinhaSwitch nome="Exibir pontuação ao final" valor={config.mostrarPontuacao} mudar={(v) => configurar({ mostrarPontuacao: v })} />
            <Rotulo nome="Texto do botão de envio"><Input value={config.textoEnvio} onChange={(e) => configurar({ textoEnvio: e.target.value })} /></Rotulo>
          </Bloco>
          <Bloco titulo="Regras de recebimento"><LinhaSwitch nome="Capturar UTMs, GCLID e FBCLID" valor={config.capturarUtm} mudar={(v) => configurar({ capturarUtm: v })} /><Rotulo nome="Impedir repetição pela resposta de"><select value={config.duplicadoPor} onChange={(e) => configurar({ duplicadoPor: e.target.value })}><option value="">Não limitar envios duplicados</option>{entrada.campos.filter((c) => c.tipo !== 'statement').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Rotulo><p className={s.ajuda}>O mesmo valor não poderá gerar uma nova tarefa. Para fechar o link, desative o formulário na listagem.</p></Bloco>
        </div> : aba === 'Rastreamento' ? <div className={s.opcoes}>
          <Bloco titulo="Meta (Facebook e Instagram)"><Rotulo nome="ID do Pixel da Meta"><Input inputMode="numeric" maxLength={20} placeholder="Ex.: 123456789012345" value={config.metaPixelId} onChange={(e) => configurar({ metaPixelId: e.target.value.replace(/\D/g, '') })} /></Rotulo><Rotulo nome="Token da API de Conversões (opcional)"><Input type="password" autoComplete="off" maxLength={600} placeholder="Cole o token gerado no Gerenciador de Eventos" value={config.metaApiToken} onChange={(e) => configurar({ metaApiToken: e.target.value.trim() })} /></Rotulo><Rotulo nome="Código de teste (opcional)"><Input maxLength={40} placeholder="Ex.: TEST12345" value={config.metaCodigoTeste} onChange={(e) => configurar({ metaCodigoTeste: e.target.value.trim() })} /></Rotulo><p className={s.ajuda}>O Pixel registra PageView ao abrir o formulário e Lead a cada envio. Com o token, o mesmo Lead também vai pelo servidor (API de Conversões), com e-mail, telefone e nome criptografados, e a Meta descarta a duplicata. O token fica só no servidor. Use o código de teste para conferir em Gerenciador de Eventos → Testar eventos e apague depois.</p></Bloco>
          <Bloco titulo="Google (Google Ads e Analytics)"><Rotulo nome="ID da tag do Google"><Input maxLength={30} placeholder="Ex.: AW-123456789 ou G-XXXXXXX" value={config.googleTagId} onChange={(e) => configurar({ googleTagId: e.target.value.trim().toUpperCase() })} /></Rotulo><Rotulo nome="Rótulo da conversão do Google Ads (opcional)"><Input maxLength={80} placeholder="Ex.: AbC-D_efG-h12_34" value={config.googleRotuloConversao} onChange={(e) => configurar({ googleRotuloConversao: e.target.value.trim() })} /></Rotulo><p className={s.ajuda}>A tag carrega ao abrir o formulário e registra generate_lead a cada envio. Com o rótulo, cada envio conta como conversão no Google Ads. O rótulo fica no snippet da conversão, depois da barra em send_to.</p></Bloco>
          <p className={s.ajuda}>Nada é disparado na prévia. Publique para valer no link.</p>
        </div> : aba === 'Compartilhar' ? <div className={s.compartilhar}><Bloco titulo="Link público">{url ? <><p className={s.ajuda}>{rascunho ? 'Há um rascunho. O link exibe a última versão publicada.' : 'Compartilhe este endereço para receber respostas sem exigir login.'}</p><Input aria-label="Link público" readOnly value={url} /><div className={s.botoes}><Button onClick={() => copiar(url)}><Copy />Copiar link</Button><Button variant="secondary" asChild><a href={url} target="_blank" rel="noopener noreferrer">Abrir formulário</a></Button></div></> : <p className={s.ajuda}>Salve o formulário e reabra-o na listagem para copiar o link. Publique para liberar os envios.</p>}</Bloco>{url && <Bloco titulo="Incorporar em um site"><p className={s.ajuda}>Cole este código no bloco HTML do seu site.</p><Textarea aria-label="Código de incorporação" readOnly rows={4} value={`<iframe src="${url}" width="100%" height="700" title="Formulário" style="border:0"></iframe>`} /><Button variant="secondary" onClick={() => copiar(`<iframe src="${url}" width="100%" height="700" title="Formulário" style="border:0"></iframe>`)}><Copy />Copiar código</Button></Bloco>}</div> : id ? <Respostas id={id} /> : <div className={s.vazio}><ClipboardList /><h2>Nenhuma resposta ainda</h2><p>Publique seu formulário e compartilhe o link para começar a receber respostas.</p></div>}
      </div>
    </DialogContent>
  </Dialog>
}
const RASTREIO = new Set(['metaPixelId', 'metaApiToken', 'metaCodigoTeste', 'googleTagId', 'googleRotuloConversao'])
function CheckCircleLabel() { return <span aria-hidden>✓</span> }
function Rotulo({ nome, children }: { nome: string; children: ReactNode }) { return <label className={s.campo}><span>{nome}</span>{children}</label> }
function LinhaSwitch({ nome, valor, mudar, desabilitado }: { nome: string; valor: boolean; mudar: (v: boolean) => void; desabilitado?: boolean }) { return <div className={s.interruptor}><span>{nome}</span><Interruptor marcado={valor} aoMudar={mudar} desabilitado={desabilitado} rotulo={nome} /></div> }
function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) { return <section className={s.bloco}><h2>{titulo}</h2>{children}</section> }
function Respostas({ id }: { id: string }) {
  const [pagina, setPagina] = useState(0), [itens, setItens] = useState<RespostaFormulario[]>([]), [total, setTotal] = useState(0), [carregando, setCarregando] = useState(true), [erro, setErro] = useState<string | null>(null), [atualizacao, setAtualizacao] = useState(0)
  useEffect(() => { let ativo = true; respostasFormularioAcao(id, pagina).then((r) => { if (ativo) { setItens(r.itens); setTotal(r.total); setErro(r.erro ?? null); setCarregando(false) } }).catch(() => { if (ativo) { setErro('Não foi possível carregar as respostas.'); setCarregando(false) } }); return () => { ativo = false } }, [id, pagina, atualizacao])
  return <div className={s.respostas}><div className={s.tituloSecao}><div><h2>Respostas</h2><p className={s.ajuda}>{total} envios registrados · as tarefas anteriores a este recurso permanecem nas listas.</p></div><div className={s.botoes}><Button variant="secondary" disabled={carregando} onClick={() => { setCarregando(true); setErro(null); setAtualizacao((v) => v + 1) }}>Atualizar</Button><Button asChild><a href={`/config/formularios/${id}/respostas.csv`}><Download />Exportar CSV</a></Button></div></div>{erro ? <p className={s.erro} role="alert">{erro}</p> : carregando ? <p role="status">Carregando respostas…</p> : !itens.length ? <div className={s.vazio}><ClipboardList /><h3>Nenhuma resposta ainda</h3><p>Compartilhe o formulário para receber os primeiros envios.</p></div> : <>{itens.map((r) => <details className={s.resposta} key={r.id}><summary><strong>{String(r.respostas.title ?? 'Resposta')}</strong><span>{new Date(r.criadaEm).toLocaleString('pt-BR')} · {r.pontuacao} pontos</span></summary><dl>{r.perguntas.filter((c) => r.respostas[c.key] !== undefined).map((c) => <div key={c.key}><dt>{c.label}</dt><dd>{Array.isArray(r.respostas[c.key]) ? (r.respostas[c.key] as string[]).join(', ') : typeof r.respostas[c.key] === 'boolean' ? r.respostas[c.key] ? 'Sim' : 'Não' : String(r.respostas[c.key])}</dd></div>)}</dl>{!!Object.keys(r.origem).length && <p className={s.ajuda}>Origem: {Object.entries(r.origem).map(([k,v]) => `${k}: ${v}`).join(' · ')}</p>}{r.tarefaId && <a href={`/tarefas/${r.tarefaId}`} target="_blank" rel="noopener noreferrer">Abrir tarefa criada</a>}</details>)}<div className={s.paginacao}><Button variant="secondary" disabled={!pagina} onClick={() => { setCarregando(true); setPagina((v) => v - 1) }}>Anterior</Button><span>Página {pagina + 1} de {Math.max(1, Math.ceil(total / 50))}</span><Button variant="secondary" disabled={(pagina + 1) * 50 >= total} onClick={() => { setCarregando(true); setPagina((v) => v + 1) }}>Próxima</Button></div></>}</div>
}
