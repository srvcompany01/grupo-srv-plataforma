/** Bytes ↔ base64 (navegador e servidor): é como as alterações do editor viajam e ficam no banco. */
export function paraBase64(bytes: Uint8Array): string {
  let texto = ''
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(texto)
}

export function deBase64(texto: string): Uint8Array {
  const bruto = atob(texto)
  const bytes = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)
  return bytes
}
