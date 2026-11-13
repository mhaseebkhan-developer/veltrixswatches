# VELTRIXS WATCHES — Premium Storefront Update (13 Nov 2026)

## Scope
- All 12 customer pages share an updated compact, monochrome design via `assets/css/noir-monochrome-2026.css`.
- All 13 admin pages share a calmer, denser dashboard/login design via `assets/css/admin-noir-monochrome-2026.css`.
- Smaller page introduction banners, landing hero, product and collection headings, and form sections across desktop/mobile.
- Original branding, products, imagery, navigation, every original HTML filename, directories, Supabase project URL, key, SQL schema and Edge Functions are preserved.

## Authentication and checkout
- An explicit CSS rule now hides `#checkoutForm` until `VXNET.currentUser()` succeeds. The HTML form is also initially hidden.
- Signed-in checkout removes the initial hiding and reveals the form.
- Logged-out cart now links to existing `account.html?view=login&next=checkout.html` (register tab is on that same page).
- Signup confirmation retains the existing Supabase confirmation redirect URL. A temporary (2-hour) same-origin checkout intent lets confirmed users continue after returning to the account page.
- Server-side `supabase/functions/place-order/index.ts` ALREADY verifies the user identity on `action=create`; this safeguard remains unchanged.
- Do not use only client-side gates as security; Supabase Auth and server order verification remain authoritative.

## Deployment
1. Back up your current deployed site and upload the entire updated `VELTRIX/` contents to the same hosting paths.
2. Keep the existing Supabase configuration, keys and Edge Functions. No SQL migration is required specifically for this visual update.
3. Keep your existing Supabase Auth URL Configuration: registration still uses the unchanged `account.html` confirmation redirect URL. Validate your real deployed domain remains allowed.
4. Test the signed-out cart > sign in/create account > checkout path, then signed-in checkout, order receipt, customer order history and admin access.
5. Test mobile navigation at 375px and tablet at 768px; test with a normal browser on your actual hosted domain, not `file://`, because Supabase redirects/recovery require an allowed HTTP(S) origin.

## Live limitation
No real order was placed; this package was verified offline for route/file preservation and local code logic. Confirm authentication, deployed Supabase redirects and ordering with controlled test data before production launch.
