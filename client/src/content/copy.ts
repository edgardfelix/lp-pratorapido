/**
 * Landing page copy (pt-BR).
 *
 * Voice: product as the hero, technical-plain (Taste Skill registers 11 + 2).
 * Facts only from the brief and the client's own app screens: no invented
 * figures, reviews, counters or deadlines. Sentence case, no exclamation
 * marks, no em dashes, buttons are a verb plus what the visitor gets.
 */

import { typeset } from './typography';

export const PRIMARY_ACTION = 'Garantir meu acesso';

export const copy = typeset({
  nav: {
    links: [
      { href: '#como-funciona', label: 'Como funciona' },
      { href: '#acesso', label: 'Acesso' },
      { href: '#duvidas', label: 'Dúvidas' },
    ],
    cta: PRIMARY_ACTION,
    home: 'Prato Rápido, página inicial',
  },

  hero: {
    eyebrow: 'App de receitas e nutrição com IA',
    /** Client copy, verbatim. */
    title: 'Transforme os ingredientes da sua geladeira em pratos de chef em segundos.',
    /** Client copy, verbatim. */
    lead: 'O Prato Rápido usa inteligência artificial para criar receitas sob medida, acompanhamentos e jornadas de nutrição para a sua rotina, sem desperdício.',
    cta: PRIMARY_ACTION,
    secondary: 'Ver como funciona',
    note: 'Pagamento seguro pela Cakto. O acesso é liberado no e-mail da compra assim que o pagamento é confirmado.',
    videoPause: 'Pausar o vídeo de fundo',
    videoPlay: 'Reproduzir o vídeo de fundo',
    phoneLabel:
      'Tela do app Prato Rápido com uma receita de frango salteado com abobrinha, pronta em 25 minutos, feita com ingredientes da geladeira.',
  },

  how: {
    id: 'como-funciona',
    title: 'Da geladeira ao prato em três passos',
    lead: 'Você informa o que tem em casa. A inteligência artificial monta a receita, sugere acompanhamentos e organiza as refeições da sua semana.',
    steps: [
      {
        title: 'Conte o que tem na geladeira',
        body: 'Toque nos ingredientes ou digite o que sobrou. A receita começa pelo que já está na sua cozinha.',
        screenLabel: 'Tela do app com ingredientes selecionados: frango, abobrinha, tomate, arroz, alho e limão.',
      },
      {
        title: 'Receba uma receita sob medida',
        body: 'Em segundos, a IA monta o prato com tempo de preparo, modo de fazer e acompanhamentos que combinam.',
        screenLabel: 'Tela do app com o modo de preparo da receita em passos e um acompanhamento sugerido.',
      },
      {
        title: 'Organize a semana e a nutrição',
        body: 'Salve receitas, planeje as refeições e siga jornadas de nutrição pensadas para a sua rotina.',
        screenLabel: 'Tela do app com o planejamento de refeições da semana e uma jornada de nutrição em andamento.',
      },
    ],
    stepLabel: (n: number, total: number) => `Passo ${n} de ${total}`,
  },

  access: {
    id: 'acesso',
    title: 'Acesso liberado pelo e-mail da compra',
    lead: 'Quando a Cakto confirma o pagamento, o e-mail informado no checkout passa a ter acesso ao Prato Rápido. Para entrar, você confirma esse e-mail com um código de 4 dígitos.',
    steps: [
      {
        title: 'Pagamento confirmado',
        body: 'A Cakto processa o pagamento e avisa o Prato Rápido automaticamente.',
      },
      {
        title: 'E-mail verificado',
        body: 'Entre com o e-mail da compra e digite o código de 4 dígitos enviado para ele.',
      },
      {
        title: 'Receitas liberadas',
        body: 'Com o e-mail confirmado, receitas, acompanhamentos e jornadas ficam disponíveis no app.',
      },
    ],
    card: 'O Prato Rápido não recebe nem armazena os dados do seu cartão.',
    confirm: 'Confirmar meu acesso',
    confirmPrefix: 'Já comprou?',
    helpPrefix: 'O código não chegou? Confira a caixa de spam ou fale com a',
    helpLink: 'Central de Suporte',
    phoneLabel:
      'Tela de login do app Prato Rápido explicando o acesso em três passos: acessar o app, confirmar o e-mail com um código de 4 dígitos e explorar as receitas.',
  },

  faq: {
    id: 'duvidas',
    title: 'Perguntas frequentes',
    hintPrefix: 'Não encontrou sua dúvida? Fale com a',
    hintLink: 'Central de Suporte',
    items: [
      {
        q: 'Como recebo meu acesso depois de pagar?',
        a: 'O acesso fica vinculado ao e-mail usado no checkout da Cakto. Assim que o pagamento é confirmado, entre no Prato Rápido com esse e-mail e confirme o código de 4 dígitos enviado para ele.',
      },
      {
        q: 'Preciso comprar ingredientes específicos?',
        a: 'Não. Você começa pelo que já tem em casa, e o Prato Rápido monta a receita e os acompanhamentos a partir disso.',
      },
      {
        q: 'As jornadas de nutrição substituem um nutricionista?',
        a: 'Não. As jornadas trazem orientações gerais para a rotina. Em caso de alergias, restrições ou condições de saúde, siga a orientação de um profissional.',
      },
      {
        q: 'O pagamento é seguro?',
        a: 'Sim. O pagamento é processado pela Cakto, em ambiente próprio. O Prato Rápido não recebe nem armazena os dados do seu cartão.',
      },
      {
        q: 'Posso desistir da compra?',
        a: 'Sim. Você tem 7 dias a partir da compra para desistir, conforme o artigo 49 do Código de Defesa do Consumidor. Peça pela Central de Suporte, no WhatsApp ou por e-mail.',
      },
    ],
  },

  closing: {
    title: 'Receitas de chef com o que já está na sua geladeira',
    lead: 'Comece pelo que você tem em casa. O acesso chega no e-mail da compra logo após a confirmação do pagamento.',
    cta: PRIMARY_ACTION,
  },

  footer: {
    tagline: 'Receitas com inteligência artificial a partir do que você tem em casa.',
    docsTitle: 'Documentos',
    docs: [
      { slug: 'privacidade', label: 'Política de Privacidade' },
      { slug: 'termos', label: 'Termos e Condições' },
      { slug: 'cookies', label: 'Política de Cookies' },
    ],
    support: {
      id: 'suporte',
      title: 'Central de Suporte',
      lead: 'Fale com a equipe do Prato Rápido sobre compra, acesso ou uso do app.',
      whatsapp: { label: 'WhatsApp', action: 'Abrir conversa no WhatsApp' },
      email: { label: 'E-mail', action: 'Enviar e-mail' },
      copy: 'Copiar',
      copied: 'Copiado',
      copyLabel: (what: string) => `Copiar ${what}`,
      loading: 'Carregando contato',
    },
    rights: (year: number) => `© ${year} Prato Rápido. Todos os direitos reservados.`,
    payments: 'Pagamentos processados pela Cakto.',
  },

  skipLink: 'Pular para o conteúdo',
} as const);

export type LegalSlug = (typeof copy.footer.docs)[number]['slug'];
