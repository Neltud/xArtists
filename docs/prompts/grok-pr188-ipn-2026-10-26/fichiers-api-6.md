---
description: 'PR #188 : partie 6/6, sources exactes et empreintes pour l’API GitHub.'
hidden: true
noIndex: true
noRobotsIndex: true
---

# Audit — état historique et validation locale

Partie 6/6 du kit API. Les chaînes `content` sont le contenu UTF-8 complet des fichiers ; les séquences JSON `\n` représentent les vrais sauts de ligne. Décoder une fois le JSON et transmettre le texte sans reformulation ni transformation HTML. Vérifier les octets UTF-8 contre `bytes`, `sha256` et `git_blob_sha`.

```json
{
  "format": "xartists-pr188-api-files-v1",
  "part": 6,
  "parts": 6,
  "repository": "Neltud/xArtists",
  "branch": "fix/p0-ipn-signed-binding-and-build",
  "expected_branch_head": "861fd0fd4abf428f7330716ca9c2de8ca8d0956d",
  "baseline_main": "52b2207aba7eb6a942fc6084d2f12652496f18c0",
  "candidate_commit_at_baseline": "57f1080b3d1dec5f13aaf3b92dac31acc75b6e13",
  "candidate_tree_at_baseline": "16955e7f4934cc1dbe3fc8c926bf07b308bb41e4",
  "files": [
    {
      "path": "docs/audits/vellum-2026-10-24/P0_SERVED_BUILD_BEFORE.json",
      "encoding": "utf-8",
      "bytes": 251,
      "sha256": "2384c3bf5fed9ae688962ef1ac4ca2edc5aa1f34b5e9f853fdfac4ecc3e55132",
      "git_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
      "content": "{\n  \"probed_at\": \"2026-10-24T06:30:00+02:00\",\n  \"site\": \"https://neltud.github.io/xArtists/\",\n  \"served_build_sha\": \"2c615728\",\n  \"note\": \"Public probe still serves pre-P0 build with LIA flag compiled to 1\",\n  \"deployed_changes_by_this_task\": false\n}\n"
    },
    {
      "path": "docs/audits/vellum-2026-10-24/P0_VALIDATION.json",
      "encoding": "utf-8",
      "bytes": 1144,
      "sha256": "5edf69ac73aeaa7d4e8eaa6cffea4a42a3e2a089da18d128d54994324bef139f",
      "git_blob_sha": "f6337f6845ea3b99e0660dc7fc7e29023df61ff3",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "b3a425249b207819e63bf9a2716fd16f63b0f7b7",
      "content": "{\n  \"schema\": \"xartists_p0_validation/v1\",\n  \"validated_on\": \"2026-10-26\",\n  \"scope\": \"Local PR 188 integration candidate; fixture tests and build only\",\n  \"main_base_sha\": \"52b2207aba7eb6a942fc6084d2f12652496f18c0\",\n  \"previous_branch_sha\": \"861fd0fd4abf428f7330716ca9c2de8ca8d0956d\",\n  \"node_version\": \"v24.22.1\",\n  \"checks\": {\n    \"access_api\": { \"passed\": 41, \"failed\": 0 },\n    \"frontend_release\": { \"passed\": 22, \"failed\": 0 },\n    \"paybox_python_regressions\": { \"passed\": 7, \"failed\": 0 },\n    \"trading_stack_gates\": { \"passed\": 5, \"failed\": 0 },\n    \"production_build\": \"passed\",\n    \"routes\": { \"modules\": 37, \"aliases\": 52, \"routes\": 99, \"unresolved\": 0 },\n    \"translations_and_built_assets\": \"passed\",\n    \"shell_server_renders\": { \"passed\": 64, \"failed\": 0 },\n    \"module_server_renders\": { \"passed\": 296, \"failed\": 0 },\n    \"mobile_regressions\": \"passed\"\n  },\n  \"compiled_lia_live_trading\": false,\n  \"build_paybox_enabled\": false,\n  \"deployment_performed\": false,\n  \"real_payment_performed\": false,\n  \"blockchain_transaction_performed\": false,\n  \"main_modified\": false,\n  \"remote_ci_status\": \"pending separate GitHub execution\"\n}\n"
    }
  ]
}
```
