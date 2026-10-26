---
hidden: true
noIndex: true
noRobotsIndex: true
---

# Manifeste SHA-256 — proposition V2

Manifeste des 22 fichiers du candidat V2. `candidate_commit_local` désigne le paquet local, pas une preuve de push. `reviewed_branch_head` est la dernière tête examinée pour les gardes du transport. `parents` conserve les parents du paquet Git ; l'exécuteur utilise les références relues pour le nouveau commit.

Les champs `expected_branch_blob_sha` décrivent le point de départ `2796316`. Les listes `accepted_branch_blob_shas` comprennent uniquement des versions déjà examinées : base, main, V1 et corrections V2. Les changements concurrents inconnus doivent faire l'objet d'une nouvelle revue.

```json
{
  "format": "xartists-pr188-sprint-v2",
  "repository": "Neltud/xArtists",
  "branch": "fix/p0-ipn-signed-binding-and-build",
  "expected_branch_head": "f457309f851d9ce5cdd3d41e4575e2ed54647927",
  "main_base_sha": "05fe13bacf5d041c281dc303521702aa5c0ec7bd",
  "main_base_tree": "6b0991b1bfaf821132851633df9ed95b326502af",
  "candidate_commit_local": "afeff287d93a1232ea110adb6f3f51e9ef152e1b",
  "candidate_tree": "7371204d22f6cb40695dc47c4037d15d98fa540c",
  "parents": [
    "2796316ca7d046d6c1be674ba421cbef260f1a52",
    "05fe13bacf5d041c281dc303521702aa5c0ec7bd"
  ],
  "files": [
    {
      "path": ".github/workflows/static.yml",
      "git_blob_sha": "f008a35ecac728bcc373e17fd89a276eef9f17dd",
      "sha256": "0adeb42eda771e7e697a17d4c5f8bfe0e34630a8a7f1d8baaf9faf877db2a7c1",
      "bytes": 5989,
      "expected_branch_blob_sha": "558d69e59392976b9c5c046ff6b32284124d46cb",
      "expected_main_blob_sha": "7633f0f6f85c93afd39106bccc70141f275a5d21",
      "requires_content": true,
      "accepted_branch_blob_shas": [
        "558d69e59392976b9c5c046ff6b32284124d46cb",
        "5bc9a32beddfddccfb8a111d6a3f2a8db69fffb5",
        "7633f0f6f85c93afd39106bccc70141f275a5d21",
        "f008a35ecac728bcc373e17fd89a276eef9f17dd"
      ]
    },
    {
      "path": "apps/frontend/src/components/CheckoutModal.tsx",
      "git_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912",
      "sha256": "a07bf58401d3aa5b7accfb035fb62ceaebfb15c8ea9dcd821af534e9fa9a5e02",
      "bytes": 13554,
      "expected_branch_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912",
      "expected_main_blob_sha": "7da5955b55c45596c47c6839c532e23496993c5e",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "38925384bef043f2438358db6e7a6b877b0a1912",
        "7da5955b55c45596c47c6839c532e23496993c5e"
      ]
    },
    {
      "path": "apps/frontend/src/lib/accessSession.ts",
      "git_blob_sha": "3382d04016653177a46c4fcb4a374ae25df3e191",
      "sha256": "deee83789435fe66d8134a9e42dcfd43feb772bb466d22b2bbeb75c15a9272fd",
      "bytes": 4012,
      "expected_branch_blob_sha": "e05d717faf7c056d73319750587b020a96d9d84e",
      "expected_main_blob_sha": null,
      "requires_content": true,
      "accepted_branch_blob_shas": [
        null,
        "3382d04016653177a46c4fcb4a374ae25df3e191",
        "e05d717faf7c056d73319750587b020a96d9d84e"
      ]
    },
    {
      "path": "apps/frontend/src/lib/nftPacks.ts",
      "git_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2",
      "sha256": "35817f5cd35332e9f669f7612af15e26d18e7c74d1fe2223e1aa779139babb98",
      "bytes": 5481,
      "expected_branch_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2",
      "expected_main_blob_sha": "01e5a106f7ed3b84659dfe19322976b90ef03f74",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "01e5a106f7ed3b84659dfe19322976b90ef03f74",
        "49129885bb230d2f67bcdc502ee45fdf1a3aeff2"
      ]
    },
    {
      "path": "apps/frontend/src/lib/paybox.ts",
      "git_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c",
      "sha256": "0e420b35360773736905e1b28effd519029d498e504381321aa1ca21b888765f",
      "bytes": 5674,
      "expected_branch_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c",
      "expected_main_blob_sha": "3691692b26f7c707304bf17bfbfbeb2093a5457d",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "3691692b26f7c707304bf17bfbfbeb2093a5457d",
        "5a4188e16ecf50323a72bcb5d5874c068e94805c"
      ]
    },
    {
      "path": "apps/frontend/src/lib/payments.ts",
      "git_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f",
      "sha256": "a7fb314d3dc0176e04677c8ba9ae3725ac2777b2ea3e7a4b8e7214ff2513a617",
      "bytes": 3576,
      "expected_branch_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f",
      "expected_main_blob_sha": "f3318da2d99cc7b4bd7fdb53ac44760e49aba8d1",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "17c890de6e480189a8591350e9f6da0c6de9451f",
        "f3318da2d99cc7b4bd7fdb53ac44760e49aba8d1"
      ]
    },
    {
      "path": "apps/frontend/src/pages/MyPacks.tsx",
      "git_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03",
      "sha256": "db97a95e3599f6c662d457b2363bba4bfb2788ad188f26cd9a872253255e0ba4",
      "bytes": 13142,
      "expected_branch_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03",
      "expected_main_blob_sha": "20466f9d694d07d3237ee7ee6c91e67615e66937",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "20466f9d694d07d3237ee7ee6c91e67615e66937",
        "6692e64b128d3f9e2d529296a6e33c46d7f9cf03"
      ]
    },
    {
      "path": "docs/audits/vellum-2026-10-24/P0_SERVED_BUILD_BEFORE.json",
      "git_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
      "sha256": "2384c3bf5fed9ae688962ef1ac4ca2edc5aa1f34b5e9f853fdfac4ecc3e55132",
      "bytes": 251,
      "expected_branch_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
      "expected_main_blob_sha": null,
      "requires_content": false,
      "accepted_branch_blob_shas": [
        null,
        "828454d377e2000e13baf22fa2be14fed3f5b707"
      ]
    },
    {
      "path": "docs/audits/vellum-2026-10-24/P0_VALIDATION.json",
      "git_blob_sha": "a41884f08ef34c755019a67dab8f6433ecab2312",
      "sha256": "727704d81586bc1712ed04edced1aa4455f0019f7ef204621a9178d289ae57ba",
      "bytes": 2046,
      "expected_branch_blob_sha": "f6337f6845ea3b99e0660dc7fc7e29023df61ff3",
      "expected_main_blob_sha": null,
      "requires_content": true,
      "accepted_branch_blob_shas": [
        null,
        "a41884f08ef34c755019a67dab8f6433ecab2312",
        "f6337f6845ea3b99e0660dc7fc7e29023df61ff3"
      ]
    },
    {
      "path": "services/access-api/src/orders.mjs",
      "git_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d",
      "sha256": "bf58263470beba2f61c5650e1e6bd8b604a0f719907661d2e07142655eff5eeb",
      "bytes": 9738,
      "expected_branch_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d",
      "expected_main_blob_sha": "20bbd34a354ca57b924e93edfcaeec7ffcf1d2ee",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "20bbd34a354ca57b924e93edfcaeec7ffcf1d2ee",
        "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d"
      ]
    },
    {
      "path": "services/access-api/src/paybox.mjs",
      "git_blob_sha": "c14c02a4208b08d24c4a865ed4bcfd0dc4802d19",
      "sha256": "e3a45d4658f6d2ebe702dd3030a344e95c21c7c03c5ee5b98a20df3f0023e606",
      "bytes": 12100,
      "expected_branch_blob_sha": "7eca00b0c9fbf461b0b95c2292aa907543700417",
      "expected_main_blob_sha": "cf07088f1c3ba68562cbe0954c3ad3d354fae919",
      "requires_content": true,
      "accepted_branch_blob_shas": [
        "7eca00b0c9fbf461b0b95c2292aa907543700417",
        "c14c02a4208b08d24c4a865ed4bcfd0dc4802d19",
        "cf07088f1c3ba68562cbe0954c3ad3d354fae919"
      ]
    },
    {
      "path": "services/access-api/src/server.mjs",
      "git_blob_sha": "c77e254e720b70444e663ab12a8a951fb887e45c",
      "sha256": "c0e84c235f2fa869f06fecf496103b40f46b49ea7d1eebcdd40d7e6e759acf46",
      "bytes": 13530,
      "expected_branch_blob_sha": "36cf90255d1f6a13f55e79f2724b20cb184f62b5",
      "expected_main_blob_sha": "93059a22f1477d2e4876d1bbe5004fe75bbd7e3a",
      "requires_content": true,
      "accepted_branch_blob_shas": [
        "36cf90255d1f6a13f55e79f2724b20cb184f62b5",
        "56e2175c634659252edea706f846850cb2ce6d13",
        "93059a22f1477d2e4876d1bbe5004fe75bbd7e3a",
        "c77e254e720b70444e663ab12a8a951fb887e45c"
      ]
    },
    {
      "path": "services/access-api/tests/orders_security_p0.test.mjs",
      "git_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0",
      "sha256": "60ef99f94375fbf42a0828840dfe15d278732acfec8b9aaef17716791111ce06",
      "bytes": 3859,
      "expected_branch_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0",
      "expected_main_blob_sha": null,
      "requires_content": false,
      "accepted_branch_blob_shas": [
        null,
        "5b42dd1d99df8dd60085d38a2fd9433c98d398f0"
      ]
    },
    {
      "path": "services/access-api/tests/paybox_escapeXml.test.mjs",
      "git_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1",
      "sha256": "3ad2eb3f4700307ea8da65501556e3eba4ffa8dfec77ba618c4275226c2f17f1",
      "bytes": 1714,
      "expected_branch_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1",
      "expected_main_blob_sha": null,
      "requires_content": false,
      "accepted_branch_blob_shas": [
        null,
        "318bb30fc7a522944e3b38e449060c19b04f09f1"
      ]
    },
    {
      "path": "services/access-api/tests/payments.test.mjs",
      "git_blob_sha": "f9c21adc88160abf94f27b0123d6d1f0f7120ec1",
      "sha256": "91fc427cc767268e845cff4b6b48da53a805973d398e91cd6e8a95383e39140f",
      "bytes": 5962,
      "expected_branch_blob_sha": "f74d734569c704f2954062b09e2c70478f727713",
      "expected_main_blob_sha": "475dac0e12ac5066de0736e7f83428c9f62d1fa9",
      "requires_content": true,
      "accepted_branch_blob_shas": [
        "475dac0e12ac5066de0736e7f83428c9f62d1fa9",
        "744de7fbf35fa61ac26cf6ca282b9b5f75557fdb",
        "f74d734569c704f2954062b09e2c70478f727713",
        "f9c21adc88160abf94f27b0123d6d1f0f7120ec1"
      ]
    },
    {
      "path": "services/access-api/tests/server-fixture.mjs",
      "git_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114",
      "sha256": "5d8737b465b10f1264d191ef143eac20d96de8bc626472072c5e76eb45da8d63",
      "bytes": 1924,
      "expected_branch_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114",
      "expected_main_blob_sha": "7dd95696ba63db515d3269c78e276ee93955604b",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "7dd95696ba63db515d3269c78e276ee93955604b",
        "9c0b42d543f6528812adfd87c20d53b610fb8114"
      ]
    },
    {
      "path": ".github/workflows/deploy-exclusive.yml",
      "git_blob_sha": "898860f186e689f715843fbf45ad23e4bbad99b3",
      "sha256": "2d0849e9c593ffac6afbfd7b08126780e263e394bf09d8cc15bf0bc1f08883af",
      "bytes": 236,
      "expected_branch_blob_sha": "898860f186e689f715843fbf45ad23e4bbad99b3",
      "expected_main_blob_sha": "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
        "898860f186e689f715843fbf45ad23e4bbad99b3"
      ]
    },
    {
      "path": ".github/workflows/deploy-frontend.yml",
      "git_blob_sha": "466bde365a6b4259d597433f145ddf6af6624227",
      "sha256": "81b9241a31b672e76dbd383da6f55a438d1ecdd81602c621b0697434a960e644",
      "bytes": 253,
      "expected_branch_blob_sha": "466bde365a6b4259d597433f145ddf6af6624227",
      "expected_main_blob_sha": "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
      "requires_content": false,
      "accepted_branch_blob_shas": [
        "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
        "466bde365a6b4259d597433f145ddf6af6624227"
      ]
    },
    {
      "path": ".github/workflows/issue-agent-pack-collections.yml",
      "git_blob_sha": "29addf976d7917bd789f8e0c57c7556c3ab82f10",
      "sha256": "9cb92b2bf85adabd3984a37f0340ca664c9575b6195a5a616c0eab21e1ab028a",
      "bytes": 11320,
      "expected_branch_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017",
      "expected_main_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017",
      "requires_content": true,
      "accepted_branch_blob_shas": [
        "29addf976d7917bd789f8e0c57c7556c3ab82f10",
        "aceffbe0f441812dffc34c6f77831ae318d9b017"
      ]
    },
    {
      "path": ".github/workflows/paybox-p0-review.yml",
      "git_blob_sha": "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8",
      "sha256": "bf7b59bd341f22b715455eef565b507b5fe96f7a1076c7ed3a3e32fa58e195d5",
      "bytes": 2410,
      "expected_branch_blob_sha": "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8",
      "expected_main_blob_sha": null,
      "requires_content": false,
      "accepted_branch_blob_shas": [
        null,
        "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8"
      ]
    },
    {
      "path": "services/access-api/tests/paybox_ipn_http.test.mjs",
      "git_blob_sha": "d02f6fbd52dc1df42b92de59195cce144049601b",
      "sha256": "2016f9544f2ca7aa63e64f4d33980ce1e717793f4b3e36166fd1d5056a415cd9",
      "bytes": 9623,
      "expected_branch_blob_sha": null,
      "expected_main_blob_sha": null,
      "requires_content": true,
      "accepted_branch_blob_shas": [
        null,
        "d02f6fbd52dc1df42b92de59195cce144049601b"
      ]
    },
    {
      "path": "apps/frontend/tests/access-session.test.mjs",
      "git_blob_sha": "d3e222a42f27e8156366283eef3ea2467a092f86",
      "sha256": "212e9c27ff81d65555d12300fee2d684145afdf3c8541e63b28baf5ca99b7284",
      "bytes": 6634,
      "expected_branch_blob_sha": null,
      "expected_main_blob_sha": null,
      "requires_content": true,
      "accepted_branch_blob_shas": [
        null,
        "d3e222a42f27e8156366283eef3ea2467a092f86"
      ]
    }
  ],
  "bundle_bytes": 10025,
  "bundle_sha256": "ed7e2b2ea33fc82c7c0eb757c97009bacb9a250b7771effd2bd54d7b32ca8c25",
  "executor_sha256": "a56b7365d8207d5b9d07f1180847868521f972dec6a7055a0baf0b0d23c2c0cd",
  "accepted_branch_baseline": "2796316ca7d046d6c1be674ba421cbef260f1a52",
  "reviewed_branch_head": "f457309f851d9ce5cdd3d41e4575e2ed54647927",
  "coordination": {
    "active_source_for_grok_alignment": "GitBook V1, original 20-file manifest",
    "reserved_grok_paths": [
      "services/access-api/src/server.mjs",
      ".github/workflows/issue-agent-pack-collections.yml",
      ".github/workflows/static.yml"
    ],
    "payments_test_policy": "verification only; do not rewrite",
    "chatgpt_scope": [
      "signed HTTP regression fixtures",
      "session regression fixtures",
      "integration plan",
      "GitBook coordination and PR body"
    ],
    "v2_code_status": "prepared and tested locally; no remote application authorized by this document",
    "integration_requires_human_go": true,
    "merge_deploy_real_payment_and_blockchain_requires_human_go": true
  }
}
```
