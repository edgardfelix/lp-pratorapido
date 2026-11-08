import type { SVGProps } from 'react';

/**
 * Line icons drawn on a 24px grid, 1.75px stroke, round caps. One family for
 * the whole interface; brand marks (WhatsApp, Gmail) are the real files.
 */
const paths = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  steps: <path d="M9 6.5h10M9 12h10M9 17.5h10M4.75 6.5h.5M4.75 12h.5M4.75 17.5h.5" />,
  bars: <path d="M6 18v-4M12 18V10M18 18V6" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17M7 14.5h3" />
    </>
  ),
  utensils: <path d="M7 3.5v6.5a2 2 0 0 0 2 2v8.5M11 3.5V10a2 2 0 0 1-2 2M7 3.5v5M17 20.5v-17c-2.2 1.2-3.5 3.6-3.5 6.5v4H17" />,
  heart: <path d="M12 19.5s-7-4.3-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" />,
  share: <path d="M12 15V4M8 7.5 12 3.5l4 4M6 11.5v7A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5v-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
      <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5.5-13.5 14-14 0 8.5-5.5 14-14 14Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  flame: <path d="M12 20.5c3.6 0 6-2.4 6-5.9 0-3.6-2.6-5.4-3.6-8.6-.4 1.6-1.3 2.8-2.4 3.4C12 6.8 10.6 4.6 8.5 3.5 8.7 7.2 6 9.3 6 14.6c0 3.5 2.4 5.9 6 5.9Z" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  bookmark: <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V5.5a1 1 0 0 1 1-1Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  sparkles: <path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3M7 7l1.8 1.8M15.2 15.2 17 17M17 7l-1.8 1.8M8.8 15.2 7 17" />,
  basket: (
    <>
      <path d="M4 10h16l-1.6 8.1a2 2 0 0 1-2 1.9H7.6a2 2 0 0 1-2-1.9L4 10Z" />
      <path d="m8.5 10 2-5.5M15.5 10l-2-5.5" />
    </>
  ),
  home: <path d="M4.5 10.5 12 4.5l7.5 6V19a1 1 0 0 1-1 1h-4.5v-5.5h-4V20H5.5a1 1 0 0 1-1-1v-8.5Z" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5c.9-3.3 3.5-5 6.5-5s5.6 1.7 6.5 5" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="14.5" r="4" />
      <path d="m11.5 11.5 8-8M16.5 6.5l2.5 2.5M14 9l2 2" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
