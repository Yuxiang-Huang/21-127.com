# 21-127

Unofficial site for CMU Concepts of Mathematics. See [CONTEXT.md](CONTEXT.md).

```sh
npm install
bash scripts/setup.sh   # Clerk keys, D1, first deploy
npm run db:migrate:local
npm run dev
```

Pushes to `main` build, apply D1 migrations, and deploy to Cloudflare Workers. Set repository secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLERK_SECRET_KEY`, and `PUBLIC_CLERK_PUBLISHABLE_KEY`.
