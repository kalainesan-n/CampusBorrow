# CampusBorrow

**Borrow what you need. Share what you have.**

CampusBorrow is a campus-focused peer-to-peer resource-sharing board built for students. It helps students find temporary access to things they need — calculators, adapters, textbooks, chargers, lab equipment, sports gear, and more — while giving other students an easy way to lend items they already have.

🎥 **Demo Video:** https://drive.google.com/drive/folders/1kv9ZqR_Ggz4g-bDryl835tU_ZL472k-p?usp=sharing
🌐 **Live Demo:** https://campus-borrow-three.vercel.app/
💻 **GitHub:** https://github.com/kalainesan-n/CampusBorrow

---

## Table of Contents

- [Why CampusBorrow?](#why-campusborrow)
- [Core Experience](#core-experience)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Model](#database-model)
- [Security Model](#security-model)
- [Realtime](#realtime)
- [Deployment](#deployment)
- [Demo Flow](#demo-flow)
- [Design Philosophy](#design-philosophy)
- [Future Ideas](#future-ideas)
- [Project Status](#project-status)

---

## Why CampusBorrow?

Students often need something for only a few hours or days:

- A calculator for an exam
- An HDMI adapter for a presentation
- A Semester 1 textbook sitting unused in a second-year student's room
- A charger, tripod, lab coat, or sports item

The usual solution is to ask around in WhatsApp groups, buy something unnecessarily, or simply go without it.

**CampusBorrow turns that scattered process into one shared campus board.**

It is intentionally **not a marketplace**:

- ❌ No buying or selling
- ❌ No ratings or reputation scores
- ❌ No social following
- ❌ No unnecessary messaging system
- ✅ Only an optional, marginal lending fee (per-day or flat, e.g. ~₹20–50/day) — just enough to make lending worth a student's while, not a resale or rental business

The product focuses on one simple workflow:

> **Post → Discover → Claim → Borrow → Return**

---

## Core Experience

CampusBorrow supports two kinds of posts:

| Type | Description | Example |
|---|---|---|
| 🔵 **Need** | A student posts something they need to borrow | *"Need a scientific calculator for tomorrow's exam"* |
| 🟢 **Have** | A student posts something they have available to lend | *"French textbook for Semester 1 available"* |

Other students can discover the post and claim it when they can fulfill the request.

### Item Lifecycle

```
OPEN → CLAIMED → BORROWED → RETURNED
```

An owner can also close a post when it is no longer available.

---

## Key Features

### 🔐 Authentication
- Supabase Email/Password authentication
- Persistent sessions
- Sign in / Sign up / Sign out
- Anonymous visitors can browse the board
- Posting and claiming require authentication

### 🔎 Search & Discovery
- Search across title, description, category, and location
- Filter by **All / Need / Have / My Posts**
- Category filters: ⚡ Electronics · 🎓 Academic · 📚 Books · 🎒 Accessories · ⚽ Sports · 📦 Other

### 📝 Create & Edit Posts
Authenticated students can:
- Create Need or Have posts
- Add title, description, category, and campus location
- Add contact information
- Set a needed/available-until date
- Upload an optional image
- Edit or delete their own posts

### 🤝 Claiming
A student can claim an open post when they can fulfill it. The claim operation is handled by a PostgreSQL RPC with row locking so two users cannot successfully claim the same item at the same time.

### 💸 Marginal Lending Fee
"Have" posts can optionally include a small fee set by the lender.

- The fee is meant to be a token incentive, not a rental price — enough to make it worth digging that calculator or adapter out of a drawer, not enough to turn the board into a rental marketplace.
- Entirely optional — a post can still be listed for free.
- **Per-day fee** (e.g. ~₹20–50/day) — suited to short-term borrows like electronics, chargers, and accessories, where the total stays trivial even over a few days.
- **Flat one-time fee** — suited to longer or lower-turnover borrows like textbooks or lab equipment, where a per-day rate would balloon over a semester-length loan or over/undervalue the item.
- Suggested default fee can vary by category (e.g. electronics/accessories default to a low per-day rate, books/lab equipment default to a flat per-borrow rate) to nudge lenders toward a sensible price without forcing one.
- Displayed upfront on the post card and detail view so borrowers know the cost before claiming.
- Settled directly between the two students at pickup/return — CampusBorrow does not process payments, so there's no in-app wallet, checkout, or transaction handling.

### 🔄 Borrowing Lifecycle
Owners can move an item through `Open → Claimed → Borrowed → Returned`, giving the board a meaningful state instead of treating posts as static records.

### ⚡ Realtime Synchronization
Supabase Realtime keeps multiple browser sessions synchronized. When one user creates, edits, claims, changes the status of, or deletes a post, other connected users see the change without manually refreshing the page.

### 🛡️ Row Level Security
Database permissions are enforced by Supabase RLS:
- Anyone can read public items
- Only authenticated users can create items
- Users can modify only their own posts
- Users cannot delete another student's post
- Claiming is handled through a controlled server-side database function

### 🖼️ Image Storage
Optional item images are stored in a Supabase Storage bucket, validated on the client before upload.

### 📱 Responsive UI
Designed for desktop, tablet, and mobile — the feed adapts from a multi-column layout on larger screens to a single-column experience on mobile.

### ♿ UX & Error Handling
- Loading skeletons
- Empty states
- Search/filter reset states
- Inline form validation
- Toast feedback
- Retryable error states
- Protected actions for authenticated users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Security | PostgreSQL Row Level Security |
| Server Logic | PostgreSQL RPC |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Deployment | Vercel |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│                CampusBorrow UI                │
│          Next.js + React + TypeScript         │
└──────────────────────┬───────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│               Supabase Client                 │
└──────────────┬───────────────┬────────────────┘
               │               │
       ┌───────▼──────┐  ┌────▼─────────────┐
       │ Supabase Auth│  │ PostgreSQL        │
       │              │  │ items + RLS       │
       └──────────────┘  └────┬──────────────┘
                               │
                      ┌────────▼─────────┐
                      │ claim_item RPC   │
                      │ atomic claiming  │
                      └──────────────────┘
                               │
                ┌──────────────┴─────────────┐
                ▼                             ▼
       ┌────────────────┐           ┌─────────────────┐
       │ Supabase       │           │ Supabase        │
       │ Storage        │           │ Realtime        │
       │ item-images    │           │ postgres_changes│
       └────────────────┘           └─────────────────┘
```

---

## Project Structure

```
CampusBorrow/
├── app/
│   ├── auth/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── sign-up/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
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
│
├── hooks/
│   ├── useAuth.ts
│   ├── useItems.ts
│   └── useRealtimeItems.ts
│
├── lib/
│   └── supabase/
│       └── client.ts
│
├── supabase/
│   └── schema.sql
│
├── types/
│   └── index.ts
│
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/kalainesan-n/CampusBorrow.git
cd CampusBorrow
npm install
```

### 2. Configure Supabase

Go to **Supabase Dashboard → SQL Editor → New Query** and run the complete SQL script at `supabase/schema.sql`.

This creates:
- `item_type` enum
- `item_status` enum
- `items` table
- indexes
- Row Level Security policies
- `claim_item()` RPC
- `item-images` storage bucket
- storage policies
- Realtime configuration

**Authentication:** Go to **Authentication → Providers → Email** and enable Email authentication. For development/demo environments, email confirmation can be disabled if immediate sign-in after registration is preferred.

### 3. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

These values are available in **Supabase Dashboard → Project Settings → API**.

> ⚠️ **Important:** Never commit `.env.local`. Do not put a Supabase service-role key in frontend code — only public client credentials should be exposed to the browser.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Model

CampusBorrow intentionally keeps the core data model small.

### `items`

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Unique item ID |
| `user_id` | uuid | Student who created the post |
| `claimed_by` | uuid | Student who claimed/fulfilled it |
| `type` | enum | `need` or `offer` |
| `title` | text | Item/request title |
| `description` | text | Details |
| `category` | text | Item category |
| `location` | text | Campus pickup/meeting location |
| `contact` | text | Contact information |
| `image_url` | text | Optional image |
| `fee_type` | enum | `none`, `per_day`, or `flat` |
| `fee_amount` | numeric | Optional lending fee amount, interpreted per `fee_type`, null if free |
| `status` | enum | Current lifecycle state |
| `expires_at` | date | Needed/available until |
| `created_at` | timestamptz | Creation timestamp |

**Status values:** `open` · `claimed` · `borrowed` · `returned` · `closed`

---

## Security Model

CampusBorrow uses **Row Level Security** instead of relying only on frontend checks.

- **Public read** — anyone can browse the board without signing in.
- **Authenticated creation** — a user can create an item only when `user_id = auth.uid()`.
- **Owner controls** — only the owner can edit, close, change status, or delete their post.
- **Claim protection** — claiming is handled by `claim_item(item_id)`, a PostgreSQL function that:
  1. Checks that the caller is authenticated
  2. Locks the target row
  3. Confirms the item is still open
  4. Prevents the owner from claiming their own post
  5. Assigns the authenticated user as `claimed_by`
  6. Changes the status to `claimed`

This makes claiming atomic and protects against two users attempting to claim the same item simultaneously.

---

## Realtime

The application subscribes to PostgreSQL changes on the `items` table:

```
INSERT  → new post appears
UPDATE  → edits/status changes appear
DELETE  → removed post disappears
```

This allows the application to behave like a shared live board rather than requiring users to refresh the page.

### Two-user demo

```
Browser A                          Browser B
─────────                          ─────────
Student A                          Student B

Create post
    │
    └──────────── Realtime ───────────────►
                                      Post appears

                                      Claim item
    ◄──────────── Realtime ────────────────┘
Status → CLAIMED

Mark Borrowed
    │
    └──────────── Realtime ───────────────►
                                      Status → BORROWED

Mark Returned
    │
    └──────────── Realtime ───────────────►
                                      Status → RETURNED
```

---

## Deployment

CampusBorrow is deployed on Vercel.

- **Live application:** https://campus-borrow-three.vercel.app/
- **GitHub repository:** https://github.com/kalainesan-n/CampusBorrow

### Deploy your own instance

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add these environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Deploy — Vercel will run the Next.js production build automatically.

---

## Demo Flow

The intended demonstration follows the complete product loop:

1. **Post** — a student posts something they need or have
2. **Discover** — another student searches or filters the campus board
3. **Claim** — the second student claims the item
4. **Borrow** — the owner marks the item as borrowed
5. **Return** — the owner marks it as returned

```
POST → DISCOVER → CLAIM → BORROW → RETURN
```

This is the central interaction the application is designed around.

---

## Design Philosophy

CampusBorrow deliberately avoids turning into a full social network or marketplace. The design priorities are:

| Priority | Meaning |
|---|---|
| **Simple** | A student should understand the app immediately |
| **Useful** | Every feature supports temporary resource sharing |
| **Live** | Multiple students should see changes without refreshing |
| **Safe** | Database permissions should protect user-owned data |
| **Focused** | No ratings, messaging, or social features — and only a marginal, optional fee, never a rental marketplace |

---

## Future Ideas

The MVP intentionally excludes features that would increase scope. Potential future versions could explore:

- Campus email verification
- Notifications
- In-app messaging
- Borrow history
- Trust/reputation systems
- Reservation windows
- QR-based handoff confirmation
- Multiple campus support

These are deliberately **not part of the current MVP**.

---

## Project Status

**CampusBorrow MVP — Complete**

- [x] Next.js App Router
- [x] React + TypeScript
- [x] Responsive UI
- [x] Supabase Authentication
- [x] PostgreSQL database
- [x] Row Level Security
- [x] Atomic claim RPC
- [x] Supabase Storage
- [x] Supabase Realtime
- [x] Need / Have posts
- [x] Search and filters
- [x] Item lifecycle
- [x] Edit/delete ownership controls
- [x] Loading, empty, and error states
- [x] Production build verification
- [x] Vercel deployment

---

**Built for students, by students.**

**CampusBorrow** — *Borrow what you need. Share what you have.*

🎥 [Demo Video](https://drive.google.com/drive/folders/1kv9ZqR_Ggz4g-bDryl835tU_ZL472k-p?usp=sharing) · 🌐 [Live Demo](https://campus-borrow-three.vercel.app/) · 💻 [GitHub](https://github.com/kalainesan-n/CampusBorrow)
