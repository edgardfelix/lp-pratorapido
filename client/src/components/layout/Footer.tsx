import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { site } from '../../config/site';
import { copy } from '../../content/copy';
import { mq } from '../../styles/theme';
import { loadLegalModal } from '../legal/loadLegalModal';
import { CheckoutButton } from '../ui/Button';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';
import { SupportCenter } from './SupportCenter';

const Root = styled.footer`
  position: relative;
  border-top: 1px solid ${({ theme }) => theme.color.line};
  background: ${({ theme }) => theme.color.bgRaised};
`;

const Close = styled.div`
  display: grid;
  gap: 24px;
  padding: ${({ theme }) => theme.layout.padTop.phone} 0 64px;

  ${mq.lg} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    align-items: end;
    padding: ${({ theme }) => theme.layout.padTop.desktop} 0 96px;
  }
`;

const CloseText = styled.div`
  ${mq.lg} {
    grid-column: 1 / span 7;
  }

  h2 {
    max-width: 18ch;
    font-size: clamp(30px, 1.9vw + 22px, 52px);
    line-height: 1.06;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 50ch;
    margin-top: 16px;
    color: ${({ theme }) => theme.color.inkMuted};
    font-size: 17px;
    line-height: 1.6;
  }
`;

const CloseAction = styled.div`
  ${mq.lg} {
    grid-column: 9 / span 4;
    justify-self: end;
  }
`;

const Directory = styled.div`
  display: grid;
  gap: 40px;
  padding: 48px 0;
  border-top: 1px solid ${({ theme }) => theme.color.line};

  ${mq.lg} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    padding: 64px 0;
  }
`;

const Brand = styled.div`
  display: grid;
  align-content: start;
  gap: 16px;

  ${mq.lg} {
    grid-column: 1 / span 4;
  }

  p {
    max-width: 34ch;
    color: ${({ theme }) => theme.color.inkMuted};
    font-size: 15px;
    line-height: 1.6;
  }
`;

const Docs = styled.nav`
  ${mq.lg} {
    grid-column: 5 / span 3;
  }

  h3 {
    margin-bottom: 8px;
    color: ${({ theme }) => theme.color.inkFaint};
    font-size: 13px;
    font-weight: 500;
  }

  ul {
    display: grid;
  }
`;

const DocLink = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 15px;
  transition: color ${({ theme }) => theme.motion.hoverOut} ease;

  ${mq.hover} {
    &:hover {
      color: ${({ theme }) => theme.color.ink};
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }
  }

  &:focus-visible {
    color: ${({ theme }) => theme.color.ink};
  }
`;

const Support = styled.div`
  ${mq.lg} {
    grid-column: 8 / span 5;
  }
`;

const LegalRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  padding: 24px 0 calc(24px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid ${({ theme }) => theme.color.line};
  color: ${({ theme }) => theme.color.inkFaint};
  font-size: 13px;
`;

interface FooterProps {
  /** The closing call to action (landing page only). */
  closing?: boolean;
}

/** Warm the dialog chunk as soon as intent shows (pointer over, or focus on, a document link). */
const prefetchDialog = () => {
  void loadLegalModal();
};

export function Footer({ closing = false }: FooterProps) {
  const location = useLocation();
  const asModal = location.pathname === '/';

  return (
    <Root id="rodape">
      <Container>
        {closing ? (
          <Close>
            <CloseText>
              <h2>{copy.closing.title}</h2>
              <p>{copy.closing.lead}</p>
            </CloseText>
            <CloseAction>
              <CheckoutButton size="lg" block="phone">
                {copy.closing.cta}
              </CheckoutButton>
            </CloseAction>
          </Close>
        ) : null}

        <Directory>
          <Brand>
            <Logo size={20} />
            <p>{copy.footer.tagline}</p>
          </Brand>

          <Docs aria-labelledby="docs-title">
            <h3 id="docs-title">{copy.footer.docsTitle}</h3>
            <ul>
              {copy.footer.docs.map((doc) => (
                <li key={doc.slug}>
                  <DocLink
                    to={`/${doc.slug}`}
                    state={asModal ? { backgroundLocation: location } : undefined}
                    onPointerEnter={asModal ? prefetchDialog : undefined}
                    onFocus={asModal ? prefetchDialog : undefined}
                  >
                    {doc.label}
                  </DocLink>
                </li>
              ))}
            </ul>
          </Docs>

          <Support>
            <SupportCenter />
          </Support>
        </Directory>

        <LegalRow>
          <span>{copy.footer.rights(site.year)}</span>
          <span>{copy.footer.payments}</span>
        </LegalRow>
      </Container>
    </Root>
  );
}
