import { redirect, RootRoute, Route } from "@tanstack/react-router";
import DashboardLayout from "./components/layout/DashboardLayout";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import DashboardPage from "./features/analytics/DashboardPage";
import AllMembersPage from "./features/members/AllMembersPage";
import AuditLogPage from "./features/audit/AuditLogPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import BillingPlansPage from "./features/billing/BillingPlansPage";
import LandingPage from "./features/landing/LandingPage";
import MyPaymentsPage from "./features/member/MyPaymentsPage";
import MyProfilePage from "./features/member/MyProfilePage";
import MySessionsPage from "./features/member/MySessionsPage";
import NotificationSettingsPage from "./features/notifications/NotificationSettingsPage";
import PaymentListPage from "./features/payments/PaymentListPage";
import PTSessionListPage from "./features/personal-training/PTSessionListPage";
import StaffPage from "./features/staff/StaffPage";
import AttendanceListPage from "./features/attendance/AttendanceListPage";
import TicketsPage from "./features/tickets/TicketsPage";
import AttendanceCalendarPage from "./features/attendance/AttendanceCalendarPage";

const rootRoute = new RootRoute();

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (search: Record<string, string>) => ({
    verified: search.verified || undefined,
  }),
});

const registerRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const dashboardLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  beforeLoad: () => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});

const dashboardIndexRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const membersRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/members",
  component: AllMembersPage,
});

const staffRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/staff",
  component: StaffPage,
});

const attendanceRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/attendance",
  component: AttendanceListPage,
});

const ticketsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/tickets",
  component: TicketsPage,
});

const attendanceCalendarRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/my-attendance",
  component: AttendanceCalendarPage,
});

const paymentsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/payments",
  component: PaymentListPage,
});

const ptSessionsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/pt-sessions",
  component: PTSessionListPage,
});

const analyticsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const billingRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/billing",
  component: BillingPlansPage,
});

const notificationsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/notifications",
  component: NotificationSettingsPage,
});

const memberProfileRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/profile",
  component: MyProfilePage,
});

const memberSessionsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/my-sessions",
  component: MySessionsPage,
});

const memberPaymentsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/my-payments",
  component: MyPaymentsPage,
});

const auditRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/audit",
  component: AuditLogPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    membersRoute,
    staffRoute,
    ptSessionsRoute,
    attendanceRoute,
    ticketsRoute,
    attendanceCalendarRoute,
    paymentsRoute,
    analyticsRoute,
    billingRoute,
    notificationsRoute,
    memberProfileRoute,
    memberSessionsRoute,
    memberPaymentsRoute,
    auditRoute,
  ]),
]);

export { routeTree };
