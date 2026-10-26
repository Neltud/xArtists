---
description: >-
  Références Git attendues, empreintes des fichiers et intégrité du transport de
  la PR #188.
hidden: true
noIndex: true
noRobotsIndex: true
---

# Manifeste et empreintes des 20 fichiers

Ce manifeste décrit le candidat de référence. Il ne prouve pas un push : `remote_applied` reste `false` jusqu’à vérification distante. Les champs `expected_main_blob_sha` et `expected_branch_blob_sha` permettent de détecter une version qui a changé avant d’écrire.

```json
{
  "candidate_commit": "57f1080b3d1dec5f13aaf3b92dac31acc75b6e13",
  "candidate_tree": "16955e7f4934cc1dbe3fc8c926bf07b308bb41e4",
  "expected_branch_head": "861fd0fd4abf428f7330716ca9c2de8ca8d0956d",
  "expected_main_head": "52b2207aba7eb6a942fc6084d2f12652496f18c0",
  "branch": "fix/p0-ipn-signed-binding-and-build",
  "schema": "xartists_pr188_resolution/v1",
  "repository": "Neltud/xArtists",
  "pull_request": 188,
  "remote_applied": false,
  "write_blocker": "GitHub API 403: Resource not accessible by integration",
  "bundle_sha256": "effb4dc38de79f807d3029c407b07126bee092a8fcacb5869631602ef6ee084e",
  "format": "xartists-pr188-gitbook-handoff-v1",
  "api_file_format": "xartists-pr188-api-files-v1",
  "source_parts": 6,
  "files": [
    {
      "path": ".github/workflows/static.yml",
      "encoding": "utf-8",
      "bytes": 5989,
      "sha256": "0adeb42eda771e7e697a17d4c5f8bfe0e34630a8a7f1d8baaf9faf877db2a7c1",
      "git_blob_sha": "f008a35ecac728bcc373e17fd89a276eef9f17dd",
      "expected_main_blob_sha": "7633f0f6f85c93afd39106bccc70141f275a5d21",
      "expected_branch_blob_sha": "558d69e59392976b9c5c046ff6b32284124d46cb"
    },
    {
      "path": "apps/frontend/src/components/CheckoutModal.tsx",
      "encoding": "utf-8",
      "bytes": 13554,
      "sha256": "a07bf58401d3aa5b7accfb035fb62ceaebfb15c8ea9dcd821af534e9fa9a5e02",
      "git_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912",
      "expected_main_blob_sha": "7da5955b55c45596c47c6839c532e23496993c5e",
      "expected_branch_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912"
    },
    {
      "path": "apps/frontend/src/lib/accessSession.ts",
      "encoding": "utf-8",
      "bytes": 2987,
      "sha256": "f22a20e679dc90b8324f9b5ef8c7763d886f64f9d53c939046b173023069f0df",
      "git_blob_sha": "e05d717faf7c056d73319750587b020a96d9d84e",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "e05d717faf7c056d73319750587b020a96d9d84e"
    },
    {
      "path": "apps/frontend/src/lib/nftPacks.ts",
      "encoding": "utf-8",
      "bytes": 5481,
      "sha256": "35817f5cd35332e9f669f7612af15e26d18e7c74d1fe2223e1aa779139babb98",
      "git_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2",
      "expected_main_blob_sha": "01e5a106f7ed3b84659dfe19322976b90ef03f74",
      "expected_branch_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2"
    },
    {
      "path": "apps/frontend/src/lib/paybox.ts",
      "encoding": "utf-8",
      "bytes": 5674,
      "sha256": "0e420b35360773736905e1b28effd519029d498e504381321aa1ca21b888765f",
      "git_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c",
      "expected_main_blob_sha": "3691692b26f7c707304bf17bfbfbeb2093a5457d",
      "expected_branch_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c"
    },
    {
      "path": "apps/frontend/src/lib/payments.ts",
      "encoding": "utf-8",
      "bytes": 3576,
      "sha256": "a7fb314d3dc0176e04677c8ba9ae3725ac2777b2ea3e7a4b8e7214ff2513a617",
      "git_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f",
      "expected_main_blob_sha": "f3318da2d99cc7b4bd7fdb53ac44760e49aba8d1",
      "expected_branch_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f"
    },
    {
      "path": "apps/frontend/src/pages/MyPacks.tsx",
      "encoding": "utf-8",
      "bytes": 13142,
      "sha256": "db97a95e3599f6c662d457b2363bba4bfb2788ad188f26cd9a872253255e0ba4",
      "git_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03",
      "expected_main_blob_sha": "20466f9d694d07d3237ee7ee6c91e67615e66937",
      "expected_branch_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03"
    },
    {
      "path": "docs/audits/vellum-2026-10-24/P0_SERVED_BUILD_BEFORE.json",
      "encoding": "utf-8",
      "bytes": 251,
      "sha256": "2384c3bf5fed9ae688962ef1ac4ca2edc5aa1f34b5e9f853fdfac4ecc3e55132",
      "git_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707"
    },
    {
      "path": "docs/audits/vellum-2026-10-24/P0_VALIDATION.json",
      "encoding": "utf-8",
      "bytes": 1144,
      "sha256": "5edf69ac73aeaa7d4e8eaa6cffea4a42a3e2a089da18d128d54994324bef139f",
      "git_blob_sha": "f6337f6845ea3b99e0660dc7fc7e29023df61ff3",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "b3a425249b207819e63bf9a2716fd16f63b0f7b7"
    },
    {
      "path": "services/access-api/src/orders.mjs",
      "encoding": "utf-8",
      "bytes": 9738,
      "sha256": "bf58263470beba2f61c5650e1e6bd8b604a0f719907661d2e07142655eff5eeb",
      "git_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d",
      "expected_main_blob_sha": "20bbd34a354ca57b924e93edfcaeec7ffcf1d2ee",
      "expected_branch_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d"
    },
    {
      "path": "services/access-api/src/paybox.mjs",
      "encoding": "utf-8",
      "bytes": 12109,
      "sha256": "9e83f659aac252e0ab62674c3a98c7d208201df00d6d689aeab75733850c7164",
      "git_blob_sha": "7eca00b0c9fbf461b0b95c2292aa907543700417",
      "expected_main_blob_sha": "cf07088f1c3ba68562cbe0954c3ad3d354fae919",
      "expected_branch_blob_sha": "7eca00b0c9fbf461b0b95c2292aa907543700417"
    },
    {
      "path": "services/access-api/src/server.mjs",
      "encoding": "utf-8",
      "bytes": 13584,
      "sha256": "1e78cfcffb8a067e3e1508849ec0d18fb5d16cbcfd45d9ccb9791f8eefc8573f",
      "git_blob_sha": "56e2175c634659252edea706f846850cb2ce6d13",
      "expected_main_blob_sha": "93059a22f1477d2e4876d1bbe5004fe75bbd7e3a",
      "expected_branch_blob_sha": "36cf90255d1f6a13f55e79f2724b20cb184f62b5"
    },
    {
      "path": "services/access-api/tests/orders_security_p0.test.mjs",
      "encoding": "utf-8",
      "bytes": 3859,
      "sha256": "60ef99f94375fbf42a0828840dfe15d278732acfec8b9aaef17716791111ce06",
      "git_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0"
    },
    {
      "path": "services/access-api/tests/paybox_escapeXml.test.mjs",
      "encoding": "utf-8",
      "bytes": 1714,
      "sha256": "3ad2eb3f4700307ea8da65501556e3eba4ffa8dfec77ba618c4275226c2f17f1",
      "git_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1"
    },
    {
      "path": "services/access-api/tests/payments.test.mjs",
      "encoding": "utf-8",
      "bytes": 5962,
      "sha256": "91fc427cc767268e845cff4b6b48da53a805973d398e91cd6e8a95383e39140f",
      "git_blob_sha": "f9c21adc88160abf94f27b0123d6d1f0f7120ec1",
      "expected_main_blob_sha": "475dac0e12ac5066de0736e7f83428c9f62d1fa9",
      "expected_branch_blob_sha": "744de7fbf35fa61ac26cf6ca282b9b5f75557fdb"
    },
    {
      "path": "services/access-api/tests/server-fixture.mjs",
      "encoding": "utf-8",
      "bytes": 1924,
      "sha256": "5d8737b465b10f1264d191ef143eac20d96de8bc626472072c5e76eb45da8d63",
      "git_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114",
      "expected_main_blob_sha": "7dd95696ba63db515d3269c78e276ee93955604b",
      "expected_branch_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114"
    },
    {
      "path": ".github/workflows/deploy-exclusive.yml",
      "encoding": "utf-8",
      "bytes": 236,
      "sha256": "2d0849e9c593ffac6afbfd7b08126780e263e394bf09d8cc15bf0bc1f08883af",
      "git_blob_sha": "898860f186e689f715843fbf45ad23e4bbad99b3",
      "expected_main_blob_sha": "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
      "expected_branch_blob_sha": "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c"
    },
    {
      "path": ".github/workflows/deploy-frontend.yml",
      "encoding": "utf-8",
      "bytes": 253,
      "sha256": "81b9241a31b672e76dbd383da6f55a438d1ecdd81602c621b0697434a960e644",
      "git_blob_sha": "466bde365a6b4259d597433f145ddf6af6624227",
      "expected_main_blob_sha": "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
      "expected_branch_blob_sha": "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb"
    },
    {
      "path": ".github/workflows/issue-agent-pack-collections.yml",
      "encoding": "utf-8",
      "bytes": 11320,
      "sha256": "9cb92b2bf85adabd3984a37f0340ca664c9575b6195a5a616c0eab21e1ab028a",
      "git_blob_sha": "29addf976d7917bd789f8e0c57c7556c3ab82f10",
      "expected_main_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017",
      "expected_branch_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017"
    },
    {
      "path": ".github/workflows/paybox-p0-review.yml",
      "encoding": "utf-8",
      "bytes": 2410,
      "sha256": "bf7b59bd341f22b715455eef565b507b5fe96f7a1076c7ed3a3e32fa58e195d5",
      "git_blob_sha": "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8",
      "expected_main_blob_sha": null,
      "expected_branch_blob_sha": null
    }
  ],
  "archive_name": "xartists-pr188-resolution.zip",
  "archive_bytes": 78536,
  "archive_sha256": "ffc380f6635bc504fa2165c00c842a68fee5b63d5c10bec32d41ca24033ac60d",
  "write_scope": [
    "update existing PR branch",
    "update PR 188 title and description"
  ],
  "forbidden_scope": [
    "merge PR into main",
    "deployment",
    "real payment",
    "blockchain transaction"
  ]
}
```
