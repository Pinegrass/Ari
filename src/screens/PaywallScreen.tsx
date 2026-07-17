import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import ScreenShell from '../components/ScreenShell';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { color, font } from '../theme/tokens';
import { track } from '../lib/analytics';

const ENTITLEMENT = 'pro';
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
let configuredFor: string | null = null;

async function configureRevenueCat(userId: string) {
  if (!API_KEY) throw new Error('Subscriptions are not configured in this build.');
  if (configuredFor === null) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    configuredFor = userId;
  } else if (configuredFor !== userId) {
    await Purchases.logIn(userId);
    configuredFor = userId;
  }
}

export default function PaywallScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, { source?: string } | undefined>, string>>();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    track('paywall_viewed', {
      source_screen: route.params?.source ?? 'unknown',
      current_tier: user?.tier ?? 'free',
    });
    if (!user) {
      setError('Sign in before upgrading so your purchase can be restored on every device.');
      return;
    }
    configureRevenueCat(String(user.id))
      .then(() => setReady(true))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load plans.'));
  }, [route.params?.source, user]);

  if (error) {
    return (
      <ScreenShell edges={['top']}>
        <View style={styles.fallback}>
          <Text style={styles.title}>Ari Pro</Text>
          <Text style={styles.body}>{error}</Text>
          <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.closeText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenShell>
    );
  }

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color={color.forest} /></View>;
  }

  return (
    <RevenueCatUI.Paywall
      options={{ displayCloseButton: true }}
      onPurchaseCompleted={({ customerInfo, storeTransaction }) => {
        const active = customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
        track('pro_purchase_completed', { active, product_id: storeTransaction.productIdentifier });
        if (active) navigation.goBack();
      }}
      onPurchaseCancelled={() => track('pro_purchase_cancelled')}
      onPurchaseError={({ error: purchaseError }) =>
        track('pro_purchase_failed', { code: purchaseError.code, message: purchaseError.message })
      }
      onRestoreCompleted={({ customerInfo }) => {
        const active = customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
        track('pro_purchase_completed', { active, source_screen: 'restore' });
        if (active) navigation.goBack();
      }}
      onDismiss={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.cream },
  fallback: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { color: color.ink, fontFamily: font.displayBold, fontSize: 28, marginBottom: 12 },
  body: { color: color.inkSoft, fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  close: { marginTop: 24, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.line, borderRadius: 12 },
  closeText: { color: color.forest, fontFamily: font.bodyBold, fontSize: 15 },
});
