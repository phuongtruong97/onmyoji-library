# Onmyoji community database

The first migration creates community profiles, Shikigami reviews, Soul recommendations, votes, reports, moderation states, indexes, and Row Level Security policies.

## Connect a Supabase project

1. Create a Supabase project.
2. Run `supabase/migrations/202609240001_community.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key to `.env.local`.
5. Keep `SUPABASE_SECRET_KEY` server-side only. Never prefix it with `NEXT_PUBLIC_`.

All community submissions start as `pending`. Public visitors can read only `approved` reviews and recommendations. Authenticated users can read and edit their own pending submissions.
