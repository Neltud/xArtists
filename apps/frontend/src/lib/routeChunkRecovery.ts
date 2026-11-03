/**
 * Version-skew recovery for dynamic route chunks after a Vite/Pages deploy.
 * Import errors can be cached by the browser module map: React remount alone
 * cannot recover a deleted hashed JS/CSS asset. Never reload automatically:
 * an in-progress xPortal wallet approval must not be interrupted.
 */
export function needsFreshBundle(message: unknown): boolean {
  if (typeof message !== 'string') return false
  return /Failed to fetch dynamically imported module|Loading (?:CSS )?chunk|Importing a module script failed|Unable to preload (?:CSS|JS)|Failed to load module script|ChunkLoadError/i.test(message)
}
