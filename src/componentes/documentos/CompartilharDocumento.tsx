'use client'

import { Globe, Lock, Share2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { definirAcessoAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { resumoAcesso, type PessoaDocumento, type ResumoDocumento, type Visibilidade } from '@/dominio/documentos'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'

type Cliente = { id: string; nome: string }

const OPCOES: { valor: Visibilidade; titulo: string; dica: string; Icone: typeof Globe }[] = [
  { valor: 'team', titulo: 'Equipe toda', dica: 'Todo mundo da equipe vê e edita', Icone: Globe },
  { valor: 'people', titulo: 'Pessoas escolhidas', dica: 'Só você e quem você marcar', Icone: Users },
  { valor: 'private', titulo: 'Só eu', dica: 'Ninguém mais vê (nem administradores)', Icone: Lock },
]

/** Quem pode ver o documento: equipe toda, pessoas escolhidas ou só o dono; e se o cliente também enxerga (e qual). */
export function CompartilharDocumento({ documento, pessoas, equipe, clientes, euId, podeGerir }: { documento: ResumoDocumento; pessoas: PessoaDocumento[]; equipe: { id: string; nome: string }[]; clientes: Cliente[]; euId: string; podeGerir: boolean }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [visibilidade, setVisibilidade] = useState<Visibilidade>(documento.visibilidade)
  const [escolhidas, setEscolhidas] = useState(() => new Map(pessoas.map((p) => [p.id, p.podeEditar])))
  const [clienteId, setClienteId] = useState(documento.clienteId ?? '')
  const [clienteVe, setClienteVe] = useState(documento.clienteVisivel)
  const [pendente, iniciar] = useTransition()

  const alternar = (id: string) =>
    setEscolhidas((atual) => {
      const novo = new Map(atual)
      if (!novo.delete(id)) novo.set(id, false)
      return novo
    })

  const salvar = () =>
    iniciar(async () => {
      const r = await definirAcessoAcao(documento.id, {
        visibilidade,
        pessoas: [...escolhidas].map(([id, podeEditar]) => ({ id, podeEditar })),
        clienteId: clienteId || null,
        clienteVisivel: !!clienteId && clienteVe,
      })
      if (!avisar(r, true)) return
      setAberto(false)
      router.refresh()
    })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger className={`${botaoFantasma} gap-1.5`}>
        <Share2 className="h-3.5 w-3.5" /> {resumoAcesso(documento, pessoas.length)}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quem pode ver este documento</DialogTitle>
          <DialogDescription>{podeGerir ? 'Só o dono muda isto.' : 'Só o dono do documento pode mudar o acesso.'}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={!podeGerir} className="space-y-4">
          <div className="space-y-1.5">
            {OPCOES.map(({ valor, titulo, dica, Icone }) => (
              <label key={valor} className={`controle flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 ${visibilidade === valor ? 'border-marca bg-marca-fundo' : 'border-borda hover:bg-hover'}`}>
                <input type="radio" name="visibilidade" className="sr-only" checked={visibilidade === valor} onChange={() => setVisibilidade(valor)} />
                <Icone className="h-4 w-4 text-texto-2" />
                <span>
                  <span className="block text-rotulo font-semibold text-texto">{titulo}</span>
                  <span className="block text-legenda text-texto-3">{dica}</span>
                </span>
              </label>
            ))}
          </div>

          {visibilidade === 'people' && (
            <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-borda p-1">
              {equipe.filter((p) => p.id !== euId).map((p) => {
                const marcada = escolhidas.has(p.id)
                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-hover">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-rotulo">
                      <input type="checkbox" checked={marcada} onChange={() => alternar(p.id)} />
                      <span className="truncate">{p.nome}</span>
                    </label>
                    {marcada && (
                      <select value={escolhidas.get(p.id) ? 'editar' : 'ver'} onChange={(e) => setEscolhidas((a) => new Map(a).set(p.id, e.target.value === 'editar'))} className="rounded border border-borda bg-white px-1 py-0.5 text-legenda">
                        <option value="ver">Só ver</option>
                        <option value="editar">Pode editar</option>
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-borda p-3">
            <p className="text-rotulo font-semibold text-texto">Cliente</p>
            <select className={`${campo} h-9`} value={clienteId} onChange={(e) => { setClienteId(e.target.value); if (!e.target.value) setClienteVe(false) }}>
              <option value="">Sem cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <label className={`flex items-center gap-2 text-rotulo ${clienteId ? '' : 'opacity-50'}`}>
              <input type="checkbox" disabled={!clienteId} checked={clienteId !== '' && clienteVe} onChange={(e) => setClienteVe(e.target.checked)} />
              O cliente pode ver este documento (somente leitura, no portal)
            </label>
          </div>
        </fieldset>
        {podeGerir && (
          <div className="flex justify-end gap-2">
            <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
            <button type="button" className={botaoPrimario} disabled={pendente} onClick={salvar}>Salvar acesso</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
