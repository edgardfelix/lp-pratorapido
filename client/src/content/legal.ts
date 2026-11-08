import type { LegalSlug } from './copy';
import { typeset } from './typography';

/**
 * Legal documents as structured data (rendered as React elements, never as
 * HTML strings). Written for the Brazilian market: LGPD (Lei 13.709/2018),
 * Marco Civil da Internet and the Consumer Defence Code (CDC). Have them
 * reviewed by the client's lawyer before publishing, and add the company's
 * legal name and CNPJ when available.
 */

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  heading: string;
  body: LegalBlock[];
  /** Shows the support channels (decoded in the browser) after the text. */
  contact?: boolean;
}

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  summary: string;
  sections: LegalSection[];
}

const privacy: LegalDocument = {
  slug: 'privacidade',
  title: 'Política de Privacidade',
  summary:
    'Como o Prato Rápido coleta, usa, compartilha e protege dados pessoais no site e no app, de acordo com a Lei Geral de Proteção de Dados Pessoais (LGPD).',
  sections: [
    {
      heading: 'Quem somos',
      body: [
        'Esta Política explica como o Prato Rápido ("Prato Rápido" ou "nós") trata dados pessoais de visitantes do site e de usuários do app, como controlador, nos termos da Lei nº 13.709/2018 (LGPD).',
        'Ao usar o site, comprar o acesso ou usar o app, você declara que leu esta Política.',
      ],
    },
    {
      heading: 'Dados que tratamos',
      body: [
        {
          list: [
            'Dados da compra: nome, e-mail, telefone e identificação do pedido, enviados pela Cakto quando o pagamento é aprovado. O Prato Rápido não recebe nem armazena dados de cartão.',
            'Dados de acesso: o e-mail usado para entrar e os códigos de verificação, guardados apenas em formato cifrado (hash) e por poucos minutos.',
            'Dados técnicos e de segurança: endereço IP, data e hora das solicitações e informações do navegador, usados para limitar tentativas e prevenir fraudes.',
            'Dados que você insere no app: ingredientes, preferências alimentares, receitas salvas e planejamento de refeições, usados para gerar receitas e jornadas.',
          ],
        },
        'Restrições alimentares ou condições de saúde que você decidir informar são dados sensíveis. Eles são usados apenas para personalizar suas receitas, com o seu consentimento, e podem ser apagados a qualquer momento.',
      ],
    },
    {
      heading: 'Para que usamos os dados e com qual base legal',
      body: [
        {
          list: [
            'Liberar e manter o seu acesso ao app, enviar códigos de verificação e comunicações sobre a compra: execução de contrato (art. 7º, V).',
            'Gerar receitas, acompanhamentos e jornadas de nutrição personalizadas: execução de contrato e, para dados sensíveis, consentimento (art. 11, I).',
            'Prestar suporte: execução de contrato e legítimo interesse (art. 7º, IX).',
            'Garantir a segurança, prevenir fraudes e abusos: legítimo interesse (art. 7º, IX).',
            'Cumprir obrigações legais, fiscais e regulatórias: obrigação legal (art. 7º, II).',
          ],
        },
      ],
    },
    {
      heading: 'Com quem compartilhamos',
      body: [
        {
          list: [
            'Cakto, plataforma que processa o pagamento e nos informa a aprovação da compra.',
            'Fornecedores de hospedagem, envio de e-mails e infraestrutura, contratados para operar o serviço.',
            'Fornecedores de inteligência artificial que processam as solicitações de receitas, limitados ao necessário para gerar a resposta.',
            'Autoridades públicas, quando houver obrigação legal ou ordem judicial.',
          ],
        },
        'Não vendemos dados pessoais. Fornecedores que tratam dados em nosso nome só podem usá-los para prestar o serviço contratado.',
      ],
    },
    {
      heading: 'Transferência internacional',
      body: [
        'Alguns fornecedores podem processar dados fora do Brasil. Nesses casos, adotamos as salvaguardas previstas no artigo 33 da LGPD.',
      ],
    },
    {
      heading: 'Por quanto tempo guardamos',
      body: [
        'Mantemos os dados pelo tempo necessário para as finalidades desta Política e para cumprir prazos legais. Códigos de verificação expiram em minutos e são descartados. Registros de acesso são mantidos por 6 meses, como determina o Marco Civil da Internet (Lei nº 12.965/2014).',
      ],
    },
    {
      heading: 'Como protegemos',
      body: [
        {
          list: [
            'Conexão cifrada (HTTPS) em todo o site e na comunicação com o servidor.',
            'Códigos de acesso guardados apenas como hash, com validade curta e limite de tentativas.',
            'Verificação da assinatura dos avisos de pagamento enviados pela Cakto.',
            'Acesso aos dados restrito às pessoas que precisam deles para operar o serviço.',
          ],
        },
      ],
    },
    {
      heading: 'Seus direitos',
      body: [
        'Pelo artigo 18 da LGPD, você pode pedir a qualquer momento:',
        {
          list: [
            'confirmação de que tratamos seus dados e acesso a eles;',
            'correção de dados incompletos, inexatos ou desatualizados;',
            'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
            'portabilidade dos dados a outro fornecedor;',
            'informação sobre com quem compartilhamos seus dados;',
            'revogação do consentimento e eliminação dos dados tratados com base nele.',
          ],
        },
      ],
    },
    {
      heading: 'Como exercer seus direitos',
      body: [
        'Envie o pedido pela Central de Suporte. Respondemos em até 15 dias, como prevê o artigo 19 da LGPD. Para proteger você, podemos confirmar a sua identidade antes de atender o pedido.',
        'Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).',
      ],
      contact: true,
    },
    {
      heading: 'Menores de idade',
      body: ['A compra do acesso é destinada a maiores de 18 anos.'],
    },
    {
      heading: 'Alterações desta Política',
      body: [
        'Podemos atualizar esta Política para refletir mudanças no serviço ou na lei. A data no início do documento indica a versão em vigor.',
      ],
    },
  ],
};

