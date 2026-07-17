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
  // actuals fail in CI. Local actuals 2026-07-05 (Sprint 4 final): 57.3/59.1/
  // 51.0/58.5 stmts/branch/funcs/lines. Raise as coverage grows, but always
  // leave headroom for cross-platform jitter — never set flush against actual.
  coverageThreshold: {
    global: {
      branches: 58,
      functions: 50,
      lines: 57,
      statements: 56,
    },
  },
};
