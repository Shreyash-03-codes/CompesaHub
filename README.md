# COMPESA Hub

**COMPESA Hub** is a full-stack web platform for the **Computer Engineering Students' Association (COMPESA)** at SITCOE. It serves as a central hub for students, faculty, the COMPESA Committee, and the Placement Club — enabling assessments, DSA contests, profile management, news, feedback, and more.

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | Angular 19, TypeScript, SCSS        |
| Backend / BaaS   | Supabase (PostgreSQL, Auth, Storage)|
| Edge Functions   | Deno (Supabase Edge Functions)      |
| Email            | Resend                              |
| Deployment       | Netlify (frontend)                  |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Angular CLI** 19 (`npm install -g @angular/cli`)
- **Supabase** account (free tier)
- **Netlify** account (free tier)
- **Deno** (for local Edge Function development, optional)

---

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root with the following variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

### 3. Run database migrations

Open your Supabase project's **SQL Editor**, paste the contents of `supabase/migrations/001_initial_schema.sql`, and run it.  
Alternatively, use the Supabase CLI:

```bash
supabase db push
```

### 4. Start the development server
```bash
ng serve
```

The application will be available at `http://localhost:4200/`.

---

## Environment Variables

| Variable            | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| `SUPABASE_URL`      | Yes      | Supabase project URL                     |
| `SUPABASE_ANON_KEY` | Yes      | Supabase anon / public key               |
| `RESEND_API_KEY`    | Yes      | Resend API key for transactional emails  |

### YOUR_APP_URL placeholder

After your first Netlify deploy, search for `YOUR_APP_URL` across the entire codebase and replace it with your actual deployed URL.  
In the local development environment (`environments/environment.development.ts`), it defaults to `http://localhost:4200`.

---

## Supabase Migration Instructions

**Option A — Supabase SQL Editor**  
1. Go to your Supabase project dashboard → **SQL Editor**  
2. Open `supabase/migrations/001_initial_schema.sql`  
3. Paste the entire contents and click **Run**

**Option B — Supabase CLI**
```bash
supabase db push
```

---

## Edge Function Deployment

Deploy each edge function to Supabase:

```bash
supabase functions deploy invite-user --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
```

Set required secrets:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set the following in **Site Settings → Environment Variables** (exact names):

| Variable            | Value                        |
| ------------------- | ---------------------------- |
| `SUPABASE_URL`      | Your Supabase project URL    |
| `SUPABASE_ANON_KEY` | Your Supabase anon key       |
| `RESEND_API_KEY`    | Your Resend API key          |

3. Configure deploy settings:

| Setting            | Value              |
| ------------------ | ------------------ |
| **Build command**  | `ng build`         |
| **Publish directory** | `dist/compesa-hub` |

4. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          — AuthGuard, RoleGuard
│   │   ├── models/          — TypeScript interfaces
│   │   └── services/        — AuthService, SupabaseService
│   ├── features/
│   │   ├── about/           — About Us page
│   │   ├── admin/           — Admin dashboard
│   │   ├── analytics/       — Reports & analytics
│   │   ├── assessments/     — Assessment tests
│   │   ├── auth/            — Login, forgot/set password
│   │   ├── committee/       — Committee members
│   │   ├── contact/         — Contact / Join Us
│   │   ├── dashboard/       — Student dashboard
│   │   ├── dsa/             — DSA contests & grading
│   │   ├── feedback/        — Feedback forms
│   │   ├── news/            — News & activities
│   │   ├── placement-club/  — Placement Club members
│   │   ├── profile/         — Student profiles
│   │   └── search/          — Search & notifications
│   ├── shared/
│   │   └── components/      — Header, Footer, Sidebar, etc.
│   └── app.component.*      — Root component
├── assets/                  — Images, manifests
├── environments/            — Dev / prod env config
└── styles/                  — Global SCSS (variables, mixins, etc.)
supabase/
├── functions/               — Edge Functions
│   ├── invite-user/
│   └── send-email/
└── migrations/              — Database schema SQL
```

---

## Modules / Feature List

- **Authentication** — Login, password reset, invite flow
- **User Profiles** — Bio, skills, social links, resume
- **Role-Based Access** — Student, Committee, Placement Club, Faculty, Admin
- **Assessment Tests** — Weekly, company-pattern, topic-based MCQs
- **DSA Contests** — Problem listing, code submissions, manual grading
- **News & Activities** — Event announcements, news feed
- **Committee & Placement Club** — Member directories
- **Feedback System** — Feedback forms linked to events
- **FAQs** — Publicly visible Q&A
- **About Us** — Vision, mission, objectives, structure
- **Contact / Join Us** — Contact form submissions
- **Notifications** — In-app notification centre
- **Search** — Search across platform content
- **Admin Dashboard** — Full CRUD over all entities
- **Analytics / Reports** — Faculty/Admin insights into performance

---

## License

Proprietary — SITCOE COMPESA
