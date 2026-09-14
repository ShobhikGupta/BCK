## Scope

Stacked on PR #6 (`feature/digital-menu-qr-hub`), not on main. Preserves the permanent recovery branch at `53f1822a9512741d67acc42a6c06ffbf8135f44e`.

- Shared nine-game runtime, merchant live preview and clearly labelled no-write test mode.
- Customer system text in English, Hindi, Gujarati, Marathi and Bengali.
- Atomic server-mapped reward migration with runnable Postgres security checks.
- Password-recovery form and pending-play recovery.
- Customer header/boot consolidation, public demos using the actual runtime.
- Merchant render-loop/filter fixes; no silent cross-account browser-draft import.
- Final rounded surface contract: 18px cards, 11px controls, 22px modals; consistent padding and hard shadows. Campaign status/options occupy a dedicated top row.
- Seven-item scrolling mobile navigation and adjacent Settings/language header controls; desktop/tablet rails preserved.
- Single analytics range/campaign/refresh scope, daily lines and metric-specific hourly bars using merchant timezone and optional overnight business hours.
- One QR design/export workspace, six scan-tested templates, protected quiet zones and PNG/PDF output.

## Verification

`npm test` and `npm run build` pass. All nine games completed the local Chrome smoke flow with zero JavaScript errors and zero RPC requests in test mode. Nine READY-screen widths checked from 320 to 1440. Cache-disabled merchant route checks cover the same nine widths, date controls and all six QR templates. Exported PNGs decoded to the expected permanent link; receipt PDF downloaded. CDP inspected authenticated campaign hierarchy/options, analytics and hourly bars, QR, Menu and shared surfaces. Optional hours passed isolated preview save/reload, overnight and copy-day checks. Onboarding hours were rendered without creating an account. See RELEASE-CANDIDATE.md for precise evidence and limitations.

## Release gates — do not merge

The reward and business-hours migrations are intentionally **not applied remotely**. Production and old previews share the same database; revoking insecure legacy endpoints needs an isolated development database or explicit coordinated approval. Until then, new live game issuance is unavailable. Test-mode games remain usable. Business hours use explicitly labelled device-only storage until the additive profiles field is approved; no cross-device persistence is claimed.

Fresh onboarding, live reward/redemption persistence, full control audit, field performance and approved commercial legal/support information remain outstanding. See RELEASE-CANDIDATE.md for evidence and limitations.

**DO NOT MERGE. DO NOT DEPLOY PRODUCTION. This is a draft review preview, not a completed release approval.**
