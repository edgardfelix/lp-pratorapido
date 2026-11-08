import { Dialog } from '@base-ui/react/dialog';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { LegalSlug } from '../../content/copy';
import { legalDocuments } from '../../content/legal';
import { pageMeta } from '../../content/meta';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { mq } from '../../styles/theme';
import { Icon } from '../ui/Icon';
import { LegalDocument } from './LegalDocument';

/*
 * Dialog motion (Emil Kowalski's modal recipe):
 *   desktop · centred, scale 0.96 → 1 + opacity, 260ms strong ease-out in,
 *             180ms out (exits are faster than entrances)
 *   phone   · a bottom sheet, translateY(100%) → 0 on the iOS drawer curve
 *   both    · the backdrop fades with the panel, as one surface
 *   reduced motion · opacity only
 * CSS transitions (not keyframes), so a close mid-open retargets smoothly.
 */

const Backdrop = styled(Dialog.Backdrop)`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(4, 6, 8, 0.72);
  transition: opacity ${({ theme }) => theme.motion.dialogIn} ${({ theme }) => theme.motion.easeOut};

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }

  &[data-ending-style] {
    transition-duration: ${({ theme }) => theme.motion.dialogOut};
  }
`;

const Popup = styled(Dialog.Popup)`
  position: fixed;
  z-index: 91;
  display: flex;
  flex-direction: column;
  inset: auto 0 0;
  max-height: 92svh;
  border: 1px solid ${({ theme }) => theme.color.lineStrong};
  border-bottom: 0;
  border-radius: 20px 20px 0 0;
  background: ${({ theme }) => theme.color.bgRaised};
  box-shadow: 0 -24px 64px rgba(0, 0, 0, 0.5);
  outline: none;
  transition: transform 400ms ${({ theme }) => theme.motion.easeDrawer};

  &[data-starting-style],
  &[data-ending-style] {
    transform: translateY(100%);
  }

  &[data-ending-style] {
    transition-duration: 240ms;
    transition-timing-function: ${({ theme }) => theme.motion.easeOut};
  }

  ${mq.md} {
    inset: 50% auto auto 50%;
    width: min(720px, calc(100vw - 64px));
    max-height: min(84svh, 860px);
    border-bottom: 1px solid ${({ theme }) => theme.color.lineStrong};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55);
    transform: translate(-50%, -50%);
    transform-origin: center;
    transition:
      opacity ${({ theme }) => theme.motion.dialogIn} ${({ theme }) => theme.motion.easeOut},
      transform ${({ theme }) => theme.motion.dialogIn} ${({ theme }) => theme.motion.easeOut};

    &[data-starting-style],
    &[data-ending-style] {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.96);
    }

    &[data-ending-style] {
      transition-duration: ${({ theme }) => theme.motion.dialogOut};
    }
  }

  ${mq.reducedMotion} {
    transition: opacity 200ms ease;

    &[data-starting-style],
    &[data-ending-style] {
      opacity: 0;
      transform: none;
    }

    ${mq.md} {
      transition: opacity 200ms ease;

      &[data-starting-style],
      &[data-ending-style] {
        transform: translate(-50%, -50%);
      }
    }
  }
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.color.line};

  ${mq.md} {
    padding: 24px 28px 18px;
  }
`;

const Grabber = styled.span`
  position: absolute;
  top: 8px;
  left: 50%;
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.color.lineStrong};
  transform: translateX(-50%);

  ${mq.md} {
    display: none;
  }
`;

const Title = styled(Dialog.Title)`
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.025em;
`;

const Description = styled(Dialog.Description)`
  margin-top: 6px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 15px;
  line-height: 1.5;
`;

const Close = styled(Dialog.Close)`
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  margin: -6px -8px 0 0;
  border-radius: ${({ theme }) => theme.radius.md};
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
      background: ${({ theme }) => theme.color.surface};
      color: ${({ theme }) => theme.color.ink};
    }
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 20px calc(28px + env(safe-area-inset-bottom, 0px));
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.color.lineStrong} transparent;

  ${mq.md} {
    padding: 4px 28px 32px;
  }
`;

const PageLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin-top: 24px;
  color: ${({ theme }) => theme.color.ink};
  font-size: 15px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(226, 232, 240, 0.32);
`;

const metaKey = { privacidade: 'privacy', termos: 'terms', cookies: 'cookies' } as const;

/**
 * Legal documents over the landing page. The URL is the source of truth:
 * /privacidade (with the landing page as background) means open. Closing
 * (Escape, backdrop, the close button) goes back in history at once, and the
 * URL change closes the dialog with its exit animation; the browser's Back
 * button closes it the same way. The host stays mounted between uses and the
 * dialog always opens from a closed state, so the entrance animates too.
 * Base UI handles focus trap, Escape, scroll lock and focus return.
 */
export function LegalDialog({ slug }: { slug: LegalSlug | null }) {
  const navigate = useNavigate();
  const [shown, setShown] = useState<LegalSlug | null>(slug);
  const [open, setOpen] = useState(false);
  // The link that opened the dialog gets the focus back when it closes.
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!slug) {
      setOpen(false);
      return undefined;
    }
    const active = document.activeElement;
    returnFocus.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setShown(slug);
    // The Root has rendered closed once; opening now is a transition Base UI animates
    // (it never animates a dialog that mounts already open).
    setOpen(true);
    return undefined;
  }, [slug]);

  useDocumentMeta(slug ? pageMeta[metaKey[slug]] : null);

  const doc = shown ? legalDocuments[shown] : null;
  if (!doc || !shown) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && slug) navigate(-1);
      }}
    >
      <Dialog.Portal>
        <Backdrop />
        <Popup finalFocus={returnFocus}>
          <Grabber aria-hidden="true" />
          <Head>
            <div>
              <Title>{doc.title}</Title>
              <Description>{doc.summary}</Description>
            </div>
            <Close aria-label="Fechar">
              <Icon name="close" size={20} />
            </Close>
          </Head>
          <Body>
            <LegalDocument doc={doc} sectionLevel="h3" hideSummary />
            <PageLink to={`/${shown}`} replace>
              Abrir em página inteira
              <Icon name="arrowUpRight" size={16} />
            </PageLink>
          </Body>
        </Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
