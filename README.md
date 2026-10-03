# Kantha Pranth — Bengaluru V2

A mobile-first Next.js prototype for the Kantha Pranth Jain Community in Bengaluru.

## What's improved
- Mobile-first premium UI with clearer hierarchy and larger tap targets.
- Home dashboard, community feed, marketplace, services, events, profile and help.
- Demo post/listing creation with browser persistence.
- Optional Supabase browser client; the app works in demo mode when credentials are not configured.
- Supabase SQL schema with locality, profiles, posts, businesses, listings and events.

## Deploy to Vercel
1. Replace the files in the GitHub repository with this project.
2. Vercel will redeploy automatically.
3. For the first Supabase connection, create a project at https://database.new.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. In Supabase Project Settings/Connect, copy the project URL and publishable key.
6. In Vercel Project Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
7. Redeploy.

Never put a Supabase service-role/secret key in browser code or `NEXT_PUBLIC_*` variables.
