import { Fragment, useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { copy } from '../../content/copy';
import { useHeroFilm } from '../../hooks/useHeroFilm';
import { mq } from '../../styles/theme';
import { ScreenRecipe } from '../app-screens/ScreenRecipe';
import { CheckoutButton, TextLink } from '../ui/Button';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';
import { PhoneFrame } from '../ui/PhoneFrame';

/* ----------------------------------------------------------------------------
 * Entrance (once a visit, CSS only, so it runs from the first paint):
 *   lead  · the h1, word by word out of masks, eased stagger 60 → 320ms
 *   support · lead, actions and note fade up 12px, 380 / 450 / 520ms
 *   picture · the film settles 1.05 → 1, the phone rises 18px; never hidden
 * Reduced motion: everything stands as written (GlobalStyle net).
 * ------------------------------------------------------------------------- */

const rise = keyframes`
  from { transform: translateY(108%); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
`;

const settle = keyframes`
  from { transform: scale(1.05); }
`;

const lift = keyframes`
  from { transform: translateY(18px) scale(0.985); }
`;

const enter = (name: ReturnType<typeof keyframes>, duration: string, delay = 0) => css`
  animation: ${name} ${duration} ${({ theme }) => theme.motion.easeOut} ${delay}ms both;
`;

let entranceDone = false;

/** True for the first hero mount of the visit (server render included). */
function useFirstEntrance() {
  const [animate] = useState(() => !entranceDone);
  useEffect(() => {
    entranceDone = true;
  }, []);
  return animate;
}

/* ------------------------------------------------------------------------- */

const Section = styled.section`
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  overflow: clip;

  &[data-static] * {
    animation: none !important;
  }

  ${mq.lg} {
    min-height: max(100svh, 640px);
    padding-top: calc(${({ theme }) => theme.layout.nav.desktop} + 48px);
    padding-bottom: 64px;
  }
`;

/*
 * Phones and tablets: the film fills whatever the words leave above them,
 * from under the header down to the eyebrow, and fades into the ground in
 * its last stretch, so every word sits on solid ground at any screen height.
 */
const PhoneFilm = styled.div`
  position: relative;
  z-index: -1;
  flex: 1 1 0;
  min-height: calc(${({ theme }) => theme.layout.nav.phone} + env(safe-area-inset-top, 0px) + 150px);
  margin-bottom: -40px;
  overflow: hidden;
  background: #1a130d url('/media/hero-phone-poster.webp') center 30% / cover no-repeat;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%;
    ${enter(settle, '1100ms')}
  }

  /* Short phones (SE, landscape-ish): the words and the action come first. */
  @media (max-height: 700px) {
    min-height: calc(${({ theme }) => theme.layout.nav.phone} + env(safe-area-inset-top, 0px) + 72px);
  }

  ${mq.lg} {
    display: none;
  }
`;

/*
 * Desktop: the film's light spilling into the ground. The blur and the radial
 * fade are baked into the image (scripts/build-media.mjs): no CSS filter or
 * mask here, so nothing is re-composited while the film plays.
 */
const Ambient = styled.div`
  display: none;

  ${mq.lg} {
    display: block;
    position: absolute;
    inset: -8% -6% -8% 38%;
    z-index: -1;
    background: url('/media/hero-ambient.webp') center / 100% 100% no-repeat;
    opacity: 0.34;
    pointer-events: none;
  }
`;

const Layout = styled(Container)`
  display: flex;
  flex: none;
  flex-direction: column;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));

  ${mq.lg} {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    align-items: start;
    justify-content: stretch;
    padding-bottom: 0;
  }
`;

const Text = styled.div`
  ${mq.lg} {
    grid-column: 1 / span 7;
    padding-right: 24px;
  }
`;

const Eyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 14px;
  font-weight: 500;
  ${enter(fadeIn, '500ms')}

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: ${({ theme }) => theme.color.accent};
  }

  ${mq.lg} {
    margin-bottom: 20px;
  }
`;

/* The client's line (74 characters) on three balanced lines at desktop widths. */
const Title = styled.h1`
  font-size: clamp(34px, 1.65vw + 28px, 58px);
  line-height: 1.04;
  font-weight: 500;
  letter-spacing: -0.038em;
  text-wrap: balance;

  /* 320 to 359px wide: four lines instead of five. */
  @media (max-width: 359px) {
    font-size: 29px;
  }
`;

/* Each word rises inside its own mask; top alignment keeps the lines even. */
const Word = styled.span`
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
  vertical-align: top;
`;

const WordInner = styled.span`
  display: inline-block;
  ${enter(rise, '700ms')}
