> **Note for premium refresh:** This is the original backend-setup guide from the initial deployment package. You have since reported that real COD orders appear in the admin panel. The premium theme release does **not** require rerunning SQL or redeploying Edge Functions. See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) for the new release.

# VELTRIX — Supabase production integration handoff

**Status:** Source code is packaged; the Supabase database/functions have NOT been deployed to your project by ChatGPT because the connected Supabase account has no permission for project `hpjferomelaupnpuvupu`. Real orders cannot be accepted until you finish deployment and test it. Never assume a successful order if the checkout function is missing.

## 1. Your environment
- Project URL: `https://hpjferomelaupnpuvupu.supabase.co`
- Project ref: `hpjferomelaupnpuvupu`
- Publishable key: configured in `assets/js/backend.js` (safe to publish when RLS is correct)
- **Do not put `service_role`/secret keys in the frontend, GitHub or ZIP.** Edge Functions use managed server environment secrets.

## 2. Run the database setup SQL
- Sign into the **correct** Supabase organization at https://supabase.com/dashboard/project/hpjferomelaupnpuvupu .
- Open **SQL Editor → New query** and run `supabase/setup.sql` as the project owner. This extends the earlier Step 3/4 product/admin tables; it also inserts the 12 original reference products but DOES NOT overwrite existing inventory.
- Check the database has `products`, `admin_users`, `orders`, `order_items`, `coupons`, `store_settings`, `reviews`, `contact_messages`, `newsletter_subscribers`.
- Ensure the admin user is listed in `admin_users` with the exact `auth.users.id`, e.g. for a manually trusted email ONLY: `insert into public.admin_users(user_id) select id from auth.users where email='YOUR_ADMIN_EMAIL' on conflict do nothing;` Run this in SQL Editor as owner. Never expose an admin-membership creation form to customers.
- Inspect **Database → Security Advisor**; do not disable RLS. Depending on Data API exposure defaults, tables may require Data API exposure / grants, but RLS policies MUST stay active.
- Seed products are `stock=0` by design. Verify actual inventory, product specifications, fulfillment ability, and update stock from authorized admin BEFORE allowing orders. This prevents taking money/commitments for nonexistent stock.

## 3. Deploy both server functions
Install and authenticate the official Supabase CLI (see https://supabase.com/docs/guides/functions/deploy ). In a terminal opened in this project root (where `supabase/` exists):

```sh
supabase login
supabase link --project-ref hpjferomelaupnpuvupu
supabase functions deploy place-order
supabase functions deploy contact-submit
```

`supabase/config.toml` sets `verify_jwt = false` only on these public endpoints; **the code itself** validates input and uses a server-side service-role key to call the restricted order RPC. This key must be available as `SUPABASE_SERVICE_ROLE_KEY` in the Edge Function runtime. If your project uses only newer secret keys and lacks that environment variable, configure a server-only project secret and adapt the function before launch; never paste it into `assets/js/backend.js`.

**Do not skip these functions.** Uploading HTML alone to GitHub Pages or another static host cannot create database orders.

## 4. Deploy only the static site
`index.html`, remaining 11 customer pages, `admin/`, and `assets/` can be deployed to GitHub Pages, Vercel static hosting, or Netlify. Keep all file names and relative paths unchanged. `supabase/` is the source for deployment operations, not needed in public static hosting.

The admin address is `<YOUR_PUBLIC_DOMAIN>/admin/index.html`. The dashboard and all modifying database operations require a real Supabase Auth session plus membership in `admin_users`. Admin UI appearance alone is not an authorization boundary; PostgreSQL RLS is the enforcement layer.

## 5. Non-negotiable release tests (using only controlled test data)
1. Confirm storefront public product and store-settings GET works and original design renders.
2. Sign in to admin; try signing in with a normal non-admin account (must be refused).
3. Set **one verified product's stock to 2**. Open guest checkout in a fresh, signed-out browser, order quantity 1 with a test address explicitly marked test in your private operations notes. The order must return a **real database order number** (e.g. `VX-…`) and order receipt and appear in `public.orders` and `public.order_items` and the admin Orders page. Inventory must become 1. **Cancel that test order** and check stock goes back to 2; delete or archive test data only via a controlled database procedure.
4. Verify duplicate checkout submissions with the same idempotency key produce only one database order.
5. Verify unauthenticated users cannot read customer addresses or mutate products/orders. Verify unauthorized customer cannot see other order information.
6. Try zero-stock checkout (must refuse). Validate coupon total is calculated on the server, not from cart price.
7. Send a contact message and newsletter signup, verify database writes in authorized SQL Editor.
8. Configure production store contact, shipping/return policies, anti-spam (ideally Turnstile/OTP), privacy notice, actual inventory, backups and merchant fulfillment workflow. COD doesn't capture any advance payment. Online payment gateway, transactional customer emails and carrier integrations are NOT included.

## 6. Architecture
- `assets/js/backend.js`: publishable key + browser REST, Auth, edge requests.
- `assets/js/store.js`: presentation/cart/wishlist helpers; demo order creation intentionally disabled.
- `assets/js/frontend.js`: shop, product, cart, COD checkout, receipt, customer account, contact.
- `assets/js/admin.js`: authenticated DB product/order/inventory management and admin UI.
- `supabase/setup.sql`: RLS, tables, seed reference products, atomic COD order RPC, stock-restoration trigger.
- `supabase/functions/place-order/index.ts`: PUBLIC server endpoint, validates guest COD orders, checks stock/pricing atomically in Postgres and returns authenticated receipt token.
- `supabase/functions/contact-submit/index.ts`: customer contact/newsletter API.

## 7. Current important limitations
- The **website code** is built for real persistent COD order records, but **no live database migration, Edge Function deployment or end-to-end real-order test has been completed** in the supplied project. The publishable key alone is insufficient privilege to deploy backend resources.
- Browser-run visual preview in ChatGPT's environment was blocked by the execution sandbox. Static HTML link checks and JavaScript syntax checks were performed.
- The original 12 watch images remain remote Unsplash references, not first-party licensed brand photography. Verify permissions/accuracy, inventory and product details before commercial launch.
- No automatic seller email/SMS order notifications or payment provider integration. Check the admin Orders panel after launch; configure your preferred notification service separately.
- Guest purchases do not automatically appear in existing customer accounts; order success uses a private receipt token and signed-in orders are linked to the authenticated user.
