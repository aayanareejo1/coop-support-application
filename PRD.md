# Product Requirements Document — TMU Co-op Support Application

## Overview
A full-stack platform for managing the TMU Co-op program lifecycle: student applications, coordinator review, supervisor evaluations, report submissions, and placement tracking.

---

## Stakeholders

| Role | Description |
|---|---|
| **Coordinator** | TMU staff. Reviews applications, manages placements, sends reminders. Has assigned students they are personally responsible for. |
| **Student** | TMU student. Applies to co-op, tracks acceptance status, submits work-term report and employer evaluation. |
| **Supervisor** | Employer representative. Submits evaluations for their assigned student. Requests to be linked to a student via coordinator approval. |

---

## Feature Requirements

### Authentication & Registration

| ID | Requirement | Priority | Status |
|---|---|---|---|
| AUTH-1 | Students register with email, password, and student ID | High | ✅ Done (student ID collected on application form) |
| AUTH-2 | Coordinators log in with email and password; protected by access code `CSA-COORD-2024` | High | ✅ Done |
| AUTH-3 | Supervisors register with email and password | High | ✅ Done |
| AUTH-4 | TMU SSO integration for student login | Low | ⛔ Blocked — requires TMU infrastructure access |

---

### Student Features

| ID | Requirement | Priority | Status |
|---|---|---|---|
| STU-1 | Submit application (name, student ID, email) with input validation | High | ✅ Done |
| STU-2 | View application status (pending / provisional / accepted / rejected) | High | ✅ Done |
| STU-3 | Upload work-term report (PDF only) after final acceptance | High | ✅ Done |
| STU-4 | Replace existing report submission | Medium | ✅ Done |
| STU-5 | Download report template provided by coordinator | Low | ✅ Done |
| STU-6 | Submit employer evaluation (employer name, job title, rating, comments) | Medium | ✅ Done |
| STU-7 | Request deadline extension with reason | Low | ✅ Done |
| STU-8 | View extension request status (pending / approved / rejected) | Low | ✅ Done |
| STU-9 | Report upload blocked after deadline (unless extended) | High | ✅ Done |
| STU-10 | View placement issue flag if one is raised | Medium | ✅ Done |

---

### Coordinator Features

| ID | Requirement | Priority | Status |
|---|---|---|---|
| COORD-1 | View all submitted applications | High | ✅ Done |
| COORD-2 | Filter applications by status | Medium | ✅ Done |
| COORD-3 | Assign self to a student (exclusive editing rights) | High | ✅ Done |
| COORD-4 | Edit only unassigned students or own assigned students | High | ✅ Done |
| COORD-5 | Set provisional accept / provisional reject / final accept / final reject | High | ✅ Done |
| COORD-6 | Record reviewer notes on application | Medium | ✅ Done |
| COORD-7 | Set student placement status (Onboarding / Work Term / Study Term / Graduated / Withdrawn) | Medium | ✅ Done |
| COORD-8 | Grant deadline extensions to specific students | Low | ✅ Done |
| COORD-9 | Approve / reject student-submitted extension requests | Low | ✅ Done |
| COORD-10 | Flag placement issues for a student | Low | ✅ Done |
| COORD-11 | Resolve placement issues | Low | ✅ Done |
| COORD-12 | View work-term report submissions; mark as reviewed / approved / rejected with feedback | High | ✅ Done |
| COORD-13 | Upload report template for students to download | Low | ✅ Done |
| COORD-14 | Update global report submission deadline | Medium | ✅ Done |
| COORD-15 | Send email reminders to students with missing reports | Medium | ✅ Done |
| COORD-16 | Send email reminders to supervisors with missing evaluations | Medium | ✅ Done |
| COORD-17 | Overview dashboard: program-wide stats (acceptances, rejections, missing reports, issues) | High | ✅ Done |
| COORD-18 | Overview dashboard: **My Assigned Students** panel showing only own students | High | 🔧 In progress |
| COORD-19 | Approve / reject supervisor–student link requests | Medium | ✅ Done |

---

### Supervisor Features

| ID | Requirement | Priority | Status |
|---|---|---|---|
| SUP-1 | Request to be linked to a student by student number | High | ✅ Done |
| SUP-2 | View link request status (pending / approved / rejected) | Medium | ✅ Done |
| SUP-3 | Submit online evaluation (student name, number, rating, comments, recommendation) | High | ✅ Done |
| SUP-4 | Upload PDF evaluation | High | ✅ Done |
| SUP-5 | View all submitted evaluations | Medium | ✅ Done |

---

### Email & Notifications

| ID | Requirement | Priority | Status |
|---|---|---|---|
| EMAIL-1 | Resend-powered email delivery via Edge Function | Medium | ✅ Done |
| EMAIL-2 | Configurable `from` address via `RESEND_FROM_EMAIL` env var | Low | ✅ Done |
| EMAIL-3 | Reminder log stored in DB for audit trail | Medium | ✅ Done |

---

## Remaining Work

| ID | Item | Notes |
|---|---|---|
| COORD-18 | My Assigned Students panel in Overview | Implementing now |
| AUTH-4 | TMU SSO | Blocked on TMU infrastructure — out of scope for this iteration |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, RLS, Storage, Edge Functions) |
| Email | Resend |
| Deployment | Vercel |
