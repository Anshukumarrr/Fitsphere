# Self-Service Signup via Invite Codes — Implementation Plan

> **Goal:** Gym owners stop creating every staff/member account. Staff self-register with a code from the owner's dashboard; members self-register with a code handed out by staff. Codes are per-org AND per-branch, and rotate daily at 00:01 IST.

## 1. Flows (as designed)

**Signup page** — role selector up front, then a per-role form:
1. **Gym Owner** → existing gym-registration form (unchanged; creates org + first branch, verification email).
2. **Staff** → name/username/email/password/phone + **role dropdown** (Manager, Receptionist, Trainer, Instructor, Security, Cleaner, Maintenance) + **staff invite code**. Code resolves org + branch → account + role profile created.
3. **Member / User / Customer** → name/username/email/password/phone + **member invite code**. Code resolves org + branch → account + `Member` profile created (no plan yet — staff assigns a plan later).

**Codes**:
- **Staff invite code** — shown on the **gym owner's** dashboard (all branches, branch selector). Used at staff signup.
- **Member invite code** — shown on **trainer / receptionist / manager** dashboards (the three roles that hand codes to customers). Used at member signup.
- Both: refreshed **daily at 00:01 IST**, per-org **and** per-branch (multi-branch gyms get one code per branch).

## 2. Data model — `InviteCode` (in `organizations/models.py`)

