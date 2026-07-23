module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-native-async-storage/async-storage)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Agent worktrees carry a full copy of the repo; without this Jest runs every suite twice.
  // Anchored to <rootDir> so Jest still works when run from inside a worktree
  // (whose own absolute path contains /.claude/).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/aritomo-web/'],
  // Coverage gate is scoped to the logic layers the unit suite targets;
  // screens/components/navigation are covered by Maestro e2e instead.
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/lib/**/*.ts',
    'src/api/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Ratchet: keep a ~1% buffer BELOW current actuals. Coverage measured on the
  // Linux CI runner runs ~0.15% under a local Windows run (platform-specific
  // branches like Platform.OS / __DEV__), so thresholds set flush against local
  // actuals fail in CI. Raise as coverage grows, but always leave headroom for
  // cross-platform jitter — never set flush against actual.
  // CI actuals 2026-07-22 (master @ b878f70): 55.98/50.24/56.98 stmts/branch/
  // lines (functions above 50). DEBT: coverage dropped ~9pts on branches since
  // Sprint 4 (new 0%-coverage modules: useVoiceInput, socialAuth, otaUpdates,
  // push, detectCountry, analytics). Restore branches toward 58 with tests for
  // those modules; do not lower these thresholds further.
  coverageThreshold: {
    global: {
      branches: 49,
      functions: 50,
      lines: 55,
      statements: 54,
    },
  },
};
