// Role → post-login landing page.
//
// Roles WITHOUT organization-dashboard access must never land on /dashboard:
// the backend gates GET /analytics/dashboard/ behind IsGymOwnerOrAdmin
// (gym_owner, super_admin, manager) — every other role would hit an empty
// "—" page. Mirrors the most useful nav item per role.
export type LandingPath = "/dashboard" | "/attendance" | "/pt-sessions" | "/tickets";

const LANDING_BY_ROLE: Record<string, LandingPath> = {
  super_admin: "/dashboard",
  gym_owner: "/dashboard",
  manager: "/dashboard",
  receptionist: "/attendance",
  trainer: "/pt-sessions",
  instructor: "/attendance",
  security: "/tickets",
  cleaner: "/tickets",
  maintenance: "/tickets",
  member: "/dashboard",
};

export function roleLandingPath(role?: string | null): LandingPath {
  return (role && LANDING_BY_ROLE[role]) || "/dashboard";
}
