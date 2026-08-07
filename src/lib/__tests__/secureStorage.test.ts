import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '../secureStorage';

const secure = new Map<string, string>();

beforeEach(() => {
  secure.clear();
  jest.clearAllMocks();
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => secure.get(key) ?? null);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
    secure.set(key, value);
  });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
    secure.delete(key);
  });
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

it('stores small values in a single secure item', async () => {
  await secureStorage.setItem('ari_token', 'small-token');
  expect(secure.get('ari_token')).toBe('small-token');
  await expect(secureStorage.getItem('ari_token')).resolves.toBe('small-token');
});

it('chunks and reconstructs Supabase sessions larger than SecureStore limits', async () => {
  const session = 'x'.repeat(5000);
  await secureStorage.setItem('supabase-session', session);

  expect(secure.has('supabase-session')).toBe(false);
  expect(secure.get('supabase-session.__chunks')).toBe('3');
  expect(secure.get('supabase-session.__chunk_0')?.length).toBeLessThanOrEqual(1800);
  await expect(secureStorage.getItem('supabase-session')).resolves.toBe(session);
});

it('removes every chunk and its manifest', async () => {
  await secureStorage.setItem('supabase-session', 'x'.repeat(5000));
  await secureStorage.removeItem('supabase-session');
  expect([...secure.keys()].filter((key) => key.startsWith('supabase-session'))).toEqual([]);
});

