import {resetRequestSession,observeRequestAccount} from '../../lib/requestSession';
import {setMeasurementEpoch,setMeasurementPrivate} from '../../lib/measurementSession';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, ApiError, deleteAccountRequest } from '../client';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => false),
  supabase: {
    auth: {
      refreshSession: jest.fn(),
    },
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRequestSession();
    setMeasurementEpoch(null);setMeasurementPrivate(false);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
  });

  it('cleans the captured deleted owner on authoritative success but discards stale response data', async () => {
    observeRequestAccount('owner-a');
    const cleanup = jest.fn().mockResolvedValue(undefined);
    mockFetch.mockImplementationOnce(async () => {
      resetRequestSession(); observeRequestAccount('owner-b');
      return { ok: true, json: async () => ({ message: 'deleted owner-a' }) };
    });
    await expect(deleteAccountRequest('password', cleanup)).rejects.toMatchObject({ status: 409 });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('never retries uncertain account deletion and never cleans on network failure', async () => {
    const cleanup = jest.fn();
    mockFetch.mockRejectedValueOnce(new Error('uncertain'));
    await expect(deleteAccountRequest('password', cleanup)).rejects.toMatchObject({ status: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('does not retry or clean local records on an unparseable deletion response', async () => {
    const cleanup = jest.fn();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error('truncated'); } });
    await expect(deleteAccountRequest('password', cleanup)).rejects.toMatchObject({ status: 200, message: 'Invalid server response' });
    expect(cleanup).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('makes GET request with correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiRequest('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('includes auth token when available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiRequest('/protected');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' }),
    });

    await expect(apiRequest('/fail')).rejects.toThrow(ApiError);
    await expect(apiRequest('/fail')).rejects.toThrow('Bad request');
  });

  it('throws ApiError with generic message on json parse failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(apiRequest('/error')).rejects.toThrow('Invalid server response');
  });

  it('returns parsed JSON on success', async () => {
    const expected = { transactions: [{ id: '1' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expected),
    });

    const result = await apiRequest('/transactions');
    expect(result).toEqual(expected);
  });

  it.each(['GET', 'PUT', 'PATCH', 'DELETE'])('retries one transient network failure for idempotent %s', async (method) => {
    mockFetch
      .mockRejectedValueOnce(new Error('radio transition'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recovered: true }),
      });

    await expect(apiRequest('/safe-mutation', { method })).resolves.toEqual({ recovered: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST after a network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('radio transition'));

    await expect(apiRequest('/transactions', { method: 'POST' })).rejects.toMatchObject({ status: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propagates 401 with correct status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    try {
      await apiRequest('/me');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
    }
  });

  it('refreshes and retries /auth/me after an expired access token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('old-token');
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'new-token' } },
      error: null,
    });
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Expired token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'u1', email: 'demo@ari.app' }),
      });

    const result = await apiRequest('/auth/me');

    expect(result).toEqual({ id: 'u1', email: 'demo@ari.app' });
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-token',
        }),
      })
    );
  });
});

describe('confirmed-action measurement consent',()=>{
  it('adds consent only to confirmed-action requests and suppresses it in private mode',async()=>{
    setMeasurementPrivate(false);setMeasurementEpoch('synthetic-epoch');
    mockFetch.mockResolvedValue({ok:true,json:()=>Promise.resolve({})});
    await apiRequest('/transactions',{method:'POST',body:'{}'});
    expect(mockFetch.mock.calls.at(-1)[1].headers['X-Measurement-Consent-Epoch']).toBe('synthetic-epoch');
    await apiRequest('/billing/trial',{method:'POST'});
    expect(mockFetch.mock.calls.at(-1)[1].headers['X-Measurement-Consent-Epoch']).toBe('synthetic-epoch');
    setMeasurementPrivate(true);
    await apiRequest('/planning',{method:'PUT',body:'{}'});
    expect(mockFetch.mock.calls.at(-1)[1].headers['X-Measurement-Consent-Epoch']).toBeUndefined();
    setMeasurementPrivate(false);
    await apiRequest('/auth/me');
    expect(mockFetch.mock.calls.at(-1)[1].headers['X-Measurement-Consent-Epoch']).toBeUndefined();
    setMeasurementEpoch(null);
  });
});

describe('account-bound request replay', () => {
  beforeEach(()=>{jest.clearAllMocks();resetRequestSession();observeRequestAccount('a');(isSupabaseConfigured as jest.Mock).mockReturnValue(true);(AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-a');});
  it.each(['PUT','DELETE'])('does not replay %s after account switch during a lost response',async(method)=>{
    let reject!: (error:unknown)=>void;
    mockFetch.mockReturnValueOnce(new Promise((_,r)=>{reject=r;}));
    const request=apiRequest('/planning',{method,body:'{"cash":"private draft"}'});
    while(!mockFetch.mock.calls.length) await Promise.resolve();
    observeRequestAccount('b');(AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-b');
    reject(new Error('lost response'));
    await expect(request).rejects.toMatchObject({status:409});
    expect(mockFetch).toHaveBeenCalledTimes(1);expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
  });
  it('does not refresh after logout while a 401 response is pending',async()=>{
    let finish!: (value:unknown)=>void;
    mockFetch.mockReturnValueOnce(new Promise(r=>{finish=r;}));
    const request=apiRequest('/planning',{method:'PUT'});
    while(!mockFetch.mock.calls.length) await Promise.resolve();
    resetRequestSession();finish({ok:false,status:401,json:()=>Promise.resolve({error:'Expired'})});
    await expect(request).rejects.toMatchObject({status:409});expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
  });
  it('does not replay or mirror a refresh completed after logout',async()=>{
    let finish!: (value:unknown)=>void;
    mockFetch.mockResolvedValueOnce({ok:false,status:401,json:()=>Promise.resolve({error:'Expired'})});
    (supabase.auth.refreshSession as jest.Mock).mockReturnValueOnce(new Promise(r=>{finish=r;}));
    const request=apiRequest('/planning',{method:'PUT'});
    while(!(supabase.auth.refreshSession as jest.Mock).mock.calls.length) await Promise.resolve();
    resetRequestSession();finish({data:{session:{access_token:'old-refreshed'}},error:null});
    await expect(request).rejects.toMatchObject({status:409});expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('ari_token','old-refreshed');
  });
});
