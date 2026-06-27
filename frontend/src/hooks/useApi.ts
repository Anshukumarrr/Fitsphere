import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import type {
  AttendanceCode,
  AttendanceLog,
  AuditLogEntry,
  DashboardData,
  GymOrganization,
  Member,
  MemberDashboardData,
  MembershipPlan,
  PaginatedResponse,
  Payment,
  PTPackage,
  PTSession,
  SubscriptionPlan,
  Trainer,
} from "../types";

const orgId = () => {
  const org = localStorage.getItem("organization_id");
  return org ? Number(org) : undefined;
};

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", orgId()],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/dashboard/");
      return data;
    },
  });
}

export function useMembers(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<Member>>({
    queryKey: ["members", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/members/", { params });
      return data;
    },
  });
}

export function useMember(id: number) {
  return useQuery<Member>({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/members/${id}/`);
      return data;
    },
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberData: Record<string, unknown>) => {
      const { data } = await apiClient.post("/members/", memberData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      window.__chalkBurst?.();
    },
  });
}

export function useMembershipPlans() {
  return useQuery<PaginatedResponse<MembershipPlan>>({
    queryKey: ["membership-plans", orgId()],
    queryFn: async () => {
      const { data } = await apiClient.get("/memberships/plans/");
      return data;
    },
  });
}

export function useCreateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Record<string, unknown>) => {
      const { data } = await apiClient.post("/memberships/plans/", plan);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membership-plans"] }),
  });
}

export function useTrainers(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<Trainer>>({
    queryKey: ["trainers", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/trainers/", { params });
      return data;
    },
  });
}

export function useCreateTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trainerData: Record<string, unknown>) => {
      const { data } = await apiClient.post("/trainers/", trainerData);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trainers"] }),
  });
}

export function useAttendanceLogs(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<AttendanceLog>>({
    queryKey: ["attendance", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/attendance/logs/", { params });
      return data;
    },
  });
}

export function usePTPackages() {
  return useQuery<PaginatedResponse<PTPackage>>({
    queryKey: ["pt-packages", orgId()],
    queryFn: async () => {
      const { data } = await apiClient.get("/personal-training/packages/");
      return data;
    },
  });
}

export function usePTSessions(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<PTSession>>({
    queryKey: ["pt-sessions", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/personal-training/sessions/", {
        params,
      });
      return data;
    },
  });
}

export function usePayments(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<Payment>>({
    queryKey: ["payments", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/payments/", { params });
      return data;
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentData: Record<string, unknown>) => {
      const { data } = await apiClient.post("/payments/", paymentData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      window.__chalkBurst?.();
    },
  });
}

export function useGyms(options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse<GymOrganization>>({
    queryKey: ["gyms"],
    queryFn: async () => {
      const { data } = await apiClient.get("/organizations/");
      return data;
    },
    ...options,
  });
}

export function useOrganization(options?: { enabled?: boolean }) {
  return useQuery<GymOrganization>({
    queryKey: ["organization", orgId()],
    queryFn: async () => {
      const { data } = await apiClient.get("/organizations/my/");
      return data;
    },
    enabled: !!orgId(),
    ...options,
  });
}

export function useBranches() {
  return useQuery<PaginatedResponse<GymOrganization["branches"][0]>>({
    queryKey: ["branches", orgId()],
    queryFn: async () => {
      const { data } = await apiClient.get("/organizations/branches/");
      return data;
    },
  });
}

export function useSubscriptionPlans() {
  return useQuery<PaginatedResponse<SubscriptionPlan>>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data } = await apiClient.get("/billing/plans/");
      return data;
    },
  });
}

export function useAuditLogs(params?: Record<string, string>) {
  return useQuery<PaginatedResponse<AuditLogEntry>>({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/audit/", { params });
      return data;
    },
  });
}

export function useRevenueReport(period = "monthly") {
  return useQuery({
    queryKey: ["revenue-report", period],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/revenue/", {
        params: { period },
      });
      return data;
    },
  });
}

// --- Attendance Code hooks ---

export function useActiveCode(params?: Record<string, string>) {
  const orgIdVal = orgId();
  const orgParam = orgIdVal ? { ...params, organization: String(orgIdVal) } : params;
  return useQuery<AttendanceCode | { code: null }>({
    queryKey: ["active-code", orgParam],
    queryFn: async () => {
      const { data } = await apiClient.get("/attendance/codes/active/", {
        params: orgParam,
      });
      return data;
    },
  });
}

export function useGenerateCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body?: Record<string, unknown>) => {
      const payload: Record<string, unknown> = { ...(body ?? {}) };
      const oid = orgId();
      if (oid && !payload.organization) {
        payload.organization = oid;
      }
      const { data } = await apiClient.post("/attendance/codes/generate/", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-code"] });
      window.__chalkBurst?.();
    },
  });
}

export function useCodeCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { code: string }) => {
      const { data } = await apiClient.post("/attendance/check-in/code/", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      window.__chalkBurst?.();
    },
  });
}

export function useMemberDashboard() {
  return useQuery<MemberDashboardData>({
    queryKey: ["member-dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/member-dashboard/");
      return data;
    },
  });
}

export function useMySessions() {
  return useQuery<PaginatedResponse<PTSession>>({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const { data } = await apiClient.get("/personal-training/sessions/");
      return data;
    },
  });
}

export function useBookSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionData: {
      trainer: number;
      scheduled_date: string;
      scheduled_time: string;
      duration_minutes?: number;
    }) => {
      const { data } = await apiClient.post("/personal-training/sessions/book/", sessionData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
      window.__chalkBurst?.();
    },
  });
}

export function useMyPayments() {
  return useQuery<PaginatedResponse<Payment>>({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data } = await apiClient.get("/payments/");
      return data;
    },
  });
}

export function useAvailableTrainers(branchId?: number | null) {
  return useQuery<PaginatedResponse<Trainer>>({
    queryKey: ["available-trainers", branchId],
    queryFn: async () => {
      const url = branchId
        ? `/trainers/branch/${branchId}/`
        : "/trainers/";
      const { data } = await apiClient.get(url);
      return data;
    },
    enabled: !!branchId,
  });
}
