import { useState } from "react";
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
import PaginationBar from "../../components/common/PaginationBar";
import SearchInput from "../../components/common/SearchInput";

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  if (search) params.search = search;
  const { data: gymsData, isLoading: gymsLoading } = useGyms(isSuperAdmin ? params : undefined, { enabled: isSuperAdmin });
  const { data: orgData, isLoading: orgLoading } = useOrganization({ enabled: !isSuperAdmin });

  const isLoading = isSuperAdmin ? gymsLoading : orgLoading;
  const gyms = isSuperAdmin ? (gymsData?.results ?? []) : (orgData ? [orgData] : []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Gyms & Branches
      </Typography>

      {isSuperAdmin && (
        <Box sx={{ mb: 2 }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search gyms..." />
        </Box>
      )}

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : gyms.length === 0 ? (
        <Typography color="text.secondary">No gyms found</Typography>
      ) : (
        gyms.map((gym) => <GymCard key={gym.id} gym={gym} />)
      )}

      {isSuperAdmin && gymsData && <PaginationBar count={gymsData.count} page={page} onChange={(_, v) => setPage(v)} />}
    </Box>
  );
}
