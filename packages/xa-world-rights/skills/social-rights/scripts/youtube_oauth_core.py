"""XA World Rights: server-side OAuth boundary, unconnected until hosted/configured.

No HTTP server or networking here. Exchange/read callables must be trusted server
adapters, never supplied by a browser. Tests use fixtures only. No payments.
"""
import hashlib
import secrets
import threading
import time
from dataclasses import dataclass, field
from urllib.parse import urlencode, urlsplit

from youtube_readonly import READ_SCOPE, API

AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'


def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()


@dataclass(repr=False)
class AccessGrant:
    access_token: str = field(repr=False)
    expires_at: int
    session_hash: str

    def __repr__(self):
        return 'AccessGrant(REDACTED)'


class YouTubeOAuthCore:
    def __init__(self, client_id, redirect_uri, exchange=None, read=None, clock=time.time):
        uri = urlsplit(redirect_uri)
        if not client_id or not client_id.endswith('.apps.googleusercontent.com'):
            raise ValueError('configured Google client ID required')
        if uri.scheme != 'https' or not uri.hostname or uri.username or uri.password or uri.fragment or uri.query:
            raise ValueError('exact registered HTTPS callback without query/fragment required')
        self.client_id, self.redirect_uri = client_id, redirect_uri
        self._exchange, self._read, self._clock = exchange, read, clock
        self._pending, self._grants = {}, {}
        self._lock = threading.Lock()

    def begin(self, authenticated_session):
        # Session value must come from the host's authenticated server session.
        if not isinstance(authenticated_session, str) or len(authenticated_session) < 32:
            raise ValueError('authenticated server session required')
        now = int(self._clock())
        state = secrets.token_urlsafe(32)
        with self._lock:
            self._pending = {k:v for k,v in self._pending.items() if v[1] > now}
            if len(self._pending) >= 1000:
                raise ValueError('pending capacity reached')
            self._pending[hash_value(state)] = (hash_value(authenticated_session), now + 300)
        return AUTH_ENDPOINT + '?' + urlencode(dict(client_id=self.client_id, redirect_uri=self.redirect_uri,
            response_type='code', scope=READ_SCOPE, state=state, access_type='online',
            include_granted_scopes='false', prompt='consent'))

    def complete(self, authenticated_session, callback_uri, query_pairs):
        # Pairs preserve duplicates so parameter pollution is rejected.
        if not isinstance(query_pairs, list) or any(not isinstance(p, tuple) or len(p)!=2 or any(not isinstance(x,str) for x in p) for p in query_pairs):
            raise ValueError('parsed callback parameter pairs required')
        values = dict(query_pairs)
        if len(values) != len(query_pairs) or set(values) - {'code','state','error','error_description','scope','authuser','prompt','iss'}:
            raise ValueError('duplicate or unsupported callback parameter')
        state = values.get('state', '')
        if not isinstance(authenticated_session,str) or not state or len(state)>512 or callback_uri != self.redirect_uri:
            raise ValueError('callback/session mismatch')
        now = int(self._clock())
        with self._lock:
            pending = self._pending.get(hash_value(state))
            if not pending or pending[1] <= now or not secrets.compare_digest(pending[0], hash_value(authenticated_session)):
                raise ValueError('state expired, replayed or bound to another session')
            # Consume before external exchange. Ambiguous failures require fresh consent.
            del self._pending[hash_value(state)]
        if values.get('iss') not in (None, 'https://accounts.google.com'):
            raise ValueError('unexpected authorization issuer')
        if 'error' in values or not values.get('code') or len(values['code'])>8192:
            raise ValueError('authorization denied or invalid response')
        if self._exchange is None or self._read is None:
            raise ValueError('NOT_CONFIGURED: no trusted Google server adapters')
        # The adapter must verify Google TLS/server identity, never follow redirects,
        # and keep client secrets, authorization codes and responses out of logs.
        try:
            token = self._exchange(dict(code=values['code'], client_id=self.client_id,
                redirect_uri=self.redirect_uri, grant_type='authorization_code'))
        except Exception:
            raise ValueError('token exchange failed; begin a new authorization') from None
        if not isinstance(token,dict) or 'error' in token or not isinstance(token.get('token_type'),str) or token['token_type'].lower()!='bearer':
            raise ValueError('invalid token response')
        if not isinstance(token.get('scope'),str) or set(token['scope'].split()) != {READ_SCOPE}:
            raise ValueError('missing or broader-than-readonly token scope')
        lifetime = token.get('expires_in')
        access = token.get('access_token')
        if type(lifetime) is not int or not 0 < lifetime <= 86400 or not isinstance(access,str) or not 1 <= len(access) <= 16384 or '\r' in access or '\n' in access:
            raise ValueError('invalid token expiry or access credential')
        expires_at = now + lifetime
        # Fresh identity check, not a callback scope claim or an unverified JWT.
        try:
            channels = self._read(access, API+'channels', dict(part='id',mine='true',maxResults='50'))
        except Exception:
            raise ValueError('authorized channel verification failed') from None
        if not isinstance(channels,dict) or channels.get('error') or channels.get('nextPageToken') or not isinstance(channels.get('items'),list) or not channels['items']:
            raise ValueError('complete authorized channel response required')
        channel_ids = [c.get('id') for c in channels['items'] if isinstance(c,dict)]
        import re
        if len(channel_ids) != len(channels['items']) or any(not isinstance(c,str) or not re.fullmatch(r'UC[A-Za-z0-9_-]{22}',c) for c in channel_ids):
            raise ValueError('invalid channel identity response')
        handle = secrets.token_urlsafe(32)
        with self._lock:
            observed_now = int(self._clock())
            self._grants = {k:v for k,v in self._grants.items() if v.expires_at > observed_now}
            if expires_at <= observed_now or len(self._grants) >= 1000:
                raise ValueError('grant expired during verification or connection capacity reached')
            self._grants[hash_value(handle)] = AccessGrant(access, expires_at, pending[0])
        return dict(connectionHandle=handle, channelIds=channel_ids, authorization='adapter_observed',
            copyrightVerified=False, listingApproved=False, liveReady=False)

    def read_video(self, handle, authenticated_session, video_id, expected_channel_id):
        import re
        if not isinstance(video_id,str) or not re.fullmatch(r'[A-Za-z0-9_-]{11}',video_id):
            raise ValueError('explicit video ID required')
        with self._lock:
            grant = self._grants.get(hash_value(handle))
            if not grant or grant.expires_at <= int(self._clock()) or not secrets.compare_digest(grant.session_hash,hash_value(authenticated_session)):
                raise ValueError('expired, disconnected or wrong-session connection')
            token = grant.access_token
        try:
            channels = self._read(token, API+'channels', dict(part='id',mine='true',maxResults='50'))
            if not isinstance(channels,dict) or channels.get('error') or channels.get('nextPageToken') or not isinstance(channels.get('items'),list) or expected_channel_id not in [c.get('id') for c in channels['items'] if isinstance(c,dict)]:
                raise ValueError('account no longer authorizes expected channel')
            videos = self._read(token, API+'videos',dict(part='snippet',id=video_id))
            if not isinstance(videos,dict) or videos.get('error') or not isinstance(videos.get('items'),list) or len(videos['items']) != 1:
                raise ValueError('video not available')
            v = videos['items'][0]
            if not isinstance(v,dict) or v.get('id')!=video_id or not isinstance(v.get('snippet'),dict) or v['snippet'].get('channelId')!=expected_channel_id:
                raise ValueError('video not bound to authorized channel')
        except Exception:
            raise ValueError('read-only verification failed; no rights conclusion') from None
        return dict(platform='youtube',videoId=video_id,channelId=expected_channel_id,
            copyrightVerified=False,listingApproved=False,liveReady=False)

    def disconnect_local(self, handle, authenticated_session):
        with self._lock:
            key = hash_value(handle)
            grant = self._grants.get(key)
            if grant and secrets.compare_digest(grant.session_hash,hash_value(authenticated_session)):
                del self._grants[key]
        # No provider revoke call, no social deletion, no cancellation of licences.
