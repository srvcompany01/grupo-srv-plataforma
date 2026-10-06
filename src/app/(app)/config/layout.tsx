import { AbasConfig } from './AbasConfig'

export default function LayoutConfig({ children }: LayoutProps<'/config'>) {
  return (
    <div className="page-shell max-w-5xl">
      <p className="eyebrow">Administração</p>
      <h1 className="page-title mt-1">Configurações</h1>
      <AbasConfig />
      <div className="mt-4">{children}</div>
    </div>
  )
}
