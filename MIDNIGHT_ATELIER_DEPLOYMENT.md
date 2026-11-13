# VELTRIXS WATCHES — THE MIDNIGHT ATELIER

## What changed (8 November 2026)

A complete visual redesign for all 25 pages using a coherent midnight sapphire, royal steel blue, platinum silver, crisp white and champagne-gold accent palette. The design was informed by luxury-watch editorial conventions (immersive product imagery, clean proportions, uncluttered shopping navigation), not cloned from a third-party brand.

### Customer experience (12 pages)
- Premium midnight-blue homepage hero with warm champagne-gold primary call to action.
- Silver/platinum product panels, strong product-price contrast, navy/silver storefront UI and footer.
- All pages: improved typography, cards, headings, buttons, checkout forms, and account visuals.
- Responsive layout adapted for 320px, 360px, 390px, 768px, 1024px and desktop.
- On tablet and mobile (up to 1100px), **Sign In / My Account and Create Account are ONLY INSIDE the hamburger menu**. No extra row of login buttons is present beneath the header. Desktop keeps the original Account navigation link.
- Mobile duplicate BAG/CART label removed. The homepage admin login link was already present and remains unchanged.

### Administration (13 pages)
- Midnight/royal-blue sidebar, champagne-gold selected indicators, crisp platinum KPI cards, modern tables and clean forms.
- Responsive sidebar/drawer, admin login and all management pages receive the same visual direction.

### What has NOT changed
- Existing Supabase URL/key, real COD place-order Edge Function logic and SQL migration contents.
- Cart/order/product/admin JS, inventory handling, tracking, email/password, protected customer profiles, and account backend logic.
- All 12 customer and 13 admin HTML filenames, their routes, and all product image URL references.
- Your real database (this ZIP is a file bundle, not a database deployment).

### Changed/new files
- New `assets/css/atelier-midnight-2026.css` loaded last by every customer HTML page.
- New `assets/css/admin-atelier-2026.css` loaded last by all admin HTML pages.
- Edited 25 HTML pages to reference the new visual styles; 12 customer files also remove the separate mobile auth row.
- Updated `assets/js/shop-auth-ui.js` for authenticated names on hamburger-menu-only account links.
- Existing legacy CSS files remain as inert archives and are NOT loaded in place of the new theme.

## Deploy
1. **Back up your existing repository.** Extract this ZIP and upload the **contents of the `VELTRIX/` folder** to the root of the current `mhaseebkhan-developer/veltrixswatches` repository. Replace all existing files with matching paths; do not upload an extra nested `VELTRIX` folder.
2. Commit to the branch GitHub Pages uses for your storefront. The current production URL should remain `https://mhaseebkhan-developer.github.io/veltrixswatches/`.
3. Open the site in a new incognito window and on a mobile browser; hard-refresh cached pages. The account-menu JS has a query-string cache version so your updated menu appears.
4. Verify: mobile and tablet hamburger menu contains Sign In / My Account and Create Account, with NO separate header auth row. Desktop has an Account link.
5. Check account sign in, checkout authorization, a controlled COD order, and admin order status on your live Supabase installation. **No change to your live database or Edge Functions is necessary for this purely visual redesign**, assuming the previously supplied account-required backend was already deployed.

## Important production caveats
- The provided product images are still loaded from the original external URLs. Actual watch authenticity and product details are not guaranteed by the template.
- The changed styling and simulated responsive layout were tested locally; actual production checkout/email/account behavior depends on your running Supabase project, SMTP setup and migrations.
- This update does not change live orders or inventory. Avoid re-running `supabase/setup.sql` just for styling.

## QA
150 responsive layout checks (25 pages at six viewport widths: 320, 360, 390, 768, 1024, 1440); no horizontal overflow detected. HTML relative paths and JS syntax tested. Layout checks loaded local stylesheet contents with external image and font network blocked, so they do not constitute a live backend test.
