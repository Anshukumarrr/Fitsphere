import apiClient from "./client";
import type { EmailLogEntry, PaginatedResponse, UpcomingEmail } from "../types";

export async function fetchEmailPreview(): Promise<UpcomingEmail[]> {
  const { data } = await apiClient.get("/notifications/email-preview/");
  return data as UpcomingEmail[];
}

export async function fetchEmailLogs(params: {
  page?: number;
  status?: string;
}): Promise<PaginatedResponse<EmailLogEntry>> {
  const { data } = await apiClient.get("/notifications/email-logs/", { params });
  return data as PaginatedResponse<EmailLogEntry>;
}
