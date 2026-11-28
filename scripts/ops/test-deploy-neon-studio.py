#!/usr/bin/env python3
"""Offline release protocol tests: no network or credentials."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('release', Path(__file__).with_name('deploy-neon-studio.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
SRC = 'a'*40
OLD = 'b'*40
def fn(id=1,status='completed',active=None):
    return {'data': {'current_deployment': {'id': id, 'status': status},
                     'active_deployment': {'id': id if active is None else active, 'status': 'completed'},
                     'invocation_url': m.ORIGIN+'/'}}
def info(src=SRC,enabled=False):
    return {'source_sha': src, 'studio_upload_enabled': enabled}

class TestRelease(unittest.TestCase):
    def test_bootstrap_exact_id_and_disabled(self):
        with patch.object(m,'request',side_effect=[(404,{}),(201,{'id':2}),(200,fn(2))]) as req, patch.object(m,'health',return_value=info()) as h:
            receipt=m.release(b'zip',SRC,'digest','fixture','bootstrap')
            self.assertEqual(receipt['deployment_id'],2)
            self.assertFalse(receipt['upload_enabled'])
            body=req.call_args_list[1].args[3]
            self.assertIn(b'"CREATOR_MEDIA_UPLOAD_ENABLED": "0"',body)
            self.assertIn(b'"XARTISTS_STUDIO_UPLOAD_APPROVED": "0"',body)
            self.assertNotIn(b'PINATA_JWT',body)
            h.assert_called_once_with(m.ORIGIN,SRC)
    def test_update_preserves_environment_and_requires_receipt(self):
        with patch.object(m,'request',side_effect=[(200,fn()),(201,{'data':{'id':2}}),(200,fn(2))]) as req,patch.object(m,'health',side_effect=[info(OLD,True),info(SRC,True)]):
            receipt=m.release(b'zip',SRC,'digest','fixture','update',1)
            self.assertTrue(receipt['upload_enabled'])
            self.assertEqual(receipt['previous_source_sha'],OLD)
            body=req.call_args_list[1].args[3]
            self.assertNotIn(b'name="environment"',body)
            self.assertNotIn(b'name="runtime"',body)
            self.assertIn(b'name="zip"',body)
    def test_stale_id_never_posts(self):
        with patch.object(m,'request',return_value=(200,fn(3))) as req:
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','update',1)
            self.assertEqual(req.call_count,1)
    def test_bootstrap_refuses_existing(self):
        with patch.object(m,'request',return_value=(200,fn())) as req:
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','bootstrap')
            self.assertEqual(req.call_count,1)
    def test_ambiguous_post_never_replayed(self):
        with patch.object(m,'request',side_effect=[(404,{}),(201,{})]) as req:
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','bootstrap')
            self.assertEqual(req.call_count,2)
    def test_different_deployment_stops(self):
        with patch.object(m,'request',side_effect=[(404,{}),(201,{'id':2}),(200,fn(3))]) as req:
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','bootstrap')
            self.assertEqual(req.call_count,3)
    def test_old_active_is_not_new_success(self):
        with patch.object(m,'request',side_effect=[(404,{}),(201,{'id':2}),(200,fn(2,active=1)),(200,fn(2))]),patch.object(m,'time') as clock,patch.object(m,'health',return_value=info()) as h:
            self.assertEqual(m.release(b'zip',SRC,'digest','fixture','bootstrap')['deployment_id'],2)
            clock.sleep.assert_called_once()
            h.assert_called_once()
    def test_changed_readiness_fails(self):
        with patch.object(m,'request',side_effect=[(404,{}),(201,{'id':2}),(200,fn(2))]),patch.object(m,'health',return_value=info(SRC,True)):
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','bootstrap')
    def test_duplicate_source_never_posts(self):
        with patch.object(m,'request',return_value=(200,fn())) as req,patch.object(m,'health',return_value=info()):
            with self.assertRaises(SystemExit):m.release(b'zip',SRC,'digest','fixture','update',1)
            self.assertEqual(req.call_count,1)
    def test_health_source_and_guards(self):
        health={'ok':True,'service':'xartists-studio-neon','commerce_enabled':False,'mint_requires_artist_signature':True,'studio_upload_enabled':False,'source_sha':SRC}
        config={'enabled':False,'pilot_images_only':True,'maxImageMiB':2,'mint_requires_artist_signature':True}
        with patch.object(m,'public_probe',side_effect=[health,config,{},{}]):
            self.assertEqual(m.health(m.ORIGIN,SRC),health)
        with patch.object(m,'public_probe',return_value=health):
            with self.assertRaises(SystemExit):m.health(m.ORIGIN,OLD)

if __name__=='__main__':unittest.main()
