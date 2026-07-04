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
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
  // Coverage gate is scoped to the logic layers the unit suite targets;
  // screens/components/navigation are covered by Maestro e2e instead.
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/lib/**/*.ts',
    'src/api/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Ratchet: set just below current actuals (56.4/58.5/50.2/57.8 stmts/branch/
  // funcs/lines as of 2026-07-04, Sprint 4 — SSL pinning, UPI builder,
  // upcoming-charges, and syncEngine hardening added unit suites). Raise these
  // as coverage grows — never lower them.
  coverageThreshold: {
    global: {
      branches: 58,
      functions: 50,
      lines: 57,
      statements: 56,
    },
  },
};
