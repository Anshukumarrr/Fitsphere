import { RootRoute, Route } from "@tanstack/react-router";
import DashboardLayout from "./components/layout/DashboardLayout";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import DashboardPage from "./features/analytics/DashboardPage";
import AttendanceListPage from "./features/attendance/AttendanceListPage";
import GymListPage from "./features/organizations/GymListPage";
import AuditLogPage from "./features/audit/AuditLogPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import BillingPlansPage from "./features/billing/BillingPlansPage";
import LandingPage from "./features/landing/LandingPage";
import MemberListPage from "./features/members/MemberListPage";
import MembershipPlanListPage from "./features/memberships/MembershipPlanListPage";
import MyPaymentsPage from "./features/member/MyPaymentsPage";
import MyProfilePage from "./features/member/MyProfilePage";
import MySessionsPage from "./features/member/MySessionsPage";
import NotificationSettingsPage from "./features/notifications/NotificationSettingsPage";
import PaymentListPage from "./features/payments/PaymentListPage";
import PTSessionListPage from "./features/personal-training/PTSessionListPage";
import TrainerListPage from "./features/trainers/TrainerListPage";

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
});

const registerRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const dashboardLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  id: "dashboard",
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
  component: MemberListPage,
});

const trainersRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/trainers",
  component: TrainerListPage,
});

const membershipsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/memberships",
  component: MembershipPlanListPage,
});

const attendanceRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/attendance",
  component: AttendanceListPage,
});

const gymsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gyms",
  component: GymListPage,
});

const ptSessionsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/pt-sessions",
  component: PTSessionListPage,
});

const paymentsRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/payments",
  component: PaymentListPage,
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
    trainersRoute,
    gymsRoute,
    membershipsRoute,
    attendanceRoute,
    ptSessionsRoute,
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
