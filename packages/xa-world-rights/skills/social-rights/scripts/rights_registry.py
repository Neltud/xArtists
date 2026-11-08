"""SQLite simulation of a single shared rights register; never a production authority.

No network, payments, OAuth, signatures or access grants. All evidence is fictional.
Use one database for all platforms. Callers supply a test clock explicitly.
"""
import hashlib
import json
import re
from content_intake import PLATFORMS
import sqlite3
from contextlib import contextmanager

RIGHTS = {'reproduction', 'distribution', 'display', 'adaptation', '*'}
CHANNELS = {'website', 'social', 'print', 'broadcast', '*'}
# Intentionally limited; expanding this list requires reviewed country normalization.
TERRITORIES = {'FR', 'DE', 'ES', 'IT', 'PT', 'BE', 'NL', 'LU', 'CH', 'GB', 'US', 'CA', '*'}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def scope_valid(s):
    if not isinstance(s, dict) or type(s.get('exclusive')) is not bool:
        raise ValueError('explicit exclusivity required')
    for key, allowed in [('rights', RIGHTS), ('channels', CHANNELS)]:
        values = s.get(key)
        if not isinstance(values, list) or not values or any(v not in allowed for v in values):
            raise ValueError('unsupported ' + key)
    territories = s.get('territories')
    if not isinstance(territories, list) or not territories or any(not isinstance(t, str) or t not in TERRITORIES for t in territories):
        raise ValueError('use reviewed country codes or *; regional groups unsupported')
    if 'end' not in s or type(s.get('start')) is not int or (s.get('end') is not None and (type(s['end']) is not int or s['end'] <= s['start'])):
        raise ValueError('integer UTC interval [start,end) required; null end means open-ended')


def overlaps(a, b):
    def intersect(key):
        return '*' in a[key] or '*' in b[key] or bool(set(a[key]) & set(b[key]))
    return (a['end'] is None or b['start'] < a['end']) and (b['end'] is None or a['start'] < b['end']) and all(intersect(k) for k in ['rights', 'channels', 'territories'])


