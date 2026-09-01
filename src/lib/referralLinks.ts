const INVITE_CODE = /^ARI[A-Z0-9]{6}$/i;

/** Extract an Ari invite code from verified HTTPS or custom-scheme links. */
export function inviteCodeFromUrl(url: string): string | null {
  const queryMatch = url.match(/[?&]code=([^&#]+)/i);
  if (queryMatch) {
    try {
      const code = decodeURIComponent(queryMatch[1]).trim();
      if (INVITE_CODE.test(code)) return code.toUpperCase();
    } catch {
      return null;
    }
  }
  const pathMatch = url.match(/(?:^|\/)invite\/([A-Za-z0-9]{9})(?:$|[/?#])/i);
  const code = pathMatch?.[1];
  return code && INVITE_CODE.test(code) ? code.toUpperCase() : null;
}
