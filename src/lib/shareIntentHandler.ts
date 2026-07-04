import * as Linking from 'expo-linking';

/**
 * Extract the usable string from an expo-share-intent payload. Android's
 * ACTION_SEND delivers the shared text (e.g. a bank SMS) as `text`; a shared
 * link arrives as `webUrl`. We prefer text, fall back to the URL. Pure — the
 * native delivery is handled by the useShareIntent hook in App.tsx.
 */
export function sharedTextFromIntent(
  intent: { text?: string | null; webUrl?: string | null } | null | undefined,
): string | null {
  if (!intent) return null;
  const text = intent.text?.trim();
  if (text) return text;
  const url = intent.webUrl?.trim();
  if (url) return url;
  return null;
}

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
