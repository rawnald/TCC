# 📘 Beginner's Step-by-Step Setup Guide

This guide is designed specifically for people with **no prior programming knowledge**. Follow these simple, click-by-click instructions to launch your Command Dashboard, connect Supabase, enable automated GitHub snapshots, and deploy to Vercel for free.

---

## Table of Contents
1. [Phase 1: Testing Immediately in Instant Demo Mode](#phase-1-testing-immediately-in-instant-demo-mode)
2. [Phase 2: Setting up your Free Supabase Database](#phase-2-setting-up-your-free-supabase-database)
3. [Phase 3: Setting up the Automated GitHub Snapshot Pipeline](#phase-3-setting-up-the-automated-github-snapshot-pipeline)
4. [Phase 4: 1-Click Automatic Vercel Deployment](#phase-4-1-click-automatic-vercel-deployment)

---

## Phase 1: Testing Immediately in Instant Demo Mode

You don't need to configure any external accounts to test and explore the entire dashboard!

1. Open your terminal in the project folder:
   ```bash
   cd C:\Users\PLONG-PLONG\.gemini\antigravity\scratch\command-dashboard-starter
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open your web browser and go to: `http://localhost:3000`
5. **Authentication & Features**:
   - Visit the dedicated authentication page at: **`http://localhost:3000/login`**
   - Click **Register Operator** to create your own account with your name, email, and password.
   - Once logged in, your genuine role badge appears in the top navigation bar.
   - Click any item on the **Geographical Command Grid (Leaflet Map)** to inspect popups.
   - Click **Add Record** to test creating a new item with latitude and longitude coordinates.
   - Click the **GH Snapshot** button to view the live JSON snapshot that gets archived on every change.

---

## Phase 2: Setting up your Free Supabase Database

Supabase provides the PostgreSQL database, user login, and Row Level Security (RLS).

### Step 1: Create a Free Account
1. Visit [supabase.com](https://supabase.com) and click **Start your project** (sign in with your GitHub account).
2. Click **New Project**.
3. Choose a Name (e.g. `tactical-command-ops`), set a secure Database Password, and pick the region closest to you.
4. Click **Create new project** and wait ~1 minute for the database to provision.

### Step 2: Run the Database Schema (1 Click)
1. In your Supabase project dashboard, click on the **SQL Editor** tab (the `>_` icon on the left sidebar).
2. Click **New query**.
3. Open the file `supabase/schema.sql` located in this project, copy **all** of its contents, and paste them into the Supabase SQL Editor.
4. Click the green **Run** button at the bottom right.
   - *Result*: Your tables (`profiles`, `records`, `audit_logs`), Row Level Security policies, and sample seed records are now created!

### Step 3: Copy your API Keys
1. In Supabase, click the **Settings** gear icon on the left sidebar, then click **API**.
2. Find the following two values:
   - **Project URL** (starts with `https://...`)
   - **Project API keys** -> `anon` / `public`
3. In your project folder, create a file named `.env.local` (or copy `.env.example` to `.env.local`) and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```
4. Restart your local server (`npm run dev`). Your dashboard is now connected to your live cloud PostgreSQL database!

---

## Phase 3: Setting up the Automated GitHub Snapshot Pipeline

This feature automatically takes a full JSON snapshot of all records and commits it directly to your GitHub repository whenever you Add, Edit, or Delete a record.

### Step 1: Create a GitHub Personal Access Token (PAT)
1. Log in to [github.com](https://github.com) and click your profile icon in the top-right -> **Settings**.
2. Scroll down on the left menu and click **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
3. Click **Generate new token** -> **Generate new token (classic)**.
4. Give it a Note (e.g., `Command Dashboard Snapshot Bot`).
5. Check the box for **`repo`** (Full control of private repositories).
6. Click **Generate token** at the bottom, and **copy the token immediately** (it looks like `ghp_...`).

### Step 2: Add Keys to `.env.local`
Add these lines to your `.env.local` file:
```env
GITHUB_ACCESS_TOKEN=ghp_yourCopiedTokenHere
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=your-github-repository-name
GITHUB_SNAPSHOT_PATH=data/records-snapshot.json
GITHUB_BRANCH=main
```

---

## Phase 4: 1-Click Automatic Vercel Deployment

Deploying your dashboard live to the internet so you and your team can access it from anywhere:

### Step 1: Push your Code to GitHub
1. Create a new repository on [github.com/new](https://github.com/new) named `command-dashboard-starter`.
2. In your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Tactical Command Dashboard"
   git branch -M main
   git remote add origin https://github.com/your-username/command-dashboard-starter.git
   git push -u origin main
   ```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/sign in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your `command-dashboard-starter` repository from the list and click **Import**.
4. In the **Environment Variables** section, paste the same keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GITHUB_ACCESS_TOKEN`
   - `GITHUB_REPO_OWNER`
   - `GITHUB_REPO_NAME`
5. Click **Deploy**!

In less than 2 minutes, Vercel will give you a live production URL (e.g. `https://command-dashboard-starter.vercel.app`).
Every time you push new code to GitHub, Vercel will automatically update your site!

---

## Phase 5: Connecting your Google Calendar (Governance)

1. On your sidebar, scroll down to the **Governance** section and click **Google Calendar**.
2. Click **Connect Google Account** (or the **Change Account** button in the top right).
3. Enter your **Google Account email** (e.g. `yourname@gmail.com` or your Google Workspace email) and click **Save & Connect**.
4. Your personal or mission Google Calendar will now load live inside your tactical dashboard with **Month**, **Week**, and **Agenda** views!
5. Click **Add Event** anytime to schedule a new event directly to your Google account in 1 click.
