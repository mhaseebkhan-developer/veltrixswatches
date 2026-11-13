# VELTRIXS WATCHES — Real Customer Accounts / Production Setup

## What this update adds
- Login, registration, email confirmation, forgot/reset password, authenticated password change, email-change request.
- Optional **keep me signed in** session and automatic access-token refresh (no credentials stored in code).
- Real **private** customer profile and multiple shipping addresses, saved to Supabase. Each user sees only their own rows through RLS.
- Saved default address and private profile information prefill a signed-in user's checkout.
- Recent and older signed-in orders from `public.orders`, with each order's status, amount, order items, courier and tracking details. **Refresh** button and background poll every 45 seconds while the customer is on the account page.
- Optional guest-order claim only when signed in and providing its matching private receipt token, verified server-side.
- Admin order-details page now allows entering **real carrier / tracking number / HTTPS tracking URL**; it still uses the existing admin authorization and status update logic.

## REQUIRED: deploy in order

### 1) Back up existing working site
Download or tag your current working `mhaseebkhan-developer/veltrixswatches` release. Keep your existing Supabase data. Do NOT delete existing auth users or any order rows.

### 2) Run only NEW migration (do not rerun initial setup)
Open the actual Supabase project: https://supabase.com/dashboard/project/hpjferomelaupnpuvupu/sql/new

Paste and run the **entire file**: `supabase/migrations/002_customer_accounts.sql`.

This is additive: new `customer_profiles`, `customer_addresses` and three tracking columns on `orders`. It **does not delete or modify existing orders, inventory or admin permissions**.

Before launch verify SQL results: 
```sql
select to_regclass('public.customer_profiles') as customer_profiles,
       to_regclass('public.customer_addresses') as customer_addresses;
select column_name from information_schema.columns
 where table_schema='public' and table_name='orders'
 and column_name in ('tracking_carrier','tracking_number','tracking_url');
```

### 3) Redeploy UPDATED `place-order` Edge Function
Project Dashboard → Edge Functions → `place-order` → edit/deploy the full contents of `supabase/functions/place-order/index.ts`.

Do **not** change the existing COD order-create function name, API URL, service-role key or configured guest-access behavior. This version preserves `create` and `receipt` and adds `claim`, which authenticates the customer before linking a matching guest order receipt. Verify the server-side `SUPABASE_SERVICE_ROLE_KEY` environment variable remains configured. NEVER put it in `assets/js/backend.js` or any HTML file.

If you use Supabase CLI instead of the Dashboard, refer to your installed CLI's `--help` for its current deployment syntax. `place-order` is a public guest-checkout endpoint: its server-side code validates customer credentials when a signed-in action requires them.

### 4) Publish website ZIP files to GitHub Pages
Replace your existing repo files with the contents of the **inner** `VELTRIX/` folder. Preserve all filenames and folder paths. Commit and wait for GitHub Pages success. The actual existing page URL is:

https://mhaseebkhan-developer.github.io/veltrixswatches/account.html

### 5) Supabase Auth URLs + email
Dashboard → Authentication → URL Configuration:

- Site URL: `https://mhaseebkhan-developer.github.io/veltrixswatches/`
- Additional Redirect URLs: `https://mhaseebkhan-developer.github.io/veltrixswatches/account.html` and `https://mhaseebkhan-developer.github.io/veltrixswatches/admin/index.html`

Dashboard → Authentication → Email Templates: both Confirm Signup and Reset Password should use `{{ .ConfirmationURL }}` for their real link. Remove any hard-coded `index.html` redirect from the email template.

Enable email/password auth and confirmation as desired, and configure custom SMTP for genuine customer-facing email volume. Supabase's default limited sender is not intended for production. **Don't share recovery tokens or SMTP credentials.**

### 6) Real end-to-end tests (on your own project)
1. Register with a NEW non-admin customer address and confirm the email; verify you land on `account.html`, not homepage.
2. Sign in, save profile and two addresses, sign out, sign in again from another browser; confirm the same private data appears.
3. Create a SECOND customer account; verify it **cannot read** the first customer's profile/addresses/orders.
4. Place one controlled COD order **while signed in**, confirm `public.orders.user_id` equals that customer's `auth.users.id`, and that customer sees the order under **My orders**. Orders placed before login are guest orders; link them only using the verified receipt flow.
5. In admin → Orders → Order Details, set status to `Shipped`, enter genuine carrier/tracking information, save and refresh customer account; the data should appear there. No courier events or automatic live GPS tracking are invented.
6. Click Forgot Password, use a fresh email link, set a new password, sign out, sign in using it. Check invalid/expired recovery links show an error rather than letting the user reset.
7. Verify order cancel/re-stock behavior still works; then test the 320px and 390px layouts.

## Notes / limitations
- **Private account storage is in Supabase Postgres protected by RLS**; old guest-only shipping fields may be on a browser locally until users sign out. Avoid public/shared computers or opt out of "Keep me signed in".
- Customers can **only see orders already linked to their Auth user ID**. Matching the email address alone is NOT proof that an old guest order belongs to that user. Claiming an older order requires the correct private receipt token.
- **Shipment tracking is staff-entered status/carrier/number/link**. This package does not integrate an external shipping company API or automatically send dispatch notifications.
- Password-reset, verification and email changes depend on working Supabase Auth emails and URL allowlist; these cannot be verified by static code alone.
- Full live Supabase integration has NOT been deployed or tested by the assistant. The user's existing COD checkout/order functionality was preserved; mock browser tests validated the updated account UI, but real end-to-end testing is necessary after deployment.
- The ZIP does not include real customer data or secret keys. Supabase publishable key is intentional for browser clients.
