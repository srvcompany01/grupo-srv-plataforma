/** "Aurum Belém" → "aurum-belem". Sem acento, só letras, números e hífen. */
function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function nomeZip(cliente: string, dataPrevista: string): string {
  return `${slug(cliente) || 'post'}-${dataPrevista}.zip`
}

/** Nomes dos arquivos dentro do zip, numerados na ordem do carrossel. */
export function nomesNoZip(originais: string[]): string[] {
  return originais.map((original, i) => {
    const base = original.split(/[\\/]/).pop() ?? ''
    const ponto = base.lastIndexOf('.')
    const nome = slug(ponto > 0 ? base.slice(0, ponto) : base) || 'imagem'
    const ext = ponto > 0 ? base.slice(ponto + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
    return `${String(i + 1).padStart(2, '0')}-${nome}${ext ? `.${ext}` : ''}`
  })
}
