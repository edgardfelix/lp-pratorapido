import styled from 'styled-components';
import { mq } from '../../styles/theme';

/**
 * The page's one content wrap: equal left and right edges at every width.
 * 1280px max on the 12-column grid, gutters 20 / 48 / 80px. The `wrap` class
 * is a stable hook for layout checks (Taste Skill's edge checker reads it).
 */
export const Container = styled.div.attrs({ className: 'wrap' })`
  position: relative;
  z-index: 1;
  width: min(100% - 2 * ${({ theme }) => theme.layout.gutter.phone}, ${({ theme }) => theme.layout.maxWidth});
  margin-inline: auto;

  ${mq.md} {
    width: min(100% - 2 * ${({ theme }) => theme.layout.gutter.tablet}, ${({ theme }) => theme.layout.maxWidth});
  }

  ${mq.lg} {
    width: min(100% - 2 * ${({ theme }) => theme.layout.gutter.desktop}, ${({ theme }) => theme.layout.maxWidth});
  }
`;

/** 12 columns, 24px gutter (12px on a phone). */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 12px;

  ${mq.md} {
    column-gap: 24px;
  }
`;
