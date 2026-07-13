# Supabase CLI Deployment Instructions

This document provides clear, actionable instructions designed to be executed by a developer or an **autonomous AI coding assistant** using the **Supabase CLI** to deploy database migrations, configure environment secrets, and deploy the Deno Edge Function.

---

## Prerequisites
Ensure the Supabase CLI is installed on the system. If not, install it via:
* **macOS/Linux:** `brew install supabase/tap/supabase`
* **Windows (Scoop):** `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git; scoop install supabase`
* **Node.js (npx):** `npm install -g supabase`

---

## Deployment Steps

Execute the following commands in the root of the repository:

### 1. Authenticate with Supabase CLI
Run the login command and follow the prompt to authenticate with your Supabase account:
```bash
supabase login
```

### 2. Link your Supabase Project
Link the local repository configurations to your remote Supabase project. Replace `<project-id>` with your live Supabase project reference ID (found in your Supabase project URL: `https://supabase.com/dashboard/project/<project-id>`):
```bash
supabase link --project-ref <project-id>
```

### 3. Deploy Database Migrations
We have created a database migration file locally under `supabase/migrations/20260713000000_secure_schema.sql`. Run the following command to apply it to your remote linked database:
```bash
supabase db push
```
*(This secures the tables, locks anonymous read/writes, sets up Server-Side RPC password verification, and configures the automated Postgres SMS notification trigger).*

### 4. Configure Server Environment Secrets
Set the required secrets on your remote Supabase Edge Functions environment.
*Replace the placeholder values `<value>` with your actual Twilio credentials and custom phone numbers:*
```bash
supabase secrets set TWILIO_ACCOUNT_SID="<your_sid>" TWILIO_AUTH_TOKEN="<your_token>" TWILIO_PHONE_NUMBER="<your_twilio_number>" SMS_API_KEY="secret_cassone_sms_token_2026"
```
*(Note: If you change `SMS_API_KEY` from `secret_cassone_sms_token_2026` to something else, make sure to update the matching `sms_token` string in the trigger function inside `supabase/migrations/20260713000000_secure_schema.sql` and run `supabase db push` again).*

### 5. Deploy the SMS Edge Function
Deploy the secure Deno-based Edge Function (`send-sms`) to your live Supabase project:
```bash
supabase functions deploy send-sms
```

---

## Success Verification
Once the above commands finish successfully:
1. The database RLS policies and RPC functions will be active.
2. The Edge Function will require `X-SMS-API-KEY` authentication headers.
3. Database mutations (Inserts/Updates) will automatically trigger background Twilio SMS dispatches.
