# VELTRIX — Premium 2026 Refresh / Launch checklist

This ZIP preserves the existing filenames, Supabase project URL/publishable key, Cash on Delivery order function, SQL migrations, and admin order/status code. Existing order data is **not** bundled or reset.

## Deploy
1. Unzip. Upload the **contents** of `VELTRIX/` to the root of your `mhaseebkhan-developer/veltrixswatches` GitHub repository, replacing matching files, and commit. Do not nest a `VELTRIX` directory one level down.
2. GitHub Settings → Pages should publish from `main` / root. Wait for the GitHub Pages deployment action to succeed.
3. Clear the site cache (Ctrl+Shift+R). Verify homepage, account, shop, admin login and checkout on both mobile and desktop.
4. No database re-migration is needed **for this visual/auth-only release**. Do not rerun `supabase/setup.sql` just for these design changes.

## Auth URL configuration (required for customer registration)
Set under Supabase project `hpjferomelaupnpuvupu` → Authentication → URL Configuration:
- Site URL: `https://mhaseebkhan-developer.github.io/veltrixswatches/`
- Allowed redirect URL: `https://mhaseebkhan-developer.github.io/veltrixswatches/account.html`
- Also retain the existing admin reset redirect allow-list URL `https://mhaseebkhan-developer.github.io/veltrixswatches/admin/index.html`.

Use the *exact repository spelling* `veltrixswatches` (with the two consecutive `s` in `swatches`) and HTTPS. Keep the email verification and password recovery templates using `{{ .ConfirmationURL }}`. Configure custom SMTP for real customer email confirmations, respecting email rate limits.

## Customer account test
- In incognito, open `account.html`, choose **Create Account**, fill Full Name, Email, Password (12+ characters), Confirm Password.
- Verify the email, if required. Follow the link back to `account.html` and confirm your account can sign in.
- Test sign out, sign back in, and view account-linked orders. Guest orders aren't automatically linked to a later-registered account.
- Test forgot password with a fresh recovery email; the reset form is on `account.html`.

## Real-order safety and marketing readiness
- This update **does not replace or simulate** the working server-side checkout; the existing `place-order` Edge Function / COD order RPC remain unchanged.
- Verify one **controlled COD order** appears in Supabase `orders`, `order_items`, and the admin Orders page, and reduces stock once. Cancel it according to your policies. Do not publish the site for general sales until this is checked after deploying the new frontend.
- Verify product photographs, specs, 7-day returns, 2-year warranty claims, stock levels, fulfillment terms and shipping promises are accurate for the products actually offered. The original site's product photography remains linked from Unsplash, not your own product asset library.
- Customer account shipping profile is stored on their current device. Signed-in order history is database-backed; the browser storage isn't an account-wide persisted address book.
- COD means no online card payment is collected; a customer order is recorded and requires manual fulfillment. Payment is not verified as collected.
- Automated seller email/SMS order alerts and persistent delivery/tracking integrations are not bundled; use admin Orders to manage fulfillment.

## Updated files
- NEW: `assets/css/luxe.css` applies the premium customer theme to all 12 pages.
- NEW: `assets/css/admin-luxe.css` applies the premium management theme to all 13 admin pages.
- UPDATED: all 25 HTML files load only the applicable new theme sheet; `account.html` has the new customer login/registration/recovery UI.
- UPDATED: `assets/js/frontend.js` and `assets/js/backend.js` add customer Auth UI support; **checkout, stock, admin logic, and order placement are unchanged**.
- Unchanged: `supabase/`, `assets/js/admin.js`, `assets/js/store.js`, and original product/content/image URLs.

Security: `sb_publishable_...` is intended for public clients; do not put any Supabase service-role or secret key in GitHub files. Admin authorization must remain enforced by existing Row Level Security policies.
