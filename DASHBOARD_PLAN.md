# BCK Merchant Console — implementation plan

This branch builds BCK's original merchant console using the user's ForStore screenshots as UX reference only. We are not copying proprietary source code or exact product copy.

## V1 console surfaces
- Overview / Today's pulse
- Events / campaigns
- New event flow: details -> choose games -> customise
- Coupons
- QR code studio
- Analytics
- Settings / account
- Notifications
- Help & support
- Terms modal

## BCK-specific additions
- Reward objective: Instant / Come-BCK / Hybrid
- Repeat visit rate and retained revenue
- Customer cohort / return window controls
- Six game library
- Brand kit controls
- WhatsApp follow-up configuration placeholder
- Branch-safe development workflow

## Git flow
feature/merchant-dashboard -> PR -> develop -> integration test -> release PR -> main.
