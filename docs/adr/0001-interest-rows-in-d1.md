# Persist Interest as D1 rows, show only the count

We store one D1 row per User who currently has an Interest, not a single incrementing counter. The site only renders the Interest count; there is no roster or admin page. D1 (not KV) is the store so a toggle can insert or delete by Clerk user id, the count is a query, and the operator can inspect or remove a row with Wrangler or the Cloudflare dashboard.
