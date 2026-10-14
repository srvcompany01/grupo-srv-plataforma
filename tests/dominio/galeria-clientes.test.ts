import { expect, it } from 'vitest'
import { ordenarGaleriaClientes } from '@/dominio/clientes-galeria'

it('galeria: posicionados na ordem escolhida, depois os novos em ordem alfabética', () => {
  const c = (nome: string, posicaoGaleria: string | null) => ({ nome, posicaoGaleria })
  expect(ordenarGaleriaClientes([c('Zeta', null), c('B', 'a1'), c('Alfa', null), c('A', 'a2'), c('C', 'a0')]).map((x) => x.nome)).toEqual(['C', 'B', 'A', 'Alfa', 'Zeta'])
})
