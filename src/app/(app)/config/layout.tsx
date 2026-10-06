import { AbasConfig } from './AbasConfig'

export default function LayoutConfig({ children }: LayoutProps<'/config'>) {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="text-lg font-semibold">Configurações</h1>
      <AbasConfig />
      <div className="mt-4">{children}</div>
    </div>
  )
}
