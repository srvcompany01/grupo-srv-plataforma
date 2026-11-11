import { Marca } from '@/componentes/Marca'

export default function LinkIndisponivel() {
  return (
    <main>
      <div>
        <div>
          <Marca tamanho="h-10 w-10 text-base" />
        </div>
        <h1>Link indisponível</h1>
        <p>Fale com a agência para receber um novo link.</p>
      </div>
    </main>
  )
}
