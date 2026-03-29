
# CSA (Co-op Support Application)

## Overview
A role-based web application for managing co-op student applications, work-term reports, and supervisor evaluations. Built with Supabase for auth, database, and file storage.

## User Roles & Access
- **Student**: Submit applications, upload work-term reports (after acceptance)
- **Coordinator**: Review applications, make accept/reject decisions, view reporting dashboard
- **Supervisor**: Register, submit evaluations (PDF upload or online form)
- **Admin**: Seeded account with full visibility (coordinator features + all data access)

## Pages & Features

### 1. Landing / Login Page
- Login form with email & password
- Registration link (for Students and Supervisors only)
- Role-based redirect after login

### 2. Registration Page
- Role selector: Student or Supervisor
- Email, password, full name fields
- Coordinators and Admin are created via seed/manual setup

### 3. Student Dashboard
- **Application Form**: Name, Student ID, Email — submit once
- **Application Status**: Shows current status (pending, provisionally accepted, accepted, rejected)
- **Report Upload** (visible only after final acceptance): Upload PDF work-term report with deadline display and enforcement (no uploads after deadline)

### 4. Coordinator Dashboard
- **Applications List**: Table of all student applications with status filters
- **Review Panel**: Click an application to view details, set provisional decision, then final accept/reject
- **Reports Overview**: List of accepted students, their report upload status, and deadline info
- **Supervisor Evaluations**: View submitted evaluations
- **Reporting Dashboard**: Summary cards showing accepted/rejected counts, missing report submissions, missing evaluations

### 5. Supervisor Dashboard
- **Evaluation Submission**: Choose between PDF upload or online form
- **Online Form**: Student name/ID, performance rating, comments, recommendation
- **Submitted Evaluations**: List of past submissions

### 6. Admin Dashboard
- Same as Coordinator dashboard with full data visibility across all records

## Database Schema
- **profiles**: user_id, full_name, role reference
- **user_roles**: user_id, role (student/coordinator/supervisor/admin)
- **applications**: student_id, name, student_number, email, status (pending/provisional/accepted/rejected)
- **work_reports**: student_id, file_path, submitted_at, deadline
- **evaluations**: supervisor_id, student_id, type (pdf/form), file_path, rating, comments, recommendation
- **deadlines**: configurable report submission deadlines

## Storage
- Supabase Storage buckets for PDF uploads (reports and evaluations)
- RLS policies ensuring users can only access their own files

## Security
- Row-Level Security on all tables
- Role stored in separate user_roles table (not on profiles)
- Role-checked via security definer function
- Protected routes in the frontend based on user role