class SimulationRegistry:
    def __init__(self, path):
        self.db = sqlite3.connect(path, timeout=10, isolation_level=None)
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS assets (hash TEXT PRIMARY KEY, creator TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS aliases (platform TEXT, post TEXT, hash TEXT REFERENCES assets(hash), PRIMARY KEY(platform,post));
        CREATE TABLE IF NOT EXISTS approvals (hash TEXT REFERENCES assets(hash), version TEXT, digest TEXT, PRIMARY KEY(hash,version));
        CREATE TABLE IF NOT EXISTS connections (creator TEXT, platform TEXT, subject TEXT, expires INTEGER, revoked INTEGER DEFAULT 0, PRIMARY KEY(creator,platform));
        CREATE TABLE IF NOT EXISTS grants (id TEXT PRIMARY KEY, hash TEXT REFERENCES assets(hash), version TEXT, scope TEXT, expires INTEGER, state TEXT);
        CREATE TABLE IF NOT EXISTS audit (seq INTEGER PRIMARY KEY, kind TEXT, payload TEXT);
        CREATE TABLE IF NOT EXISTS receipt_orders (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS receipt_candidates (
            id TEXT PRIMARY KEY, order_id TEXT REFERENCES receipt_orders(id), kind TEXT,
            digest TEXT, body TEXT, verification TEXT CHECK(verification='unverified'),
            source_system TEXT, source_event TEXT, issued INTEGER,
            UNIQUE(kind,source_system,source_event));
        ''')

    def close(self):
        self.db.close()

    @contextmanager
    def transaction(self):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            yield
            self.db.execute('COMMIT')
        except Exception:
            self.db.execute('ROLLBACK')
            raise

    def log(self, kind, data):
        self.db.execute('INSERT INTO audit(kind,payload) VALUES (?,?)', (kind, json.dumps(data, sort_keys=True)))

    def register(self, media_hash, creator, platform, post):
        if not re.fullmatch('[0-9a-f]{64}', media_hash) or not creator or not post or platform not in PLATFORMS:
            raise ValueError('invalid asset/creator/platform')
        with self.transaction():
            self.db.execute('INSERT OR IGNORE INTO assets VALUES (?,?)', (media_hash, creator))
            if self.db.execute('SELECT creator FROM assets WHERE hash=?', (media_hash,)).fetchone()[0] != creator:
                raise ValueError('different claimant: manual rights review required')
            previous = self.db.execute('SELECT hash FROM aliases WHERE platform=? AND post=?', (platform, post)).fetchone()
            if previous and previous[0] != media_hash:
                raise ValueError('post version changed: do not overwrite evidence')
            self.db.execute('INSERT OR IGNORE INTO aliases VALUES (?,?,?)', (platform, post, media_hash))
            self.log('sim_asset_link', [media_hash, creator, platform, post])

    def approve(self, media_hash, creator, version, proposal):
        scope_valid(proposal['scope'])
        if not version or not proposal.get('destinations') or any(p not in PLATFORMS for p in proposal['destinations']):
            raise ValueError('version required')
        with self.transaction():
            owner = self.db.execute('SELECT creator FROM assets WHERE hash=?', (media_hash,)).fetchone()
            if owner != (creator,):
                raise ValueError('creator mismatch')
            value = digest(proposal)
            previous = self.db.execute('SELECT digest FROM approvals WHERE hash=? AND version=?', (media_hash, version)).fetchone()
            if previous and previous[0] != value:
                raise ValueError('immutable version: request new creator approval')
            self.db.execute('INSERT OR IGNORE INTO approvals VALUES (?,?,?)', (media_hash, version, value))
            self.log('sim_creator_approval', [media_hash, version, value])

    def mock_connect(self, creator, platform, subject, expires):
        if platform not in PLATFORMS or not subject or type(expires) is not int:
            raise ValueError('invalid simulated connection')
        with self.transaction():
            self.db.execute('INSERT OR REPLACE INTO connections VALUES (?,?,?,?,0)', (creator, platform, subject, expires))
            self.log('sim_connection', [creator, platform, subject, expires])

    def revoke(self, creator, platform):
        with self.transaction():
            self.db.execute('UPDATE connections SET revoked=1 WHERE creator=? AND platform=?', (creator, platform))
            self.log('sim_revocation', [creator, platform])

    def reserve(self, reservation_id, media_hash, version, proposal, platform, now, ttl=300):
        scope_valid(proposal['scope'])
        if platform not in proposal.get('destinations', []):
            raise ValueError('publication destination not approved')
        if type(now) is not int or type(ttl) is not int or not 0 < ttl <= 900 or not reservation_id:
            raise ValueError('invalid test clock, TTL or reservation ID')
        with self.transaction():
            self.db.execute("UPDATE grants SET state='expired' WHERE state='reserved' AND expires<=?", (now,))
            creator = self.db.execute('SELECT creator FROM assets WHERE hash=?', (media_hash,)).fetchone()
            if not creator:
                raise ValueError('unknown asset')
            connection = self.db.execute('SELECT expires,revoked FROM connections WHERE creator=? AND platform=?', (creator[0], platform)).fetchone()
            if not connection or connection[1] or connection[0] <= now:
                raise ValueError('simulated creator connection unavailable')
            approved = self.db.execute('SELECT digest FROM approvals WHERE hash=? AND version=?', (media_hash, version)).fetchone()
            if approved != (digest(proposal),):
                raise ValueError('proposal differs from creator-approved version')
            for old, in self.db.execute("SELECT scope FROM grants WHERE hash=? AND state IN ('reserved','contracted')", (media_hash,)):
                old = json.loads(old)
                if (old['exclusive'] or proposal['scope']['exclusive']) and overlaps(old, proposal['scope']):
                    raise ValueError('conflicting rights already reserved or contracted')
            self.db.execute('INSERT INTO grants VALUES (?,?,?,?,?,?)', (reservation_id, media_hash, version, json.dumps(proposal['scope']), now + ttl, 'reserved'))
            self.log('sim_reservation', [reservation_id, media_hash, version, now + ttl])

    def mock_contract(self, reservation_id, now):
        # Contracted rights outlive reservation TTL; real signature verification is absent.
        with self.transaction():
            row = self.db.execute('SELECT state,expires FROM grants WHERE id=?', (reservation_id,)).fetchone()
            if not row or row[0] != 'reserved' or row[1] <= now:
                raise ValueError('no unexpired reservation')
            self.db.execute("UPDATE grants SET state='contracted' WHERE id=?", (reservation_id,))
            self.log('sim_contract_only', [reservation_id, now])

    def activate(self, *args, **kwargs):
        raise ValueError('LIVE_DISABLED: no verified payment or delivery adapter')

    def freeze_order(self, order, proposal):
        # A simulated order snapshot. These fields are not a verified contract.
        required = {'orderId','buyerId','creatorId','assetHash','proposalDigest','contractDigest','version','price'}
        if set(order) != required or any(not isinstance(order[k], str) or not order[k] for k in required - {'price'}):
            raise ValueError('invalid order shape')
        if any(not re.fullmatch('[0-9a-f]{64}', order[k]) for k in ['assetHash','proposalDigest','contractDigest']):
            raise ValueError('invalid order digests')
        price = order['price']
        if not isinstance(price, dict) or set(price) != {'amountBaseUnits','asset','rail','network'} or any(not isinstance(v,str) or not v for v in price.values()) or not re.fullmatch('[1-9][0-9]*', price['amountBaseUnits']):
            raise ValueError('exact integer-string price and explicit rail/network required')
        if order['proposalDigest'] != digest(proposal) or proposal.get('price') != price:
            raise ValueError('order differs from approved proposal price')
        snapshot = json.dumps(order, sort_keys=True, separators=(',', ':'))
        with self.transaction():
            owner = self.db.execute('SELECT creator FROM assets WHERE hash=?', (order['assetHash'],)).fetchone()
            approval = self.db.execute('SELECT digest FROM approvals WHERE hash=? AND version=?', (order['assetHash'], order['version'])).fetchone()
            if owner != (order['creatorId'],) or approval != (order['proposalDigest'],):
                raise ValueError('creator or approval mismatch')
            old = self.db.execute('SELECT snapshot FROM receipt_orders WHERE id=?', (order['orderId'],)).fetchone()
            if old and old[0] != snapshot:
                raise ValueError('immutable order snapshot')
            self.db.execute('INSERT OR IGNORE INTO receipt_orders VALUES (?,?)', (order['orderId'], snapshot))
            if not old:
                self.log('sim_frozen_order', [order['orderId'], digest(order)])

    def record_receipt_candidate(self, receipt):
        from receipts import record_candidate
        return record_candidate(self, receipt)
