# Cassone Trap House 🛖🏠

A modern, responsive, and secure **React + Vite** holiday coordinating web application styled with a dark glassmorphic interface. Built to coordinate guest stays, sleeping arrangements, travel schedules, and noise rule compliance for a private vacation house near Lake Garda, Italy.

---

## 🚀 Key Features

* **Interactive Guest List:** Guests can easily register their arrival/departure dates, transport arrangements (car, train, motorcycle, etc.), and custom notes.
* **Smart Occupancy & Overlap Validator:** Automatically computes date overlaps in real-time, displaying availability limits for accommodations (e.g. Max 6 spots in the *Reggae Hut* and Max 2 spots in the *Haus*).
* **House Rules scrolled acceptance:** Enforces rules regarding noise guidelines, neighbor respect, and motorcycle limits using a dynamic confirmation modal.
* **Server-Side Admin Control Panel:** Allows administrative login with server-side password validation (password: `cassone2026`). Admins can approve/reject guests, delete entries, and customize notification targets.
* **Automated Background SMS Alerts:** Powered by database triggers and a Supabase Edge Function integrated with Twilio. Automatically sends status notifications to guests and alerts to admins.
* **Privacy & Security Defenses:** Completely locked-down Row Level Security (RLS), column privileges protecting private details (phone numbers and edit IDs), and API token checks on Edge Functions.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, Vite, Vanilla CSS
* **Database & Serverless Backend:** Supabase (PostgreSQL tables, RPC database functions, Postgres triggers)
* **SMS Gateway:** Supabase Edge Functions (Deno) and the Twilio SMS API
* **Icons & Date Operations:** `lucide-react`, `date-fns`

---

## 📂 Project Structure

```text
├── public/                       # Static assets (images, logos, liability PDF)
├── src/
│   ├── components/
│   │   ├── AddParticipantForm.jsx # Guest signup modal with occupancy validation
│   │   ├── EditParticipantForm.jsx# Guest edit modal
│   │   ├── Header.jsx             # Title & Google Maps coordinates link
│   │   ├── InfoModal.jsx          # Guidelines & local activities info
│   │   ├── ParticipantsTable.jsx  # Interactive guest table
│   │   └── RulesModal.jsx         # House rules modal (scroll-to-accept)
│   ├── App.jsx                   # Main application entry and API controllers
│   ├── index.css                 # CSS variables, glassmorphic tokens & transitions
│   └── supabaseClient.js         # Supabase client instantiation
├── supabase/
│   ├── functions/
│   │   └── send-sms/             # Secured Twilio Edge Function
│   └── migrations/               # Database SQL migrations
├── supabase_init.sql             # SQL script to initialize DB
└── supabase_deployment_instructions.md # Automated instructions for Supabase CLI
```

---

## 💻 Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Cxriszz/Cassone-trap-house.git
cd Cassone-trap-house
npm install
```

### 2. Configure Environment Secrets
Ensure you configure your Supabase Client environment secrets in `src/supabaseClient.js` (Supabase URL & Anon Key).

### 3. Start Development Server
```bash
npm run dev
```

---

## 📦 Deployment

### Database & Edge Functions
For automated deployment of the database migrations, secrets, and Deno Edge Function using the **Supabase CLI**, please consult the instructions guide:
👉 **[supabase_deployment_instructions.md](supabase_deployment_instructions.md)**

### Frontend
Deploy the built site (`dist/`) directly to your hosting provider of choice (Vercel, Netlify, Github Pages, etc.).

---

## 🔒 Security Summary
This application features a hardened database schema where anonymous public access is restricted to public columns only. All administrative configurations, data modifications, and SMS notification pathways are validated server-side using secure Postgres Database RPCs, triggers, and Deno auth filters, preventing any client-side exposure of private user data or credentials.
