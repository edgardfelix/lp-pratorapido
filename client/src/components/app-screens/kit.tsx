import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { Icon, type IconName } from '../ui/Icon';
import { LogoMark } from '../ui/Logo';

/**
 * App UI kit for the phone mockups. Everything is measured in iPhone points
 * (a 393pt-wide screen) and converted to container units, so a screen drawn
 * once renders identically inside a 260px or a 360px frame.
 *
 * The visual language follows the client's own app screens: dark ground,
 * white type, rounded cards with hairlines, green for the main action and
 * the brand orange in the logo.
 */
export const pt = (n: number) => `${((n / 393) * 100).toFixed(3)}cqw`;

export const AppScreen = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 0 ${pt(20)};
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(255, 255, 255, 0.05), transparent 60%),
    ${({ theme }) => theme.color.appBg};
  color: #f3f4f6;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: ${pt(15)};
  line-height: 1.35;
  letter-spacing: -0.01em;
  overflow: hidden;
`;

/* ------------------------------------------------------------------------ */

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  height: ${pt(54)};
  padding: ${pt(6)} ${pt(14)} 0 ${pt(18)};
  font-size: ${pt(16.5)};
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const BarIcons = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${pt(6)};

  svg {
    height: ${pt(12)};
    width: auto;
  }
`;

/** iOS-style status bar: time on the left, signal, Wi-Fi and battery on the right. */
export function StatusBar() {
  return (
    <Bar>
      <span>9:41</span>
      <BarIcons>
        <svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
          <path d="M8 2.6c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.5 10.5 0 0 0 8 .8 10.5 10.5 0 0 0 .5 3.8l1.3 1.3A8.7 8.7 0 0 1 8 2.6Zm0 3.6c1.4 0 2.7.5 3.6 1.5l1.3-1.3A7 7 0 0 0 8 4.4a7 7 0 0 0-4.9 2l1.3 1.3c1-1 2.2-1.5 3.6-1.5Zm0 3.6c.5 0 1 .2 1.3.5L8 11.6 6.7 10.3c.3-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg viewBox="0 0 27 12" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" />
          <path d="M24.5 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </BarIcons>
    </Bar>
  );
}

/* ------------------------------------------------------------------------ */

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: ${pt(44)} 1fr auto;
  align-items: center;
  gap: ${pt(8)};
  flex: none;
  height: ${pt(52)};
  margin-top: ${pt(4)};
`;

export const RoundIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: ${pt(44)};
  height: ${pt(44)};
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #f3f4f6;

  svg {
    width: ${pt(20)};
    height: ${pt(20)};
  }
`;

const Brand = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${pt(6)};
  font-size: ${pt(17)};
  font-weight: 600;
  letter-spacing: -0.02em;

  svg {
    width: ${pt(34)};
    height: auto;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.color.accent};
  }
`;

const HeaderTitle = styled.span`
  font-size: ${pt(17)};
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.span`
  display: inline-flex;
  gap: ${pt(8)};
`;

interface AppHeaderProps {
  title?: string;
  back?: boolean;
  actions?: IconName[];
}

/** The app's top bar: back, the brand (or a title), and up to two actions. */
export function AppHeader({ title, back = true, actions = ['heart', 'share'] }: AppHeaderProps) {
  return (
    <HeaderRow>
      {back ? (
        <RoundIcon>
          <Icon name="chevronLeft" />
        </RoundIcon>
      ) : (
        <span />
      )}
      {title ? (
        <HeaderTitle>{title}</HeaderTitle>
      ) : (
        <Brand>
          <LogoMark tone="light" />
          <span>
            Prato <em>Rápido</em>
          </span>
        </Brand>
      )}
      <HeaderActions>
        {actions.map((name) => (
          <RoundIcon key={name}>
            <Icon name={name} />
          </RoundIcon>
        ))}
      </HeaderActions>
    </HeaderRow>
  );
}

/* ------------------------------------------------------------------------ */

export const ScreenTitle = styled.p<{ $size?: number }>`
  font-size: ${({ $size = 26 }) => pt($size)};
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-wrap: balance;
`;

export const ScreenText = styled.p`
  color: rgba(243, 244, 246, 0.62);
  font-size: ${pt(15)};
  line-height: 1.4;
`;

export const Label = styled.p`
  color: rgba(243, 244, 246, 0.55);
  font-size: ${pt(13)};
  font-weight: 500;
  letter-spacing: 0;
`;

