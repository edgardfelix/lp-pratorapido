import styled from 'styled-components';
import { copy } from '../../content/copy';
import { mq } from '../../styles/theme';
import { Container } from '../ui/Container';

const Section = styled.section`
  padding: ${({ theme }) => theme.layout.padTop.phone} 0 ${({ theme }) => theme.layout.padBottom.phone};
  border-top: 1px solid ${({ theme }) => theme.color.line};

  /* Tablets and up: one whole screen, so no neighbour peeks into its tile. */
  ${mq.md} {
    min-height: 100svh;
  }

  ${mq.lg} {
    display: flex;
    align-items: center;
    min-height: 100svh;
    padding: ${({ theme }) => theme.layout.padTop.desktop} 0 ${({ theme }) => theme.layout.padBottom.desktop};
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 32px;

  ${mq.lg} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    align-items: start;
  }
`;

const Head = styled.div`
  ${mq.lg} {
    grid-column: 1 / span 4;
  }
`;

const Title = styled.h2`
  font-size: clamp(28px, 1.4vw + 22px, 44px);
  line-height: 1.08;
  letter-spacing: -0.032em;
`;

const Hint = styled.p`
  max-width: 30ch;
  margin-top: 16px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 16px;
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.color.ink};
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    text-decoration-color: rgba(226, 232, 240, 0.32);
    transition: text-decoration-color ${({ theme }) => theme.motion.hoverOut} ease;
  }

  ${mq.hover} {
    a:hover {
      text-decoration-color: currentColor;
    }
  }
`;

/* Every answer open: no accordion, nothing animates height (Taste Skill). */
const List = styled.dl`
  border-top: 1px solid ${({ theme }) => theme.color.line};

  ${mq.lg} {
    grid-column: 6 / span 7;
  }
`;

const Item = styled.div`
  padding: 22px 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.line};

  dt {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.35;
    letter-spacing: -0.015em;
  }

  dd {
    max-width: 62ch;
    margin: 8px 0 0;
    color: ${({ theme }) => theme.color.inkMuted};
    font-size: 16px;
    line-height: 1.65;
  }
`;

export function Faq() {
  return (
    <Section id={copy.faq.id} aria-labelledby="duvidas-title">
      <Container>
        <Grid>
          <Head>
            <Title id="duvidas-title">{copy.faq.title}</Title>
            <Hint>
              {copy.faq.hintPrefix} <a href={`#${copy.footer.support.id}`}>{copy.faq.hintLink}</a>.
            </Hint>
          </Head>
          <List>
            {copy.faq.items.map((item) => (
              <Item key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </Item>
            ))}
          </List>
        </Grid>
      </Container>
    </Section>
  );
}
