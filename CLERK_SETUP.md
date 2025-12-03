# Clerk Authentication Setup Guide

## Prerequisites

Before running your application with Clerk authentication, you need to:

1. **Create a Clerk Account**
   - Go to [https://clerk.com](https://clerk.com)
   - Sign up for a free account
   - Create a new application

2. **Get Your Clerk Keys**
   - In your Clerk dashboard, navigate to API Keys
   - Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (if not already done)
   - Add your Clerk Publishable Key:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
     ```

4. **Apply Database Migration**
   - Run the `add_clerk_auth.sql` script in your Supabase database
   - This adds user profiles and multi-user support

## Running the Application

```bash
npm run dev
```

## Features Enabled

✅ User sign-up and sign-in
✅ Protected routes (DataRoom, DocumentSharing)
✅ Public routes (Landing page, share links)
✅ User profile display
✅ Sign out functionality
✅ Document ownership tracking

## Important Notes

- Recipients do NOT need accounts to view documents via share links
- Only the DataRoom and DocumentSharing pages require authentication
- Existing documents without a user_id remain accessible via share links
