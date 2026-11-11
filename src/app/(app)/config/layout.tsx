import { AbasConfig } from './AbasConfig'

export default function LayoutConfig({ children }: LayoutProps<'/config'>) {
  return (
    <div>
      <p>Administração</p>
      <h1>Configurações</h1>
      <AbasConfig />
      <div>{children}</div>
    </div>
  )
}
