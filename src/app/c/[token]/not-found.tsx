import { Marca } from '@/componentes/Marca'

export default function LinkIndisponivel() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
      <div className="space-y-3">
        <div className="flex justify-center">
          <Marca tamanho="h-10 w-10 text-base" />
        </div>
        <h1 className="text-lg font-semibold">Link indisponível</h1>
        <p className="text-texto-2">Fale com a agência para receber um novo link.</p>
      </div>
    </main>
  )
}
