/**
 * Ari teal-on-cream design system — single source of truth.
 *
 * Sprint 2 ("Fast Entry + Forest Reskin"). Every color/font/size value lives
 * here. No inline hex anywhere else in the app.
 *
 * Sprint 8 (Pinegrass design system): brand ink shifted forest → DEEP TEAL
 * (#0F2B2A). Forest #1F3D2B is Kleriq's owned anchor (see Pinegrass/pinegrass-
 * tokens); teal unifies Ari mobile with aritomo-web while preserving the
 * identical near-black-ink feel. Cream paper + clay + gold rules unchanged.
 *
 * Rules (the anti-slop guardrails):
 *   1. No gradients. Every surface is a flat field.
 *   2. Warm paper, never pure white. Background = cream, cards = card.
 *   3. teal is structural, clay is spending/Add, gold is a sparing accent
 *      (max twice per screen) and NEVER a fill.
 *   4. Hairline borders (line) over drop shadows.
 */

/** Surfaces and text on the cream/paper side of the app. */
export const color = {
  teal: '#0F2B2A', // brand ink, primary actions, hero block, Tomo mark (was forest #1F3D2B — Kleriq's anchor)
  teal2: '#1A3D3B', // lighter teal — "received", secondary action
  tealDeep: '#081817', // headings, toast bg
  moss: '#5C7370', // muted secondary text / links (teal-shifted)
  cream: '#F4EFE3', // app background (paper)
  cream2: '#EDE7D7', // sunk panels, pressed states, segment track
  card: '#FBF8F0', // raised cards, keypad keys
  line: '#E0D8C4', // hairlines
  lineStrong: '#CFC5AC', // stronger borders
  ink: '#23291F', // primary text on cream
  inkSoft: '#6E6B5C', // secondary text
  inkFaint: '#9A9683', // tertiary / decoration only (low contrast — not for reading text)
  clay: '#B4612F', // spending accent + Add FAB (pairs with Aritomo coral family)
  clayTint: '#F0E2D2',
  gold: '#A8862C', // single sparing highlight — never a fill
} as const;

/** Text tints that sit ON the dark teal hero surface. */
export const onTeal = {
  textBright: '#FBF8F0', // hero amount
  text: '#EFEAD9', // pill values, body on teal
  muted: '#A9C6BD', // hero label
  label: '#8FB0A8', // pill keys / rupee mark
  clay: '#E8A06B', // "money out" value on teal
} as const;

/** @deprecated use onTeal — kept so existing imports don't break */
export const onForest = onTeal;

/** Font family names as exported by @expo-google-fonts/{fraunces,inter}. */
export const font = {
  display: 'Fraunces_500Medium',
  displaySemi: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale (pt). Display sizes use `font.display*`, the rest use `font.body*`. */
export const type = {
  heroAmount: 54,
  addAmount: 60,
  screenTitle: 16,
  sectionHead: 17,
  greeting: 27,
  body: 13.5,
  caption: 12,
  eyebrow: 11,
} as const;
