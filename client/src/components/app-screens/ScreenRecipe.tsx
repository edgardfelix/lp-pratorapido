import styled from 'styled-components';
import { Icon } from '../ui/Icon';
import {
  AppButton,
  AppHeader,
  AppScreen,
  Card,
  Chip,
  ChipWrap,
  Gap,
  Label,
  MetaRow,
  ScreenTitle,
  StatusBar,
  pt,
} from './kit';

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${pt(6)};
  align-self: flex-start;
  height: ${pt(28)};
  padding: 0 ${pt(10)};
  border-radius: ${pt(8)};
  background: ${({ theme }) => theme.color.appGreenSoft};
  color: #9fe3c6;
  font-size: ${pt(12.5)};
  font-weight: 500;

  svg {
    width: ${pt(14)};
    height: ${pt(14)};
  }
`;

const SideDish = styled(Card)`
  display: grid;
  grid-template-columns: ${pt(44)} 1fr auto;
  align-items: center;
  gap: ${pt(12)};
  padding: ${pt(12)} ${pt(14)};

  b {
    display: block;
    font-size: ${pt(15)};
    font-weight: 600;
  }

  small {
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(12.5)};
  }
`;

const SideIcon = styled.span`
  display: grid;
  place-items: center;
  width: ${pt(44)};
  height: ${pt(44)};
  border-radius: ${pt(12)};
  background: rgba(254, 101, 5, 0.14);
  color: ${({ theme }) => theme.color.accent};

  svg {
    width: ${pt(22)};
    height: ${pt(22)};
  }
`;

const Nutrition = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${pt(8)};

  span {
    display: grid;
    gap: ${pt(2)};
    padding: ${pt(10)} ${pt(12)};
    border-radius: ${pt(12)};
    background: rgba(255, 255, 255, 0.04);
  }

  b {
    font-size: ${pt(16)};
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  small {
    color: rgba(243, 244, 246, 0.55);
    font-size: ${pt(11.5)};
  }
`;

const Tip = styled.div`
  display: grid;
  grid-template-columns: ${pt(20)} 1fr;
  gap: ${pt(10)};
  padding: ${pt(12)} ${pt(14)};
  border-radius: ${pt(14)};
  border: 1px dashed rgba(254, 101, 5, 0.35);
  color: rgba(243, 244, 246, 0.7);
  font-size: ${pt(13)};
  line-height: 1.4;

  svg {
    width: ${pt(18)};
    height: ${pt(18)};
    color: ${({ theme }) => theme.color.accent};
  }

  b {
    color: #f3f4f6;
    font-weight: 600;
  }
`;

/** Hero phone: the recipe the app built from the fridge, for the dish in the film. */
export function ScreenRecipe() {
  return (
    <AppScreen>
      <StatusBar />
      <AppHeader />
      <Gap h={18} />
      <Tag>
        <Icon name="check" strokeWidth={2.2} />
        Feita com o que você tem em casa
      </Tag>
      <Gap h={12} />
      <ScreenTitle $size={25}>Salmão grelhado com couve e abóbora assada</ScreenTitle>
      <Gap h={16} />
      <MetaRow
        items={[
          { icon: 'clock', value: '30 min', label: 'Tempo de preparo' },
          { icon: 'steps', value: '4 passos', label: 'Modo de preparo' },
          { icon: 'bars', value: 'Fácil', label: 'Dificuldade' },
        ]}
      />
      <Gap h={16} />
      <Label>Ingredientes da sua geladeira</Label>
      <Gap h={10} />
      <ChipWrap>
        {['Salmão', 'Couve', 'Abóbora', 'Castanha de caju', 'Limão', 'Alho'].map((item) => (
          <Chip key={item} $on>
            <Icon name="check" strokeWidth={2.2} />
            {item}
          </Chip>
        ))}
      </ChipWrap>
      <Gap h={16} />
      <Label>Acompanhamento sugerido</Label>
      <Gap h={10} />
      <SideDish>
        <SideIcon>
          <Icon name="leaf" />
        </SideIcon>
        <span>
          <b>Arroz integral com limão</b>
          <small>15 min · combina com o salmão</small>
        </span>
        <Icon name="plus" style={{ width: pt(20), height: pt(20), opacity: 0.6 }} />
      </SideDish>
      <Gap h={12} />
      <Nutrition>
        <span>
          <b>560</b>
          <small>kcal por porção</small>
        </span>
        <span>
          <b>36 g</b>
          <small>proteína</small>
        </span>
        <span>
          <b>8 g</b>
          <small>fibras</small>
        </span>
      </Nutrition>
      <Gap h={12} />
      <Tip>
        <Icon name="flame" />
        <span>
          <b>Dica:</b> asse a abóbora enquanto tempera o salmão. Os dois ficam prontos juntos.
        </span>
      </Tip>
      <AppButton>
        <Icon name="play" />
        Começar o preparo
      </AppButton>
    </AppScreen>
  );
}
