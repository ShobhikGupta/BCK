# BCK. — DESIGN.md

> **Status:** Grand Master Design System
> **Brand:** `bck.`
> **Tagline:** `bring them bck.`
> **Domain:** `getbck.com`
> **Product:** Gamified customer-retention SaaS for restaurants, cafés, QSRs, bakeries and dessert businesses
> **Visual direction:** Premium Neo-Brutalism
> **Reference benchmark:** ForStore for minimal information density, product clarity, hierarchy and conversion flow — never for proprietary source-code, exact-copy, logo, or pixel-for-pixel duplication.

## 0. MASTER RULE
BCK must never look like a generic AI-generated SaaS template. Every public and authenticated screen should feel deliberate, premium, restrained, tactile and highly legible.

## 1. DESIGN PHILOSOPHY
Premium neo-brutalism, not cartoon brutalism:
- hard 2px ink borders
- restrained 4–8px offset shadows
- flat colour fields
- bold editorial hierarchy
- controlled asymmetry
- generous whitespace
- no glassmorphism
- no soft SaaS gradient blobs
- no generic 3D illustrations
- no excessive decorative UI

Visual balance target:
- 65% bone / ivory
- 20% paper / white
- 8% ink
- 5% BCK violet
- 2% acid lime

## 2. BRAND POSITIONING
BCK helps restaurants turn QR scans into customer engagement and measurable repeat business.

Campaign modes:
1. **Instant Reward** — redeem on the current visit.
2. **Come-BCK Reward** — redeem on a later visit to drive retention.
3. **Hybrid** — mix both in one campaign.

Customer flow:
**SCAN → PLAY → WIN → REDEEM NOW OR COME BCK → MEASURE**

## 3. COLOUR SYSTEM
```css
:root {
  --bone: #F4F0E6;
  --paper: #FFFDF7;
  --white: #FFFFFF;
  --ink: #111111;
  --violet: #6558FF;
  --violet-dark: #5548EA;
  --lime: #C8FF4D;
  --lime-soft: #E7FFAC;
  --muted: #68645F;
  --danger: #FF6B66;
  --success: #75D89B;
}
```

## 4. TYPOGRAPHY
Primary stack:
```css
font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Desktop scale:
- Display XL: 76/78, 800
- Display: 64/66, 800
- H1: 56/58, 800
- H2: 44/48, 800
- H3: 30/34, 750
- H4: 22/27, 700
- Body XL: 20/30
- Body: 16/25
- Small: 14/21
- Label: 12/16, 800 uppercase

Mobile scale:
- Display: 46/47
- H1: 42/44
- H2: 34/38
- H3: 26/30
- Body XL: 18/27
- Body: 16/25
- Small: 14/21

## 5. SPACING
Use only:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 144`

Desktop section spacing: 96–120px.
Mobile section spacing: 64–80px.

## 6. LAYOUT
- Marketing max width: 1240px
- Merchant console content max width: 1220px
- Cards use 2px ink borders
- Desktop side rail: about 240–246px
- Tablet rail may collapse to icons
- Mobile uses compact navigation; no horizontal crowding

## 7. PUBLIC WEBSITE
Keep minimal and product-led:
**Hero → reward modes → nine games → how it works → dashboard proof → brand control → Surat pilot → final CTA**.
Do not crowd the homepage with every backend feature.

## 8. GAME LIBRARY
The release candidate includes exactly nine games:
1. Spin the Wheel
2. Instant Lottery
3. Slot Machine
4. Catch & Win
5. Snakes & Ladders
6. Tap Speed
7. Perfect Pour
8. Pin the Bite
9. Stack & Win

Customer states are READY → PLAYING → RESULT → REWARD. Merchant previews use this same runtime in clearly labelled test mode, without live rewards or activity. Retain the lightweight DOM/CSS and requestAnimationFrame architecture.

Games may be visually more expressive but must still use the BCK palette. Avoid gambling language and casino positioning.

