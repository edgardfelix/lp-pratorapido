import styled from 'styled-components';
import { Icon } from '../ui/Icon';
import { AppButton, AppHeader, AppScreen, Chip, ChipWrap, Gap, Label, ScreenText, ScreenTitle, StatusBar, pt } from './kit';

const Search = styled.div`
  display: flex;
  align-items: center;
  gap: ${pt(10)};
  height: ${pt(50)};
  padding: 0 ${pt(14)};
  border: 1px solid rgba(34, 176, 125, 0.6);
  border-radius: ${pt(14)};
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 0 ${pt(3)} rgba(34, 176, 125, 0.14);
  font-size: ${pt(15.5)};

  svg {
    width: ${pt(20)};
    height: ${pt(20)};
    color: rgba(243, 244, 246, 0.55);
  }
`;

const Caret = styled.span`
  display: inline-block;
  width: ${pt(2)};
  height: ${pt(20)};
  margin-left: ${pt(1)};
  background: ${({ theme }) => theme.color.appGreen};
  vertical-align: middle;
`;

const Prefs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${pt(8)};

  span {
    display: grid;
    gap: ${pt(2)};
    padding: ${pt(12)} ${pt(14)};
    border: 1px solid ${({ theme }) => theme.color.appLine};
    border-radius: ${pt(14)};
    background: ${({ theme }) => theme.color.appSurface};
  }

  small {
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(12)};
  }

  b {
    font-size: ${pt(15)};
    font-weight: 600;
  }
`;

const Count = styled.p`
  color: rgba(243, 244, 246, 0.62);
  font-size: ${pt(13)};

  b {
    color: #f3f4f6;
    font-weight: 600;
  }
`;

const selected = ['Salmão', 'Couve', 'Abóbora', 'Castanha de caju', 'Limão', 'Alho'];
const others = ['Ovos', 'Tomate', 'Cebola', 'Arroz', 'Iogurte', 'Espinafre', 'Batata'];

/** Step 1: the fridge, ingredient by ingredient. */
export function ScreenIngredients() {
  return (
    <AppScreen>
      <StatusBar />
      <AppHeader title="Nova receita" actions={['bookmark']} />
      <Gap h={20} />
      <ScreenTitle>O que tem na sua geladeira?</ScreenTitle>
      <Gap h={8} />
      <ScreenText>Toque nos ingredientes ou digite o que sobrou.</ScreenText>
      <Gap h={18} />
      <Search>
        <Icon name="search" />
        <span>
          Limão
          <Caret />
        </span>
      </Search>
      <Gap h={18} />
      <Label>Selecionados</Label>
      <Gap h={10} />
      <ChipWrap>
        {selected.map((item) => (
          <Chip key={item} $on>
            <Icon name="check" strokeWidth={2.2} />
            {item}
          </Chip>
        ))}
      </ChipWrap>
      <Gap h={16} />
      <Label>Também na geladeira</Label>
      <Gap h={10} />
      <ChipWrap>
        {others.map((item) => (
          <Chip key={item}>
            <Icon name="plus" />
            {item}
          </Chip>
        ))}
      </ChipWrap>
      <Gap h={18} />
      <Prefs>
        <span>
          <small>Tempo</small>
          <b>Até 30 min</b>
        </span>
        <span>
          <small>Porções</small>
          <b>2 pessoas</b>
        </span>
        <span>
          <small>Objetivo</small>
          <b>Mais proteína</b>
        </span>
        <span>
          <small>Restrições</small>
          <b>Sem lactose</b>
        </span>
      </Prefs>
      <Gap h={14} />
      <Count>
        <b>6 ingredientes</b> selecionados
      </Count>
      <AppButton>
        Criar receita
        <Icon name="arrowRight" />
      </AppButton>
    </AppScreen>
  );
}
