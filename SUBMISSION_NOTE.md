# Arvo Systems — Frontdesk Submission Note

**Role:** Full Stack Developer Assessment  
**Candidate Evaluation Note**

---

### Question: What did you not finish, and why?

In line with the 8-hour assessment scope and Arvo Systems' immediate operational fires, I prioritized the **four core failure points** that caused last quarter's breakdown:
1. **The Business-Hours SLA Engine** (9:30–18:30, Mon–Fri, holiday skipping, pause-on-waiting, and dynamic priority recalculation).
2. **Race condition collision locking (INC-0291)** to stop two agents from taking the same ticket.
3. **Data isolation for internal notes (INC-0304)** ensuring zero leakage to customer views or APIs.
4. **The immutable audit log (INC-0318)** to provide an indisputable source of truth.

To deliver a working, deployable full-stack application within the time budget, the following items were intentionally deferred:

---

#### 1. Real-Time WebSockets / Server-Sent Events (SSE)
* **What was skipped:** Real-time push updates to agent browser tabs when another agent claims a ticket.
* **Why:** For a 9-agent team processing ~40 tickets daily, atomic database checks with optimistic concurrency (`UPDATE ... WHERE assignedToId IS NULL` returning `409 Conflict`) 100% eliminates the double-handling bug (INC-0291) without the operational overhead of stateful WebSocket connections on serverless or container tiers. WebSocket subscriptions are scoped as Phase 2.

#### 2. Inbound Email Parsing Pipeline (SendGrid / Mailgun webhook)
* **What was skipped:** Direct ingestion of customer emails into tickets via an SMTP/IMAP listener.
* **Why:** Setting up and testing external DNS MX records and webhook tunnels is fragile in a hiring review sandbox. Instead, I built a robust REST API (`POST /api/tickets`) and an interactive **Customer View Simulation Modal** inside the frontend so reviewers can test the customer journey, ticket creation, customer replies, and reopening policies immediately in their browser.

#### 3. Administrative GUI for Festival Holidays
* **What was skipped:** A web dashboard for HR/Management to add and remove festival holidays dynamically.
* **Why:** The festival holiday calendar is currently maintained in `server/services/slaService.js` as an ISO date array (`YYYY-MM-DD`). A full CRUD admin screen was deprioritized in favor of perfecting the business-hours date math (handling Friday evening rollovers to Monday mornings and multi-day holidays).

#### 4. JWT Authentication & Password Infrastructure
* **What was skipped:** User registration, password hashing (bcrypt), and JWT refresh tokens.
* **Why:** An authentication wall would slow down the hiring reviewer from testing the platform. Instead, I provided a persistent **Agent Switcher** in the navigation header pre-loaded with Arvo's 9 support agents. This allows the reviewer to seamlessly switch perspectives (e.g., from Meera to Rahul Sharma) to test race condition claims and private internal note authors with zero friction. Full OAuth/SSO would be attached prior to enterprise rollout.

---

### Architectural Decisions Summary
- **Section 3 Meeting Question (Priority Changes):** Decided that switching a ticket to Urgent mid-lifecycle preserves fair time accounting: elapsed working minutes are deducted from the new target budget ($\text{Remaining} = \max(0, \text{Target} - \text{Elapsed})$). If elapsed time already exceeds the target, it flags immediately as overdue.
- **Auto-Close Policy:** Implemented a sweep endpoint (`POST /api/tickets/sweep-autoclose`) that checks for tickets in `WAITING_ON_CUSTOMER` past 5 working days (45 working hours).
- **Reopen Window:** Enforced a 5-working-day limit on `RESOLVED` tickets, after which status transitions to `CLOSED` and customer must log a new ticket.
