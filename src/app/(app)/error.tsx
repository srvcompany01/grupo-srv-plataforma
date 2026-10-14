'use client'

import { useEffect } from 'react'
import { TelaErro } from '@/componentes/TelaErro'

export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return <TelaErro digest={error.digest} retry={retry} />
}
