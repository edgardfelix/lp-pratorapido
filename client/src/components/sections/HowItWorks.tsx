import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { copy } from '../../content/copy';
import { useActiveStep } from '../../hooks/useActiveStep';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { mq } from '../../styles/theme';
import { ScreenIngredients } from '../app-screens/ScreenIngredients';
import { ScreenMethod } from '../app-screens/ScreenMethod';
import { ScreenWeek } from '../app-screens/ScreenWeek';
import { Container } from '../ui/Container';
import { PhoneFrame } from '../ui/PhoneFrame';

/**
 * "Pinned chapters" (Taste Skill moment, dealt for this page): the section
 * holds on screen for one screen of scroll while its three steps take turns
 * and the phone's screen crossfades to each one. The page scrolls natively;
 * only `position: sticky` holds the stage. Purpose: explanation, how the
 * product goes from fridge to plate, in the space of one screen.
 *
 * The layout mode is pure CSS (media queries), so server and client markup
 * are identical; JavaScript only reports which step is under the middle of
 * the viewport. Reduced motion, short screens and no script: a static layout
 * where every step stands with its own phone.
 */
const PINNED = [
  '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)',
  '(max-width: 1023px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)',
].join(', ');

const pinned = (rules: ReturnType<typeof css>) => css`
  @media ${PINNED} {
    ${rules}
  }
`;

const screens: ReactNode[] = [<ScreenIngredients key="ingredients" />, <ScreenMethod key="method" />, <ScreenWeek key="week" />];

/* ------------------------------------------------------------------------- */

const Section = styled.section`
  position: relative;
  background: ${({ theme }) => theme.color.bg};
`;

const Track = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.layout.padTop.phone} 0 ${({ theme }) => theme.layout.padBottom.phone};

  ${mq.lg} {
    padding: ${({ theme }) => theme.layout.padTop.desktop} 0 ${({ theme }) => theme.layout.padBottom.desktop};
  }

  ${pinned(css`
    /* Exactly two screens: one held screen of content, one screen of scroll for the three steps. */
    height: 200svh;
    padding: 0;
  `)}
`;

const Stage = styled.div`
  ${pinned(css`
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    height: 100svh;
    padding-top: calc(${({ theme }) => theme.layout.nav.phone} + 16px);
    padding-bottom: 20px;

    ${mq.lg} {
      padding-top: ${({ theme }) => theme.layout.nav.desktop};
      padding-bottom: 0;
    }
  `)}
`;

const Grid = styled.div`
  display: grid;
  gap: 32px;

  ${mq.lg} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    align-items: center;
  }

  ${pinned(css`
    height: 100%;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 16px;

    ${mq.lg} {
      grid-template-rows: none;
      height: auto;
    }
  `)}
`;

const Copy = styled.div`
  ${mq.lg} {
    grid-column: 1 / -1;
  }

  ${pinned(css`
    display: contents;

    ${mq.lg} {
      display: block;
      grid-column: 1 / span 5;
    }
  `)}
`;

const Title = styled.h2`
  max-width: 16ch;
  font-size: clamp(28px, 1.4vw + 22px, 44px);
  line-height: 1.08;
  letter-spacing: -0.032em;

  ${pinned(css`
    order: 1;

    ${mq.belowLg} {
      font-size: 26px;
    }
  `)}
`;

const Lead = styled.p`
  max-width: 46ch;
  margin-top: 16px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 17px;
  line-height: 1.6;

  ${mq.lg} {
    font-size: 18px;
  }

  ${pinned(css`
    ${mq.belowLg} {
      display: none;
    }
  `)}
`;

const Steps = styled.ol`
  display: grid;
  gap: 56px;
  margin-top: 48px;

  ${mq.lg} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
    margin-top: 64px;
  }

  ${pinned(css`
    order: 3;
    grid-template-areas: 'step';
    gap: 0;
    margin-top: 0;

    ${mq.lg} {
      grid-template-columns: none;
      grid-template-areas: none;
      gap: 0;
      margin-top: 40px;
      border-top: 1px solid ${({ theme }) => theme.color.line};
    }
  `)}
`;

const Step = styled.li`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${mq.lg} {
    gap: 10px;
  }

  ${pinned(css`
    ${mq.belowLg} {
      grid-area: step;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity ${({ theme }) => theme.motion.crossfadeOut} ${({ theme }) => theme.motion.easeOut},
        transform ${({ theme }) => theme.motion.crossfadeOut} ${({ theme }) => theme.motion.easeOut};

      &[data-state='active'] {
        opacity: 1;
        transform: none;
        transition-duration: ${({ theme }) => theme.motion.crossfadeIn};
        transition-delay: 60ms;
      }
    }

    ${mq.lg} {
      position: relative;
      padding: 22px 0 22px 24px;
      border-bottom: 1px solid ${({ theme }) => theme.color.line};

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 22px;
        bottom: 22px;
        width: 2px;
        border-radius: 1px;
        background: ${({ theme }) => theme.color.accent};
        transform: scaleY(0);
        transform-origin: top center;
        transition: transform 240ms ${({ theme }) => theme.motion.easeOut};
      }

      &[data-state='active']::before {
        transform: scaleY(1);
      }
    }
  `)}
