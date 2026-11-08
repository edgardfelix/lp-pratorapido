import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { LegalDocument } from '../components/legal/LegalDocument';
import { PageShell } from '../components/layout/PageShell';
import { Icon } from '../components/ui/Icon';
import type { LegalSlug } from '../content/copy';
import { legalDocuments } from '../content/legal';
import { pageMeta } from '../content/meta';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 15px;
  font-weight: 500;
`;

const Title = styled.h1`
  max-width: 18ch;
  margin-bottom: 12px;
  font-size: clamp(32px, 1.6vw + 24px, 48px);
  line-height: 1.06;
  letter-spacing: -0.035em;
`;

const metaKey = { privacidade: 'privacy', termos: 'terms', cookies: 'cookies' } as const;

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = legalDocuments[slug];
  useDocumentMeta(pageMeta[metaKey[slug]]);
  return (
    <PageShell>
      <Back to="/">
        <Icon name="chevronLeft" size={18} />
        Voltar para a página inicial
      </Back>
      <Title>{doc.title}</Title>
      <LegalDocument doc={doc} />
    </PageShell>
  );
}
