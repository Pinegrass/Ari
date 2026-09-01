import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';
import { useAuth } from '../context/AuthContext';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;

interface ModuleItem {
  key: keyof MainStackParamList | 'Transactions';
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle: string;
  /** ISO country codes this module applies to. Omit for universal modules. */
  countries?: string[];
}

const MODULES: ModuleItem[] = [
  {
    key: 'Transactions',
    icon: 'trending-up',
    iconColor: color.forest,
    title: 'Trends & Insights',
    subtitle: 'Spending patterns, categories and recent activity',
  },
  {
    key: 'SmartLedger',
    icon: 'list',
    iconColor: color.forest2,
    title: 'Smart Ledger',
    subtitle: 'Recurring entries, tags & multi-source income',
  },
  {
    key: 'BudgetPlanner',
    icon: 'target',
    iconColor: color.clay,
    title: 'Budget Planner',
    subtitle: 'Monthly targets with rollover tracking',
  },
  {
    key: 'Bills',
    icon: 'bell',
    iconColor: color.clay,
    title: 'Bills & reminders',
    subtitle: 'Rent, EMI & bill due-date reminders',
  },
  {
    key: 'SavingsGoals',
    icon: 'flag',
    iconColor: color.forest,
    title: 'Savings Goals',
    subtitle: 'Track goals & contributions',
  },
  {
    key: 'TaxEstimator',
    icon: 'briefcase',
    iconColor: color.moss,
    title: 'Tax Estimator',
    subtitle: 'Old vs New regime, 80C/80D, HRA, GST',
    // Indian tax law (FY slabs, 80C/80D, HRA, GST) — meaningless elsewhere.
    // Other markets get their own estimator when tax rules are modelled.
    countries: ['IN'],
  },
  {
    key: 'PeriodicReports',
    icon: 'activity',
    iconColor: color.forest,
    title: 'Daily, Weekly & Monthly',
    subtitle: 'Visual reports for every money rhythm',
  },
  {
    key: 'PnlReport',
    icon: 'bar-chart',
    iconColor: color.gold,
    title: 'P&L Reports',
    subtitle: 'Income vs expense trends & insights',
  },
  {
    key: 'DailyHeatmap',
    icon: 'calendar',
    iconColor: color.forest,
    title: 'Daily Heatmap',
    subtitle: 'Which days of the month you spend the most',
  },
  {
    key: 'Groups',
    icon: 'user',
    iconColor: color.forest2,
    title: 'Shared Expenses',
    subtitle: 'Split with friends, settle via UPI',
  },
  {
    key: 'TodoNotes',
    icon: 'edit',
    iconColor: color.moss,
    title: 'To-do Notes',
    subtitle: 'Track financial tasks and due dates',
  },
];

/** Modules visible for a user's country (defaults to IN, the origin market). */
export function visibleModules(country: string | null | undefined): ModuleItem[] {
  const c = country ?? 'IN';
  return MODULES.filter((m) => !m.countries || m.countries.includes(c));
}

interface AccountantScreenProps {
  embedded?: boolean;
}

export default function AccountantScreen({ embedded = false }: AccountantScreenProps) {
  const navigation = useNavigation<Nav>();
  const haptics = useHaptics();
  const { user } = useAuth();
  const country = user?.country ?? 'IN';
  const modules = visibleModules(country);

  return (
    <ScreenShell edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {!embedded && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color={color.ink} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>Ari Accountant</Text>
          <Text style={styles.headerSub}>Your personal finance toolkit</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={styles.moduleCard}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={mod.title}
            onPress={() => {
              haptics.light();
              if (mod.key === 'Transactions') {
                navigation.navigate('Tabs', { screen: 'Transactions' });
              } else {
                navigation.navigate(mod.key as any);
              }
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: mod.iconColor + '20' }]}>
              <Icon name={mod.icon} size={24} color={mod.iconColor} />
            </View>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSub}>
                {mod.key === 'Groups' && country !== 'IN'
                  ? 'Split expenses with friends'
                  : mod.subtitle}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={color.inkFaint} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: font.bodySemi, color: color.ink },
  headerSub: { fontSize: 12, color: color.inkSoft, fontFamily: font.body, marginTop: 2 },
  content: { padding: 20, gap: 12 },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: { flex: 1 },
  moduleTitle: { fontSize: 15, fontFamily: font.bodySemi, color: color.ink },
  moduleSub: { fontSize: 12, color: color.inkSoft, fontFamily: font.body, marginTop: 3 },
});
