'use client'

import { Copy, KeyRound } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { avisar } from '@/componentes/tarefas/avisar'
import type { EscopoToken } from '@/dominio/api-token'
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
    <div>
      <p>
        Conecte o Claude, o Codex ou outra IA à plataforma pelo MCP. Elas agem com as suas permissões e enxergam as ferramentas da plataforma. Tokens com escopo de leitura não alteram nada.
      </p>

      <section>
        <h2>Novo token</h2>
        <div>
          <input placeholder="Nome (ex.: Codex no meu Mac)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <select value={escopo} onChange={(e) => setEscopo(e.target.value as EscopoToken)}>
            <option value="write">Leitura e escrita</option>
            <option value="read">Somente leitura</option>
          </select>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {[30, 90, 180, 365].map((d) => <option key={d} value={d}>{d} dias</option>)}
          </select>
          <button disabled={pendente || !nome.trim()} onClick={criar}><KeyRound /> Gerar token</button>
        </div>
        {novo && (
          <div>
            <p>Copie agora: este token não será mostrado de novo.</p>
            <div>
              <code>{novo}</code>
              <button onClick={() => copiar(novo)}><Copy /> Copiar</button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2>Seus tokens</h2>
        {tokens.length === 0 ? (
          <EstadoVazio titulo="Nenhum token ainda" descricao="Gere um token para conectar uma IA." />
        ) : (
          <ul>
            {tokens.map((t) => {
              const expirado = new Date(t.expiraEm) <= new Date()
              return (
                <li key={t.id}>
                  <div>
                    <p>{t.nome}</p>
                    <p>
                      {t.escopo === 'write' ? 'Leitura e escrita' : 'Somente leitura'} · criado em {data(t.criadoEm)} · {t.revogado ? 'revogado' : expirado ? 'expirado' : `vale até ${data(t.expiraEm)}`} · {t.ultimoUso ? `último uso ${data(t.ultimoUso)}` : 'nunca usado'}
                    </p>
                  </div>
                  {!t.revogado && !expirado && <button disabled={pendente} onClick={() => revogar(t)}>Revogar</button>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Como conectar</h2>
        <div>
          <p>Claude Code</p>
          <pre>{`claude mcp add --transport http srv ${urlMcp} --header "Authorization: Bearer ${token}"`}</pre>
        </div>
        <div>
          <p>Codex (arquivo ~/.codex/config.toml)</p>
          <pre>{`[mcp_servers.srv]\nurl = "${urlMcp}"\nhttp_headers = { Authorization = "Bearer ${token}" }`}</pre>
        </div>
        <p>Depois de conectar, peça à IA para começar por <code>descrever_plataforma</code>: ela explica a plataforma e lista tudo o que pode fazer.</p>
      </section>
    </div>
  )
}
