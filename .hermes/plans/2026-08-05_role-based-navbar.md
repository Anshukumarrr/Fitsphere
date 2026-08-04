# Role-Based Navbar Redesign — Implementation Plan

> **Goal:** Every role (10 roles) sees only the navbar items required for their job — no dead links, no "everything for everyone".

**Architecture:** Single source of truth stays in `frontend/src/components/layout/DashboardLayout.tsx` (`navItems[]` with `roles[]` arrays + `filteredNav` filter). The mechanism already exists and works — the task is re-whitelisting each item against (a) backend permission reality and (b) product sense. No backend changes unless the user opts into the dashboard-access fix.

**Tech Stack:** React 19 + MUI, TanStack Router, existing `useAuth().user.role`.

---

## Current state (what I verified)

1. **Role filtering already exists** — `DashboardLayout.tsx:41-61` (`navItems` with `roles[]`), `:81-84` (`filteredNav`). It's been in the repo since an old commit (`75e1c0d`), so the live "I see all options" is almost certainly **super_admin being whitelisted on 13 of 14 staff items**, not a missing filter. (Verify live bundle after deploy to be sure.)

2. **The 10 roles** (`core/models.py:8-18`): `super_admin, gym_owner, receptionist, trainer, cleaner, manager, security, instructor, maintenance, member`.

3. **Dead/broken nav items found (backend permission ≠ nav whitelist):**
   - ❌ **receptionist, trainer, instructor → Dashboard**: `GET /analytics/dashboard/` is `IsGymOwnerOrAdmin` (`analytics/views.py:33`) = only `gym_owner, super_admin, manager`. These roles currently get a Dashboard item that renders an empty "—" page (API 403, no data).
   - ❌ **security / cleaner / maintenance → My Attendance**: `AttendanceLogListView` returns `AttendanceLog.objects.none()` for these roles (`attendance/views.py:45-46`) — page will always be empty.
   - ⚠️ **manager → Audit Logs**: backend allows (`IsGymOwnerOrAdmin`, `audit/views.py:18`) but nav excludes — product decision (owner-only vs owner+manager).
   - ⚠️ **trainer → Payments**: backend allows (`IsStaff`, `payments/views.py:9,45`) but nav excludes — product decision.
   - ⚠️ **receptionist → PT Sessions**: backend allows (`IsStaff`, `personal_training/views.py:48,71`) but nav excludes — product decision.
   - ✓ **instructor → Members**: backend read-only allowed (`IsStaffOrReadOnlyInstructor`, `members/views.py:15,77`) — nav already includes.
   - 🐛 **Duplicate `path: "/dashboard"`** entries (`DashboardLayout.tsx:42` + `:56`) share the same React `key={item.path}` — works today only because no role sees both; fragile.

4. **Post-login landing**: `LoginPage` + our new auth redirect send everyone to `/dashboard`. If trainer/receptionist/instructor lose Dashboard, their landing must change too (open question B).

---

## Proposed role → navbar matrix (MY DEFAULT — user will amend)

✅ = include · ❌ = exclude · ⚠️ = flagged decision for user

| Nav item | super_admin | gym_owner | manager | receptionist | trainer | instructor | security | cleaner | maintenance | member |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| Members | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (RO) | ❌ | ❌ | ❌ | ❌ |
| Import Members | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Staff | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments | ❌ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PT Sessions | ❌ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Attendance | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exercises | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Tickets | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Email Center | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| My Dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| My Attendance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| My Sessions | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| My Payments | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| My Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Item count** | **6** | **13** | **12** | **3** | **5** | **3** | **3** | **3** | **3** | **7** |

### Rationale per role
- **super_admin** — platform-level only: Dashboard (all-org stats), Email Center (all-org logs), Billing (subscription plans), Audit Logs, Tickets (platform support), Profile. Operations (Members/Staff/Payments/Attendance/Analytics/Notifications/Import) belong to the gym — trimmed.
- **gym_owner** — full operations menu (13 items). The only role that gets everything operational.
- **manager** — owner minus Audit Logs (⚠️ decision).
- **receptionist** — front-desk essentials: Members, Payments, Attendance (they generate the code), Profile. No analytics/staff/import.
- **trainer** — Members, PT Sessions, Attendance (view), Exercises, Tickets, Profile. No Dashboard (403 today).
- **instructor** — Members (read-only), Attendance (view), Tickets, Profile.
- **security / cleaner / maintenance** — My Attendance, Tickets, Profile (⚠️ My Attendance is empty-data today — see open question C).
- **member** — My Dashboard, My Attendance, My Sessions, My Payments, Exercises, Tickets, Profile.

---

## Implementation steps (single file)

### Task 1: Rewrite the roles arrays in `navItems`
- **File:** `frontend/src/components/layout/DashboardLayout.tsx:41-61` only.
- Apply the agreed matrix to each item's `roles` array.
- Fix the duplicate-key fragility: give the two `/dashboard` entries distinct handling (e.g. add an `id` field and `key={item.id}`, or keep one entry and label it by role at render).

### Task 2 (only if user opts in): role-based post-login landing
- **Files:** `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/features/auth/RegisterPage.tsx` (the `navigate({ to: "/dashboard" })` calls) and the auth-redirect effect added this session.
- Redirect to the role's first nav item instead of hardcoded `/dashboard` (e.g. receptionist → `/attendance`, trainer → `/pt-sessions`), OR keep `/dashboard` for all and fix the backend to let `IsStaff` read `organization_dashboard` — **backend option NOT recommended** (analytics are org-level; trainers/receptionists have no business there).

### Task 3 (optional, if user wants): `My Attendance` for security/cleaner/maintenance
- Either remove the item from their nav (they have no attendance data anyway) or give the backend a real attendance surface for them (out of scope — separate task).

---

## Verification

1. `cd frontend && npm run build` (tsc + vite, must exit 0) — run UNPIPED as the last command.
2. `npm run lint` — 0 new errors in `DashboardLayout.tsx`.
3. Ad-hoc temp script `hermes-verify-navbar-matrix.py` — reads `DashboardLayout.tsx`, extracts every `roles[]` array, asserts it matches the agreed matrix exactly; run, then delete in a separate command.
4. **Live per-role check (after deploy + seed)**: login as each seed role (super_admin, gym_owner, manager, receptionist, trainer, member — seed_data creates all), confirm the rendered drawer matches the matrix. Requires `seed_data` (live DB is currently empty — 0 orgs) and user approval.

---

## Risks / tradeoffs / open questions

- **A. super_admin scope** — my default trims super_admin to 6 platform items. If you want super_admin to keep cross-gym oversight (Members/Payments/Attendance for debugging gyms), say which items stay.
- **B. Trainer/receptionist/instructor landing page** — their Dashboard is dead today (403). Options: (1) role-based landing (my recommendation), (2) keep Dashboard for them and make the backend allow it (not recommended), (3) leave as-is (empty dashboard — current behavior).
- **C. security/cleaner/maintenance "My Attendance"** — empty data today. Keep the placeholder item, or drop it?
- **D. manager → Audit Logs, trainer → Payments, receptionist → PT Sessions** — include (backend allows) or exclude (product sense)?
- **E. Live build staleness** — filtering has existed for many commits; if the live navbar truly shows ALL 19 items (including My Payments/My Sessions for super_admin), the deployed bundle is stale and needs a redeploy regardless. Will confirm against the live bundle URL after the change.
