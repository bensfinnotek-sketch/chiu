# Lina AI Chinese

## Architecture

`Frontend → API/service layer → Backend → Database provider`

The UI keeps its existing local/demo learning engine. The backend boundary supports managed PostgreSQL through Supabase and a direct PostgreSQL executor adapter for deployments that inject node-postgres, postgres.js, Neon, or another compatible driver. When Supabase is configured, authentication and server repositories can persist account and learning data without allowing UI code to access the database directly.

### Backend provider boundary

- `src/app/services/auth.ts` — browser authentication client (email/password, Google OAuth, session, logout, reset request, account deletion).
- `api/_lib/authMiddleware.ts` — verifies bearer sessions server-side.
- `api/_lib/authHandlers.ts` — password reset and account deletion endpoints.
- `api/_lib/database/provider.ts` — provider-agnostic database contract.
- `api/_lib/database/supabaseProvider.ts` — managed PostgreSQL/Supabase adapter.
- `api/_lib/repositories/` — data-access layer; UI never imports database clients.
- `supabase/migrations/20261001000000_lina_learning_schema.sql` — PostgreSQL schema + RLS.

The schema covers profiles, lessons, vocabulary, grammar, mistakes, reviews, conversations, progress, streaks, achievements, subscriptions, usage, and conversation messages. The SQL migration is PostgreSQL-compatible and includes Row Level Security plus an auth-user trigger.

### Security

Gemini credentials are server-only. The browser only receives the Supabase publishable/anon key. Service-role credentials are accepted only by server-side code and are never referenced from `VITE_*` variables.

If no database/auth provider is configured, the app intentionally remains in local/demo mode. No fake remote database is presented as real persistence.

## Local development

Copy `.env.example` to `.env` and configure the provider values you need.

Existing frontend routes and learning flows remain unchanged.
