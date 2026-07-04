import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  lightPalette,
  darkPalette,
  type Palette,
  type ThemePreference,
  type ResolvedScheme,
} from '../theme/palettes';

/**
 * ThemeContext — theme groundwork (Sprint 3, C4).
 *
 * Threads the active colour palette through the app via `useColors()` and holds
 * a persisted appearance preference (system / light / dark). This is the
 * plumbing a real dark mode needs; the switch itself is NOT thrown yet.
 *
 * `DARK_ENABLED` is the master gate. While it's false, `useColors()` always
 * returns the production light palette regardless of preference or OS setting,
 * so a not-yet-migrated screen can never render a broken half-dark UI. The
 * preference is still stored, so flipping this flag in Sprint 4 — once every
 * screen reads from `useColors()` and the dark palette is signed off — lights up
 * dark mode without further plumbing.
 */
const DARK_ENABLED = false;

const THEME_PREF_KEY = 'ari_theme_pref';

interface ThemeContextValue {
  /** The resolved palette to render with (always light while DARK_ENABLED=false). */
  colors: Palette;
  /** The resolved scheme after applying preference + OS + the gate. */
  scheme: ResolvedScheme;
  /** The user's stored preference (system by default). */
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** Whether dark mode is switched on yet (Sprint 4). Drives the Settings UI. */
  darkEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveScheme(pref: ThemePreference, system: ResolvedScheme): ResolvedScheme {
  if (!DARK_ENABLED) return 'light';
  const chosen = pref === 'system' ? system : pref;
  return chosen === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ResolvedScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Hydrate the stored preference once.
  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY).then((val) => {
      if (val === 'system' || val === 'light' || val === 'dark') {
        setPreferenceState(val);
      }
    });
  }, []);

  // Track OS light/dark changes so a 'system' preference stays live.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(THEME_PREF_KEY, pref).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(preference, systemScheme);
    return {
      colors: scheme === 'dark' ? darkPalette : lightPalette,
      scheme,
      preference,
      setPreference,
      darkEnabled: DARK_ENABLED,
    };
  }, [preference, systemScheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Defensive fallback so a component rendered outside the provider (tests,
    // storybook) still gets the production palette instead of crashing.
    return {
      colors: lightPalette,
      scheme: 'light',
      preference: 'system',
      setPreference: () => {},
      darkEnabled: DARK_ENABLED,
    };
  }
  return ctx;
}

/** The active colour palette. Drop-in replacement for the static `color` import
 *  as screens get migrated. Always light until dark mode ships (Sprint 4). */
export function useColors(): Palette {
  return useThemeContext().colors;
}

/** Appearance preference + setter, for the Settings control. */
export function useThemePreference() {
  const { preference, setPreference, scheme, darkEnabled } = useThemeContext();
  return { preference, setPreference, scheme, darkEnabled };
}