const terms: LegalDocument = {
  slug: 'termos',
  title: 'Termos e Condições',
  summary: 'Regras de compra, liberação de acesso e uso do app Prato Rápido.',
  sections: [
    {
      heading: 'Aceitação',
      body: [
        'Ao comprar o acesso ou usar o Prato Rápido, você concorda com estes Termos e com a Política de Privacidade. Se não concordar, não utilize o serviço.',
      ],
    },
    {
      heading: 'O serviço',
      body: [
        'O Prato Rápido é um app que usa inteligência artificial para sugerir receitas, acompanhamentos e jornadas de nutrição a partir das informações que você fornece, como os ingredientes que tem em casa.',
      ],
    },
    {
      heading: 'Compra e pagamento',
      body: [
        'A compra é feita pelo checkout da Cakto, que processa o pagamento e emite o comprovante. Preço, forma de pagamento e demais condições são os exibidos no checkout no momento da compra.',
      ],
    },
    {
      heading: 'Liberação do acesso',
      body: [
        {
          list: [
            'O acesso é vinculado ao e-mail informado no checkout e é liberado automaticamente quando a Cakto confirma o pagamento.',
            'Pagamentos por Pix ou boleto liberam o acesso após a compensação informada pela Cakto.',
            'Para entrar, você confirma o e-mail com um código de 4 dígitos enviado para ele.',
            'Informe um e-mail correto e ao qual você tenha acesso. Se houver erro de digitação, fale com a Central de Suporte.',
          ],
        },
      ],
    },
    {
      heading: 'Uso da conta',
      body: [
        'O acesso é pessoal e intransferível. Não é permitido:',
        {
          list: [
            'compartilhar códigos de verificação ou revender o acesso;',
            'copiar, extrair em massa ou redistribuir conteúdo do app por meios automatizados;',
            'fazer engenharia reversa, contornar mecanismos de segurança ou sobrecarregar o serviço;',
            'usar o serviço para fins ilegais.',
          ],
        },
      ],
    },
    {
      heading: 'Conteúdo gerado por inteligência artificial',
      body: [
        'Receitas e sugestões são geradas automaticamente e podem conter imprecisões. Antes de preparar uma receita, confira ingredientes, alergênicos, validade e boas práticas de higiene dos alimentos.',
        'As jornadas de nutrição trazem orientações gerais e não substituem a avaliação de nutricionista ou médico. Em caso de alergias, restrições ou condições de saúde, siga a orientação de um profissional.',
      ],
    },
    {
      heading: 'Direito de arrependimento',
      body: [
        'Você pode desistir da compra em até 7 dias corridos a partir da data do pagamento, conforme o artigo 49 do Código de Defesa do Consumidor, com devolução integral do valor pago. Faça o pedido pela Central de Suporte.',
      ],
      contact: true,
    },
    {
      heading: 'Disponibilidade',
      body: [
        'Trabalhamos para manter o serviço disponível, mas ele pode passar por manutenções e interrupções pontuais. Sempre que possível, avisaremos com antecedência.',
      ],
    },
    {
      heading: 'Propriedade intelectual',
      body: [
        'A marca Prato Rápido, o software, os textos e o design do app pertencem ao Prato Rápido. As receitas geradas para você podem ser usadas livremente para fins pessoais.',
      ],
    },
    {
      heading: 'Suspensão do acesso',
      body: [
        'O acesso pode ser suspenso em caso de violação destes Termos, fraude no pagamento, estorno (chargeback) ou reembolso.',
      ],
    },
    {
      heading: 'Responsabilidade',
      body: [
        'O Prato Rápido responde pelo serviço nos limites do Código de Defesa do Consumidor. Não respondemos por danos decorrentes de uso em desacordo com estes Termos ou com as orientações do item 6.',
      ],
    },
    {
      heading: 'Alterações e legislação',
      body: [
        'Estes Termos podem ser atualizados; a data no início do documento indica a versão em vigor. Aplica-se a legislação brasileira, e fica eleito o foro do domicílio do consumidor.',
      ],
    },
  ],
};

