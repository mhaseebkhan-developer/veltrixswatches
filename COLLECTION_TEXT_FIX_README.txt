VELTRIXS WATCHES — NOIR COLLECTION TEXT RESTORATION

Fixed: missing text overlay on the three homepage Collection cards and on the Collections listing.
The cause was an incorrect CSS override that switched the caption container to relative position, causing it to be clipped. The cards now show their labels, titles, and links reliably on all viewports.

Files changed from previous NOIR ZIP:
  index.html (cache-busting CSS link only)
  collections.html (cache-busting CSS link only)
  assets/css/noir-monochrome-2026.css (caption overlay correction appended)

Everything else, including Supabase, COD checkout, accounts, admin, functions and SQL, is byte-for-byte unchanged.

HOW TO UPLOAD: Extract ZIP; upload all CONTENTS inside VELTRIX folder to root of existing GitHub repo, replacing matches. Or for minimal patch, replace the three files listed above.
Then hard refresh (Ctrl+Shift+R) or open incognito. No SQL or Edge Function redeployment needed.
