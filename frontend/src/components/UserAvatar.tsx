import { Box } from "@mui/material";

interface Props {
  firstName?: string;
  size?: number;
}

export default function UserAvatar({ firstName, size = 32 }: Props) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: "#2A2D2B",
        border: "1px solid rgba(107,111,108,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(size * 0.35, 10),
        fontWeight: 600,
        color: "#E8E3D8",
      }}
    >
      {firstName?.[0]?.toUpperCase() || "U"}
    </Box>
  );
}
