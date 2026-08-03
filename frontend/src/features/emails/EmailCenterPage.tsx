import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { fetchEmailLogs, fetchEmailPreview } from "../../api/emails";
import { useAuth } from "../../hooks/useAuth";
import PaginationBar from "../../components/common/PaginationBar";
import type { UpcomingEmailStatus } from "../../types";

const UPCOMING_STATUS_META: Record<
  UpcomingEmailStatus,
  { label: string; color: "success" | "warning" | "error" | "default" }
> = {
  will_send: { label: "Will send", color: "success" },
  suppressed_dedup: { label: "Already sent (skip)", color: "warning" },
  blocked_pref: { label: "Pref OFF", color: "default" },
  blocked_template: { label: "No template", color: "error" },
  no_email: { label: "No email", color: "default" },
  render_error: { label: "Template error", color: "error" },
};

const HISTORY_STATUS_META: Record<string, { label: string; color: "success" | "warning" | "error" }> = {
  sent: { label: "Sent", color: "success" },
  failed: { label: "Failed", color: "error" },
  pending: { label: "Pending", color: "warning" },
};

const EVENT_ORDER = [
  "membership_expiry",
  "membership_expired",
  "payment_due",
  "pt_session_reminder",
];

export default function EmailCenterPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: upcoming, isLoading: previewLoading } = useQuery({
    queryKey: ["email-preview"],
    queryFn: fetchEmailPreview,
    enabled: tab === 0,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs", page, statusFilter],
    queryFn: () => fetchEmailLogs({ page, status: statusFilter || undefined }),
    enabled: tab === 1,
  });

  const grouped = useMemo(() => {
    if (!upcoming) return [];
    const byEvent = new Map<string, typeof upcoming>();
    for (const item of upcoming) {
      const list = byEvent.get(item.event) ?? [];
      list.push(item);
      byEvent.set(item.event, list);
    }
    return EVENT_ORDER.filter((e) => byEvent.has(e)).map((e) => ({
      event: e,
      items: byEvent.get(e)!,
    }));
  }, [upcoming]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
        Email Center
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upcoming scheduled emails and send history.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Upcoming" />
        <Tab label="History" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {previewLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          )}
          {!previewLoading && grouped.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              No upcoming emails match the scheduler windows right now.
            </Typography>
          )}
          {grouped.map(({ event, items }) => {
            const willSend = items.filter((i) => i.status === "will_send").length;
            return (
              <Card key={event} sx={{ mb: 2 }}>
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{items[0].event_label}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        size="small"
                        label={`${willSend} will send`}
                        color="success"
                        variant="outlined"
                      />
                      {items.length - willSend > 0 && (
                        <Chip
                          size="small"
                          label={`${items.length - willSend} blocked`}
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Member</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          {isSuperAdmin && <TableCell sx={{ fontWeight: 600 }}>Org</TableCell>}
                          <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item, idx) => {
                          const meta = UPCOMING_STATUS_META[item.status];
                          return (
                            <TableRow key={`${item.event}-${idx}`} hover>
                              <TableCell>{item.member_name}</TableCell>
                              <TableCell>{item.recipient}</TableCell>
                              {isSuperAdmin && <TableCell>{item.org_name}</TableCell>}
                              <TableCell>
                                {item.trigger_date
                                  ? `${dayjs(item.trigger_date).format("MMM D, YYYY")}${item.days ? ` (in ${item.days}d)` : ""}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Tooltip title={item.reason}>
                                  <Chip
                                    size="small"
                                    label={meta.label}
                                    color={meta.color}
                                    variant="outlined"
                                  />
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Status"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {logsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!logsLoading && logs && (
            <Card>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Recipient</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Sent at</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.results.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ color: "text.secondary" }}>
                            No emails found.
                          </TableCell>
                        </TableRow>
                      )}
                      {logs.results.map((log) => {
                        const meta = HISTORY_STATUS_META[log.status] ?? {
                          label: log.status,
                          color: "default" as const,
                        };
                        return (
                          <TableRow key={log.id} hover>
                            <TableCell>{log.recipient}</TableCell>
                            <TableCell>
                              <Tooltip title={log.error_message || log.body} arrow>
                                <span>{log.subject || "—"}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {log.sent_at ? dayjs(log.sent_at).format("MMM D, YYYY h:mm A") : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <PaginationBar count={logs.count} page={page} onChange={(_, v) => setPage(v)} />
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
