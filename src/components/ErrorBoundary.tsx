import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { phrase } from '../i18n/phrases';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { captureError } from '../config/sentry';
import { color, font } from '../theme/tokens';
import Icon from './ui/Icon';

interface Props {
  children: React.ReactNode;
}

interface State {
  language?: string;
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Tag root-boundary catches so Sentry can split them from per-screen
    // boundaries when we add those. The component-stack fragment gives us
    // a quick triage hint without bloating the event payload.
    void AsyncStorage.getItem('ari_language').then(value => this.setState({ language: value === 'hi' ? 'hi' : 'en' })).catch(() => {});
    captureError(error, {
      boundary: 'root',
      component: errorInfo.componentStack?.substring(0, 200) ?? 'unknown',
    });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const copy = (text: string) => phrase(this.state.language ?? 'en', text);
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Icon name="alert-triangle" size={64} color={color.clay} />
          <Text style={styles.title}>{copy('Something went wrong')}</Text>
          <Text style={styles.message}>
            {copy('Ari could not display this screen. Try again, and check recent changes before repeating a save.')}
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.debugBox}>
              <Text style={styles.debugText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy("Try Again")} style={styles.btn} onPress={this.handleRestart} activeOpacity={0.85}>
            <Text style={styles.btnText}>{copy('Try Again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontFamily: font.displayBold,
    color: color.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: font.body,
    color: color.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  debugBox: {
    backgroundColor: color.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.clay,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  debugText: {
    fontSize: 11,
    color: color.clay,
    fontFamily: 'monospace',
  },
  btn: {
    backgroundColor: color.forest,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 16,
    fontFamily: font.bodyBold,
    color: color.cream,
  },
});