`;

const Lead = styled.p`
  max-width: 52ch;
  margin-top: 18px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 17px;
  line-height: 1.55;
  ${enter(fadeUp, '520ms', 380)}

  ${mq.lg} {
    margin-top: 24px;
    font-size: 19px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
  margin-top: 24px;
  ${enter(fadeUp, '520ms', 450)}

  ${mq.lg} {
    margin-top: 36px;
  }
`;

const Note = styled.p`
  display: flex;
  gap: 8px;
  max-width: 46ch;
  margin-top: 12px;
  color: ${({ theme }) => theme.color.inkFaint};
  font-size: 13px;
  line-height: 1.5;
  ${enter(fadeUp, '520ms', 520)}

  svg {
    flex: none;
    margin-top: 1px;
  }

  ${mq.lg} {
    margin-top: 20px;
    font-size: 14px;
  }
`;

const Visual = styled.div`
  display: none;

  ${mq.lg} {
    display: block;
    position: relative;
    grid-column: 8 / span 5;
    height: calc(100svh - ${({ theme }) => theme.layout.nav.desktop} - 112px);
    min-height: 520px;
    max-height: 780px;
  }
`;

const FilmFrame = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 28px;
  width: 76%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #1a130d url('/media/hero-desktop-poster.webp') center / cover no-repeat;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    ${enter(settle, '1100ms')}
  }
`;

const PhoneSlot = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 1;
  --phone-w: clamp(236px, calc((100svh - 250px) / 2.12), 300px);
  ${enter(lift, '900ms', 120)}
`;

const FilmToggle = styled.button<{ $placement: 'frame' | 'phone' }>`
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: rgba(10, 12, 15, 0.7);
  color: ${({ theme }) => theme.color.ink};
  transition:
    transform ${({ theme }) => theme.motion.press} ${({ theme }) => theme.motion.easeOut},
    background-color ${({ theme }) => theme.motion.hoverOut} ease;

  ${({ $placement, theme }) =>
    $placement === 'frame'
      ? css`
          right: 14px;
          bottom: 14px;
        `
      : css`
          top: calc(${theme.layout.nav.phone} + env(safe-area-inset-top, 0px) + 12px);
          right: 12px;
        `}

  &:active {
    transform: scale(0.94);
  }

  ${mq.hover} {
    &:hover {
      background: rgba(10, 12, 15, 0.88);
    }
  }

  ${mq.reducedMotion} {
    &:active {
      transform: none;
    }
  }
`;

const PhoneFilmToggle = styled(FilmToggle)`
  ${mq.lg} {
    display: none;
  }
`;

/* ------------------------------------------------------------------------- */

function SplitWords({ text }: { text: string }) {
  const words = text.split(' ');
  const last = words.length - 1;
  return (
    <>
      {words.map((word, index) => {
        // Eased stagger: the gaps shrink as the line goes on (a wave, not a metronome).
        const t = last > 0 ? index / last : 0;
        const delay = Math.round(60 + 260 * (1 - (1 - t) ** 2));
        return (
          <Fragment key={`${word}-${index}`}>
            <Word>
              <WordInner style={{ animationDelay: `${delay}ms` }}>{word}</WordInner>
            </Word>
            {index < last ? ' ' : null}
          </Fragment>
        );
      })}
    </>
  );
}

const filmProps = {
  muted: true,
  loop: true,
  playsInline: true,
  preload: 'none',
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  controlsList: 'nodownload nofullscreen noremoteplayback noplaybackrate',
  tabIndex: -1,
  'aria-hidden': true,
  'data-protected': '',
} as const;

export function Hero() {
  const animate = useFirstEntrance();
  const desktopFilm = useRef<HTMLVideoElement>(null);
  const phoneFilm = useRef<HTMLVideoElement>(null);
  const { playing, toggle } = useHeroFilm(desktopFilm, phoneFilm);
  const toggleLabel = playing ? copy.hero.videoPause : copy.hero.videoPlay;

  return (
    <Section id="inicio" aria-labelledby="hero-title" data-static={animate ? undefined : ''}>
      <PhoneFilm>
        <video ref={phoneFilm} {...filmProps}>
          <source src="/media/hero-phone.mp4" type="video/mp4" />
        </video>
      </PhoneFilm>
      <PhoneFilmToggle type="button" $placement="phone" onClick={toggle} aria-label={toggleLabel}>
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </PhoneFilmToggle>
      <Ambient aria-hidden="true" />

      <Layout>
        <Text>
          <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          <Title id="hero-title">
            <SplitWords text={copy.hero.title} />
          </Title>
          <Lead>{copy.hero.lead}</Lead>
          <Actions>
            <CheckoutButton size="lg" block="phone">
              {copy.hero.cta}
            </CheckoutButton>
            <TextLink href={`#${copy.how.id}`}>
              <span>{copy.hero.secondary}</span>
            </TextLink>
          </Actions>
          <Note>
            <Icon name="lock" size={15} />
            {copy.hero.note}
          </Note>
        </Text>

        <Visual>
          <FilmFrame>
            <video ref={desktopFilm} {...filmProps}>
              <source src="/media/hero-desktop.mp4" type="video/mp4" />
            </video>
            <FilmToggle type="button" $placement="frame" onClick={toggle} aria-label={toggleLabel}>
              <Icon name={playing ? 'pause' : 'play'} size={18} />
            </FilmToggle>
          </FilmFrame>
          <PhoneSlot>
            <PhoneFrame label={copy.hero.phoneLabel}>
              <ScreenRecipe />
            </PhoneFrame>
          </PhoneSlot>
        </Visual>
      </Layout>
    </Section>
  );
}