## 9. AUTH EXPERIENCE
Auth must be minimal and premium:
- Sign In / Create Account tabs
- email + password
- password visibility toggle
- forgot password
- business name on sign-up
- real Supabase Auth
- no decorative clutter

## 10. MERCHANT CONSOLE INFORMATION ARCHITECTURE
```text
Overview
Campaigns
  -> New campaign wizard
Coupons
QR Studio
Analytics
Customers
Settings
  -> Notifications
  -> Help & support
  -> Legal / terms preview
```

The screenshots supplied by the user show useful product categories and hierarchy, but BCK must not reproduce another product's distinctive page layouts or exact copy.

## 11. MERCHANT CONSOLE DESIGN RULES
- Same premium neo-brutalist system as the marketing site, but quieter.
- Bone background and paper navigation surface.
- Primary cards: 2px ink border + 4–6px offset shadow.
- Accent shadows only where they help hierarchy.
- One persistent business identity.
- One permanent QR destination.
- Many campaigns can sit behind the same QR.
- Empty states must explain the next useful action.
- No duplicate floating chat/WhatsApp buttons.
- No serif font substitution just to mimic another dashboard.

## 12. BCK-SPECIFIC DIFFERENTIATORS IN THE CONSOLE
The merchant console must explicitly support:
- Instant Reward
- Come-BCK Reward
- Hybrid campaigns
- repeat-visit rate
- retained revenue
- return-window/cohort measurement
- first-timer / returned / regular / at-risk segments
- permanent dynamic QR routing
- nine-game library
- future WhatsApp follow-up controls

## 13. CAMPAIGN BUILDER
Campaign creation is three explicit steps:
```text
1. DETAILS
2. GAMES
3. REWARDS & BRAND
```
Avoid a long single-page settings dump. Advanced controls stay secondary.

## 14. OVERVIEW / TODAY'S PULSE
Show only essential metrics:
- scans
- plays
- rewards redeemed
- repeat rate
- daily activity
- engagement funnel
- active campaign state
- quick actions

## 15. COUPONS
Track:
- issued
- redeemed
- expired
- validity
- redemption mode
- campaign source

## 16. QR STUDIO
One Design & Export workspace shares a single live preview and export toolbar (Preview, Test live experience, Copy link, PNG, PDF, Save, Reset). Templates: QR Only, Table QR, Table Tent A6, Counter Card A5, Poster A4 and compact receipt. Colours, frame, background, business name, optional logo and CTA (maximum 64 characters) never change the permanent merchant link. Keep a white quiet zone of at least four modules, high-contrast code colours and logos outside the code. PNG/PDF use the same full-resolution canvas as the preview.

## 17. ANALYTICS
Exactly one date selector: 1D, 7D, 30D, 90D, 1Y, Custom; one campaign filter and one data-only Refresh analytics control. All tabs share that scope. Retain the daily line chart. Peak engagement is a separate hourly bar chart with Plays (default), Scans or Redemptions, never their sum. Aggregate the selected metric by clock hour across selected merchant-local dates; keep correct night/morning/noon/afternoon/evening labels and accessible values.

Optional business hours belong in onboarding and Company details: seven open/closed days, native opening/closing time inputs, timezone, apply-to-all and copy-previous controls. Overnight closing belongs to the following day. Configured hourly charts use the union of applicable opening hours; 1D uses that day, including overnight carry-over. Without hours, show observed hours and an explicit configuration prompt, not invented opening times. Until the additive business-hours database migration is approved, clearly label device-only schedule storage. Do not imply cross-device persistence.

Tabs:
- Traffic
- Games
- Coupons
- Retention

BCK's unique retention layer should include:
- returned customers
- repeat rate
- retained revenue
- average return days
- configurable return window / cohorts

## 18. CUSTOMERS
Use lightweight segmentation rather than a heavy CRM in early versions:
- First timers
- Come-BCK customers
- Regulars / VIP
- At risk

Any customer identification or messaging must be consent-based.

## 19. SETTINGS
Include:
- owner / business details
- city / address
- brand defaults
- menu or fallback destination
- account controls
- notifications
- support
- legal preview

