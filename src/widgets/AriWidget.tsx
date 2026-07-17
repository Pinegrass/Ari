import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../lib/widgetData';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * The "Spent today" + budget-ring home-screen widget (Android, D6). Rendered by
 * the widget task handler from a WidgetSnapshot. Tapping it deep-links into fast
 * entry via the `ari://add` clickAction.
 *
 * NOTE: this renders on the OS widget host, not in the RN tree — it can only use
 * react-native-android-widget primitives, and it can only be verified on a
 * device build (build-gated).
 */

// Forest-on-cream palette (widgets can't import the RN StyleSheet tokens).
const CREAM = '#F4F1E8';
const FOREST = '#1F3D2B';
const MOSS = '#4B7355';
const CLAY = '#B5502F';
const INK_SOFT = '#5E6B60';

function fmt(n: number): string {
  return formatCurrency(Math.round(n));
}

export function renderAriWidget(snapshot: WidgetSnapshot | null) {
  const s: WidgetSnapshot = snapshot ?? {
    spentToday: 0,
    spentThisMonth: 0,
    monthBudget: 0,
    budgetFraction: 0,
    overBudget: false,
    updatedAt: '',
  };

  // Progress bar as two flex-weighted cells (the widget host has no % widths).
  // Keep a minimum sliver of fill so a tiny spend is still visible.
  const fillWeight = Math.max(Math.round(s.budgetFraction * 100), 2);
  const restWeight = Math.max(100 - fillWeight, 0);
  const barColor = s.overBudget ? CLAY : MOSS;

  return (
    <FlexWidget
      clickAction="OPEN_ADD"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: CREAM,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text="SPENT TODAY"
          style={{ fontSize: 11, color: INK_SOFT, letterSpacing: 1 }}
        />
        <TextWidget
          text={fmt(s.spentToday)}
          style={{ fontSize: 28, fontWeight: 'bold', color: FOREST }}
        />
      </FlexWidget>

      {/* Budget progress bar (track + proportional fill). */}
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        <FlexWidget
          style={{
            height: 8,
            width: 'match_parent',
            backgroundColor: '#E3DFD2',
            borderRadius: 4,
            flexDirection: 'row',
          }}
        >
          <FlexWidget style={{ flex: fillWeight, height: 8, backgroundColor: barColor, borderRadius: 4 }} />
          {restWeight > 0 && <FlexWidget style={{ flex: restWeight, height: 8 }} />}
        </FlexWidget>
        <TextWidget
          text={
            s.monthBudget > 0
              ? `${fmt(s.spentThisMonth)} of ${fmt(s.monthBudget)} this month`
              : `${fmt(s.spentThisMonth)} this month`
          }
          style={{ fontSize: 11, color: INK_SOFT, marginTop: 6 }}
        />
      </FlexWidget>

      <TextWidget text="+ Add expense" style={{ fontSize: 12, color: MOSS }} />
    </FlexWidget>
  );
}

export const ARI_WIDGET_NAME = 'AriSpentToday';