export const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.color.appLine};
  border-radius: ${pt(18)};
  background: ${({ theme }) => theme.color.appSurface};
`;

export const Chip = styled.span<{ $on?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${pt(6)};
  height: ${pt(36)};
  padding: 0 ${pt(12)};
  border-radius: ${pt(12)};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(243, 244, 246, 0.78);
  font-size: ${pt(14)};
  font-weight: 500;
  white-space: nowrap;

  svg {
    width: ${pt(15)};
    height: ${pt(15)};
  }

  ${({ $on, theme }) =>
    $on &&
    css`
      border-color: rgba(34, 176, 125, 0.55);
      background: ${theme.color.appGreenSoft};
      color: #f3f4f6;

      svg {
        color: ${theme.color.appGreen};
      }
    `}
`;

export const ChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${pt(8)};
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: ${pt(12)} 0;
  border-block: 1px solid ${({ theme }) => theme.color.appLine};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${pt(8)};
  padding-inline: ${pt(10)};

  & + & {
    border-left: 1px solid ${({ theme }) => theme.color.appLine};
  }

  &:first-child {
    padding-left: 0;
  }

  svg {
    flex: none;
    width: ${pt(22)};
    height: ${pt(22)};
    color: rgba(243, 244, 246, 0.7);
  }

  b {
    display: block;
    font-size: ${pt(15)};
    font-weight: 600;
  }

  small {
    display: block;
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(11.5)};
    white-space: nowrap;
  }
`;

export interface MetaEntry {
  icon: IconName;
  value: string;
  label: string;
}

/** The app's recipe facts row (time · steps · difficulty), as on the client's screens. */
export function MetaRow({ items }: { items: MetaEntry[] }) {
  return (
    <MetaGrid>
      {items.map((item) => (
        <MetaItem key={item.label}>
          <Icon name={item.icon} strokeWidth={1.6} />
          <span>
            <b>{item.value}</b>
            <small>{item.label}</small>
          </span>
        </MetaItem>
      ))}
    </MetaGrid>
  );
}

export const AppButton = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${pt(10)};
  height: ${pt(54)};
  margin-top: auto;
  margin-bottom: ${pt(30)};
  border-radius: ${pt(16)};
  background: ${({ theme }) => theme.color.appGreen};
  color: #06140e;
  font-size: ${pt(17)};
  font-weight: 600;
  flex: none;

  svg {
    width: ${pt(20)};
    height: ${pt(20)};
  }
`;

const TabBarRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  flex: none;
  margin: auto ${pt(-20)} 0;
  padding: ${pt(10)} ${pt(12)} ${pt(28)};
  border-top: 1px solid ${({ theme }) => theme.color.appLine};
  background: rgba(15, 17, 19, 0.96);
`;

const TabItem = styled.span<{ $on?: boolean }>`
  display: grid;
  justify-items: center;
  gap: ${pt(4)};
  color: ${({ $on }) => ($on ? '#f3f4f6' : 'rgba(243, 244, 246, 0.45)')};
  font-size: ${pt(11)};
  font-weight: 500;

  svg {
    width: ${pt(24)};
    height: ${pt(24)};
    color: ${({ $on, theme }) => ($on ? theme.color.accent : 'currentColor')};
  }
`;

export function TabBar({ active }: { active: 'inicio' | 'receitas' | 'semana' | 'perfil' }) {
  const tabs: { id: typeof active; label: string; icon: IconName }[] = [
    { id: 'inicio', label: 'Início', icon: 'home' },
    { id: 'receitas', label: 'Receitas', icon: 'bookmark' },
    { id: 'semana', label: 'Semana', icon: 'calendar' },
    { id: 'perfil', label: 'Perfil', icon: 'user' },
  ];
  return (
    <TabBarRow>
      {tabs.map((tab) => (
        <TabItem key={tab.id} $on={tab.id === active}>
          <Icon name={tab.icon} strokeWidth={1.6} />
          {tab.label}
        </TabItem>
      ))}
    </TabBarRow>
  );
}

export function Gap({ h }: { h: number }) {
  return <div style={{ height: pt(h), flex: 'none' }} />;
}

export function IconText({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: pt(6) }}>
      <Icon name={icon} style={{ width: pt(16), height: pt(16) }} />
      {children}
    </span>
  );
}
