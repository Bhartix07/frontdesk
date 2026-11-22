# Frontdesk — Arvo Systems Support Platform

> A production-grade support ticket management platform engineered to replace Arvo Systems' legacy spreadsheet and WhatsApp workflow. Built with a business-hours SLA engine, concurrency collision guards, strict note segregation, and an immutable activity audit log.

---

## 📌 Executive Summary & Incident Solutions

Arvo Systems operates with **9 support agents** handling approximately **40 customer issues per day**. The previous spreadsheet-based workflow resulted in a 20% SLA miss rate and zero historical traceability. Frontdesk was designed from the ground up to solve the three critical incidents from last month:

### 1. Concurrency & Collision Lock (INC-0291)
- **The Problem:** Two agents opened the same unassigned ticket, clicked *"take this ticket"* simultaneously, and gave conflicting answers to the customer.
- **The Solution:** Atomic database updates with optimistic locking and collision checks (`UPDATE ... WHERE assignedToId IS NULL`). If an agent attempts to claim a ticket that another agent has already claimed, the server halts the operation and responds with `409 Conflict`, naming the agent who claimed it. The UI immediately reflects the lock state.

### 2. Private Note Segregation & Leak Prevention (INC-0304)
- **The Problem:** An agent wrote a private internal note regarding a difficult customer; the spreadsheet leaked it to the customer.
- **The Solution:** Architectural data isolation. Private notes are stored in a dedicated `InternalNote` model and serviced via an isolated `noteService`. The customer-facing API (`/api/tickets/customer/:ticketNumber`) strictly projects only public conversation messages (`TicketMessage`). Internal notes are physically stripped at the service layer and never sent over the wire to customer endpoints or exports. The agent UI marks internal notes with high-contrast amber security banners and lock indicators.

### 3. Immutable Activity Audit Trail (INC-0318)
- **The Problem:** A customer claimed Arvo delayed responding until next morning; Arvo claimed 40 minutes. Nobody could prove the truth because the spreadsheet maintained no historical logs.
- **The Solution:** An append-only, tamper-evident `AuditLog` table. Every action (`TICKET_CREATED`, `TICKET_CLAIMED`, `AGENT_REPLIED`, `CUSTOMER_REPLIED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `SLA_PAUSED`) is permanently written with actor type (`AGENT`, `CUSTOMER`, `SYSTEM`), actor ID, actor name, exact UTC timestamp, and serialized state diffs. There are no `UPDATE` or `DELETE` endpoints for audit records.

---

## ⏱ Working-Hours SLA Engine

Arvo's SLAs are governed by strict business hours rather than continuous wall-clock time:

- **Working Hours:** Monday to Friday, `09:30 AM – 06:30 PM` (9.0 working hours / 540 working minutes per day).
- **Non-Working Time:** Weekends (Saturday & Sunday) and defined Festival Holidays are completely skipped. For example, a Critical ticket arriving at 6:00 PM on Friday has only 30 working minutes remaining on Friday; its remaining 90 minutes roll forward to Monday 09:30 AM, setting the deadline to **Monday 11:00 AM**.
- **Customer Waiting Pause:** When a ticket status transitions to `WAITING_ON_CUSTOMER`, the SLA timer pauses. When the customer replies or the ticket resumes, the paused working duration is added to the due dates so Arvo agents are not penalized for customer delays.
- **Auto-Close:** If a ticket remains in `WAITING_ON_CUSTOMER` without a customer reply for **5 working days** (45 working hours), the system auto-closes the ticket with an audit trail note.
- **Reopen Window:** A resolved ticket can only be reopened by a customer within **5 working days** of resolution. After this window, the ticket is permanently closed, requiring a new ticket.
- **Priority Changes Mid-Lifecycle (Meera's Meeting Question):** If a ticket's priority is upgraded or downgraded in-flight, Frontdesk calculates the elapsed working time from creation (excluding paused intervals) and applies it against the new priority target:
  $$\text{Remaining Working Minutes} = \max(0, \text{NewTargetMinutes} - \text{ElapsedWorkingMinutes})$$
  If the elapsed time already exceeds the new target, the ticket immediately flags as breached.

---

## 🛠 Technology Stack

- **Backend:** Node.js, Express.js
- **Database & ORM:** Prisma ORM with SQLite (development/demo) and PostgreSQL support (production)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Architecture:** Layered Controller-Service-Repository architecture with dedicated `slaService`, `noteService`, `auditService`, and `ticketService`.

---

## 🚀 Quick Start (Local Setup)

The repository is configured for plug-and-play local execution without requiring a separate database server.

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd frontdesk

# Install dependencies for both server and client
npm run install:all
```

### 2. Initialize Database & Seed Demo Data
```bash
# Generates Prisma client, applies schema, and seeds Arvo's 9 agents & tickets
npm run setup
```

### 3. Start Application
```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev:server

# Terminal 2: Start Frontend (Port 3000)
npm run dev:client
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Incident Verification Suite

You can execute the built-in automated test suite verifying all 3 incidents and the working-hours SLA engine:

```bash
cd server
node test-incidents.js
```

**Expected output:**
- `TEST 1`: Friday 6:00 PM critical ticket rollovers correctly to Monday 11:00 AM.
- `TEST 2`: Simultaneous ticket claiming blocked with `409 Conflict`.
- `TEST 3`: Customer API verified to contain zero internal notes.
- `TEST 4`: Append-only audit logs confirmed immutable.

---

## 🌐 Production Deployment Guide

Frontdesk is configured for unified 1-click deployment on **Render**, **Railway**, **Vercel**, or **Fly.io**.

### 1-Click Deployment on Render
1. Push this repository to GitHub.
2. In Render Dashboard, click **New > Blueprint** and connect this repository (reads `render.yaml`).
3. Render will automatically build the client, generate the Prisma database, run the seed script, and serve the full-stack app.

### Manual Single-Server Production Build
In production, the Express backend serves the compiled React application directly:
```bash
# Build frontend
npm run build

# Start single unified production server
npm start
```
final URL:https://frontdesk-arvo-auu1.onrender.com/
