# Kantha Pranth — Bengaluru

Vercel-ready Next.js shell around the current Kantha Pranth V1 functional prototype.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Framework: Next.js (auto-detected).
4. Build command: `next build`.
5. Deploy.

The current prototype is stored at `public/prototype.html`. It uses browser localStorage for demo data. The next production step is replacing this storage with Supabase authentication/database/storage.
