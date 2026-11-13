"""Keep the public searchable xOrus index EXACTLY in sync with core Python IDs."""
import json
import unittest
from pathlib import Path
from lia.xorus.catalog import catalog

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT / "apps/frontend/public/data/xorus_signal_catalog.json"

class XOrusPublicCatalogTests(unittest.TestCase):
    def test_public_signal_names_match_canonical_120_without_fake_observations(self):
        payload=json.loads(PUBLIC.read_text(encoding="utf-8"))
        self.assertEqual(payload["schema"], "xorus_signal_catalog/v1")
        self.assertEqual(payload["source"], "lia/chorus/catalog.py")
        self.assertEqual(payload["kind"], "signal_definitions_not_observations")
        self.assertEqual(payload["total_defined"],120)
        core=catalog()
        self.assertEqual(len(core),120)
        expected=[{
            "id":x["id"],"family":x["family"],"axis":x["axis"],"n":x["n"],
            "status":"defined_not_verified"
        } for x in core]
        self.assertEqual(payload["signals"],expected)
        self.assertFalse(any("price" in row or "score" in row or "source_ts" in row
                             for row in payload["signals"]))

if __name__=="__main__":
    unittest.main()
