/** SIWX sign via the active xPortal session, using the SDK Message contract. */
import { getXPortalSession } from './xportalWc'
import { signAccessWithProvider } from './accessMessagePayload'

export async function signAccessMessage(
  message: string,
): Promise<{ ok: true; signature: string } | { ok: false; error: string }> {
  const session = getXPortalSession()
  if (!session?.provider) return { ok: false, error: 'no_xportal_session' }
  return signAccessWithProvider(session.provider, message)
}
