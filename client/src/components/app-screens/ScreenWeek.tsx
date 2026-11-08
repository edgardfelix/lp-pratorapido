import styled from 'styled-components';
import { Icon } from '../ui/Icon';
import { AppHeader, AppScreen, Card, Gap, Label, ScreenTitle, StatusBar, TabBar, pt } from './kit';

const Days = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${pt(6)};
  text-align: center;

  span {
    display: grid;
    justify-items: center;
    gap: ${pt(6)};
    padding: ${pt(10)} 0;
    border-radius: ${pt(12)};
    color: rgba(243, 244, 246, 0.6);
    font-size: ${pt(12.5)};
    font-weight: 500;
  }

  span[data-on] {
    background: #f3f4f6;
    color: #0f1113;
  }

  i {
    width: ${pt(5)};
    height: ${pt(5)};
    border-radius: 50%;
    background: currentColor;
    opacity: 0.6;
  }
`;

const Journey = styled(Card)`
  display: grid;
  gap: ${pt(10)};
  padding: ${pt(14)};

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${pt(8)};
  }

  header > span {
    display: grid;
    gap: ${pt(2)};
  }

  b {
    font-size: ${pt(15.5)};
    font-weight: 600;
  }

  small {
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(12.5)};
  }
`;

const Badge = styled.span`
  padding: ${pt(4)} ${pt(8)};
  border-radius: ${pt(8)};
  background: rgba(254, 101, 5, 0.14);
  color: #ffb27d;
  font-size: ${pt(12)};
  font-weight: 500;
  white-space: nowrap;
`;

const Progress = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${pt(6)};

  i {
    height: ${pt(6)};
    border-radius: ${pt(3)};
    background: rgba(255, 255, 255, 0.1);
  }

  i[data-on] {
    background: ${({ theme }) => theme.color.appGreen};
  }

  i[data-half] {
    background: linear-gradient(90deg, ${({ theme }) => theme.color.appGreen} 50%, rgba(255, 255, 255, 0.1) 50%);
  }
`;

const Meals = styled.ul`
  display: grid;
  gap: ${pt(8)};
`;

const Meal = styled.li`
  display: grid;
  grid-template-columns: ${pt(40)} 1fr auto;
  align-items: center;
  gap: ${pt(12)};
  padding: ${pt(10)} ${pt(12)};
  border: 1px solid ${({ theme }) => theme.color.appLine};
  border-radius: ${pt(14)};
  background: ${({ theme }) => theme.color.appSurface};

  em {
    display: grid;
    place-items: center;
    width: ${pt(40)};
    height: ${pt(40)};
    border-radius: ${pt(11)};
    background: rgba(255, 255, 255, 0.06);
    font-style: normal;

    svg {
      width: ${pt(20)};
      height: ${pt(20)};
    }
  }

  small {
    display: block;
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(12)};
  }

  b {
    display: block;
    font-size: ${pt(14.5)};
    font-weight: 600;
    line-height: 1.25;
  }

  > svg {
    width: ${pt(20)};
    height: ${pt(20)};
    color: ${({ theme }) => theme.color.appGreen};
  }
`;

const meals = [
  { when: 'Café da manhã · 10 min', what: 'Ovos mexidos com espinafre', icon: 'flame' as const, saved: true },
  { when: 'Almoço · 30 min', what: 'Salmão grelhado com couve', icon: 'utensils' as const, saved: true },
  { when: 'Lanche · 5 min', what: 'Iogurte com banana e aveia', icon: 'leaf' as const, saved: true },
  { when: 'Jantar · 25 min', what: 'Sopa de abóbora com gengibre', icon: 'clock' as const, saved: false },
];

/** Step 3: the week planned, and a nutrition journey in progress. */
export function ScreenWeek() {
  return (
    <AppScreen>
      <StatusBar />
      <AppHeader back={false} actions={['calendar']} />
      <Gap h={14} />
      <ScreenTitle $size={24}>Sua semana</ScreenTitle>
      <Gap h={14} />
      <Days>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <span key={day} data-on={day === 'Ter' ? '' : undefined}>
            {day}
            <i />
          </span>
        ))}
      </Days>
      <Gap h={16} />
      <Journey>
        <header>
          <span>
            <small>Jornada de nutrição</small>
            <b>Mais proteína na rotina</b>
          </span>
          <Badge>Semana 2 de 4</Badge>
        </header>
        <Progress>
          <i data-on="" />
          <i data-half="" />
          <i />
          <i />
        </Progress>
        <small>Terça: 4 refeições planejadas com o que você tem em casa.</small>
      </Journey>
      <Gap h={18} />
      <Label>Terça-feira</Label>
      <Gap h={10} />
      <Meals>
        {meals.map((meal) => (
          <Meal key={meal.what}>
            <em>
              <Icon name={meal.icon} />
            </em>
            <span>
              <small>{meal.when}</small>
              <b>{meal.what}</b>
            </span>
            {meal.saved ? <Icon name="check" strokeWidth={2.2} /> : <Icon name="plus" style={{ opacity: 0.5, color: '#f3f4f6' }} />}
          </Meal>
        ))}
      </Meals>
      <TabBar active="semana" />
    </AppScreen>
  );
}
