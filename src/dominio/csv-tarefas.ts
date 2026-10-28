/** CSV simples (vírgula ou ponto e vírgula, aspas opcionais). Coluna 1 = título; coluna 2 = vencimento (AAAA-MM-DD ou DD/MM/AAAA). Ignora o cabeçalho "titulo/título/nome". */
export function lerCsvDeTarefas(texto: string): { titulo: string; prazo: string | null }[] {
  const celulas = (linha: string) => [...linha.matchAll(/("([^"]*)"|[^,;]*)(?:[,;]|$)/g)].map((m) => (m[2] ?? m[1] ?? '').trim()).slice(0, 2)
  return texto
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l, i) => {
      const [titulo = '', data = ''] = celulas(l)
      const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data)
      return { i, titulo, prazo: br ? `${br[3]}-${br[2]}-${br[1]}` : data || null }
    })
    .filter((l) => !(l.i === 0 && /^(t[ií]tulo|nome|tarefa)$/i.test(l.titulo)))
    .map(({ titulo, prazo }) => ({ titulo, prazo }))
}
