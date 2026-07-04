/**
 * palettes — theme groundwork (Sprint 3, C4). The app shipped a single
 * forest-on-cream (light) palette in `tokens.ts`; this file re-exposes it as the
 * `light` Palette and adds a *draft* `dark` palette so a future dark mode has a
 * concrete target.
 *
 * IMPORTANT: the dark palette is unreviewed scaffolding. Dark mode is gated OFF
 * (see ThemeContext `DARK_ENABLED`) until (a) every screen sources colours from
 * `useColors()` rather than the static `color` import, and (b) a designer signs
 * off on these values. Until then `useColors()` always returns `light`, so no
 * screen can half-render a broken dark theme. Full migration = Sprint 4.
 */
import { color } from './tokens';

/** Every themeable colour key. Mirrors the `color` token object 1:1. */
export type Palette = Record<keyof typeof color, string>;

/** Production palette — the forest-on-cream design system, verbatim. */
export const lightPalette: Palette = { ...color };

/**
 * DRAFT dark palette (forest-on-charcoal). Not shipped — see the file header.
 * Values are a reasonable first pass, not a finished design.
 */
export const darkPalette: Palette = {
  forest: '#3E7A54', // primary action — brightened for contrast on charcoal
  forest2: '#4E8163',
  forestDeep: '#EAF3EC', // headings become light on dark
  moss: '#8AA891',
  cream: '#0E1512', // app background — near-black charcoal
  cream2: '#16201B', // sunk panels
  card: '#182420', // raised cards
  line: '#26332B', // hairlines
  lineStrong: '#33453A',
  ink: '#EAF3EC', // primary text
  inkSoft: '#A6B8AC',
  inkFaint: '#6E8378',
  clay: '#D9814F', // spending accent — brightened
  clayTint: '#2A211A',
  gold: '#C9A54A',
};

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';
