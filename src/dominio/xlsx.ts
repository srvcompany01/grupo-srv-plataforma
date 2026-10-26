import { strToU8, zipSync } from 'fflate'

/**
 * Planilha .xlsx mínima (sem biblioteca): abas com texto, números e formatos (R$, inteiro, decimal, %).
 * Texto vai inline; a primeira linha de cada aba sai em negrito (cabeçalho).
 */
export type Formato = 'moeda' | 'inteiro' | 'decimal' | 'pct'
export type Celula = string | number | null | { v: string | number | null; f?: Formato }
export type AbaPlanilha = { nome: string; linhas: Celula[][]; larguras?: number[] }

// índice em cellXfs: 0 normal, 1 negrito, 2 R$, 3 inteiro, 4 decimal, 5 %
const ESTILO: Record<Formato, number> = { moeda: 2, inteiro: 3, decimal: 4, pct: 5 }

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')

/** A, B, … Z, AA… */
export function coluna(i: number): string {
  let n = i + 1
  let r = ''
  while (n > 0) {
    r = String.fromCharCode(65 + ((n - 1) % 26)) + r
    n = Math.floor((n - 1) / 26)
  }
  return r
}

/** Nome de aba válido no Excel: até 31 caracteres, sem []:*?/\ e único. */
export function nomeDeAba(nome: string, usados: Set<string>): string {
  const base = nome.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Aba'
  let n = base
  for (let i = 2; usados.has(n.toLowerCase()); i++) n = `${base.slice(0, 28)} ${i}`
  usados.add(n.toLowerCase())
  return n
}

function xmlDaAba(a: AbaPlanilha): string {
  const largura = a.larguras ?? a.linhas.reduce<number[]>((m, l) => {
    l.forEach((c, i) => {
      const v = c !== null && typeof c === 'object' ? c.v : c
      m[i] = Math.max(m[i] ?? 8, Math.min(60, String(v ?? '').length + 2))
    })
    return m
  }, [])
  const cols = largura.length ? `<cols>${largura.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : ''
  const linhas = a.linhas.map((l, r) => {
    const celulas = l.map((c, i) => {
      const ref = `${coluna(i)}${r + 1}`
      const v = c !== null && typeof c === 'object' ? c.v : c
      if (v === null || v === undefined || v === '') return ''
      if (typeof v === 'number' && Number.isFinite(v)) {
        const f = c !== null && typeof c === 'object' && c.f ? ESTILO[c.f] : 0
        return `<c r="${ref}"${f ? ` s="${f}"` : ''}><v>${v}</v></c>`
      }
      return `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`
    }).join('')
    return `<row r="${r + 1}">${celulas}</row>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${linhas}</sheetData></worksheet>`
}

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="0.0&quot;%&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

export function gerarXlsx(abas: AbaPlanilha[]): Uint8Array {
  const usados = new Set<string>()
  const nomes = abas.map((a) => nomeDeAba(a.nome, usados))
  const arquivos: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${nomes.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(ESTILOS),
  }
  abas.forEach((a, i) => { arquivos[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(xmlDaAba(a)) })
  return zipSync(arquivos)
}
