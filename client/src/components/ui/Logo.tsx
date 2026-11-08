import styled from 'styled-components';
import { logoMark } from '../../assets/generated/logo';

interface LogoMarkProps {
  /** `light` paints the hat and cloche in near-white for dark grounds. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * The Prato Rápido mark (chef hat, cloche and speed lines), vectorised from
 * the client's logo file by `scripts/build-media.mjs`. The orange layer keeps
 * the brand colour; the outline layer follows the ground.
 */
export function LogoMark({ tone = 'light', className }: LogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox={logoMark.viewBox}
      width={logoMark.width}
      height={logoMark.height}
      aria-hidden="true"
      focusable="false"
    >
      <path d={logoMark.outline} fill={tone === 'light' ? '#F3F4F6' : '#11161B'} />
      <path d={logoMark.accent} fill="#FE6505" />
    </svg>
  );
}

const Lockup = styled.span<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $size }) => Math.round($size * 0.36)}px;
  color: ${({ theme }) => theme.color.ink};
  font-size: ${({ $size }) => $size}px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  white-space: nowrap;

  svg {
    width: auto;
    height: ${({ $size }) => Math.round($size * 1.45)}px;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.color.accent};
  }
`;

interface LogoProps {
  /** Wordmark font size in px; the mark scales with it. */
  size?: number;
  /** Hide the wordmark below this many px of viewport width (mark only). */
  className?: string;
}

/** Horizontal lockup: mark + "Prato Rápido", as the client's app header sets it. */
export function Logo({ size = 19, className }: LogoProps) {
  return (
    <Lockup $size={size} className={className}>
      <LogoMark />
      <span data-wordmark="">
        Prato <em>Rápido</em>
      </span>
    </Lockup>
  );
}
