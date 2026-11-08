import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { mq } from '../../styles/theme';
import { Icon } from './Icon';

const Button = styled.button`
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.inkMuted};
  transition:
    transform ${({ theme }) => theme.motion.press} ${({ theme }) => theme.motion.easeOut},
    background-color ${({ theme }) => theme.motion.hoverOut} ease,
    color ${({ theme }) => theme.motion.hoverOut} ease;

  &:active {
    transform: scale(0.94);
  }

  ${mq.hover} {
    &:hover {
      background: ${({ theme }) => theme.color.surfaceHover};
      color: ${({ theme }) => theme.color.ink};
    }
  }

  /* The glyph swaps in place: copy → check, held ~1.6 s, then back. */
  svg {
    grid-area: 1 / 1;
    transition:
      opacity 150ms ease,
      transform 150ms ${({ theme }) => theme.motion.easeOut};
  }

  svg[data-glyph='check'] {
    color: ${({ theme }) => theme.color.appGreen};
    opacity: 0;
    transform: scale(0.7);
  }

  &[data-copied] svg[data-glyph='copy'] {
    opacity: 0;
    transform: scale(0.7);
  }

  &[data-copied] svg[data-glyph='check'] {
    opacity: 1;
    transform: none;
  }

  ${mq.reducedMotion} {
    &:active {
      transform: none;
    }

    svg {
      transition: none;
    }
  }
`;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context: fall through.
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

interface CopyButtonProps {
  value: string;
  label: string;
  copiedLabel: string;
}

export function CopyButton({ value, label, copiedLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    if (!(await writeClipboard(value))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <Button type="button" onClick={onClick} aria-label={label} data-copied={copied ? '' : undefined}>
        <Icon name="copy" size={18} data-glyph="copy" />
        <Icon name="check" size={18} strokeWidth={2.2} data-glyph="check" />
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
}
