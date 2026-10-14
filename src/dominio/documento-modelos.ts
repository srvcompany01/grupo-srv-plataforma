import { textoParaDescricao } from './descricao'

export type ModeloDocumento = { id: string; nome: string; descricao: string; titulo: string; paginas: { titulo: string; texto: string }[]; wiki?: boolean }

const doc = (texto: string) => textoParaDescricao(texto)

export const MODELOS_DOCUMENTO: ModeloDocumento[] = [
  { id: 'em-branco', nome: 'Em branco', descricao: 'Comece do zero', titulo: 'Documento sem título', paginas: [{ titulo: '', texto: '' }] },
  {
    id: 'visao-geral',
    nome: 'Visão geral do projeto',
    descricao: 'Metas, escopo e marcos',
    titulo: 'Visão geral do projeto',
    paginas: [{ titulo: 'Visão geral do projeto', texto: 'Objetivo\n\nEscopo\n\nMarcos\n\nResponsáveis' }],
  },
  {
    id: 'ata',
    nome: 'Ata da reunião',
    descricao: 'Pauta, anotações e itens de ação',
    titulo: 'Ata da reunião',
    paginas: [{ titulo: 'Ata da reunião', texto: 'Data e participantes\n\nPauta\n\nAnotações\n\nItens de ação' }],
  },
  {
    id: 'wiki',
    nome: 'Wiki',
    descricao: 'Informação organizada em páginas',
    titulo: 'Wiki',
    wiki: true,
    paginas: [
      { titulo: 'Início', texto: 'Bem-vindo! Use as páginas ao lado para organizar o conhecimento da equipe.' },
      { titulo: 'Como usar', texto: '' },
    ],
  },
]

/** Conteúdo (JSON do editor) de uma página de modelo. */
export const conteudoDoModelo = (texto: string): unknown => doc(texto)
