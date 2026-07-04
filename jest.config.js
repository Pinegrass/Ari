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
  // Ratchet: set just below current actuals (50.6/54.0/44.9/52.0 stmts/branch/
  // funcs/lines as of 2026-07-04, Sprint 3 — bill reminders added billSchedule +
  // bills unit suites) to catch regressions. Raise these as coverage grows —
  // never lower them.
  coverageThreshold: {
    global: {
      branches: 53,
      functions: 44,
      lines: 51,
      statements: 50,
    },
  },
};
