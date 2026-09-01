import { inviteCodeFromUrl } from '../referralLinks';

describe('inviteCodeFromUrl', () => {
  it('reads the verified HTTPS query link', () => {
    expect(inviteCodeFromUrl('https://aritomo.in/invite?code=ari12ab34')).toBe('ARI12AB34');
  });

  it('reads the custom-scheme path link', () => {
    expect(inviteCodeFromUrl('ari://invite/ARI12AB34')).toBe('ARI12AB34');
  });

  it('rejects malformed and unrelated links', () => {
    expect(inviteCodeFromUrl('https://aritomo.in/invite?code=bad')).toBeNull();
    expect(inviteCodeFromUrl('https://aritomo.in/login')).toBeNull();
  });
});
