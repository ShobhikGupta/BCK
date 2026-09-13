## Scope

Stacked on PR #6 (`feature/digital-menu-qr-hub`), not on main. Preserves the permanent recovery branch at `53f1822a9512741d67acc42a6c06ffbf8135f44e`.

- Shared nine-game runtime, merchant live preview and clearly labelled no-write test mode.
- Customer system text in English, Hindi, Gujarati, Marathi and Bengali.
- Atomic server-mapped reward migration with runnable Postgres security checks.
- Password-recovery form and pending-play recovery.
- Customer header/boot consolidation, public demos using the actual runtime.
- Merchant render-loop/filter fixes; no silent cross-account browser-draft import.

## Verification

`npm test` and `npm run build` pass. All nine games completed the local Playwright smoke flow with zero JavaScript errors and zero RPC requests in test mode. Nine READY-screen widths checked from 320 to 1440. CDP checked customer flows and language controls; merchant builder tested locally. Existing authenticated preview #6 was inspected without logging the user out.

## Release gates — do not merge

The migration is intentionally **not applied remotely**. Production and old previews share the same database; revoking insecure legacy endpoints needs an isolated development database or explicit coordinated approval. Until then, new live game issuance is unavailable. Test-mode games remain usable.

Fresh onboarding, live reward/redemption persistence, full control audit, field performance and approved commercial legal/support information remain outstanding. See RELEASE-CANDIDATE.md for evidence and limitations.

**DO NOT MERGE. DO NOT DEPLOY PRODUCTION. This is a draft review preview, not a completed release approval.**
