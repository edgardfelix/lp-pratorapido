import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { copy } from '../../content/copy';
import { mq } from '../../styles/theme';
import { CheckoutButton } from '../ui/Button';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';

const Bar = styled.header`
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: ${({ theme }) => theme.layout.nav.phone};
  background: ${({ theme }) => theme.color.bg};
  border-bottom: 1px solid ${({ theme }) => theme.color.line};
  padding-top: env(safe-area-inset-top, 0px);
  box-sizing: content-box;

  ${mq.lg} {
    height: ${({ theme }) => theme.layout.nav.desktop};
  }
`;

const Inner = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[5]};
  height: ${({ theme }) => theme.layout.nav.phone};

  ${mq.lg} {
    height: ${({ theme }) => theme.layout.nav.desktop};
  }
`;

const SkipLink = styled.a`
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 2;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.ink};
  color: ${({ theme }) => theme.color.bg};
  font-size: 14px;
  font-weight: 500;
  transform: translateY(-50%);
  clip-path: inset(50%);
  opacity: 0;

  &:focus-visible {
    clip-path: none;
    opacity: 1;
  }
`;

const Home = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.radius.sm};

  /* Below 400px the mark stands alone so the action keeps its full label. */
  @media (max-width: 399px) {
    [data-wordmark] {
      display: none;
    }
  }
`;

const Nav = styled.nav`
  display: none;

  ${mq.lg} {
    display: flex;
    gap: ${({ theme }) => theme.space[6]};
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const NavLink = styled.a`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  transition: color ${({ theme }) => theme.motion.hoverOut} ease;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right center;
    transition: transform ${({ theme }) => theme.motion.hoverOut} ${({ theme }) => theme.motion.easeOut};
  }

  ${mq.hover} {
    &:hover {
      color: ${({ theme }) => theme.color.ink};
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }

    &:hover::after {
      transform: scaleX(1);
      transform-origin: left center;
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }
  }

  &:focus-visible {
    color: ${({ theme }) => theme.color.ink};
  }

  ${mq.reducedMotion} {
    &::after {
      transition: none;
    }
  }
`;

const Action = styled.div`
  display: flex;
  align-items: center;

  a {
    height: 44px;
    padding: 0 14px;
    font-size: 14px;
  }

  ${mq.lg} {
    a {
      padding: 0 18px;
      font-size: 15px;
    }
  }
`;

interface HeaderProps {
  /** Section links (landing page only). */
  sections?: boolean;
  /** The checkout action. */
  action?: boolean;
}

export function Header({ sections = true, action = true }: HeaderProps) {
  return (
    <Bar>
      <Container>
        <Inner>
          <SkipLink href="#conteudo">{copy.skipLink}</SkipLink>
          <Home to="/" aria-label={copy.nav.home}>
            <Logo size={18} />
          </Home>
          {sections ? (
            <Nav aria-label="Seções da página">
              {copy.nav.links.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </Nav>
          ) : null}
          {action ? (
            <Action>
              <CheckoutButton arrow={false}>{copy.nav.cta}</CheckoutButton>
            </Action>
          ) : null}
        </Inner>
      </Container>
    </Bar>
  );
}
