import copy
import os
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor

from rights_registry import SimulationRegistry

HASH = 'a' * 64


def proposal(exclusive=True, **scope_changes):
    scope = dict(rights=['reproduction'], channels=['social'], territories=['FR'], start=1000, end=2000, exclusive=exclusive)
    scope.update(scope_changes)
    return dict(scope=scope, destinations=['x', 'youtube'], price={'asset': 'EUR', 'amountBaseUnits': '10000'}, royalties={'rateBps': 800})


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, 'simulation.sqlite')
        self.r = SimulationRegistry(self.path)
        self.r.register(HASH, 'alice', 'x', 'post-1')
        self.r.mock_connect('alice', 'x', 'account-x', 10000)
        self.r.mock_connect('alice', 'youtube', 'account-youtube', 10000)

    def tearDown(self):
        self.r.close()
        self.tmp.cleanup()

    def reserve(self, key, p=None, now=500, ttl=300, platform='x'):
        p = p or proposal()
        self.r.approve(HASH, 'alice', key, p)
        self.r.reserve(key, HASH, key, p, platform, now, ttl)

    def test_cross_platform_conflict(self):
        self.r.register(HASH, 'alice', 'youtube', 'video-1')
        self.reserve('a')
        with self.assertRaisesRegex(ValueError, 'conflicting'):
            self.reserve('b', platform='youtube')

    def test_concurrent_exclusive_only_one_wins(self):
        p = proposal()
        self.r.approve(HASH, 'alice', 'v1', p)
        barrier = threading.Barrier(2)
        def attempt(key):
            r = SimulationRegistry(self.path)
            try:
                barrier.wait(timeout=10)
                r.reserve(key, HASH, 'v1', p, 'x', 500)
                return 'reserved'
            except ValueError:
                return 'conflict'
            finally:
                r.close()
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(attempt, ['a', 'b']))
        self.assertCountEqual(outcomes, ['reserved', 'conflict'])
        self.assertEqual(self.r.db.execute('SELECT count(*) FROM grants').fetchone()[0], 1)

    def test_nonexclusive_coexists(self):
        self.reserve('a', proposal(False))
        self.reserve('b', proposal(False))
        self.assertEqual(self.r.db.execute('SELECT count(*) FROM grants').fetchone()[0], 2)

    def test_exclusive_cannot_override_nonexclusive(self):
        self.reserve('a', proposal(False))
        with self.assertRaisesRegex(ValueError, 'conflicting'):
            self.reserve('b')

    def test_disjoint_period_country_and_right(self):
        self.reserve('a')
        self.reserve('b', proposal(start=2000, end=3000))
        self.reserve('c', proposal(territories=['DE']))
        self.reserve('d', proposal(rights=['display']))
        self.reserve('e', proposal(channels=['print']))

    def test_wildcard_conflicts(self):
        self.reserve('a', proposal(territories=['*']))
        with self.assertRaisesRegex(ValueError, 'conflicting'):
            self.reserve('b', proposal(territories=['DE']))

    def test_expired_reservation_releases(self):
        self.reserve('a', now=500, ttl=10)
        self.reserve('b', now=510)
        self.assertEqual(self.r.db.execute('SELECT state FROM grants WHERE id="a"').fetchone()[0], 'expired')

    def test_contract_survives_reservation_ttl(self):
        self.reserve('a', now=500, ttl=10)
        self.r.mock_contract('a', 501)
        with self.assertRaisesRegex(ValueError, 'conflicting'):
            self.reserve('b', now=1000)

    def test_expired_reservation_cannot_contract(self):
        self.reserve('a', now=500, ttl=10)
        with self.assertRaises(ValueError):
            self.r.mock_contract('a', 510)

    def test_price_and_royalty_tamper_invalidates_approval(self):
        p = proposal()
        self.r.approve(HASH, 'alice', 'v1', p)
        for field in ['price', 'royalties']:
            changed = copy.deepcopy(p)
            changed[field] = {'tampered': True}
            with self.assertRaisesRegex(ValueError, 'proposal differs'):
                self.r.reserve(field, HASH, 'v1', changed, 'x', 500)
        with self.assertRaisesRegex(ValueError, 'immutable'):
            self.r.approve(HASH, 'alice', 'v1', changed)

    def test_revoked_or_expired_connection(self):
        self.r.revoke('alice', 'x')
        with self.assertRaisesRegex(ValueError, 'connection unavailable'):
            self.reserve('a')
        self.r.mock_connect('alice', 'x', 'account-x', 500)
        with self.assertRaisesRegex(ValueError, 'connection unavailable'):
            self.reserve('b', now=500)

    def test_unknown_creator_and_changed_master_rejected(self):
        with self.assertRaises(ValueError):
            self.r.approve(HASH, 'mallory', 'v1', proposal())
        with self.assertRaises(ValueError):
            self.r.register(HASH, 'mallory', 'youtube', 'stolen')
        with self.assertRaises(ValueError):
            self.r.register('b'*64, 'alice', 'x', 'post-1')
        self.assertEqual(self.r.db.execute('SELECT count(*) FROM assets').fetchone()[0], 1)

    def test_unsupported_scope_fails_closed(self):
        for change in [dict(territories=['EU']), dict(channels=['instagram']), dict(rights=['everything']), dict(end=1000), dict(exclusive='true')]:
            with self.assertRaises(ValueError):
                self.r.approve(HASH, 'alice', 'invalid', proposal(**change))

    def test_activation_always_blocked_even_forged_evidence(self):
        self.reserve('a')
        self.r.mock_contract('a', 501)
        with self.assertRaisesRegex(ValueError, 'LIVE_DISABLED'):
            self.r.activate('a', paid=True, delivered=True, signature='FAKE')

    def test_unapproved_destination_blocked(self):
        p = proposal()
        self.r.approve(HASH, 'alice', 'v1', p)
        with self.assertRaisesRegex(ValueError, 'destination not approved'):
            self.r.reserve('a', HASH, 'v1', p, 'instagram', 500)

    def test_audit_and_duplicate_reservation_rollback(self):
        self.reserve('a', proposal(False))
        before = self.r.db.execute('SELECT count(*) FROM audit').fetchone()[0]
        with self.assertRaises(Exception):
            self.r.reserve('a', HASH, 'a', proposal(False), 'x', 500)
        self.assertEqual(self.r.db.execute('SELECT count(*) FROM audit').fetchone()[0], before)


if __name__ == '__main__':
    unittest.main()
