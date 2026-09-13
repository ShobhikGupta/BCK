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