| Field | Type | Notes |
|---|---|---|
| organization | FK `GymOrganization` | |
| branch | FK `Branch` | non-null — codes are branch-scoped |
| kind | CharField `staff`/`member` | |
| code | CharField(6), unique | 6 random alphanumeric chars from unambiguous set `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L) |
| valid_for | DateField | the IST calendar date the code works on |
| created_at | DateTimeField | |

- `UniqueConstraint(organization, branch, kind, valid_for)` — one code per branch-kind-day.
- **`get_current(org, branch, kind)` classmethod** — returns today's code, **lazily generating it if missing** (robust to scheduler misses on Render free tier).
- Code generation: `secrets`-based random 6-char, collision-checked.
- **Timezone**: `valid_for` computed with `datetime.now(ZoneInfo("Asia/Kolkata")).date()` — settings use UTC, so IST must be pinned explicitly (same convention as the existing scheduler).

**Rotation (two layers):**
1. **APScheduler job** in `notifications/scheduler.py` (`BackgroundScheduler(timezone="Asia/Kolkata")`, same pattern as the 3 existing jobs): `CronTrigger(hour=0, minute=1)` → pre-create today's codes for all orgs/branches/kinds.
2. **Lazy fallback** in `get_current()` — any fetch after 00:01 IST without the job having run still returns today's fresh code.

Old codes stay in the table (valid_for gates them; useful audit trail).

## 3. Backend — new endpoints (all in `core/views.py` + `core/serializers.py`, mirrors of `RegisterView`)

1. **`POST /api/v1/auth/register-staff/`** (anonymous, `RegisterThrottle`)
   - Input: username, email, password, first_name, last_name, phone?, role (whitelist: manager, receptionist, trainer, instructor, security, cleaner, maintenance), invite_code.
   - Validates code (exists + `valid_for == today IST`); resolves org+branch; `User.objects.create_user(role=role, organization=org, is_active=False)`; creates the role profile with `branch` (map: manager→`ManagerProfile`, receptionist→`ReceptionistProfile`, trainer→`Trainer`, instructor→`InstructorProfile`, security→`SecurityProfile`, cleaner→`CleanerProfile`, maintenance→`MaintenanceProfile`); `created_by=None`.
   - Sends the same verification email as `RegisterView`; returns `{detail, email}`.
2. **`POST /api/v1/auth/register-member/`** (anonymous, `RegisterThrottle`)
   - Input: username, email, password, first_name, last_name, phone?, invite_code.
   - Creates `User(role="member", organization=org, is_active=False)` + `Member(branch=branch, membership_status="active")` — **no plan/dates** (staff assigns a plan via the existing members UI).
   - Same verification email; returns `{detail, email}`.
3. **`GET /api/v1/organizations/invite-code/?kind=staff|member`** (authenticated)
   - `kind=staff` → permission **gym_owner only**; returns codes for **all branches** (branch selector on owner dashboard).
   - `kind=member` → permission **trainer / receptionist / manager**; resolves the caller's branch from their role profile; returns that branch's code.
   - Response: `{kind, org, branch, branch_name, code, rotates_at}` (ISO 00:01 IST tomorrow).
   - Lazy-rotates via `get_current()`.

**Scheduler:** add `rotate_invite_codes()` job at `CronTrigger(hour=0, minute=1)` in `notifications/scheduler.py`, updating the startup log line.

**Migration:** `makemigrations organizations` + `migrate`. No seed needed — codes generate lazily on first fetch.

## 4. Frontend

1. **`RegisterPage.tsx`** — role selector (3 cards) → per-role form:
   - Owner: existing form untouched.
   - Staff: fields above + role dropdown + code input; posts to `register-staff`; same success/verify-email screen.
   - Member: fields + code input; posts to `register-member`; same success screen.
2. **New `InviteCodeCard` component** — big monospace code, **Copy** button, "Refreshes every day at 12:01 AM" note:
   - **DashboardPage**: `kind=staff` card (owner) — branch selector when the org has >1 branch.
   - **DashboardPage**: `kind=member` card (manager).
   - **AttendanceListPage** (receptionist's home page): `kind=member` card.
   - **PTSessionListPage** (trainer's home page): `kind=member` card.
   - (Trainer/receptionist have no Dashboard nav item since the last change — their "dashboard" is their landing page, per the current nav matrix.)
3. **`useApi.ts`**: add `registerStaff`, `registerMember`, `getInviteCodes` hooks.

## 5. Security

- Codes: 6 chars from a 31-char unambiguous alphanumeric set ≈ 30 bits of entropy — plenty for a daily-rotating invite code; daily rotation bounds exposure if leaked.
- Old-day codes rejected server-side (`valid_for` check) — no client-side trust.
- Public endpoints throttled (`RegisterThrottle`, mirrors existing register).
- Email verification enforced for all three paths (is_active=False until verified) — same as today.
- `super_admin` accounts: platform-created only — not exposed in any signup option.
- Code is returned only to authorized roles; member code never shown to members themselves.

## 6. What stays unchanged

- Gym-owner registration (org + branch creation).
- Login / JWT / password flows; email templates.
- Staff management page (list / deactivate / edit) — only the *account-creation* part of the flow moves to self-signup.
- Members import (bulk) — still useful for existing members.
- Navbar role matrix from the previous change.

## 7. Verification plan

- Backend: `manage.py check`; targeted test-client script (rollback-wrapped, no live-DB writes): register-staff + register-member with valid/invalid/expired codes, invite-code endpoint for owner vs trainer vs trainer-without-branch, lazy rotation across the 00:01 IST boundary (unit-level date injection), scheduler job registration.
- Frontend: `npm run build` (canonical, unpiped, last) + `npm run lint` + ad-hoc wiring script.

## 8. Decisions I made (flag if wrong)

1. **Signup options: three confirmed** (gym owner / staff / member-user) — user confirmed the "four" was a miscount.
2. The "three people" (trainer/receptionist/manager) receive the **member** code (they hand it to customers), not the staff code.
3. Staff code is **owner-only** (manager does not see it).
4. Member signs up **without** a plan; staff assigns membership later. *(Pending check: the members UI must support assigning a plan to a plan-less member — small follow-up if not.)*
5. Staff self-signup **requires email verification** (same as owner today).
6. `instructor` is included in staff self-signup (role dropdown) — even though they don't get the member code.

## 9. Implementation order

1. `InviteCode` model + migration + `get_current()` lazy rotation
2. Scheduler job (00:01 IST) + log line
3. `register-staff` + `register-member` views/serializers + URL wiring
4. `invite-code` GET endpoint + permissions
5. Backend verification script
6. RegisterPage role selector + two new forms
7. `InviteCodeCard` + placement on 4 pages + `useApi` hooks
8. Frontend build/lint/verification
9. Deploy (migration + backend + frontend)
