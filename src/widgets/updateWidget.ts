/**
 * updateWidget — the bridge from app state to the Android home-screen widget.
 * Recomputes the snapshot, mirrors it to the shared store, and asks the OS to
 * re-render. Every native touch is guarded so this is a safe no-op on iOS,
 * Expo Go, or any build without the widget module — callers (DataContext) never
 * need to branch on platform.
 */
import { Platform } from 'react-native';
import {
  computeWidgetSnapshot,
  saveWidgetSnapshot,
  loadWidgetSnapshot,
} from '../lib/widgetData';
import type { Transaction } from '../types';

/** Push the current snapshot to the OS widget host. Best-effort. */
export async function pushWidgetUpdate(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // Lazy require so non-Android / test bundles never load the native module.
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { renderAriWidget, ARI_WIDGET_NAME } = require('./AriWidget');
    const snapshot = await loadWidgetSnapshot();
    await requestWidgetUpdate({
      widgetName: ARI_WIDGET_NAME,
      renderWidget: () => renderAriWidget(snapshot),
      widgetNotFound: () => {
        /* widget not on the home screen — nothing to update */
      },
    });
  } catch {
    /* native module absent or render failed — widget just shows stale data */
  }
}

/**
 * Recompute from the latest transactions + budgets, persist, and refresh the
 * widget. Call after every transaction write. Never throws.
 */
export async function refreshAriWidget(
  transactions: Transaction[],
  budgets: { limit: number }[],
  now: Date = new Date(),
): Promise<void> {
  try {
    await saveWidgetSnapshot(computeWidgetSnapshot(transactions, budgets, now));
    await pushWidgetUpdate();
  } catch {
    /* a widget refresh must never affect the write that triggered it */
  }
}
