'use client'

import { ExternalLink, FileText, MessageCircle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { gerarRelatorioAcao } from '@/app/(app)/clientes/acoes-relatorio'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'

const dia = (d: Date) => d.toISOString().slice(0, 10)
const menos = (hoje: string, n: number) => dia(new Date(Date.parse(`${hoje}T12:00:00Z`) - n * 86_400_000))

/** Períodos prontos (até ontem, como os relatórios de anúncios) ou personalizado. */
function periodo(tipo: string, hoje: string): { de: string; ate: string } {
  const [a, m] = hoje.split('-').map(Number)
  if (tipo === '7') return { de: menos(hoje, 7), ate: menos(hoje, 1) }
  if (tipo === '30') return { de: menos(hoje, 30), ate: menos(hoje, 1) }
  if (tipo === 'mes-passado') return { de: dia(new Date(Date.UTC(a, m - 2, 1))), ate: dia(new Date(Date.UTC(a, m - 1, 0))) }
  const inicio = `${hoje.slice(0, 7)}-01`
  return { de: inicio, ate: menos(hoje, 1) < inicio ? hoje : menos(hoje, 1) }
}

/** Gera o relatório do cliente e entrega o link, o texto e o botão do WhatsApp (com o número do cadastro). */
export function EnviarRelatorio({ clienteId, hoje }: { clienteId: string; hoje: string; temWhatsapp?: boolean }) {
  const [tipo, setTipo] = useState('30')
  const [de, setDe] = useState(menos(hoje, 30))
  const [ate, setAte] = useState(menos(hoje, 1))
  const [investimento, setInvestimento] = useState(true)
  const [pronto, setPronto] = useState<{ url: string; texto: string; whatsapp: string | null; whatsappTelefone: string | null; avisos: string[] } | null>(null)
  const [pendente, iniciar] = useTransition()
  const escolher = (t: string) => {
    setTipo(t)
    if (t !== 'personalizado') {
      const p = periodo(t, hoje)
      setDe(p.de)
      setAte(p.ate)
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="block space-y-1">
          <span className={rotulo}>Período</span>
          <select className={`${campo} w-44`} value={tipo} onChange={(e) => escolher(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="este-mes">Este mês</option>
            <option value="mes-passado">Mês passado</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
        {tipo === 'personalizado' && (
          <>
            <label className="block space-y-1"><span className={rotulo}>De</span><input type="date" className={`${campo} w-40`} value={de} max={ate} onChange={(e) => setDe(e.target.value)} /></label>
            <label className="block space-y-1"><span className={rotulo}>Até</span><input type="date" className={`${campo} w-40`} value={ate} min={de} max={hoje} onChange={(e) => setAte(e.target.value)} /></label>
          </>
        )}
        <label className="flex items-center gap-2 pb-2 text-rotulo"><input type="checkbox" checked={investimento} onChange={(e) => setInvestimento(e.target.checked)} /> Mostrar investimento</label>
        <button type="button" disabled={pendente} onClick={() => iniciar(async () => {
          const r = await gerarRelatorioAcao(clienteId, de, ate, investimento)
          if ('erro' in r) avisar(r)
          else setPronto(r)
        })} className={botaoPrimario}><FileText className="h-4 w-4" /> {pendente ? 'Gerando…' : 'Gerar relatório'}</button>
      </div>
      {pronto && (
        <div className="space-y-2 rounded-xl border border-sucesso/30 bg-sucesso-fundo/40 p-3">
          <div className="flex flex-wrap gap-2">
            {pronto.whatsapp && <a href={pronto.whatsapp} target="_blank" rel="noreferrer" className={botaoPrimario}><MessageCircle className="h-4 w-4" /> Enviar no WhatsApp do cliente</a>}
            {!pronto.whatsapp && pronto.whatsappTelefone && <a href={pronto.whatsappTelefone} target="_blank" rel="noreferrer" className={botaoSecundario}><MessageCircle className="h-4 w-4" /> Enviar para o telefone do cadastro</a>}
            {!pronto.whatsapp && <a href={`https://wa.me/?text=${encodeURIComponent(pronto.texto)}`} target="_blank" rel="noreferrer" className={botaoSecundario}><MessageCircle className="h-4 w-4" /> Abrir WhatsApp e escolher o contato</a>}
            <a href={pronto.url} target="_blank" rel="noreferrer" className={botaoSecundario}><ExternalLink className="h-4 w-4" /> Ver relatório</a>
            <CopiarTexto texto={pronto.texto} rotulo="Copiar texto" />
          </div>
          {pronto.avisos.length > 0 && (
            <div className="space-y-1 rounded-lg border border-aviso/40 bg-aviso-fundo/50 p-2">
              <p className="text-legenda font-semibold text-aviso-forte">Só para a equipe (o cliente não vê):</p>
              <ul className="list-disc space-y-0.5 pl-5 text-legenda text-texto-2">{pronto.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-2 font-sans text-legenda text-texto-2">{pronto.texto}</pre>
        </div>
      )}
    </div>
  )
}