## 20. MOTION
Allowed:
- 150–250ms button interactions
- 400–600ms reveals
- game-specific animation
- short celebratory feedback

Avoid:
- parallax overload
- scroll hijacking
- infinite decorative movement
- huge 3D transforms

Respect `prefers-reduced-motion`.

## 21. ACCESSIBILITY
Required:
- strong contrast
- visible focus states
- 44px minimum touch targets
- semantic headings
- labels for auth/forms
- keyboard usability where feasible
- no information communicated only by colour

## 22. COPY RULES
Preferred language:
- come bck
- bring them bck
- reward now
- reward next visit
- repeat customers
- repeat revenue
- scans
- plays
- redemptions

Avoid generic AI/SaaS filler such as “revolutionize”, “seamless ecosystem”, and “growth hacking”.

## 23. DO NOT
- use glassmorphism
- use random pastel colours
- add fake logos/testimonials
- crowd pages
- overuse lime
- overuse rounded cards
- add decorative AI-looking graphics
- copy ForStore proprietary code, assets, logo, exact copy or terms
- make BCK look like a casino
- hide core functionality behind hover-only states
- sacrifice mobile usability

## 24. BRANCH-SAFE DEVELOPMENT
BCK uses feature isolation:
- `main` = stable production
- `develop` = integration
- `feature/marketing-site`
- `feature/auth-supabase`
- `feature/games`
- `feature/merchant-dashboard`
- `chore/netlify-deploy`

Flow: feature branch → PR → `develop` → integration test → release PR → `main`.

## 25. ACCEPTANCE TEST
A BCK screen is acceptable only if:
1. It clearly reads as premium neo-brutalist.
2. It feels restrained and professional.
3. Information density is controlled.
4. Mobile looks intentional.
5. Instant / Come-BCK / Hybrid logic is visible where relevant.
6. The console measures retention, not only game engagement.
7. The original six games are preserved alongside Perfect Pour, Pin the Bite and Stack & Win.
8. Auth uses real Supabase.
9. No proprietary ForStore code or assets are copied.
10. Work is done on the correct feature branch and tested before `main`.

## NORTH STAR
> **bck.** should feel like the sharpest customer-retention product in the room — playful enough to make games desirable, disciplined enough that a restaurant owner trusts it with real revenue.
# PR #7 shared surface contract

The existing static UI uses `bck-system.css` as its final geometry layer. STANDARD CARD / PANEL RADIUS = 18px, CONTROL RADIUS = 11px, MODAL RADIUS = 22px. Status pills retain 999px. Normal important cards use 2px ink borders and a 6px 6px hard ink shadow; small secondary surfaces may use 4px. Controlled violet/lime offsets belong only to selected or primary features. No blurred shadows. Controls have a minimum 44px target. Do not sharpen these values in later polish passes.

Normal card padding is 24px desktop / 20px mobile. Normal card gaps are 20px desktop / 16px mobile; related controls use 8–12px and major sections 32–40px. Special boards, QR graphics and the phone preview retain purpose-specific geometry. Campaign cards always put status top-left and options top-right, above the name and metadata, never absolutely positioned over content.

Mobile uses one fixed horizontally scrollable bottom rail: Dashboard, Campaigns, Coupons, QR, Menu, Analytics, Customers. Each destination has an icon, readable label and comfortable width. The active item scrolls into view; safe-area and content bottom padding prevent obstruction. There is no More placeholder or duplicate top icon rail. Settings is a 44px gear beside the language selector in the mobile header. Desktop keeps the labelled sidebar. Campaign overflow menus support arrows, Home/End, Escape and outside dismissal, stay above bottom navigation and retain destructive confirmations.

Data-heavy screens use the shared “Refresh data” control: fetch without page navigation, disable while pending, show status, retain previous data on failure. Realtime updates must not rebuild unsaved forms.

Game identities use original 64-unit SVG marks from `BCKGames.mark`, in a consistent 48px container (96px on READY). Names remain visible; icons never replace accessible labels. The same customer runtime appears inside a phone frame with an explicit no-write test notice.
