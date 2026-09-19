// Request replay boundary, independent of optional measurement consent.
let revision = 0;
let account: string | null = null;
export function requestSessionRevision() { return revision; }
export function resetRequestSession() { revision++; account = null; }
export function observeRequestAccount(id: string | null) {
  if (id !== account) { revision++; account = id; }
}
