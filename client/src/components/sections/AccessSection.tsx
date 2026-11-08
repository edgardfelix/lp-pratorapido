import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { copy } from '../../content/copy';
import { mq } from '../../styles/theme';
import { ScreenAccess } from '../app-screens/ScreenAccess';
import { Container } from '../ui/Container';
import { Icon, type IconName } from '../ui/Icon';
import { PhoneFrame } from '../ui/PhoneFrame';

const Section = styled.section`
  position: relative;
  padding: ${({ theme }) => theme.layout.padTop.phone} 0 ${({ theme }) => theme.layout.padBottom.phone};
  background: ${({ theme }) => theme.color.bgRaised};
  border-top: 1px solid ${({ theme }) => theme.color.line};

  ${mq.lg} {
    display: flex;
    align-items: center;
    min-height: 100svh;
    padding: ${({ theme }) => theme.layout.padTop.desktop} 0 ${({ theme }) => theme.layout.padBottom.desktop};
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 48px;

  ${mq.lg} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 24px;
    align-items: center;
  }
`;

const Text = styled.div`
  ${mq.lg} {
    grid-column: 1 / span 6;
  }
`;

const Title = styled.h2`
  max-width: 17ch;
  font-size: clamp(28px, 1.4vw + 22px, 44px);
  line-height: 1.08;
  letter-spacing: -0.032em;
`;

const Lead = styled.p`
  max-width: 50ch;
  margin-top: 16px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 17px;
  line-height: 1.6;

  ${mq.lg} {
    font-size: 18px;
  }
`;

const Rows = styled.ol`
  display: grid;
  margin-top: 32px;
  border-top: 1px solid ${({ theme }) => theme.color.line};

  ${mq.lg} {
    margin-top: 40px;
  }
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 18px 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.line};

  b {
    display: block;
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.015em;
  }

  p {
    margin-top: 4px;
    color: ${({ theme }) => theme.color.inkMuted};
    font-size: 16px;
    line-height: 1.55;
  }
`;

const RowIcon = styled.span`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.accent};
`;

const Secure = styled.p`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 15px;

  svg {
    flex: none;
    color: ${({ theme }) => theme.color.ink};
  }
`;

const Links = styled.div`
  display: grid;
  gap: 4px;
  margin-top: 20px;
  font-size: 15px;
  color: ${({ theme }) => theme.color.inkMuted};
`;

const inlineLink = `
  color: inherit;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(226, 232, 240, 0.32);
`;

const ConfirmLink = styled(Link)`
  ${inlineLink}
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: ${({ theme }) => theme.color.ink};
  font-weight: 500;
  transition: text-decoration-color ${({ theme }) => theme.motion.hoverOut} ease;

  svg {
    transition: transform ${({ theme }) => theme.motion.hoverOut} ${({ theme }) => theme.motion.easeOut};
  }

  ${mq.hover} {
    &:hover {
      text-decoration-color: currentColor;
    }

    &:hover svg {
      transform: translateX(3px);
    }
  }
`;

const HelpLink = styled.a`
  ${inlineLink}
  color: ${({ theme }) => theme.color.ink};

  ${mq.hover} {
    &:hover {
      text-decoration-color: currentColor;
    }
  }
`;

const Visual = styled.div`
  display: flex;
  justify-content: center;
  --phone-w: min(300px, 74vw);

  ${mq.lg} {
    grid-column: 8 / span 5;
    --phone-w: min(310px, calc((100svh - 190px) / 2.09));
  }
`;

const icons: IconName[] = ['card', 'mail', 'utensils'];

export function AccessSection() {
  return (
    <Section id={copy.access.id} aria-labelledby="acesso-title">
      <Container>
        <Grid>
          <Text>
            <Title id="acesso-title">{copy.access.title}</Title>
            <Lead>{copy.access.lead}</Lead>
            <Rows>
              {copy.access.steps.map((step, index) => (
                <Row key={step.title}>
                  <RowIcon>
                    <Icon name={icons[index] ?? 'check'} size={20} />
                  </RowIcon>
                  <div>
                    <b>{step.title}</b>
                    <p>{step.body}</p>
                  </div>
                </Row>
              ))}
            </Rows>
            <Secure>
              <Icon name="shield" size={18} />
              {copy.access.card}
            </Secure>
            <Links>
              <span>
                {copy.access.confirmPrefix}{' '}
                <ConfirmLink to="/acesso">
                  {copy.access.confirm}
                  <Icon name="arrowRight" size={16} />
                </ConfirmLink>
              </span>
              <span>
                {copy.access.helpPrefix} <HelpLink href={`#${copy.footer.support.id}`}>{copy.access.helpLink}</HelpLink>.
              </span>
            </Links>
          </Text>
          <Visual>
            <PhoneFrame label={copy.access.phoneLabel}>
              <ScreenAccess />
            </PhoneFrame>
          </Visual>
        </Grid>
      </Container>
    </Section>
  );
}
