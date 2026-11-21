import { apiRequest } from '../client';
import { getPeriodicReport } from '../reports';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

it.each(['es', 'fr', 'pt-BR', 'ar'])('keeps %s reports available on the original report API', language => {
  getPeriodicReport('monthly', language, '2026-10-31');
  expect(apiRequest).toHaveBeenLastCalledWith('/reports/periodic?period=monthly&language=en&anchor=2026-10-31');
});

it('keeps Hindi report explanations and historical dates', () => {
  getPeriodicReport('weekly', 'hi', '2026-11-14');
  expect(apiRequest).toHaveBeenLastCalledWith('/reports/periodic?period=weekly&language=hi&anchor=2026-11-14');
});