const cookies: LegalDocument = {
  slug: 'cookies',
  title: 'Política de Cookies',
  summary: 'Quais cookies e tecnologias de armazenamento o site do Prato Rápido usa e como você pode controlá-los.',
  sections: [
    {
      heading: 'O que são cookies',
      body: [
        'Cookies são pequenos arquivos que um site grava no seu navegador. Tecnologias parecidas, como o armazenamento local (localStorage) e o de sessão (sessionStorage), guardam informações no próprio dispositivo.',
      ],
    },
    {
      heading: 'O que este site usa',
      body: [
        'O site do Prato Rápido não usa cookies de publicidade, de análise ou de rastreamento de terceiros.',
        'Usamos apenas o armazenamento de sessão do navegador (sessionStorage), para:',
        {
          list: [
            'lembrar, durante a visita, os parâmetros de campanha do link que trouxe você ao site (como utm_source), para que a compra seja atribuída corretamente;',
            'lembrar se você pausou o vídeo de fundo.',
          ],
        },
      ],
    },
    {
      heading: 'Por quanto tempo',
      body: ['Essas informações ficam só no seu navegador e são apagadas quando você fecha a aba.'],
    },
    {
      heading: 'Checkout da Cakto',
      body: [
        'Ao clicar para comprar, você é levado ao checkout da Cakto, que tem as próprias políticas de privacidade e de cookies.',
      ],
    },
    {
      heading: 'Como controlar',
      body: [
        'Você pode apagar ou bloquear cookies e dados de sites nas configurações do seu navegador. O site continua funcionando sem eles; apenas a atribuição de campanha e a preferência do vídeo deixam de ser lembradas.',
      ],
    },
    {
      heading: 'Alterações',
      body: [
        'Se passarmos a usar cookies de análise ou de publicidade, esta Política será atualizada e pediremos o seu consentimento antes de ativá-los.',
      ],
      contact: true,
    },
  ],
};

export const legalDocuments: Record<LegalSlug, LegalDocument> = typeset({
  privacidade: privacy,
  termos: terms,
  cookies,
});
