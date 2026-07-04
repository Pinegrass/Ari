import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Register the Android home-screen widget task handler (D6). Guarded: the
// native module only exists on Android device builds; a require failure (iOS,
// Expo Go, web) must not break app startup.
if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    /* widget module unavailable — app runs without the widget */
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
