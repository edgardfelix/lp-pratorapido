import type { ReactNode } from 'react';
import styled from 'styled-components';
import { mq } from '../../styles/theme';
import { Container } from '../ui/Container';
import { Footer } from './Footer';
import { Header } from './Header';

const Main = styled.main`
  min-height: 70svh;
  padding: calc(${({ theme }) => theme.layout.nav.phone} + 48px) 0 72px;

  ${mq.lg} {
    padding: calc(${({ theme }) => theme.layout.nav.desktop} + 72px) 0 96px;
  }

  &:focus {
    outline: none;
  }
`;

interface PageShellProps {
  children: ReactNode;
  /** Show the checkout action in the header. */
  action?: boolean;
}

/** Header + a single-column main + footer, for every page but the landing page. */
export function PageShell({ children, action = true }: PageShellProps) {
  return (
    <>
      <Header sections={false} action={action} />
      <Main id="conteudo" tabIndex={-1}>
        <Container>{children}</Container>
      </Main>
      <Footer />
    </>
  );
}
