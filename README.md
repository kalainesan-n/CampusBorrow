# CampusBorrow

Borrow what you need. Share what you have.

CampusBorrow is a campus-focused peer-to-peer board for temporarily sharing things students already own — calculators, adapters, textbooks, chargers, lab equipment, sports gear, that kind of thing.

**Live demo:** https://campus-borrow-three.vercel.app/
**GitHub:** https://github.com/kalainesan-n/CampusBorrow
**Demo video:** https://drive.google.com/drive/folders/1kv9ZqR_Ggz4g-bDryl835tU_ZL472k-p?usp=sharing

## The idea

Most of the time when a student needs something — a calculator for tomorrow's exam, an HDMI adapter for a presentation, a textbook someone else finished with last semester — the actual process is asking around in WhatsApp groups and hoping someone responds in time. CampusBorrow just puts that in one place instead of a dozen scattered chats.

It's deliberately not a marketplace. No buying/selling, no ratings, no follower system, no built-in chat. The only thing close to "money" is an optional small lending fee a lender can attach to their post — enough to make it worth digging a charger out of a drawer, not enough to make this a rental business. The whole thing is built around one loop:

**Post → Discover → Claim → Borrow → Return**

## How it works

A post is either a **Need** ("need a scientific calculator for tomorrow") or a **Have** ("French textbook available, Sem 1"). Anyone browsing the board can claim an open post if they can fulfill it, and from there it moves through a simple lifecycle: `Open → Claimed → Borrowed → Returned` (or the owner can just close it if it's no longer available).

## Features

**Auth** — Supabase email/password, persistent sessions. You can browse the board without an account, but posting or claiming requires one.

**Search & filters** — search by title, description, category, or location; filter by Need/Have/My Posts; category tags (Electronics, Academic, Books, Accessories, Sports, Other).

**Posts** — authenticated users can create, edit, or delete their own posts, with title, description, category, location, contact info, an optional image, and an optional "needed/available until" date.

**Claiming** — handled through a Postgres RPC (`claim_item`) that locks the row before assigning it, so two people can't both successfully claim the same item at the same time. This was one of the trickier parts to get right — a naive check-then-update from the client has an obvious race condition if two people tap claim within the same second.

**Optional lending fee** — a lender can attach a small fee to a Have post, either per-day (for short electronics/accessory borrows) or a flat one-time amount (for things like textbooks where a per-day rate doesn't make sense over a semester). It's entirely optional, shown on the post before anyone claims it, and settled directly between the two students — CampusBorrow doesn't touch payments at all, no wallet or checkout flow.

**Realtime** — Supabase Realtime keeps everyone's view in sync. When someone creates a post, edits one, claims something, or changes its status, other people looking at the board see it update without refreshing.

**Row Level Security** — permissions are enforced in Postgres, not just hidden in the UI: anyone can read posts, only authenticated users can create them, only the owner can edit/delete/change status, and claiming only goes through the locked RPC rather than a direct row update.

**Images** — optional item photos go into a Supabase Storage bucket, validated client-side before upload.

**Responsive** — multi-column feed on desktop, collapses to single column on mobile.

**Error/loading states** — loading skeletons, empty states, inline form validation, toast feedback, retry on failed requests.

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Server-side logic:** a Postgres RPC function for atomic claiming
- **Deployment:** Vercel

## Architecture

```
Next.js / React / TypeScript frontend
              │
              ▼
        Supabase client
        │            │
        ▼            ▼
  Supabase Auth   Postgres (items table + RLS)
                        │
                        ▼
                 claim_item() RPC
                 (row-locked, atomic)
                   │           │
                   ▼           ▼
          Supabase Storage   Supabase Realtime
          (item images)      (postgres_changes)
```

## Project structure

```
CampusBorrow/
├── app/
│   ├── auth/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CategoryFilters.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── FilterTabs.tsx
│   ├── Header.tsx
│   ├── ItemCard.tsx
│   ├── ItemDetailModal.tsx
│   ├── ItemFormModal.tsx
│   ├── LoadingSkeleton.tsx
│   ├── SearchBar.tsx
│   └── ToastProvider.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useItems.ts
│   └── useRealtimeItems.ts
├── lib/
│   └── supabase/client.ts
├── supabase/
│   └── schema.sql
├── types/
│   └── index.ts
├── .env.example
├── package.json
└── README.md
```

## Running it locally

You'll need Node 18+, npm, and a Supabase project.

```bash
git clone https://github.com/kalainesan-n/CampusBorrow.git
cd CampusBorrow
npm install
```

**Set up Supabase:** in the Supabase dashboard, go to SQL Editor → New Query, and run the full script in `supabase/schema.sql`. That sets up the `item_type`/`item_status` enums, the `items` table, indexes, RLS policies, the `claim_item()` RPC, the `item-images` storage bucket and its policies, and Realtime.

Then go to Authentication → Providers → Email and enable it. For local testing you can turn off email confirmation so you're not stuck waiting on a verification email.

**Environment variables** — create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

(found under Project Settings → API in the Supabase dashboard). Never commit this file, and never put the service-role key anywhere in frontend code — only the public anon key belongs in the browser.

```bash
npm run dev
```

Then open http://localhost:3000.

## Data model

Kept intentionally small — one main table, `items`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | who posted it |
| `claimed_by` | uuid | who claimed it, if anyone |
| `type` | enum | `need` or `offer` |
| `title` | text | |
| `description` | text | |
| `category` | text | |
| `location` | text | campus pickup spot |
| `contact` | text | |
| `image_url` | text | optional |
| `fee_type` | enum | `none`, `per_day`, `flat` |
| `fee_amount` | numeric | null if free |
| `status` | enum | `open`, `claimed`, `borrowed`, `returned`, `closed` |
| `expires_at` | date | needed/available until |
| `created_at` | timestamptz | |

## Security

RLS does the actual enforcement here, not the frontend:

- anyone can read posts, signed in or not
- creating a post requires `user_id = auth.uid()`
- only the owner can edit, close, or delete their own post
- claiming never goes through a direct row update from the client — it's routed through `claim_item(item_id)`, which checks the caller is authenticated, locks the row, confirms the item is still open, blocks the owner from claiming their own post, then assigns `claimed_by` and flips the status to `claimed`

That row lock is what actually prevents the double-claim race condition, which is the main reason this is a database function instead of a plain update call.

## Realtime

The app subscribes to Postgres changes on `items` — inserts, updates, and deletes all propagate to every connected browser without a manual refresh. Easiest way to see it: open the app in two browser windows, post something in one, and watch it show up in the other in real time, then claim it and watch the status change reflect on both sides.

## Deployment

Deployed on Vercel, connected to the GitHub repo. To deploy your own copy: push to GitHub, import the repo into Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` environment variables, and Vercel handles the Next.js build.

## What's deliberately not in here

No campus email verification, no notifications, no in-app messaging, no borrow history or reputation system, no reservation windows, no QR handoff confirmation, no multi-campus support. All reasonable next steps, all cut from this version to keep the scope to something I could actually finish and test properly.

## Status

MVP is complete and deployed: auth, posts, search/filters, the claim RPC with row locking, realtime sync, image upload, RLS across the board, and the full lifecycle from open to returned. Tested the whole post → discover → claim → borrow → return loop across two browser sessions to confirm the realtime sync actually works the way it's supposed to, not just in theory.
