'use client'

import { Copy, KeyRound } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { avisar } from '@/componentes/tarefas/avisar'
import type { EscopoToken } from '@/dominio/api-token'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import type { TokenApi } from '@/servicos/api-tokens'
import { criarTokenAcao, revogarTokenAcao } from './acoes'

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

async function copiar(texto: string) {
  await navigator.clipboard.writeText(texto)
  avisar({ ok: 'Copiado.' }, true)
}

export function GerenciarTokens({ tokens, urlMcp }: { tokens: TokenApi[]; urlMcp: string }) {
  const [nome, setNome] = useState('')
  const [escopo, setEscopo] = useState<EscopoToken>('write')
  const [dias, setDias] = useState(90)
  const [novo, setNovo] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const token = novo ?? '<SEU_TOKEN>'

  const criar = () =>
    iniciar(async () => {
      const r = await criarTokenAcao(nome, escopo, dias)
      if ('erro' in r) return void avisar({ erro: r.erro })
      setNovo(r.token)
      setNome('')
    })
  const revogar = async (t: TokenApi) => {
    if (!(await confirmar({ titulo: `Revogar "${t.nome}"?`, descricao: 'Quem usa este token perde o acesso na hora.', confirmar: 'Revogar', perigo: true }))) return
    iniciar(async () => {
      const r = await revogarTokenAcao(t.id)
      avisar('erro' in r ? { erro: r.erro } : { ok: 'Token revogado.' }, true)
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-corpo text-texto-2">
        Conecte o Claude, o Codex ou outra IA à plataforma pelo MCP. Elas agem com as suas permissões e enxergam as ferramentas da plataforma. Tokens com escopo de leitura não alteram nada.
      </p>

      <section className="space-y-3 rounded-lg border border-borda bg-white p-4">
        <h2 className="font-semibold">Novo token</h2>
        <div className="flex flex-wrap gap-2">
          <input className={`${campo} min-w-52 flex-1`} placeholder="Nome (ex.: Codex no meu Mac)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <select className={`${campo} w-48`} value={escopo} onChange={(e) => setEscopo(e.target.value as EscopoToken)}>
            <option value="write">Leitura e escrita</option>
            <option value="read">Somente leitura</option>
          </select>
          <select className={`${campo} w-36`} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {[30, 90, 180, 365].map((d) => <option key={d} value={d}>{d} dias</option>)}
          </select>
          <button className={botaoPrimario} disabled={pendente || !nome.trim()} onClick={criar}><KeyRound className="h-4 w-4" /> Gerar token</button>
        </div>
        {novo && (
          <div className="space-y-2 rounded-lg border border-aviso bg-aviso-fundo p-3">
            <p className="text-corpo font-medium">Copie agora: este token não será mostrado de novo.</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-white px-2 py-1.5 text-corpo">{novo}</code>
              <button className={botaoSecundario} onClick={() => copiar(novo)}><Copy className="h-4 w-4" /> Copiar</button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Seus tokens</h2>
        {tokens.length === 0 ? (
          <EstadoVazio titulo="Nenhum token ainda" descricao="Gere um token para conectar uma IA." />
        ) : (
          <ul className="divide-y divide-borda rounded-lg border border-borda bg-white">
            {tokens.map((t) => {
              const expirado = new Date(t.expiraEm) <= new Date()
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.nome}</p>
                    <p className="text-corpo text-texto-2">
                      {t.escopo === 'write' ? 'Leitura e escrita' : 'Somente leitura'} · criado em {data(t.criadoEm)} · {t.revogado ? 'revogado' : expirado ? 'expirado' : `vale até ${data(t.expiraEm)}`} · {t.ultimoUso ? `último uso ${data(t.ultimoUso)}` : 'nunca usado'}
                    </p>
                  </div>
                  {!t.revogado && !expirado && <button className={botaoSecundario} disabled={pendente} onClick={() => revogar(t)}>Revogar</button>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-borda bg-white p-4">
        <h2 className="font-semibold">Como conectar</h2>
        <div className="space-y-1">
          <p className="text-corpo font-medium">Claude Code</p>
          <pre className="overflow-x-auto rounded bg-fundo p-2 text-corpo">{`claude mcp add --transport http srv ${urlMcp} --header "Authorization: Bearer ${token}"`}</pre>
        </div>
        <div className="space-y-1">
          <p className="text-corpo font-medium">Codex (arquivo ~/.codex/config.toml)</p>
          <pre className="overflow-x-auto rounded bg-fundo p-2 text-corpo">{`[mcp_servers.srv]\nurl = "${urlMcp}"\nhttp_headers = { Authorization = "Bearer ${token}" }`}</pre>
        </div>
        <p className="text-corpo text-texto-2">Depois de conectar, peça à IA para começar por <code>descrever_plataforma</code>: ela explica a plataforma e lista tudo o que pode fazer.</p>
      </section>
    </div>
  )
}
