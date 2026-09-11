# CampusBorrow

> **Borrow what you need. Share what you have.**

CampusBorrow is a campus-only, peer-to-peer borrowing and lending board designed exclusively for students.

---

## 1. Problem

College and university students frequently need equipment and supplies temporarily rather than permanently:
- A graphing calculator for a single mid-term exam
- A USB-C to HDMI adapter or dongle for a 15-minute presentation
- Lab safety goggles or lab coat for a single experiment
- Textbooks or reference manuals for a homework assignment
- Tools, chargers, tripods, sports gear, or cables

Instead of purchasing items that will be used once or spamming informal chat groups, students use **CampusBorrow** to post what they need or list what they have available to lend.

**CampusBorrow is student-to-student resource sharing, not a traditional marketplace.**
- ❌ No payments or transactions
- ❌ No selling
- ❌ No ratings or reputation rankings
- ❌ No complex social feeds

The entire platform revolves around a single, tight loop:
**Post → Discover → Claim → Borrow → Return**

---

## 2. Key Features

- **Post Creation (Need vs. Have)**:
  - Post an urgent request (**NEED**) or offer equipment to fellow students (**HAVE**).
  - Categorization into *Electronics, Academic, Books, Accessories, Sports, Other*.
  - Campus pickup location and direct contact information (e.g. WhatsApp, phone, email).
  - Optional expiry/availability dates.
  - Image upload with size validation (up to 5 MB) stored directly in Supabase Storage.
- **Discovery, Search & Filters**:
  - Live search across title, description, category, and campus location.
  - Filter tabs: *All, Need, Have, My Posts*.
  - Category pill filters with visual icons.
  - Fully combines search terms and active filters simultaneously.
- **Secure Claim Mechanism**:
  - Direct atomic claim backed by PostgreSQL RPC `claim_item(item_id)` with row-level locks (`SELECT FOR UPDATE`).
  - Strict server-side validation prevents race conditions, double-claims, or claiming one's own post.
- **Status Lifecycle**:
  - `open` → `claimed` → `borrowed` → `returned` (with closure option `open/claimed` → `closed`).
  - Owner-exclusive actions: Mark Borrowed, Mark Returned, Edit, Close, Delete.
- **Supabase Realtime Synchronization**:
  - Instant UI reflection of `INSERT` (new posts appear live), `UPDATE` (status changes and edits appear live), and `DELETE` (removed posts disappear live) across multiple browser sessions without page reloads.
- **Clean Authentication**:
  - Supabase Email & Password authentication.
  - Public anonymous browsing and detail exploration.
  - Protected actions (posting, claiming, editing, deleting) require an active student session.
- **Design & Accessibility**:
  - Custom warm campus community visual identity (amber, warm stone, distinct status badges).
  - Skeleton loaders for initial feed fetch, empty states with one-click filter resets, and error states with retries.
  - Fully responsive layout: 3 columns on desktop, 2 on tablet, 1 on mobile.

---

## 3. Tech Stack

- **Frontend**:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS 4
- **Backend (Supabase)**:
  - PostgreSQL with `pgcrypto`
  - Row Level Security (RLS) policies
  - Stored Procedures (`claim_item` RPC)
  - Supabase Authentication (Email/Password)
  - Supabase Storage (`item-images` bucket)
  - Supabase Realtime (`postgres_changes` publication)
- **Deployment**:
  - Vercel

---

## 4. Architecture

```
CampusBorrow/
├── app/
│   ├── auth/
│   │   ├── sign-in/page.tsx      # Sign in page
│   │   └── sign-up/page.tsx      # Sign up page with verification handling
│   ├── globals.css               # Warm campus palette
│   ├── layout.tsx                # Root layout with ToastProvider
│   └── page.tsx                  # Home feed with search, filters, modals, realtime
├── components/
│   ├── CategoryFilters.tsx       # Category selector pills
│   ├── EmptyState.tsx            # Clear filters / be first to post
│   ├── ErrorState.tsx            # Error boundary card with retry
│   ├── FilterTabs.tsx            # All / Need / Have / My Posts tabs
│   ├── Header.tsx                # Sticky top nav, brand, user email & actions
│   ├── ItemCard.tsx              # Item preview card with badges & relative time
│   ├── ItemDetailModal.tsx       # Detail view, claim RPC action & status lifecycle
│   ├── ItemFormModal.tsx         # Create & edit post modal with image upload
│   ├── LoadingSkeleton.tsx       # Animated skeleton cards
│   ├── SearchBar.tsx             # Instant search bar
│   └── ToastProvider.tsx         # Toast notification system
├── hooks/
│   ├── useAuth.ts                # Supabase session, sign in, sign up, sign out
│   ├── useItems.ts               # Filtered items query, search, cache updates
│   └── useRealtimeItems.ts       # Supabase Realtime channel subscription
├── lib/
│   └── supabase/
│       └── client.ts             # Browser client factory with safe fallback
├── supabase/
│   └── schema.sql                # Complete idempotent SQL setup
├── types/
│   └── index.ts                  # Shared TypeScript interfaces & types
├── .env.example                  # Template environment variables
├── package.json
└── README.md
```

