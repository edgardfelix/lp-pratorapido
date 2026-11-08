/**
 * Prato Rápido · Obsidian design system
 *
 * One ground family (obsidian slate), one ink, one accent (the brand orange
 * sampled from the client's logo). The interface stays ~95% neutral; colour
 * comes from the product (the app UI inside the phones) and the food film.
 *
 * Motion tokens follow Emil Kowalski's curves (one strong ease-out for UI and
 * entrances, one ease-in-out for on-screen travel) and the Taste Skill timings.
 */

const color = {
  /** Page ground: near-black slate, never #000. */
  bg: '#0A0C0F',
  /** Alternate section ground, one step up. */
  bgRaised: '#0E1115',
  /** Cards, panels, inputs. */
  surface: '#13171C',
  surfaceHover: '#181D23',
  surfaceStrong: '#1E242B',
  /** Hairlines: ink at 8% and 14%. */
  line: 'rgba(226, 232, 240, 0.08)',
  lineStrong: 'rgba(226, 232, 240, 0.15)',
  /** Text. ink ≈ 16.9:1, inkMuted ≈ 8.5:1, inkFaint ≈ 5.3:1 on bg (≥ 4.8:1 on surface). */
  ink: '#ECEEF1',
  inkMuted: '#A3ACB7',
  inkFaint: '#7C8692',
  /** Brand orange sampled from the logo (rgb 254 101 5). ≈ 6.6:1 on bg; labels on it use bg. */
  accent: '#FE6505',
  accentHover: '#FF7A24',
  accentPress: '#E85A00',
  onAccent: '#0A0C0F',
  accentSoft: 'rgba(254, 101, 5, 0.12)',
  /** The logo's own near-black slate (rgb 17 22 27). */
  brandSlate: '#11161B',
  /** Product colours, used only inside the app mockups. */
  appBg: '#0F1113',
  appSurface: '#181B1F',
  appLine: 'rgba(255, 255, 255, 0.08)',
  appGreen: '#22B07D',
  appGreenSoft: 'rgba(34, 176, 125, 0.14)',
  danger: '#F2726F',
} as const;

const font = {
  sans: "'Geist Variable', 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'Geist Mono Variable', 'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const;

/** Spacing scale (Taste Skill): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 */
const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
  10: '128px',
} as const;

const radius = {
  /** Buttons: sleek rectangles with a subtle corner. */
  btn: '10px',
  sm: '8px',
  md: '12px',
  lg: '20px',
  xl: '28px',
} as const;

const breakpoint = {
  sm: 480,
  md: 640,
  lg: 1024,
  xl: 1280,
} as const;

const motion = {
  /** Strong ease-out: UI, entrances, exits (Emil Kowalski). */
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  /** Strong ease-in-out: elements already on screen moving A → B. */
  easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  /** iOS-like sheet curve, for the legal dialogs. */
  easeDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
  press: '120ms',
  hoverIn: '150ms',
  hoverOut: '120ms',
  dialogIn: '260ms',
  dialogOut: '180ms',
  crossfadeIn: '420ms',
  crossfadeOut: '240ms',
  enter: '700ms',
} as const;

const layout = {
  /** Fixed header height: desktop / phone. */
  nav: { desktop: '72px', phone: '56px' },
  /** Max content width on the 12-column grid. */
  maxWidth: '1280px',
  /** Side gutter: desktop / tablet / phone. */
  gutter: { desktop: '80px', tablet: '48px', phone: '20px' },
  /** Section padding (top / bottom): desktop / phone. */
  padTop: { desktop: '120px', phone: '96px' },
  padBottom: { desktop: '72px', phone: '56px' },
} as const;

export const theme = {
  color,
  font,
  space,
  radius,
  breakpoint,
  motion,
  layout,
} as const;

export type AppTheme = typeof theme;

/** Media query helpers (mobile-first). */
export const mq = {
  sm: `@media (min-width: ${breakpoint.sm}px)`,
  md: `@media (min-width: ${breakpoint.md}px)`,
  lg: `@media (min-width: ${breakpoint.lg}px)`,
  xl: `@media (min-width: ${breakpoint.xl}px)`,
  belowMd: `@media (max-width: ${breakpoint.md - 1}px)`,
  belowLg: `@media (max-width: ${breakpoint.lg - 1}px)`,
  /** Hover motion only for a precise pointer (no sticky hover on touch). */
  hover: '@media (hover: hover) and (pointer: fine)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;
