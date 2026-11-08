import styled from 'styled-components';
import dish400 from '../../assets/generated/dish-400.webp';
import dish560 from '../../assets/generated/dish-560.webp';
import { Icon } from '../ui/Icon';
import { AppHeader, AppScreen, Card, Gap, ScreenTitle, StatusBar, pt } from './kit';

const Photo = styled.img`
  width: 100%;
  height: ${pt(176)};
  flex: none;
  object-fit: cover;
  border-radius: ${pt(18)};
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: ${pt(4)};
  border-radius: ${pt(12)};
  background: rgba(255, 255, 255, 0.05);
  font-size: ${pt(13.5)};
  font-weight: 500;
  text-align: center;

  span {
    padding: ${pt(8)} 0;
    border-radius: ${pt(9)};
    color: rgba(243, 244, 246, 0.55);
  }

  span[data-on] {
    background: #f3f4f6;
    color: #0f1113;
  }
`;

const Steps = styled.ol`
  display: grid;
  gap: ${pt(14)};
`;

const Step = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: ${pt(30)} 1fr;
  gap: ${pt(12)};

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: ${pt(14.5)};
    top: ${pt(32)};
    bottom: ${pt(-12)};
    width: 1px;
    background: rgba(255, 255, 255, 0.14);
  }

  i {
    display: grid;
    place-items: center;
    width: ${pt(30)};
    height: ${pt(30)};
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    font-style: normal;
    font-size: ${pt(14)};
    font-weight: 600;
  }

  &[data-done] i {
    background: ${({ theme }) => theme.color.appGreen};
    color: #06140e;
  }

  b {
    display: block;
    font-size: ${pt(15)};
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: ${pt(2)};
    color: rgba(243, 244, 246, 0.6);
    font-size: ${pt(13)};
    line-height: 1.35;
  }
`;

const Pairing = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${pt(10)};
  margin-top: auto;
  margin-bottom: ${pt(30)};
  padding: ${pt(12)} ${pt(14)};
  font-size: ${pt(13)};
  color: rgba(243, 244, 246, 0.7);

  svg {
    flex: none;
    width: ${pt(20)};
    height: ${pt(20)};
    color: ${({ theme }) => theme.color.accent};
  }

  b {
    color: #f3f4f6;
    font-weight: 600;
  }
`;

const steps = [
  { title: 'Asse a abóbora', text: 'Cubos com azeite e sal, 20 min a 200 °C.', done: true },
  { title: 'Tempere o salmão', text: 'Sal, pimenta e raspas de limão nos dois lados.', done: true },
  { title: 'Grelhe o salmão', text: '4 min de cada lado, em frigideira bem quente.' },
  { title: 'Monte o prato', text: 'Couve com molho de limão, abóbora, salmão e castanhas.' },
];

/** Step 2: the recipe the AI wrote, step by step, with its side dish. */
export function ScreenMethod() {
  return (
    <AppScreen>
      <StatusBar />
      <AppHeader />
      <Gap h={14} />
      <Photo
        src={dish560}
        srcSet={`${dish400} 400w, ${dish560} 560w`}
        sizes="(min-width: 1024px) 280px, 200px"
        alt=""
        width={560}
        height={373}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <Gap h={14} />
      <ScreenTitle $size={21}>Salmão grelhado com couve e abóbora assada</ScreenTitle>
      <Gap h={14} />
      <Tabs>
        <span>Ingredientes</span>
        <span data-on="">Preparo</span>
        <span>Nutrição</span>
      </Tabs>
      <Gap h={16} />
      <Steps>
        {steps.map((step, index) => (
          <Step key={step.title} data-done={step.done ? '' : undefined}>
            <i>{step.done ? <Icon name="check" strokeWidth={2.4} style={{ width: pt(15), height: pt(15) }} /> : index + 1}</i>
            <span>
              <b>{step.title}</b>
              <small>{step.text}</small>
            </span>
          </Step>
        ))}
      </Steps>
      <Pairing>
        <Icon name="leaf" />
        <span>
          Combina com <b>arroz integral com limão</b>
        </span>
      </Pairing>
    </AppScreen>
  );
}
