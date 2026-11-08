export interface PageMeta {
  title: string;
  description: string;
  /** Canonical path of the page. */
  path: string;
  noindex?: boolean;
}

export const pageMeta = {
  home: {
    title: 'Prato Rápido | Receitas fáceis com o que você tem',
    description:
      'Transforme os ingredientes da sua geladeira em pratos de chef em segundos. Receitas sob medida, acompanhamentos e jornadas de nutrição criados por inteligência artificial.',
    path: '/',
  },
  privacy: {
    title: 'Política de Privacidade | Prato Rápido',
    description: 'Como o Prato Rápido coleta, usa e protege seus dados pessoais, de acordo com a LGPD.',
    path: '/privacidade',
  },
  terms: {
    title: 'Termos e Condições | Prato Rápido',
    description: 'Regras de compra, acesso e uso do app Prato Rápido.',
    path: '/termos',
  },
  cookies: {
    title: 'Política de Cookies | Prato Rápido',
    description: 'Quais cookies e tecnologias de armazenamento o site do Prato Rápido usa e como controlá-los.',
    path: '/cookies',
  },
  access: {
    title: 'Confirmar acesso | Prato Rápido',
    description: 'Confirme o e-mail da compra para liberar seu acesso ao Prato Rápido.',
    path: '/acesso',
    noindex: true,
  },
  notFound: {
    title: 'Página não encontrada | Prato Rápido',
    description: 'O endereço acessado não existe no site do Prato Rápido.',
    path: '/404',
    noindex: true,
  },
} satisfies Record<string, PageMeta>;

export type PageKey = keyof typeof pageMeta;
