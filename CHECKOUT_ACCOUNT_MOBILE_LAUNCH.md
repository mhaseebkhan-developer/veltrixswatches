# VELTRIXS WATCHES — Customer sign-in required + premium store upgrade

Updated: November 2026. This ZIP includes **all 25 original HTML pages** and the Supabase backend source.

## Deployment order (important)

1. **Before advertising / enforcing customer accounts**, first check that your existing customer account setup (migration `supabase/migrations/002_customer_accounts.sql`) has been applied and customer registration, confirmation, profile and private order list already work. If it has already been run, do **not** rerun old setup.sql and do not reset orders.
2. In Supabase Dashboard > Edge Functions > **place-order**, replace and redeploy with `supabase/functions/place-order/index.ts` from this ZIP. Keep the function name `place-order`. The function now rejects `action:create` with **HTTP 401** unless the request has a valid Supabase Auth access token; it never trusts user_id/email from the browser. Valid older order receipts and guest-order claims continue to work.
3. **Verify JWT OFF** for this function only if you need existing public receipt verification/guest-order claim functionality. The function itself verifies the access token for `create` and `claim`. This does **not** bypass auth for new orders. Confirm function logs and rate limits. Service-role key must be present **only in Supabase function environment**; never in your public GitHub site.
4. Deploy contents of `VELTRIX/` to the root of the existing GitHub Pages repo (`veltrixswatches`). Don't upload the outer VELTRIX directory as an additional path.
5. Supabase Auth > URL Configuration: Site URL `https://mhaseebkhan-developer.github.io/veltrixswatches/` and allow Redirect URLs for `.../account.html` and `.../admin/index.html`. Check Reset Password and Confirm Signup email templates use `{{ .ConfirmationURL }}`. Configure a reliable custom SMTP provider. Test confirmation and reset links.
6. Hard-refresh the pages on your phone (close old browser tabs or open an incognito tab) and test at 320px/360px and 768px. The mobile/tablet top bar has **SIGN IN** and **CREATE ACCOUNT** CTAs. After login, they become MY ACCOUNT / MY ORDERS.

## Safe checkout test checklist

- Signed out with cart item: checkout displays **Sign in to finish your order**; no shipping/Place Order form available.
- Direct POST `action:create` without bearer token: **HTTP 401**, and no order or inventory changes.
- Register a fresh customer and confirm email, login; cart remains on device. Sign-in from checkout should return to checkout.
- Place one authorized, small controlled COD test order with sufficient verified stock; verify admin and customer account show SAME order and that stock changes exactly once. Cancel the controlled test and check stock restore.
- Admin dashboard > Orders > status change persists and appears in customer order history; tracking information is displayed only when entered by staff.
- Sign out then login again, private profile/address/order data still available; another customer cannot access it (RLS test).
- Homepage footer Staff/Admin Login opens `admin/index.html`, not unsecured dashboard.

## Scope and limitations

- This is a **premium retail UI redesign**, not a Shopify backend, payment gateway or courier integration. Supabase remains the source of truth.
- Existing live orders/admin pages, product prices, SQL 001/002, order-status logic and files remain in place.
- Live SMTP and Supabase Edge Function deployment require credentials/control that aren't included in this ZIP. These must be checked in your project dashboard.
- No physical order was submitted automatically in testing.
