import type { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

/**
 * A vertical device frame drawn in CSS. The screen is a size container, so
 * the app UI inside is laid out in iPhone points (393 wide) through `cqw`
 * units and stays crisp and proportional at any frame width.
 *
 * The whole frame is one image to assistive tech (role="img" + label); the
 * mock UI inside is aria-hidden and inert, so nothing in it takes focus.
 */

const Device = styled.div`
  --w: var(--phone-w, 320px);
  position: relative;
  width: var(--w);
  flex: none;
  padding: calc(var(--w) * 0.034);
  border-radius: calc(var(--w) * 0.165);
  background: linear-gradient(145deg, #3b414a 0%, #1c2025 16%, #0e1013 48%, #191c21 84%, #343a42 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 0 calc(var(--w) * 0.011) #050607,
    0 48px 96px -32px rgba(0, 0, 0, 0.78),
    0 24px 48px -36px rgba(0, 0, 0, 0.7);
  -webkit-user-select: none;
  user-select: none;
`;

const Screen = styled.div`
  position: relative;
  aspect-ratio: 393 / 852;
  overflow: hidden;
  border-radius: calc(var(--w) * 0.131);
  background: ${({ theme }) => theme.color.appBg};
  container-type: inline-size;
  isolation: isolate;
  transform: translateZ(0);
`;

const Island = styled.span`
  position: absolute;
  z-index: 3;
  top: calc(var(--w) * 0.062);
  left: 50%;
  width: calc(var(--w) * 0.3);
  height: calc(var(--w) * 0.086);
  border-radius: 999px;
  background: #000;
  transform: translateX(-50%);
  pointer-events: none;
`;

const SideKey = styled.span<{ $side: 'left' | 'right'; $top: string; $h: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  ${({ $side }) => ($side === 'left' ? 'left: -2px;' : 'right: -2px;')}
  width: 3px;
  height: ${({ $h }) => $h};
  border-radius: 2px;
  background: linear-gradient(90deg, #2b3037, #4a515b);
  pointer-events: none;
`;

interface PhoneFrameProps {
  /** Describes what the screen shows, for screen readers. */
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function PhoneFrame({ label, children, className, style }: PhoneFrameProps) {
  return (
    <Device role="img" aria-label={label} className={className} style={style} data-protected="">
      <Screen aria-hidden="true" inert>
        {children}
      </Screen>
      <Island aria-hidden="true" />
      <SideKey aria-hidden="true" $side="left" $top="17%" $h="3.6%" />
      <SideKey aria-hidden="true" $side="left" $top="24%" $h="6.6%" />
      <SideKey aria-hidden="true" $side="left" $top="32.5%" $h="6.6%" />
      <SideKey aria-hidden="true" $side="right" $top="27%" $h="10.5%" />
    </Device>
  );
}
