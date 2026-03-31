# CSA Co-op Support Application

A full-stack co-op management platform built for coordinators, students, and supervisors. Students apply for co-op, track their acceptance status, and submit work-term reports. Supervisors log in to submit employer evaluations via an online form or PDF upload. Coordinators manage the entire pipeline — reviewing applications, making provisional and final acceptance decisions, tracking report and evaluation submissions, and sending email reminders to students and supervisors who haven't submitted on time.

## Features

- Student application and acceptance flow
- Coordinator dashboard for managing reports and evaluations
- Supervisor evaluation submissions
- Email reminders via Resend for missing reports and evaluations
- Deadline management with extension support

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Email:** Resend
- **Deployment:** Vercel

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_PUBLISHABLE_KEY=
   RESEND_API_KEY=
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Apply database migrations:
   ```bash
   supabase db push
   ```
5. Deploy the email edge function:
   ```bash
   supabase functions deploy send-reminder
   supabase secrets set RESEND_API_KEY=your_key_here
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```
