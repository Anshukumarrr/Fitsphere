import { Button, Card, Typography } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useActiveCode, useGenerateCode } from "../../hooks/useApi";

/**
 * Daily attendance check-in code panel.
 * Roles allowed to generate: gym_owner, super_admin, receptionist, manager
 * (matches the backend generate_code permission set).
 */
export default function AttendanceCodePanel() {
  const { data: activeCode, isLoading: codeLoading } = useActiveCode();
  const generateCode = useGenerateCode();
  const code = activeCode && "code" in activeCode ? activeCode.code : null;

  const handleGenerate = async () => {
    await generateCode.mutateAsync({});
  };

  return (
    <Card sx={{ p: 4, mb: 3, textAlign: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Attendance Code
      </Typography>
      {codeLoading ? (
        <Typography>Loading...</Typography>
      ) : code ? (
        <>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#00E676",
              fontFamily: "monospace",
              mb: 1,
            }}
          >
            {code}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Valid until 12:01 AM tomorrow
          </Typography>
        </>
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No active code. Generate a new one for members to check in.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleGenerate}
            disabled={generateCode.isPending}
          >
            {generateCode.isPending ? "Generating..." : "Generate New Code"}
          </Button>
        </>
      )}
    </Card>
  );
}
