import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { mq } from '../../styles/theme';
import { useCheckoutHref } from '../../hooks/useCheckoutHref';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'lg';

interface StyleProps {
  $variant?: Variant;
  $size?: Size;
  /** Full width; `'phone'` only under 640px. */
  $block?: boolean | 'phone';
}

/**
 * One button system: sleek rectangles, 10px corners, two variants.
 * Hover steps the fill and lifts 1px (fine pointers only); press scales to
 * 0.97 in 120ms with a strong ease-out, so it answers on pointer-down.
 */
const buttonStyles = css<StyleProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: ${({ $size }) => ($size === 'lg' ? '52px' : '44px')};
  padding: 0 ${({ $size }) => ($size === 'lg' ? '24px' : '18px')};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.btn};
  font-size: ${({ $size }) => ($size === 'lg' ? '16px' : '15px')};
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform ${({ theme }) => theme.motion.press} ${({ theme }) => theme.motion.easeOut},
    background-color ${({ theme }) => theme.motion.hoverOut} ease,
    border-color ${({ theme }) => theme.motion.hoverOut} ease,
    color ${({ theme }) => theme.motion.hoverOut} ease;

  ${({ $block }) =>
    $block === true
      ? css`
          width: 100%;
        `
      : $block === 'phone'
        ? css`
            ${mq.belowMd} {
              width: 100%;
            }
          `
        : null}

  ${({ $variant, theme }) =>
    $variant === 'secondary'
      ? css`
          background-color: ${theme.color.surface};
          border-color: ${theme.color.lineStrong};
          color: ${theme.color.ink};

          &:active {
            background-color: ${theme.color.surfaceStrong};
          }

          ${mq.hover} {
            &:hover {
              background-color: ${theme.color.surfaceHover};
              border-color: rgba(226, 232, 240, 0.24);
            }
          }
        `
      : css`
          background-color: ${theme.color.accent};
          color: ${theme.color.onAccent};

          &:active {
            background-color: ${theme.color.accentPress};
          }

          ${mq.hover} {
            &:hover {
              background-color: ${theme.color.accentHover};
            }
          }
        `}

  & > svg[data-arrow] {
    flex: none;
    transition: transform ${({ theme }) => theme.motion.hoverOut} ${({ theme }) => theme.motion.easeOut};
  }

  &:active {
    transform: scale(0.97);
  }

  ${mq.hover} {
    &:hover {
      transform: translateY(-1px);
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }

    &:hover > svg[data-arrow] {
      transform: translateX(3px);
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }

    &:hover:active {
      transform: translateY(0) scale(0.97);
      transition-duration: ${({ theme }) => theme.motion.press};
    }
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  /* Reduced motion: no movement, the colour step alone answers the press. */
  ${mq.reducedMotion} {
    &,
    &:hover,
    &:active,
    &:hover:active,
    &:hover > svg[data-arrow] {
      transform: none;
    }
  }
`;

const StyledAnchor = styled.a<StyleProps>`
  ${buttonStyles}
`;

const StyledButton = styled.button<StyleProps>`
  ${buttonStyles}
`;

const StyledRouterLink = styled(Link)<StyleProps>`
  ${buttonStyles}
`;

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean | 'phone';
  arrow?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  arrow,
  children,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledButton type={type} $variant={variant} $size={size} $block={block} {...rest}>
      {children}
      {arrow ? <Icon name="arrowRight" size={18} data-arrow="" /> : null}
    </StyledButton>
  );
}

export function ButtonRouterLink({
  variant = 'primary',
  size = 'md',
  block,
  arrow,
  children,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <StyledRouterLink $variant={variant} $size={size} $block={block} {...rest}>
      {children}
      {arrow ? <Icon name="arrowRight" size={18} data-arrow="" /> : null}
    </StyledRouterLink>
  );
}

/**
 * The primary action: always the canonical Cakto checkout (plus sanitised
 * campaign parameters), guarded at runtime by `guardCheckoutLinks`.
 */
export function CheckoutButton({
  variant = 'primary',
  size = 'md',
  block,
  arrow = true,
  children,
  ...rest
}: CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target'>) {
  const href = useCheckoutHref();
  return (
    <StyledAnchor
      href={href}
      data-checkout=""
      referrerPolicy="strict-origin-when-cross-origin"
      $variant={variant}
      $size={size}
      $block={block}
      {...rest}
    >
      {children}
      {arrow ? <Icon name="arrowRight" size={18} data-arrow="" /> : null}
    </StyledAnchor>
  );
}

/** Text link: rests on a faint hairline, an ink line draws left to right on hover. */
export const TextLink = styled.a`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: ${({ theme }) => theme.color.ink};
  font-weight: 500;
  font-size: 15px;

  & > span {
    position: relative;
    padding-bottom: 2px;
  }

  & > span::before,
  & > span::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
  }

  & > span::before {
    background: ${({ theme }) => theme.color.lineStrong};
  }

  & > span::after {
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right center;
    transition: transform ${({ theme }) => theme.motion.hoverOut} ${({ theme }) => theme.motion.easeOut};
  }

  ${mq.hover} {
    &:hover > span::after {
      transform: scaleX(1);
      transform-origin: left center;
      transition-duration: ${({ theme }) => theme.motion.hoverIn};
    }
  }

  &:focus-visible > span::after {
    transform: scaleX(1);
  }

  ${mq.reducedMotion} {
    & > span::after {
      transition: none;
    }
  }
`;
