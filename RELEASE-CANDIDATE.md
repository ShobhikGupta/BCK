# BCK release-candidate work log

## Protected starting point

- Remote backup verified 2026-09-13: `backup/pre-final-codex-2026-09-13` at `53f1822a9512741d67acc42a6c06ffbf8135f44e`. Never modify this ref.
- Latest development: `feature/digital-menu-qr-hub`, PR #6, same commit. PR #6 base is `fix/onboarding-location-ui`.
- Netlify preview #6 is ready at that commit (deploy `6aa5476198e7210008e5f818`).
- Work branch: `codex/release-candidate`, based on that development branch.
- Parent local workspace was empty. Work lives in the `release-candidate` checkout.

## Initial verified findings

- BCK Supabase is reachable and healthy. The connector list omits it; direct project access works.
- Live `issue_public_coupon` trusts reward text/type/code/expiry without a play-session check. Release blocker.
- Live `start_public_play` lacks locking and selected-game validation. Public redemption lacks a row lock.
- Fourteen remote migrations exist; only the menu migration is represented in Git.
- Password recovery had no form; session restoration redirected away from recovery.
- Customer boot has two independent RPC/render paths and two language preference keys.
- Merchant test mode uses separate simplified games instead of the customer runtime.

## Verification status

In progress. Source inspection or syntax checking is not an end-to-end pass.
Production deployment and merging require explicit user approval.

## Verified local checkpoints

- Password-recovery form renders correctly; no account password was changed.
- PGlite executes the reward migration and checks reward forgery, replay, limits, visitor mismatch and single-use redemption. Migration is NOT applied remotely.
- All nine games completed READY → PLAYING → RESULT → REWARD through Playwright in test mode. No page errors and no RPC requests occurred.
- All nine game READY screens passed overflow assertions at 320, 360, 375, 390, 430, 768, 1024, 1366 and 1440 pixels. This is not yet a full-product responsive pass.
- CDP checks covered wheel/result/reward, lottery, pour overflow, bite collision and language selection. EN/HI/GU/MR/BN wheel titles, instructions and controls were observed.
- Merchant local-preview builder: campaign text survives redemption toggles; three new game configurations render; actual-runtime iframe and native test dialog open. No live campaign was created.
- Authenticated preview #6 dashboard inspected using the existing Chrome session; no logout or account change.
- Repeatable game check: pass the contents of `scripts/browser-game-qa.js` to `playwright-cli run-code`. Screenshots are generated in ignored `output/playwright/`.

## UI continuation checkpoint (2026-09-13)

- Both remote recovery refs verified: original `53f1822`, and `backup/pr7-before-ui-difficulty-polish-2026-09-13` at `750dc32`. Neither modified.
- Current PR #7 preview was verified ready at `750dc32`; no production deployment or remote migration.
- Shared surfaces, labelled mobile navigation, native More sheet, data-only refresh and keyboard campaign menus added. Local authenticated coupon refresh reached disabled/busy then success with the same four existing coupons; no coupon or campaign changed.
- Cached local JavaScript initially hid refresh; disabling cache confirmed current code. Mobile visual inspection caught and fixed status/action overlap.
- Settings/company rendering guards preserve unsaved fields. Menu signed-out state is explicit. QR print outputs regenerate at print resolution; five template dimensions and receipt PNG/PDF were checked.
- Original nine-game SVG identity family and phone-frame runtime preview added. Full icon and responsive review still pending.
- Node tests and static build pass. Difficulty, Snakes & Ladders overhaul, analytics expansion and full required visual/playtest matrix remain pending; this checkpoint is NOT completion of the continuation pass.

## Rounded UI correction — 2026-09-14

- Resumed clean remote checkpoint `3ba57d5`, verified all three backup branches including `backup/pr7-usage-limit-wip-2026-09-14`; no backup changed.
- Restored 18px cards / 11px controls / 22px modals and 6px main-card shadows, 20px desktop / 16px mobile card gaps.
- Campaign status and options now occupy their own top row on desktop and mobile. CDP inspected authenticated 390px and 1440px Campaigns and the mobile options menu; no data changed.
- Mobile navigation is a seven-destination scrollable rail; Settings is beside Language. Desktop sidebar preserved. Full-width regression sweep remains pending.

## Release gates still in effect

- Shared Supabase project serves production and all old previews. Revoking legacy insecure issuance would change those clients. A safe development database or explicit coordinated database approval is required before remote migration.
- Fresh-account onboarding, live issuance/redemption, full merchant persistence, all-control audit and field performance remain unverified.
- Public privacy/terms and approved support/account-handling information are missing; commercial review required.

## Final UI / analytics / QR continuation — 2026-09-14

This section supersedes pending UI notes in the historical checkpoints above. PR #7 stays Draft; no production deployment, merge or shared database migration.

- Recovery checkpoints: `4f0cb3f` restores rounded surfaces/navigation; `ff3c6c8` adds shared analytics scope and optional business hours.
- Previous card/control/modal radii 8/4/8px are now 18/11/22px. Main hard shadows 4px → 6px; secondary shadows 4px. Card padding 24px desktop / 20px mobile, gaps 20/16px, sections 32px. Campaign top-row status/options no longer overlap content.
- Analytics has one 1D/7D/30D/90D/1Y/Custom selector, campaign filter and data-only refresh. Daily lines show scans/plays/wins; separate hourly bars select one metric. Shared merchant-local date scope, overnight hours and configured-range union are covered by runnable tests.
- Optional seven-day hours are in onboarding and Company details. Open/closed, native times, copy previous/apply all and timezone are supported. Isolated preview save/reload with 18:00–02:00 and closed days passed. Live cross-device hours require the unapplied additive `20260914040924_merchant_business_hours.sql` migration. Existing profiles remain untouched; missing-column clients use explicitly labelled device storage.
- QR Studio now has one shared design/export workspace and preview, six templates, bounded colour/frame/background/branding/CTA controls and one toolbar. All six exported PNGs decoded to the expected permanent preview link using Chrome BarcodeDetector; receipt PDF downloaded. Quiet zones stay white; logo never covers modules. Real merchant QR save was not exercised by this pass.
- Visual defects found and fixed: mobile date controls squeezed by a full-width refresh button; tablet brand/language overlap; excessive stacked campaign margins; floating hourly bars; undersized onboarding time fields; QR error retry loop; onboarding favicon 404; asynchronous base dashboard overwriting Menu.
- CDP inspected authenticated Campaigns/status/options at 390/1440, real Analytics metrics/hour bars, QR, and Menu. Local Chrome screenshots cover Campaigns, Analytics and QR at 320/360/375/390/430/768/1024/1366/1440. Representative screenshots at each width were inspected, including cache-disabled mobile/tablet corrections. Settings/company and onboarding hours were inspected separately. Screenshot outputs remain ignored under `output/playwright/`.
- All nine games again completed READY → PLAYING → RESULT → REWARD in isolated test mode, with zero JavaScript errors and zero RPCs. All nine READY layouts passed the nine requested width checks. This is a smoke regression, not exhaustive difficulty balancing or physical-device testing.
- `npm test` passes five tests including both local PostgreSQL migration checks; static build and whitespace checks pass. The cache-disabled merchant QA script checks route overflow, date controls, exports and HTTP/page/request failures. Run its contents with `playwright-cli run-code` in headed Chrome.
- Deployment verification belongs to the final handoff: confirm Netlify preview success against the pushed commit, not merely a successful local build.

Remaining gates above still apply: no shared-database writes were approved; fresh live onboarding, live reward issuance/redemption, full authenticated save coverage and commercial/legal review are not claimed complete.
