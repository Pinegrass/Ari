import { Linking } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { loadWidgetSnapshot } from '../lib/widgetData';
import { renderAriWidget, ARI_WIDGET_NAME } from './AriWidget';

/**
 * OS-invoked handler for widget lifecycle events (Android, D6). Registered in
 * index.ts via registerWidgetTaskHandler. Runs in a headless JS task, so it may
 * execute while the app process is not foregrounded.
 *
 * Build-gated: only exercised on a device build with the widget on the home
 * screen.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const widgetName = props.widgetInfo.widgetName;
  if (widgetName !== ARI_WIDGET_NAME) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await loadWidgetSnapshot();
      props.renderWidget(renderAriWidget(snapshot));
      break;
    }
    case 'WIDGET_CLICK': {
      // Deep-link into fast entry. App.tsx routes ari://add -> AddTransaction.
      if (props.clickAction === 'OPEN_ADD') {
        try {
          await Linking.openURL('ari://add');
        } catch {
          /* if the deep link can't open, the OS still foregrounds the app */
        }
      }
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
