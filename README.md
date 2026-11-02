# VELTRIX Watches — Modern Atelier Premium Refresh

Complete 25-page static storefront and administration interface, connected to the **existing** Supabase backend. The new design makes no attempt to imitate a payment gateway or create fictitious orders; customer checkout continues to use the real server-side Cash on Delivery order function already configured for VELTRIX.

## What's new
- A unified premium theme throughout the 12 customer pages: `assets/css/luxe.css`.
- A modernized admin interface (13 pages): `assets/css/admin-luxe.css`.
- Refreshed `account.html`: real Supabase Auth login, full-name registration, confirmation messaging, show/hide password, recovery and signed-in order history.
- Responsive layout polish, hover/focus states and accessible form labels.

## What's preserved
- All 25 page filenames and navigation paths, original VELTRIX branding, reference product images and descriptions.
- Public Supabase URL and publishable key, product catalog and live database queries.
- **Identical code** in the real COD checkout Edge Function, SQL, admin order management and shared cart/product storage.
- No changes to database schema, existing Supabase orders or server deployments.

## Publish
Upload the **contents of the `VELTRIX` directory** to the root of the `mhaseebkhan-developer/veltrixswatches` repository. See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) for Supabase Auth redirect configuration and recommended post-deploy validation. You do **not** need to rerun SQL migrations for this theme release.

**Important**: Customer sign-up and password recovery require Supabase Authentication email settings, redirect URL allowlist and deliverable SMTP email service. Browser-level UI tests were run in an isolated mocked-Supabase renderer, not against live accounts or actual order submissions.

**Marketing launch**: Replace externally hosted reference images with owned/authorized images of the watches you actually sell, and validate all specs, inventory, returns, warranty and shipping claims before paid promotion. COD orders are received in Supabase but fulfillment is still a merchant process, and online card payments and automated notification emails are not bundled.
