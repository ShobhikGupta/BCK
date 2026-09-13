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

## Outstanding release gates

## UI continuation checkpoint (2026-09-13)

- Both remote recovery refs verified: original `53f1822`, and `backup/pr7-before-ui-difficulty-polish-2026-09-13` at `750dc32`. Neither modified.
- Current PR #7 preview was verified ready at `750dc32`; no production deployment or remote migration.
- Shared surfaces, labelled mobile navigation, native More sheet, data-only refresh and keyboard campaign menus added. Local authenticated coupon refresh reached disabled/busy then success with the same four existing coupons; no coupon or campaign changed.
- Cached local JavaScript initially hid refresh; disabling cache confirmed current code. Mobile visual inspection caught and fixed status/action overlap.
- Settings/company rendering guards preserve unsaved fields. Menu signed-out state is explicit. QR print outputs regenerate at print resolution; five template dimensions and receipt PNG/PDF were checked.
- Original nine-game SVG identity family and phone-frame runtime preview added. Full icon and responsive review still pending.
- Node tests and static build pass. Difficulty, Snakes & Ladders overhaul, analytics expansion and full required visual/playtest matrix remain pending; this checkpoint is NOT completion of the continuation pass.

## Remaining release gates

- Shared Supabase project serves production and all old previews. Revoking legacy insecure issuance would change those clients. A safe development database or explicit coordinated database approval is required before remote migration.
- Fresh-account onboarding, live issuance/redemption, full merchant persistence, all-control audit and field performance remain unverified.
- Public privacy/terms and approved support/account-handling information are missing; commercial review required.
