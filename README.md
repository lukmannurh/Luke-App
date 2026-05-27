# Community Giveaway Platform

A mobile-first web application designed for online hobby and entertainment communities to host fair, transparent giveaways. The platform features automatic server-side drawings using cryptographically secure randomization, real-time sync, and a bold neobrutalist visual design.

## Features
- **Google OAuth Authentication:** Secure and seamless sign-in via Supabase Auth.
- **Fair Drawings:** Cryptographically secure server-side RNG (`crypto.randomInt`).
- **Real-time Synchronization:** Live drawing animations and state updates across clients.
- **Adaptive UI:** Mobile-optimized number selection (grid, dropdown, or input depending on scale).
- **Automated Deadlines:** Hands-free drawing via Vercel Cron jobs.
- **Multi-Winner Support:** Select multiple winners in a single giveaway.
- **Neobrutalism Design:** High-contrast, playful, and bold aesthetics.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Neobrutalism Tokens
- **Components:** shadcn/ui
- **Database:** Supabase PostgreSQL
- **Realtime & Auth:** Supabase Realtime, Supabase Auth
- **Deployment:** Vercel

## Environment Variables

Copy the `.env.example` file to `.env.local` and configure the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron Secret for automated drawings
CRON_SECRET=your_secure_cron_secret
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project in [Supabase](https://supabase.com).
   - Set up Google OAuth in the Authentication settings.
   - Run the SQL schema found in `specs/design.md` to create the tables (`users`, `rooms`, `participants`, `winners`).
   - Enable Row Level Security (RLS) policies as specified.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

### 1. Supabase
- Ensure your production database is fully set up with the correct schema and RLS policies.
- Configure your OAuth callback URLs in Supabase for your production domain.

### 2. Vercel
- Push the repository to GitHub.
- Import the project into [Vercel](https://vercel.com).
- Add all required environment variables in the Vercel project settings.
- The `vercel.json` file is already configured to trigger the cron job `GET /api/cron/check-deadlines`. Make sure the `CRON_SECRET` matches your Vercel settings.
- Deploy!
