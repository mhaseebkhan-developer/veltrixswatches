# VELTRIXS WATCHES — Small-Phone Responsive + Premium Admin Upgrade

## What is new
- All 12 customer HTML pages include `assets/css/responsive-2026.css` as a final responsive layer.
- All 13 admin HTML pages include `assets/css/admin-signature-2026.css` for an updated premium executive dashboard, refined tables, login forms and navigation.
- The 12 internal admin pages additionally include `assets/js/admin-ui-2026.js`, a presentation-only small-screen menu backdrop, Escape/outside-tap close and accessibility state synchronization.
- The brand name remains **VELTRIXS WATCHES** (with WATCHES separately styled).

## What has NOT changed
- Original 25 HTML filenames and folders, customer account/registration flow and Supabase URL.
- `assets/js/backend.js`, `frontend.js`, `store.js`, `admin.js` (original business code unchanged, byte-for-byte).
- PostgreSQL schema, SQL functions, Edge Functions, product catalog data and pricing.
- Live Cash-on-Delivery checkout, admin order status actions and inventory management code.

## Deployment
1. Extract the ZIP. Open the **VELTRIX** folder.
2. Upload **all files and folders INSIDE VELTRIX** to the root of your `veltrixswatches` GitHub Pages repository, preserving paths and overriding previous versions. Do not create a nested VELTRIX folder inside the repository root.
3. Commit, confirm GitHub Pages finished deployment and hard refresh on mobile.
4. Smoke-test: shop filter / cart / checkout, admin mobile menu, login, saved order status, 320px / 360px / 375px / 390px / 430px widths.
5. Keep Supabase project settings and SQL as-is; no migration required.

## QA notes
- Local Chromium render tests inspected all 25 HTML pages at viewport widths **320, 360, 390, 430, 768, 1024 and 1440**: 175 viewport/page combinations; no horizontal overflow in the static rendered pages. Interactive server data, images and authenticated admin states were not tested against your live Supabase project.
- Existing business logic source files are byte-for-byte identical to previous complete release.
- JavaScript syntax and local relative-file path checks pass.
- Mobile administrator tables scroll horizontally **inside their own containers** rather than overflowing the screen. On screens 320–600px, shop cards remain two columns; filters, cart, search and forms fit the viewport.

## Safety
This package does NOT migrate or directly change your live GitHub repository or Supabase backend. User previously confirmed production test orders and admin order status work; you should verify those flows again after deployment, and always back up the deployed version before replacement.
