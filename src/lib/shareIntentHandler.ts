import * as Linking from 'expo-linking';

export function parseShareLink(url: string): string | null {
  const parsed = Linking.parse(url);
  if (parsed.path === 'share' && typeof parsed.queryParams?.text === 'string') {
    return decodeURIComponent(parsed.queryParams.text);
  }
  return null;
}

export async function getInitialSharedText(): Promise<string | null> {
  const url = await Linking.getInitialURL();
  if (!url) return null;
  return parseShareLink(url);
}

export function addShareIntentListener(cb: (text: string) => void): { remove: () => void } {
  const sub = Linking.addEventListener('url', ({ url }) => {
    const text = parseShareLink(url);
    if (text) cb(text);
  });
  return { remove: () => sub.remove() };
}
