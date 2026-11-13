# VELTRIXS WATCHES | Customer Accounts Upgrade

**Site:** https://mhaseebkhan-developer.github.io/veltrixswatches/

Includes all existing HTML pages and assets plus a complete Supabase-backed customer account dashboard.

**Start here:** `CUSTOMER_ACCOUNT_SETUP.md` — especially the SQL migration, `place-order` Edge Function redeployment, email URL configuration and private-data tests.

**Core changes:** `account.html`, `assets/css/customer-account.css`, `assets/js/customer-account.js`, `assets/js/backend.js`, `assets/js/frontend.js`, `assets/js/admin.js`, `supabase/functions/place-order/index.ts` and the new additive SQL migration. All other existing production behavior and files are retained.

**Order tracking:** Admin enters real courier details into `admin/order-details.html` (the UI is injected by updated `admin.js`), and customer history queries the same database. Order statuses are not invented.

**Security:** Row Level Security is required for customer profile and addresses. Production must not launch without running the migration and verifying that two different customer accounts cannot access each other's private records.
