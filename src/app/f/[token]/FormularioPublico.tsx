'use client'

import { ArrowDown, ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import { useId, useState, useTransition, type CSSProperties } from 'react'
import { configuracaoFormulario, perguntasVisiveis, pontuacaoFormulario, validarResposta, type CampoFormulario, type RespostasFormulario, type ValorResposta } from '@/dominio/formularios'
import type { FormularioPublico as Dados, CampoPublico } from '@/servicos/formularios'
import { enviarFormularioAcao } from './acoes'
import s from './formulario-publico.module.css'

export function FormularioPublico({ token, formulario, previa = false }: { token: string; formulario: Dados; previa?: boolean }) {
  const config = configuracaoFormulario(formulario.configuracao)
  const [respostas, setRespostas] = useState<RespostasFormulario>({})
  const [indice, setIndice] = useState(0)
  const [comecou, setComecou] = useState(!config.boasVindas)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()
  const campos = perguntasVisiveis(formulario.campos, respostas) as CampoPublico[]
  const posicao = Math.min(indice, Math.max(0, campos.length - 1))
  const atual = campos[posicao]
  const conversa = config.modo === 'conversa'
  const ultimo = posicao === campos.length - 1
  const progresso = enviado ? 100 : !comecou ? 0 : Math.round((posicao / Math.max(1, campos.length)) * 100)
  const estilo = {
    '--form-botao': config.corBotao, '--form-texto': config.corTexto, '--form-resposta': config.corResposta, '--form-fundo': config.corFundo,
    '--form-em-botao': (parseInt(config.corBotao.slice(1,3),16)*.299+parseInt(config.corBotao.slice(3,5),16)*.587+parseInt(config.corBotao.slice(5,7),16)*.114)>150?'#111113':'#ffffff', '--form-raio': `${config.bordas}px`, fontFamily: config.fonte === 'serif' ? 'Georgia, serif' : config.fonte === 'mono' ? 'var(--font-mono)' : 'var(--font-ui)',
    backgroundImage: config.imagemFundo ? `url(${JSON.stringify(config.imagemFundo)})` : undefined,
  } as CSSProperties
  const mudar = (key: string, valor: ValorResposta) => { setRespostas((a) => ({ ...a, [key]: valor })); setErro(null) }
  const avancar = () => {
    const falha = validarResposta(atual, respostas[atual.key])
    if (falha) { setErro(falha); return }
    setErro(null); setIndice(posicao + 1)
  }
  const enviar = (armadilha: string) => iniciar(async () => {
    const invalidos = campos.map((c) => ({ c, erro: validarResposta(c, respostas[c.key]) })).find((r) => r.erro)
    if (invalidos) { setErro(invalidos.erro); setIndice(campos.indexOf(invalidos.c)); return }
    if (previa) { setEnviado(true); return }
    const form = new FormData()
    for (const c of campos) {
      if (c.tipo === 'statement') continue
      const valor = respostas[c.key]
      if (valor === undefined || valor === '') continue
      if (Array.isArray(valor)) valor.forEach((v) => form.append(c.key, v))
      else form.set(c.key, typeof valor === 'boolean' ? valor ? 'on' : 'off' : String(valor))
    }
    form.set('website', armadilha)
    if (config.capturarUtm) {
      const parametros = new URLSearchParams(window.location.search)
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']) {
        const valor = parametros.get(k); if (valor) form.set(`__${k}`, valor.slice(0, 500))
      }
    }
    setErro(null)
    try { const r = await enviarFormularioAcao(token, form); if ('erro' in r) setErro(r.erro); else setEnviado(true) }
    catch { setErro('Não foi possível enviar agora. Suas respostas foram mantidas; tente de novo.') }
  })
  return (
    <section aria-label={formulario.nome} className={s.pagina} data-modo={config.modo} data-previa={previa} style={estilo}>
      {previa && <div className={s.avisoPrevia}>Prévia · nenhum dado será enviado</div>}
      {conversa && <div className={s.progresso} role="progressbar" aria-label="Progresso do formulário" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso}><span style={{ width: `${progresso}%` }} /></div>}
      {config.logo && <div className={s.logo}><Image unoptimized width={150} height={64} src={config.logo} alt="Logotipo" referrerPolicy="no-referrer" /></div>}
      <div className={s.cartao}>
        {enviado ? <div className={s.sucesso} role="status"><CheckCircle2 aria-hidden /><h1>{config.tituloFinal}</h1><p>{config.textoFinal}</p>{config.mostrarPontuacao && <p className={s.pontuacao}>Sua pontuação: <strong>{pontuacaoFormulario(formulario.campos, respostas)}</strong></p>}{config.linkFinal && config.botaoFinal && <a className={s.botao} href={config.linkFinal} rel="noopener noreferrer">{config.botaoFinal}<ArrowRight aria-hidden /></a>}</div> : !comecou ? <section className={s.boasVindas}><h1>{config.tituloBoasVindas || formulario.nome}</h1><p>{config.textoBoasVindas || formulario.descricao}</p><button className={s.botao} type="button" onClick={() => setComecou(true)}>{config.botaoInicio}<ArrowRight aria-hidden /></button></section> : <>
          {!conversa && <header className={s.cabecalho}><h1>{formulario.nome}</h1>{formulario.descricao && <p>{formulario.descricao}</p>}</header>}
          <form className={s.formulario} aria-busy={pendente} onSubmit={(e) => { e.preventDefault(); if (conversa && !ultimo) avancar(); else enviar(String(new FormData(e.currentTarget).get('website') ?? '')) }}>
            {!conversa && <p className={s.instrucao}>Os campos com asterisco são obrigatórios.</p>}
            <fieldset className={s.campos} disabled={pendente}>
              <legend className={s.oculto}>Dados do formulário</legend>
              {(conversa ? atual ? [atual] : [] : campos).map((c) => <CampoPergunta key={c.key} campo={c} valor={respostas[c.key]} aoMudar={(v) => mudar(c.key, v)} numero={conversa ? posicao + 1 : undefined} />)}
            </fieldset>
            <input className={s.oculto} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {erro && <p className={s.erro} role="alert">{erro}</p>}
            <div className={s.rodape}>
              {conversa && posicao > 0 && <button className={s.voltar} type="button" disabled={pendente} onClick={() => { setErro(null); setIndice(posicao - 1) }}><ArrowLeft aria-hidden /> Voltar</button>}
              <button className={s.botao} type="submit" disabled={pendente}>
                {pendente ? <LoaderCircle className={s.carregando} aria-hidden /> : conversa && !ultimo ? <ArrowDown aria-hidden /> : <Check aria-hidden />}
                {pendente ? 'Enviando…' : conversa && !ultimo ? atual?.tipo === 'statement' ? 'Continuar' : 'Avançar' : config.textoEnvio}
              </button>
              {conversa && <span className={s.contador}>{posicao + 1} de {campos.length}</span>}
            </div>
          </form>
        </>}
      </div>
    </section>
  )
}

