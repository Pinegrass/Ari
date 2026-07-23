/**
 * palettes — theme groundwork (Sprint 3, C4). The app shipped a single
 * paper-based (light) palette in `tokens.ts`; this file re-exposes it as the
 * `light` Palette and adds a *draft* `dark` palette so a future dark mode has a
 * concrete target.
 *
 * Sprint 8: forest→teal VALUE shift (Kleriq owns forest #1F3D2B in the
 * Pinegrass system; Ari's anchor is deep teal #0F2B2A, matching aritomo-web).
 * Key names unchanged — no screen code breaks.
 *
 * IMPORTANT: the dark palette is unreviewed scaffolding. Dark mode is gated OFF
 * (see ThemeContext `DARK_ENABLED`) until (a) every screen sources colours from
 * `useColors()` rather than the static `color` import, and (b) a designer signs
 * off on these values. Until then `useColors()` always returns `light`, so no
 * screen can half-render a broken dark theme.
 */
import { color } from './tokens';

/** Every themeable colour key. Mirrors the `color` token object 1:1. */
export type Palette = Record<keyof typeof color, string>;

/** Production palette — the teal-on-cream design system, verbatim. */
export const lightPalette: Palette = { ...color };

/**
 * DRAFT dark palette (teal-on-charcoal). Not shipped — see the file header.
 * Values are a reasonable first pass, not a finished design.
 */
export const darkPalette: Palette = {
  forest: '#2E6B66', // primary action — brightened teal for contrast on charcoal
  forest2: '#3D7A74',
  forestDeep: '#EAF3F1', // headings become light on dark
  moss: '#8AA8A3',
  cream: '#0E1514', // app background — near-black charcoal
  cream2: '#16201E', // sunk panels
  card: '#182421', // raised cards
  line: '#263330', // hairlines
  lineStrong: '#33453F',
  ink: '#EAF3F1', // primary text
  inkSoft: '#A6B8B3',
  inkFaint: '#6E837D',
  clay: '#D9814F', // spending accent — brightened
  clayTint: '#2A211A',
  gold: '#C9A54A',
};

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';
