import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { useGyms, useOrganization } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import type { GymOrganization } from "../../types";

function GymCard({ gym }: { gym: GymOrganization }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {gym.name}
          </Typography>
          <Chip
            label={`${gym.branch_count} branch${gym.branch_count !== 1 ? "es" : ""}`}
            size="small"
            color="primary"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {gym.branches?.map((b) => (
            <Chip key={b.id} label={b.name} variant="outlined" size="small" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function GymListPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { data: gymsData, isLoading: gymsLoading } = useGyms({ enabled: isSuperAdmin });
  const { data: orgData, isLoading: orgLoading } = useOrganization({ enabled: !isSuperAdmin });

  const isLoading = isSuperAdmin ? gymsLoading : orgLoading;
  const gyms = isSuperAdmin ? (gymsData?.results ?? []) : (orgData ? [orgData] : []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Gyms & Branches
      </Typography>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : gyms.length === 0 ? (
        <Typography color="text.secondary">No gyms found</Typography>
      ) : (
        gyms.map((gym) => <GymCard key={gym.id} gym={gym} />)
      )}
    </Box>
  );
}
