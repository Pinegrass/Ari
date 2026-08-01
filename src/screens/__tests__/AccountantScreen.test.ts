import { visibleModules } from '../AccountantScreen';

// AccountantScreen imports navigation/theme chains; mock the heavy natives so
// the pure filter can be unit-tested without rendering.
jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));

describe('visibleModules', () => {
  it('shows the Indian Tax Estimator to Indian users', () => {
    expect(visibleModules('IN').some((m) => m.key === 'TaxEstimator')).toBe(true);
  });

  it('defaults to the Indian module set when country is unknown', () => {
    expect(visibleModules(undefined).some((m) => m.key === 'TaxEstimator')).toBe(true);
    expect(visibleModules(null).some((m) => m.key === 'TaxEstimator')).toBe(true);
  });

  it.each(['US', 'GB', 'AU'])('hides the Indian Tax Estimator for %s users', (country) => {
    const mods = visibleModules(country);
    expect(mods.some((m) => m.key === 'TaxEstimator')).toBe(false);
    // Universal modules stay visible.
    expect(mods.some((m) => m.key === 'SavingsGoals')).toBe(true);
    expect(mods.some((m) => m.key === 'PnlReport')).toBe(true);
  });
});
