import { createGlobalStyle } from 'styled-components';
import { mq } from './theme';

/**
 * Base layer: reset, mobile-native fixes (tap highlight, 16px inputs,
 * touch-action), focus ring, selection and the reduced-motion safety net.
 * Component motion lives with each component; this file only guards it.
 */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    background: ${({ theme }) => theme.color.bg};
    color: ${({ theme }) => theme.color.ink};
    color-scheme: dark;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    scroll-padding-top: 0;
    hanging-punctuation: first last;
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }

  html,
  body {
    margin: 0;
  }

  body {
    min-height: 100svh;
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 16px;
    line-height: 1.6;
    font-weight: 400;
    font-optical-sizing: auto;
    font-synthesis: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    overflow-x: clip;
  }

  h1,
  h2,
  h3,
  h4,
  p,
  ul,
  ol,
  dl,
  dd,
  figure,
  blockquote {
    margin: 0;
  }

  h1,
  h2,
  h3,
  h4 {
    font-weight: 500;
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  ul,
  ol {
    padding: 0;
    list-style: none;
  }

  img,
  svg,
  video,
  picture,
  canvas {
    display: block;
    max-width: 100%;
  }

  img,
  video {
    height: auto;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
  }

  /* iOS zooms into inputs under 16px; fix the cause, never disable zoom. */
  input,
  textarea,
  select {
    font-size: 16px;
  }

  button {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  /* Controls answer on press, never select their label on long-press. */
  a,
  button,
  [role='button'],
  [role='tab'] {
    touch-action: manipulation;
  }

  button,
  [role='button'],
  [role='tab'] {
    -webkit-user-select: none;
    user-select: none;
  }

  :focus {
    outline: none;
  }

  /* The focus ring shows at once and never animates. */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
    border-radius: 4px;
  }

  ::selection {
    background: rgba(255, 107, 26, 0.32);
    color: ${({ theme }) => theme.color.ink};
  }

  /* Media is decoration or product UI: not draggable, no long-press save sheet. */
  img,
  video {
    -webkit-user-drag: none;
    -webkit-touch-callout: none;
  }

  [hidden] {
    display: none !important;
  }

  .sr-only {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /*
   * Reduced motion: movement rests. Each component sets its own gentler
   * variant (opacity and colour stay); this net catches keyframes only.
   */
  ${mq.reducedMotion} {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-delay: 0ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;
