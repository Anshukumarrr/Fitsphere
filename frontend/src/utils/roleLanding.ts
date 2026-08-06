// Role → post-login landing page.
//
// Roles WITHOUT a dashboard must never land on /dashboard blindly: the
// backend gates org analytics GET /analytics/dashboard/ behind IsGymOwnerOrAdmin
// (gym_owner, super_admin, manager). Member and trainer have their own
// dashboard endpoints/pages (member-dashboard, trainer-dashboard) served from
// the same /dashboard route via role switch in DashboardPage. Every remaining
// role lands on its most useful nav item.
export type LandingPath = "/dashboard" | "/attendance" | "/pt-sessions" | "/tickets";

const LANDING_BY_ROLE: Record<string, LandingPath> = {
  super_admin: "/dashboard",
  gym_owner: "/dashboard",
  manager: "/dashboard",
  receptionist: "/attendance",
  trainer: "/dashboard",
  instructor: "/attendance",
  security: "/tickets",
  cleaner: "/tickets",
  maintenance: "/tickets",
  member: "/dashboard",
};

export function roleLandingPath(role?: string | null): LandingPath {
  return (role && LANDING_BY_ROLE[role]) || "/dashboard";
}