`;

const StepNumber = styled.span`
  color: ${({ theme }) => theme.color.accent};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
`;

const StepTitle = styled.h3`
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: -0.02em;
  transition: color 240ms ease;

  ${pinned(css`
    ${mq.lg} {
      color: ${({ theme }) => theme.color.inkMuted};

      [data-state='active'] > & {
        color: ${({ theme }) => theme.color.ink};
      }
    }
  `)}
`;

const StepBody = styled.p`
  max-width: 40ch;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 16px;
  line-height: 1.6;
  transition: color 240ms ease;

  ${pinned(css`
    ${mq.lg} {
      color: ${({ theme }) => theme.color.inkFaint};

      [data-state='active'] > & {
        color: ${({ theme }) => theme.color.inkMuted};
      }
    }
  `)}
`;

/** Static layout only: each step carries its own phone. */
const StepPhone = styled.div`
  --phone-w: min(300px, 76vw);
  display: flex;
  justify-content: center;
  margin-top: 16px;

  ${mq.lg} {
    /* A length, never a percentage: the frame derives its radii and bezel from it. */
    --phone-w: 280px;
    order: -1;
    justify-content: flex-start;
    margin: 0 0 24px;
  }

  ${pinned(css`
    display: none;
  `)}
`;

const Progress = styled.div`
  display: none;

  ${pinned(css`
    ${mq.belowLg} {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      order: 4;
      margin-top: 4px;

      i {
        height: 3px;
        border-radius: 2px;
        background: ${({ theme }) => theme.color.lineStrong};
        transition: background-color 240ms ease;
      }

      i[data-on] {
        background: ${({ theme }) => theme.color.accent};
      }
    }
  `)}
`;

const PinnedVisual = styled.div`
  display: none;

  ${pinned(css`
    display: flex;
    order: 2;
    justify-content: center;
    align-items: center;
    min-height: 0;
    --phone-w: min(300px, calc((100svh - 360px) / 2.09));

    ${mq.lg} {
      grid-column: 7 / span 6;
      --phone-w: min(320px, calc((100svh - 150px) / 2.09));
    }
  `)}
`;

const Layer = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(3%);
  filter: blur(2px);
  transition:
    opacity ${({ theme }) => theme.motion.crossfadeOut} ${({ theme }) => theme.motion.easeOut},
    transform ${({ theme }) => theme.motion.crossfadeOut} ${({ theme }) => theme.motion.easeOut},
    filter ${({ theme }) => theme.motion.crossfadeOut} ${({ theme }) => theme.motion.easeOut};

  &[data-state='past'] {
    transform: translateY(-3%);
  }

  &[data-state='active'] {
    opacity: 1;
    transform: none;
    filter: none;
    transition-duration: ${({ theme }) => theme.motion.crossfadeIn};
    transition-delay: 60ms;
  }
`;

const Sentinels = styled.div`
  display: none;

  ${pinned(css`
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
    visibility: hidden;

    span {
      position: absolute;
      left: 0;
      width: 1px;
    }
  `)}
`;

/* ------------------------------------------------------------------------- */

export function HowItWorks() {
  const isPinned = useMediaQuery(PINNED, false);
  const { active, sentinel } = useActiveStep(copy.how.steps.length, isPinned);
  const stateOf = (index: number) => (index === active ? 'active' : index < active ? 'past' : 'future');
  const total = copy.how.steps.length;

  return (
    <Section id={copy.how.id} aria-labelledby="como-title" data-moment="pinned-chapters">
      <Track>
        <Stage>
          <Container>
            <Grid>
              <Copy>
                <Title id="como-title">{copy.how.title}</Title>
                <Lead>{copy.how.lead}</Lead>
                <Steps>
                  {copy.how.steps.map((step, index) => (
                    <Step key={step.title} data-state={stateOf(index)}>
                      <StepNumber>{String(index + 1).padStart(2, '0')}</StepNumber>
                      <StepTitle>{step.title}</StepTitle>
                      <StepBody>{step.body}</StepBody>
                      <StepPhone>
                        <PhoneFrame label={step.screenLabel}>{screens[index]}</PhoneFrame>
                      </StepPhone>
                    </Step>
                  ))}
                </Steps>
                <Progress aria-hidden="true">
                  {copy.how.steps.map((step, index) => (
                    <i key={step.title} data-on={index <= active ? '' : undefined} />
                  ))}
                </Progress>
              </Copy>

              <PinnedVisual>
                <PhoneFrame label={copy.how.steps[active]?.screenLabel ?? ''}>
                  {screens.map((screen, index) => (
                    <Layer key={index} data-state={stateOf(index)}>
                      {screen}
                    </Layer>
                  ))}
                </PhoneFrame>
              </PinnedVisual>
            </Grid>
          </Container>
        </Stage>

        {/* One sentinel per step across the held scroll; the middle of the viewport picks the step. */}
        <Sentinels aria-hidden="true">
          {copy.how.steps.map((step, index) => (
            <span
              key={step.title}
              ref={sentinel(index)}
              data-step={index}
              style={{
                top: `calc(50svh + ${index} * (100% - 100svh) / ${total})`,
                height: `calc((100% - 100svh) / ${total})`,
              }}
            />
          ))}
        </Sentinels>
      </Track>
    </Section>
  );
}
