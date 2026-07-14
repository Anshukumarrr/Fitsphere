import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/client";

interface NotificationPreference {
  id: number;
  organization: number;
  event: string;
  channel: string;
  enabled: boolean;
  reminder_days: number | null;
}

const EVENT_LABELS: Record<string, string> = {
  membership_expiry: "Membership Expiry",
  membership_expired: "Membership Expired",
  payment_due: "Payment Due",
  pt_session_reminder: "PT Session Reminder",
  announcement: "Gym Announcement",
  staff_invite: "Staff Invite",
  welcome: "Welcome",
};

const EVENTS = Object.keys(EVENT_LABELS);

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { data } = await apiClient.get("/notifications/preferences/");
      return (data as { results: NotificationPreference[] }).results;
    },
  });

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data } = await apiClient.get("/organizations/my/");
      return data as { id: number; name: string };
    },
  });

  const upsertPref = useMutation({
    mutationFn: async (pref: { event: string; channel: string; enabled: boolean }) => {
      await apiClient.post("/notifications/preferences/", {
        organization: org?.id,
        event: pref.event,
        channel: pref.channel,
        enabled: pref.enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const getPref = (event: string, channel: string): boolean => {
    if (!preferences) return false;
    const found = preferences.find((p) => p.event === event && p.channel === channel);
    return found ? found.enabled : false;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure which events trigger WhatsApp notifications.
      </Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    WhatsApp
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Email
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {EVENTS.map((event) => (
                  <TableRow key={event}>
                    <TableCell>{EVENT_LABELS[event]}</TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={getPref(event, "whatsapp")}
                            onChange={(e) =>
                              upsertPref.mutate({
                                event,
                                channel: "whatsapp",
                                enabled: e.target.checked,
                              })
                            }
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={getPref(event, "email")}
                            onChange={(e) =>
                              upsertPref.mutate({
                                event,
                                channel: "email",
                                enabled: e.target.checked,
                              })
                            }
                          />
                        }
                        label=""
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