export function CampoPergunta({ campo: c, valor, aoMudar, numero }: { campo: CampoFormulario; valor?: ValorResposta; aoMudar: (v: ValorResposta) => void; numero?: number }) {
  const id = useId()
  const tipo = c.tipo ?? (c.key === 'description' ? 'long_text' : 'text')
  const longo = ['long_text', 'address', 'statement'].includes(tipo)
  const opcoes = c.opcoes ?? []
  const valores = Array.isArray(valor) ? valor : valor === undefined ? [] : [String(valor)]
  return <div className={s.campo} data-largo={longo || c.key === 'title'}>
    <label htmlFor={id} className={s.pergunta}>{numero && <span className={s.numero}>{numero} <ArrowRight aria-hidden /></span>}{c.label}{c.required && <span className={s.asterisco} aria-hidden> *</span>}</label>
    {c.descricao && <p id={`${id}-ajuda`} className={s.descricao}>{c.descricao}</p>}
    {c.imagem && <div className={s.midia}><Image unoptimized width={800} height={400} src={c.imagem} alt="Imagem da pergunta" referrerPolicy="no-referrer" /></div>}
    {tipo === 'statement' ? null : tipo === 'multiple_choice' ? <div className={s.escolhas} role="group" aria-label={c.label}>{opcoes.map((o, i) => <label key={o} className={s.opcao} data-marcada={valores.includes(o)}><input type={c.multipla ? 'checkbox' : 'radio'} name={c.key} value={o} checked={valores.includes(o)} onChange={(e) => aoMudar(c.multipla ? e.target.checked ? [...valores, o] : valores.filter((v) => v !== o) : o)} /><span className={s.letra}>{String.fromCharCode(65 + i)}</span><span>{o}</span>{valores.includes(o) && <Check aria-hidden />}</label>)}</div> : tipo === 'rating' ? <div className={s.escala} role="group" aria-label={c.label}>{Array.from({ length: Math.min(10, Math.max(2, c.maximo ?? 5)) }, (_, i) => i + 1).map((n) => <button key={n} className={s.nota} aria-pressed={valor === n} type="button" onClick={() => aoMudar(n)}>{n}</button>)}</div> : tipo === 'checkbox' ? <div className={s.escolhas} role="group" aria-label={c.label}>{[true, false].map((v) => <label key={String(v)} className={s.opcao} data-marcada={valor === v}><input type="radio" name={c.key} checked={valor === v} onChange={() => aoMudar(v)} />{v ? 'Sim' : 'Não'}</label>)}</div> : tipo === 'terms' ? <label className={s.termos}><input id={id} type="checkbox" checked={valor === true} onChange={(e) => aoMudar(e.target.checked)} />Li e concordo com os termos apresentados.</label> : tipo === 'dropdown' ? <select id={id} aria-describedby={c.descricao ? `${id}-ajuda` : undefined} required={c.required} value={String(valor ?? '')} onChange={(e) => aoMudar(e.target.value)}><option value="" disabled={c.required}>{c.placeholder || 'Selecione uma opção'}</option>{opcoes.map((o) => <option key={o} value={o}>{o}</option>)}</select> : longo ? <textarea id={id} name={c.key} aria-describedby={c.descricao ? `${id}-ajuda` : undefined} rows={4} required={c.required} maxLength={c.limite ?? 20000} value={String(valor ?? '')} placeholder={c.placeholder || 'Escreva sua resposta…'} onChange={(e) => aoMudar(e.target.value)} /> : <input id={id} name={c.key} aria-describedby={c.descricao ? `${id}-ajuda` : undefined} required={c.required} maxLength={c.key === 'title' ? 200 : c.limite ?? 20000} min={c.minimo} max={c.maximo} step={tipo === 'number' || tipo === 'money' ? 'any' : undefined} type={tipo === 'email' ? 'email' : tipo === 'phone' ? 'tel' : tipo === 'date' ? 'date' : tipo === 'site' ? 'url' : tipo === 'number' || tipo === 'money' ? 'number' : 'text'} autoComplete={tipo === 'name' ? 'name' : tipo === 'email' ? 'email' : tipo === 'phone' ? 'tel' : undefined} value={String(valor ?? '')} placeholder={c.placeholder || (tipo === 'date' ? undefined : 'Sua resposta…')} onChange={(e) => aoMudar((tipo === 'number' || tipo === 'money') && e.target.value !== '' ? Number(e.target.value) : e.target.value)} />}
  </div>
}
