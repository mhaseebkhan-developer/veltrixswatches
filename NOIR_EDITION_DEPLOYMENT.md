# VELTRIXS WATCHES — NOIR EDITION (Black & White)

## Update summary
- All **12 customer pages** and **13 admin pages** now use a clean editorial black-and-white visual style.
- High-contrast white navigation, elegant serif VELTRIXS WATCHES wordmark, bold monochrome homepage, uncluttered product cards, refined login/register area, black footer, and minimalist admin dashboard.
- The **mobile/tablet Sign In and Create Account links remain ONLY inside the hamburger menu**; desktop keeps its original Account link.
- Homepage footer retains its **Admin Login** link.
- Product photos/URLs, all business data, SQL, Edge Functions, JavaScript, checkout auth rules, passwords, admin permissions, orders and stock are **unchanged**.
- The color palette of UI (black, white and neutral gray) is monochrome. Product photo imagery is not recolored in product cards, to avoid misrepresenting the actual watches.

## Installation
1. Make a backup of the live repository first.
2. Extract the ZIP and upload **everything INSIDE `VELTRIX/`** to your GitHub repository root `mhaseebkhan-developer/veltrixswatches`, replacing the existing matching paths. Do not create a nested `VELTRIX/` directory on GitHub.
3. Commit and let GitHub Pages deployment finish.
4. Open https://mhaseebkhan-developer.github.io/veltrixswatches/ and refresh the cache (`Ctrl+Shift+R` on desktop, private browser tab on mobile).
5. Check desktop and mobile home, shop, product, login/register, cart, checkout; log in as an admin and check dashboard, products and orders.
6. Run a **controlled logged-in COD test** and verify the existing Supabase order, customer history and admin order-status flow before marketing.

**No database SQL migrations or Edge Function redeployments are required for this CSS-only redesign**, provided your previously deployed login-required order and customer-account features are already working. This package does not activate missing backend resources.

## QA performed
- 25/25 HTML pages verified, 150 offline browser layout checks (320, 360, 390, 768, 1024, 1440px) without horizontal overflow.
- 16 isolated interactive checks of the hamburger Sign In/Create Account links across 4 customer pages and 4 viewport widths.
- JavaScript syntax checks for all project JavaScript and inline HTML scripts.
- Relative local file links checked. Source diff audit confirmed all existing JavaScript, SQL and Edge Function files are byte-for-byte unchanged.
- Pure black/white contrast confirmed on home, shop, product, account, checkout and admin dashboard.
- Product photo/network availability and real Supabase end-to-end behavior were NOT tested in the isolated preview environment.

## Why the screenshots may look darker offline
The hero and collections use the original external Unsplash photography, which remains untouched. When images cannot load in an offline preview, the black background stays visible; the live website requires network access to show those original images.
