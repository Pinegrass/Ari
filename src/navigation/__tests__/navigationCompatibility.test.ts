import { CommonActions, StackRouter } from '@react-navigation/routers';
import { getPathFromState, getStateFromPath } from '@react-navigation/native';

const options = {
  routeNames: ['Tabs', 'Accountant', 'PeriodicReports', 'AddTransaction'],
  routeParamList: {}, routeGetIdList: {},
};

it('returns from a standalone Accountant screen to the existing tabs', () => {
  const router = StackRouter({ initialRouteName: 'Tabs' });
  const initial = router.getInitialState(options);
  const accountant = router.getRehydratedState(router.getStateForAction(initial,
    CommonActions.navigate('Accountant'), options)!, options);
  const result = router.getRehydratedState(router.getStateForAction(accountant,
    CommonActions.navigate('Tabs', { screen: 'Transactions' }, { pop: true }), options)!, options);
  expect(result.routes.map(route => route.name)).toEqual(['Tabs']);
  expect(result.routes[0].params).toEqual({ screen: 'Transactions' });
});

it('preserves a historical report when returning from an entry action', () => {
  const router = StackRouter({ initialRouteName: 'Tabs' });
  const initial = router.getInitialState(options);
  const report = router.getRehydratedState(router.getStateForAction(initial,
    CommonActions.navigate('PeriodicReports', { period: 'monthly', anchor: '2026-10-31' }), options)!, options);
  const entry = router.getRehydratedState(router.getStateForAction(report,
    CommonActions.navigate('AddTransaction', { type: 'income' }), options)!, options);
  const result = router.getRehydratedState(router.getStateForAction(entry, CommonActions.goBack(), options)!, options);
  expect(result.routes[result.index]).toEqual(report.routes[report.index]);
});

it('round-trips international link parameters with the patched query parser', () => {
  const config = { screens: { PeriodicReports: 'reports' } };
  const state = getStateFromPath('/reports?label=Caf%C3%A9&note=%D9%85%D8%A7%D9%84', config)!;
  expect(state.routes[0].params).toEqual({ label: 'Café', note: 'مال' });
  const path = getPathFromState(state, config);
  expect(getStateFromPath(path, config)?.routes[0].params).toEqual(state.routes[0].params);
});
