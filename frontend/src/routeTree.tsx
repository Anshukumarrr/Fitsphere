import { lazyRouteComponent, redirect, RootRoute, Route } from "@tanstack/react-router";
import DashboardLayout from "./components/layout/DashboardLayout";

const LandingPage = lazyRouteComponent(() => import("./features/landing/LandingPage"));
const LoginPage = lazyRouteComponent(() => import("./features/auth/LoginPage"));
const RegisterPage = lazyRouteComponent(() => import("./features/auth/RegisterPage"));
const ForgotPasswordPage = lazyRouteComponent(() => import("./features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazyRouteComponent(() => import("./features/auth/ResetPasswordPage"));
const DashboardPage = lazyRouteComponent(() => import("./features/analytics/DashboardPage"));
const AnalyticsPage = lazyRouteComponent(() => import("./features/analytics/AnalyticsPage"));
const AllMembersPage = lazyRouteComponent(() => import("./features/members/AllMembersPage"));
const BulkImportPage = lazyRouteComponent(() => import("./features/members/BulkImportPage"));
const StaffPage = lazyRouteComponent(() => import("./features/staff/StaffPage"));
const AttendanceListPage = lazyRouteComponent(() => import("./features/attendance/AttendanceListPage"));
const AttendanceCalendarPage = lazyRouteComponent(() => import("./features/attendance/AttendanceCalendarPage"));
const AttendanceGeneratePage = lazyRouteComponent(() => import("./features/attendance/AttendanceGeneratePage"));
const TicketsPage = lazyRouteComponent(() => import("./features/tickets/TicketsPage"));
const PaymentListPage = lazyRouteComponent(() => import("./features/payments/PaymentListPage"));
const PTSessionListPage = lazyRouteComponent(() => import("./features/personal-training/PTSessionListPage"));
const BillingPlansPage = lazyRouteComponent(() => import("./features/billing/BillingPlansPage"));
const NotificationSettingsPage = lazyRouteComponent(() => import("./features/notifications/NotificationSettingsPage"));
const EmailCenterPage = lazyRouteComponent(() => import("./features/emails/EmailCenterPage"));
const AuditLogPage = lazyRouteComponent(() => import("./features/audit/AuditLogPage"));
const GymProfilePage = lazyRouteComponent(() => import("./features/organizations/GymProfilePage"));
const ExerciseExplorerPage = lazyRouteComponent(() => import("./features/exercises/ExerciseExplorerPage"));
const ProfilePage = lazyRouteComponent(() => import("./features/profile/ProfilePage"));
const MySessionsPage = lazyRouteComponent(() => import("./features/member/MySessionsPage"));
const MyPaymentsPage = lazyRouteComponent(() => import("./features/member/MyPaymentsPage"));
const PaymentReceiptPage = lazyRouteComponent(() => import("./features/member/PaymentReceiptPage"));

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

const forgotPasswordRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
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

const memberImportRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/members/import",
  component: BulkImportPage,
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

const attendanceGenerateRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/attendance/generate",
  component: AttendanceGeneratePage,
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

const emailCenterRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/email-center",
  component: EmailCenterPage,
});

const profileRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/profile",
  component: ProfilePage,
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

const paymentReceiptRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/my-payments/$paymentId/receipt",
  component: PaymentReceiptPage,
});

const auditRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/audit",
  component: AuditLogPage,
});

const exercisesRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/exercises",
  component: ExerciseExplorerPage,
});

const gymProfileRoute = new Route({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gym-profile",
  component: GymProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    membersRoute,
    memberImportRoute,
    staffRoute,
    ptSessionsRoute,
    attendanceRoute,
    attendanceGenerateRoute,
    ticketsRoute,
    attendanceCalendarRoute,
    paymentsRoute,
    analyticsRoute,
    billingRoute,
    notificationsRoute,
    emailCenterRoute,
    profileRoute,
    memberSessionsRoute,
    memberPaymentsRoute,
    paymentReceiptRoute,
    auditRoute,
    exercisesRoute,
    gymProfileRoute,
  ]),
]);

export { routeTree };
