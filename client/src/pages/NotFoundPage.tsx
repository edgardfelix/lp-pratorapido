import styled from 'styled-components';
import { PageShell } from '../components/layout/PageShell';
import { ButtonRouterLink } from '../components/ui/Button';
import { pageMeta } from '../content/meta';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const Title = styled.h1`
  font-size: clamp(32px, 1.6vw + 24px, 48px);
  line-height: 1.06;
  letter-spacing: -0.035em;
`;

const Text = styled.p`
  max-width: 46ch;
  margin: 16px 0 32px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 17px;
`;

export function NotFoundPage() {
  useDocumentMeta(pageMeta.notFound);
  return (
    <PageShell>
      <Title>Página não encontrada</Title>
      <Text>O endereço que você abriu não existe ou mudou. As receitas, o acesso e o suporte estão na página inicial.</Text>
      <ButtonRouterLink to="/" variant="secondary" arrow>
        Voltar para a página inicial
      </ButtonRouterLink>
    </PageShell>
  );
}
