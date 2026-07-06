import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Chip,
  Typography,
} from "@mui/material";
import { ExpandMore, FitnessCenter, Store } from "@mui/icons-material";
import { useGyms, useOrganization } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import BranchMemberTable from "./BranchMemberTable";

export default function AllMembersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { data: gymsData, isLoading: gymsLoading } = useGyms(undefined, { enabled: isSuperAdmin });
  const { data: orgData, isLoading: orgLoading } = useOrganization({ enabled: !isSuperAdmin });
  const [expandedOrg, setExpandedOrg] = useState<string | false>(false);
  const [expandedBranch, setExpandedBranch] = useState<string | false>(false);

  const orgs = isSuperAdmin ? (gymsData?.results ?? []) : (orgData ? [orgData] : []);
  const isLoading = gymsLoading || orgLoading;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        {isSuperAdmin ? "All Members" : "Members"}
      </Typography>
      {isSuperAdmin && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Overview of all gyms, branches, and their members across the platform
        </Typography>
      )}

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : orgs.length === 0 ? (
        <Typography color="text.secondary">No gyms found</Typography>
      ) : (
        orgs.map((org) => (
          <Card key={org.id} sx={{ mb: 2, overflow: "hidden" }}>
            <Accordion
              expanded={expandedOrg === `org-${org.id}`}
              onChange={(_, isExp) => setExpandedOrg(isExp ? `org-${org.id}` : false)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                  <FitnessCenter sx={{ color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {org.name}
                  </Typography>
                  <Chip label={`${org.branches?.length ?? 0} branches`} size="small" variant="outlined" />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 0 }}>
                {org.branches?.map((branch) => (
                  <Accordion
                    key={branch.id}
                    expanded={expandedBranch === `branch-${org.id}-${branch.id}`}
                    onChange={(_, isExp) =>
                      setExpandedBranch(isExp ? `branch-${org.id}-${branch.id}` : false)
                    }
                    sx={{ "&:before": { display: "none" }, boxShadow: "none" }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ borderTop: "1px solid", borderColor: "divider" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <Store sx={{ color: "text.secondary", fontSize: 20 }} />
                        <Typography variant="subtitle2">{branch.name}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pb: 0 }}>
                      {expandedBranch === `branch-${org.id}-${branch.id}` && (
                        <BranchMemberTable branchId={branch.id} />
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </AccordionDetails>
            </Accordion>
          </Card>
        ))
      )}
    </Box>
  );
}
