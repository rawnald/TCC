# 🛡️ Tactical Command Center & Secure CRUD Starter Application

A full-stack, modular Command & Control Dashboard web application built for operational tracking, tactical mapping, secure multi-role CRUD operations, and automated GitHub data archiving. Designed to be beginner-friendly, clean, and deployable to Vercel in minutes.

---

## ⚡ Highlights & Key Capabilities

- **🔐 Supabase Authentication & PostgreSQL RLS**:
  - Secure session management with email/password authentication.
  - Role-Based Access Control (RBAC): `Admin`, `Operator`, and `Viewer`.
  - PostgreSQL Row Level Security (RLS) policies enforcing database-level boundaries.
- **🗺️ Interactive Tactical GIS Map (Leaflet + OpenStreetMap)**:
  - Real-time carto-dark OpenStreetMap rendering with zero SSR issues.
  - Coordinate markers (latitude/longitude) with glowing status indicators (Active, Pending, Critical).
  - Click-on-map to inspect or set coordinates.
- **📊 Quick-View Command Dashboard**:
  - Live metric cards: Total Records, Active Operations, Pending Tasks, Critical Alerts.
  - Filterable activity ledger and operational audit trail.
  - High-priority triage queue and operational calendar.
- **🗂️ 8 Operational CRUD Modules**:
  1. **Events & Incidents**: Emergency alerts, security breaches, operational incidents.
  2. **Personnel & Agents**: Active duty operators, badges, clearance, roles.
  3. **Units & Squads**: Mobilized tactical squads, vehicle units, field forces.
  4. **Locations & Facilities**: Staging hubs, relay substations, command centers.
  5. **Tasks & Missions**: Action items, assignees, deadlines, and priorities.
  6. **Equipment & Logistics**: Hardware tracking, serial numbers, maintenance condition.
  7. **Intelligence Reports**: Field assessments, security summaries, briefings.
  8. **Secure Documents**: Standard Operating Procedures (SOPs), protocols, manuals.
- **🔄 Automated GitHub JSON Snapshot Pipeline**:
  - Automatically triggers a serverless snapshot upon every **Add**, **Update**, or **Delete** action.
  - Directly commits formatted `data/records-snapshot.json` to your GitHub repository.
  - Full audit logging of snapshot triggers and commit hashes.
- **🚀 One-Click Vercel Deployment**:
  - Built with Next.js 14 App Router, pre-configured for zero-setup deployment on Vercel through GitHub.
- **🎮 Built-In Instant Demo Mode**:
  - Can be explored and tested immediately without any API keys or third-party accounts configured.

---

## 🏗️ Project Structure

```text
command-dashboard-starter/
├── app/
│   ├── api/
│   │   └── snapshot/
│   │       └── route.ts          # Serverless GitHub snapshot commit endpoint
│   ├── globals.css               # Tactical dark theme, Leaflet styles & radar pulse animations
│   ├── layout.tsx                # App root layout with AuthProvider
│   └── page.tsx                  # Unified Command Dashboard & Module router
├── components/
│   ├── Navbar.tsx                # Header with status, tactical clock & role switcher
│   ├── Sidebar.tsx               # Navigation for Overview, Map, 8 CRUD modules & Audit Log
│   ├── DashboardOverview.tsx     # Metrics, alert triage, calendar & activity feed
│   ├── TacticalMap.tsx           # Leaflet + OpenStreetMap interactive mapping
│   ├── RecordList.tsx            # CRUD table/cards with filters and action buttons
│   ├── RecordModal.tsx           # Create / Edit modal with GPS coordinate picker
│   ├── AuditLogView.tsx          # Full audit ledger with expandable JSON diffs
│   ├── AuthModal.tsx             # Supabase Auth modal + 1-click test roles
│   └── ExportModal.tsx           # GitHub snapshot inspector & offline JSON export
├── lib/
│   ├── authContext.tsx           # Role-based access control & demo switcher context
│   ├── mockData.ts               # Realistic initial seed data across all 8 modules
│   └── supabaseClient.ts         # Supabase client with graceful fallback detection
├── supabase/
│   └── schema.sql                # Complete PostgreSQL migration with RLS & RBAC
├── types/
│   └── index.ts                  # TypeScript definitions for records, roles, & logs
├── .env.example                  # Environment variable reference
├── package.json
└── README.md
```

---

## 🚀 Quick Start (Local Run)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will launch instantly in **Demo Mode**, populated with interactive sample data, ready for you to test!

---

## 📖 Step-by-Step Setup Guide

For a non-technical walkthrough on connecting your free **Supabase** database, **GitHub repository**, and deploying to **Vercel**, read [SETUP_GUIDE.md](./SETUP_GUIDE.md).
