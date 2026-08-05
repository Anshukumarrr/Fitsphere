import { Box, Typography } from "@mui/material";
import AttendanceCodePanel from "./AttendanceCodePanel";

export default function AttendanceGeneratePage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Generate Attendance Code
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: '"Inter", sans-serif' }}>
        Members check in by entering this code at the front desk. The code stays
        valid until 12:01 AM, then a new one is needed.
      </Typography>

      <AttendanceCodePanel />
    </Box>
  );
}