---

## 5. Local Setup

### Prerequisites
- Node.js 18+ or 20+
- A free account on [Supabase](https://supabase.com)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd CampusBorrow
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Supabase Setup Guide

1. **Create Project**:
   - Go to [Supabase Dashboard](https://app.supabase.com) and click **New Project**.
2. **Execute Schema**:
   - In your project dashboard, navigate to **SQL Editor** in the left sidebar.
   - Click **New Query**.
   - Copy and paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
   - Click **Run**.
3. **Verify Auth**:
   - Under **Authentication** → **Providers**, ensure **Email** is enabled.
   - *(Optional for testing)*: Under **Authentication** → **Email Templates / Providers**, disable "Confirm email" if you wish to allow instant test user sign-ins without inbox verification.
4. **Verify Storage**:
   - Go to **Storage**. Confirm the `item-images` bucket was created and marked as **Public**.
5. **Verify Realtime**:
   - Under **Database** → **Replication**, ensure the `items` table is toggled on for the `supabase_realtime` publication.

---

## 7. Database & Security Model

### `items` Table Schema
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` |
| `user_id` | `uuid` | Foreign key to `auth.users(id)` ON DELETE CASCADE |
| `claimed_by` | `uuid` | Foreign key to `auth.users(id)` ON DELETE SET NULL |
| `type` | `item_type` | Enum: `'need'`, `'offer'` |
| `title` | `text` | Required (max 100 characters) |
| `description` | `text` | Required (max 500 characters) |
| `category` | `text` | Required (*Electronics, Academic, Books, Accessories, Sports, Other*) |
| `location` | `text` | Required campus location (max 80 characters) |
| `contact` | `text` | Required contact info (max 80 characters) |
| `image_url` | `text` | Optional public Supabase Storage URL |
| `status` | `item_status` | Enum: `'open'`, `'claimed'`, `'borrowed'`, `'returned'`, `'closed'` |
| `expires_at` | `date` | Optional needed/available until date |
| `created_at` | `timestamptz` | Default `now()` |

### Row Level Security (RLS)
- **SELECT**: Accessible to everyone (`using (true)`), allowing anonymous visitors to browse the board.
- **INSERT**: Restricted to authenticated users where `auth.uid() = user_id`, forcing `status = 'open'` and `claimed_by IS NULL`.
- **UPDATE**: Only the creator (`auth.uid() = user_id`) can update item fields or transition the status. Ownership cannot be reassigned.
- **DELETE**: Only the creator (`auth.uid() = user_id`) can delete their item.

### Secure Claim RPC (`claim_item`)
Claiming is guarded by a PostgreSQL function defined with `SECURITY DEFINER`:
```sql
create or replace function public.claim_item(item_id uuid)
returns public.items
language plpgsql
security definer
as $$ ... $$;
```
1. Verifies caller is authenticated (`auth.uid()`).
2. Locks the item row using `SELECT ... FOR UPDATE` to eliminate race conditions.
3. Validates that the post is currently `open` and not claimed.
4. Ensures the owner cannot claim their own post.
5. Atomically sets `claimed_by = auth.uid()` and `status = 'claimed'`.

---

## 8. Two-User Realtime Verification Guide

To verify the multi-user realtime loop:

1. **Setup**:
   - Open **Browser A** (e.g. Chrome) and navigate to `http://localhost:3000`. Sign in as `student1@campus.edu`.
   - Open **Browser B** (e.g. Chrome Incognito or Firefox) and navigate to `http://localhost:3000`. Sign in as `student2@campus.edu`.
2. **Realtime Insert**:
   - In Browser A, click **+ Post** and submit a **NEED**: *"TI-84 Plus Graphing Calculator for Calculus final"*.
   - Browser B will display the new card at the top of the feed instantly without page reload.
3. **Realtime Claim**:
   - In Browser B, click the new calculator post and click **I Can Lend This**.
   - In Browser A, the card badge instantly switches to **CLAIMED**.
4. **Realtime Status Handover**:
   - In Browser A, open the post and click **Mark as Borrowed**.
   - In Browser B, the post badge updates immediately to **BORROWED**.
5. **Realtime Return**:
   - In Browser A, open the post and click **Mark as Returned**.
   - In Browser B, the post badge updates immediately to **RETURNED**.
6. **Security Checks**:
   - Browser A cannot claim their own post.
   - Neither user can edit or delete each other's posts.

---

## 9. Production Deployment to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete CampusBorrow MVP"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Import the project in [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Project Anon Public Key
4. Click **Deploy**.
