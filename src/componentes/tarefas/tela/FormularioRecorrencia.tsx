'use client'

import { useId, useMemo, useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Input } from '@/componentes/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import {
  DIAS_DA_SEMANA,
  REGRA_PADRAO,
  dataCurtaBr,
  descreverPosicaoMensal,
  proximasDatas,
  validarRecorrencia,
  type Frequencia,
  type ModoCriacao,
  type ModoMensal,
  type RegraRecorrencia,
} from '@/dominio/recorrencia'

type Tipo = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'
type Fim = 'nunca' | 'data' | 'vezes'

const ROTULOS_TIPO: Record<Tipo, string> = { daily: 'Diária', weekdays: 'Dias úteis', weekly: 'Semanal', monthly: 'Mensal', custom: 'Personalizada' }

/** Qual opção do Select representa uma regra salva (mensal "a cada 2 meses" só existe na Personalizada). */
function tipoDaRegra(r: Pick<RegraRecorrencia, 'frequencia' | 'cada'>): Tipo {
  if (r.frequencia === 'monthly' && r.cada !== 1) return 'custom'
  return r.frequencia
}

function diaDaSemanaDe(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

/**
 * Formulário "Repetir": o mesmo conteúdo no Popover (desktop) e no Sheet de baixo (celular).
 * `inicial` é a regra salva (ou `null` para uma série nova); `geradas` conta as cópias já criadas.
 */
export function FormularioRecorrencia({
  inicial,
  geradas,
  prazoDaTarefa,
  hoje,
  salvando,
  erro,
  aoSalvar,
  aoCancelar,
  celular,
}: {
  inicial: RegraRecorrencia | null
  geradas: number
  prazoDaTarefa: string | null
  hoje: string
  salvando: boolean
  erro: string | null
  aoSalvar: (regra: RegraRecorrencia) => void
  aoCancelar: () => void
  celular: boolean
}) {
  const id = useId()
  const semPrazo = !inicial && !prazoDaTarefa
  const [tipo, setTipo] = useState<Tipo>(inicial ? tipoDaRegra(inicial) : 'weekly')
  const [inicio, setInicio] = useState(inicial?.primeiroPrazo ?? prazoDaTarefa ?? hoje)
  const [cada, setCada] = useState(String(inicial?.cada ?? 1))
  const [unidade, setUnidade] = useState<Exclude<Frequencia, 'weekdays'>>(inicial && tipoDaRegra(inicial) === 'custom' ? (inicial.frequencia as 'monthly') : 'daily')
  const [dias, setDias] = useState<number[]>(inicial?.diasSemana ?? [diaDaSemanaDe(inicial?.primeiroPrazo ?? prazoDaTarefa ?? hoje)])
  const [modoMensal, setModoMensal] = useState<ModoMensal>(inicial?.modoMensal ?? 'day')
  const [fim, setFim] = useState<Fim>(inicial?.terminaEm ? 'data' : inicial?.maximo ? 'vezes' : 'nunca')
  const [fimData, setFimData] = useState(inicial?.terminaEm ?? '')
  const [fimVezes, setFimVezes] = useState(String(inicial?.maximo ?? 10))
  const [modoCriacao, setModoCriacao] = useState<ModoCriacao>(inicial?.modoCriacao ?? 'schedule')
  const [antecedencia, setAntecedencia] = useState(String(inicial?.antecedencia ?? 0))
  const [copiarResponsaveis, setCopiarResponsaveis] = useState(inicial?.copiarResponsaveis ?? true)
  const [copiarSubtarefas, setCopiarSubtarefas] = useState(inicial?.copiarSubtarefas ?? true)
  const [copiarCampos, setCopiarCampos] = useState(inicial?.copiarCampos ?? true)
  // Depois da primeira cópia a data de início não muda (o servidor mantém a âncora).
  const inicioTravado = !!inicial && geradas > 0

  const frequencia: Frequencia = tipo === 'custom' ? unidade : tipo
  const cadaNumero = tipo === 'weekdays' ? 1 : tipo === 'monthly' ? 1 : Number(cada)
  const regra: RegraRecorrencia = {
    ...REGRA_PADRAO,
    frequencia,
    cada: cadaNumero,
    antecedencia: modoCriacao === 'schedule' ? Number(antecedencia) : 0,
    ativa: inicial?.ativa ?? true,
    primeiroPrazo: inicio,
    diasSemana: frequencia === 'weekly' ? (tipo === 'custom' ? [diaDaSemanaDe(inicio)] : dias) : null,
    modoMensal: frequencia === 'monthly' && tipo === 'monthly' ? modoMensal : 'day',
    terminaEm: fim === 'data' ? fimData || null : null,
    maximo: fim === 'vezes' ? Number(fimVezes) : null,
    modoCriacao,
    copiarResponsaveis,
    copiarSubtarefas,
    copiarCampos,
  }
  const mensagem = fim === 'data' && !fimData ? 'Informe a data de fim.' : validarRecorrencia(regra)
  // Cada campo mostra a mensagem que lhe cabe (aria-invalid + aria-describedby).
  const erroCada = mensagem === 'Use um número de 1 a 365.' ? mensagem : null
  const erroDias = mensagem === 'Escolha pelo menos um dia.' ? mensagem : null
  const erroFim = mensagem && !erroCada && !erroDias && fim !== 'nunca' && /fim|vezes/.test(mensagem) ? mensagem : null
  const erroGeral = mensagem && !erroCada && !erroDias && !erroFim ? mensagem : null

  const proximas = useMemo(() => {
    if (mensagem) return []
    return proximasDatas({ ...regra, geradas: inicioTravado ? geradas : 0 }, 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagem, tipo, inicio, cada, unidade, dias, modoMensal, fim, fimData, fimVezes, geradas, inicioTravado])

  const alternarDia = (n: number) => setDias((atual) => (atual.includes(n) ? atual.filter((d) => d !== n) : [...atual, n].sort((a, b) => a - b)))
  const altura = celular ? 'h-11' : 'h-8'
  const rotulo = 'text-rotulo text-texto-2'
  const grupo = 'space-y-1.5 border-0 p-0'

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!mensagem) aoSalvar(regra)
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-tipo`} className={rotulo}>Frequência</label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)} disabled={salvando}>
          <SelectTrigger id={`${id}-tipo`} autoFocus className={`${altura} w-full`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROTULOS_TIPO) as Tipo[]).map((t) => <SelectItem key={t} value={t}>{ROTULOS_TIPO[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {tipo === 'weekly' && (
        <fieldset className={grupo} disabled={salvando}>
          <legend className={rotulo}>Nos dias</legend>
          <div className="flex flex-wrap gap-1.5" role="group" aria-describedby={erroDias ? `${id}-erro-dias` : undefined}>
            {DIAS_DA_SEMANA.map((d) => {
              const marcado = dias.includes(d.numero)
              return (
                <button
                  key={d.numero}
                  type="button"
                  aria-pressed={marcado}
                  aria-label={d.longo}
                  onClick={() => alternarDia(d.numero)}
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-corpo font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:h-8 md:w-8 ${marcado ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'border border-borda text-texto-2 hover:bg-hover'}`}
                >
                  <span aria-hidden="true">{d.letra}</span>
                </button>
              )
            })}
          </div>
          {erroDias && <p id={`${id}-erro-dias`} className="text-rotulo text-perigo-forte">{erroDias}</p>}
        </fieldset>
      )}

      {(tipo === 'daily' || tipo === 'weekly' || tipo === 'custom') && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-cada`} className={rotulo}>A cada</label>
          <div className="flex items-center gap-2">
            <Input
              id={`${id}-cada`}
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              value={cada}
              disabled={salvando}
              aria-invalid={!!erroCada}
              aria-describedby={erroCada ? `${id}-erro-cada` : undefined}
              onChange={(e) => setCada(e.target.value)}
              className={`${altura} w-20`}
            />
            {tipo === 'custom' ? (
              <Select value={unidade} onValueChange={(v) => setUnidade(v as typeof unidade)} disabled={salvando}>
                <SelectTrigger aria-label="Unidade" className={`${altura} w-32`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">dia(s)</SelectItem>
                  <SelectItem value="weekly">semana(s)</SelectItem>
                  <SelectItem value="monthly">mês(es)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-corpo text-texto">{tipo === 'daily' ? 'dia(s)' : 'semana(s)'}</span>
            )}
          </div>
          {erroCada && <p id={`${id}-erro-cada`} className="text-rotulo text-perigo-forte">{erroCada}</p>}
        </div>
      )}

      {tipo === 'monthly' && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-mensal`} className={rotulo}>Repetir</label>
          <Select value={modoMensal} onValueChange={(v) => setModoMensal(v as ModoMensal)} disabled={salvando}>
            <SelectTrigger id={`${id}-mensal`} className={`${altura} w-full`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">No dia {Number(inicio.slice(8))} do mês</SelectItem>
              <SelectItem value="weekday_position">{descreverPosicaoMensal(inicio).replace(/^./, (c) => c.toUpperCase())}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-inicio`} className={rotulo}>Começa em</label>
        <Input id={`${id}-inicio`} type="date" value={inicio} disabled={salvando || inicioTravado} onChange={(e) => setInicio(e.target.value)} className={`${altura} w-44`} />
        {semPrazo && <p className="text-rotulo text-texto-2">A tarefa ainda não tem vencimento; usaremos esta data.</p>}
        {inicioTravado && <p className="text-rotulo text-texto-2">O início não muda depois que a primeira tarefa foi criada.</p>}
      </div>

      <fieldset className={grupo} disabled={salvando}>
        <legend className={rotulo}>Termina</legend>
        <label className="flex min-h-8 items-center gap-2 text-corpo text-texto"><input type="radio" name={`${id}-fim`} checked={fim === 'nunca'} onChange={() => setFim('nunca')} /> Nunca</label>
        <label className="flex min-h-8 items-center gap-2 text-corpo text-texto">
          <input type="radio" name={`${id}-fim`} checked={fim === 'data'} onChange={() => setFim('data')} /> Em
          <Input type="date" aria-label="Data de fim" value={fimData} disabled={fim !== 'data' || salvando} aria-invalid={fim === 'data' && !!erroFim} aria-describedby={erroFim ? `${id}-erro-fim` : undefined} onChange={(e) => setFimData(e.target.value)} className={`${altura} w-40`} />
        </label>
        <label className="flex min-h-8 items-center gap-2 text-corpo text-texto">
          <input type="radio" name={`${id}-fim`} checked={fim === 'vezes'} onChange={() => setFim('vezes')} /> Depois de
          <Input type="number" min={1} max={1000} aria-label="Número de vezes" value={fimVezes} disabled={fim !== 'vezes' || salvando} aria-invalid={fim === 'vezes' && !!erroFim} aria-describedby={erroFim ? `${id}-erro-fim` : undefined} onChange={(e) => setFimVezes(e.target.value)} className={`${altura} w-20`} /> vezes
        </label>
        {erroFim && <p id={`${id}-erro-fim`} className="text-rotulo text-perigo-forte">{erroFim}</p>}
      </fieldset>

      <fieldset className={grupo} disabled={salvando}>
        <legend className={rotulo}>Criar a próxima</legend>
        <label className="flex min-h-8 items-center gap-2 text-corpo text-texto"><input type="radio" name={`${id}-modo`} checked={modoCriacao === 'schedule'} onChange={() => setModoCriacao('schedule')} /> Na data programada</label>
        {modoCriacao === 'schedule' && (
          <div className="ml-6 flex items-center gap-2 text-corpo text-texto">
            <Input type="number" min={0} max={60} aria-label="Dias de antecedência" value={antecedencia} disabled={salvando} onChange={(e) => setAntecedencia(e.target.value)} className={`${altura} w-16`} />
            dias antes do vencimento
          </div>
        )}
        <label className="flex min-h-8 items-center gap-2 text-corpo text-texto"><input type="radio" name={`${id}-modo`} checked={modoCriacao === 'on_complete'} onChange={() => setModoCriacao('on_complete')} /> Quando esta for concluída</label>
      </fieldset>

      <fieldset className={grupo} disabled={salvando}>
        <legend className={rotulo}>Copiar para a próxima</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            { rotulo: 'Responsáveis', valor: copiarResponsaveis, definir: setCopiarResponsaveis },
            { rotulo: 'Subtarefas', valor: copiarSubtarefas, definir: setCopiarSubtarefas },
            { rotulo: 'Etiquetas e campos', valor: copiarCampos, definir: setCopiarCampos },
          ].map((o) => (
            <label key={o.rotulo} className="flex min-h-8 items-center gap-2 text-corpo text-texto">
              <Checkbox checked={o.valor} onCheckedChange={(v) => o.definir(v === true)} /> {o.rotulo}
            </label>
          ))}
        </div>
        {!copiarResponsaveis && <p className="text-rotulo text-texto-2">Toda tarefa precisa de um responsável: a próxima fica só com o primeiro.</p>}
      </fieldset>

      <p aria-live="polite" className="border-t border-borda pt-3 text-rotulo text-texto-2">
        {proximas.length ? `Próximas: ${proximas.map((d) => dataCurtaBr(d)).join(' · ')}` : erroGeral ?? 'Nenhuma data prevista.'}
      </p>
      {inicial && <p className="text-rotulo text-texto-2">Vale para as próximas. As tarefas já criadas não mudam.</p>}
      {erro && <p role="alert" className="text-rotulo text-perigo-forte">{erro}</p>}

      <div className={`flex justify-end gap-2 ${celular ? 'sticky bottom-0 border-t border-borda bg-white p-3' : ''}`}>
        <Button type="button" variant="ghost" size={celular ? 'lg' : 'sm'} onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
        <Button type="submit" size={celular ? 'lg' : 'sm'} disabled={salvando || !!mensagem}>{salvando ? 'Salvando…' : 'Salvar'}</Button>
      </div>
    </form>
  )
}
