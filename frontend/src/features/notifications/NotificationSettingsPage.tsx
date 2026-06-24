import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function NotificationSettingsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Notification Preferences
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            Notification settings will be available here. Configure email reminders for
            membership expiries, payment dues, and PT sessions.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
