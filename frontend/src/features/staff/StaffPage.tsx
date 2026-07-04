import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ExpandMore } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBranches, useCreateStaff, useStaff } from "../../hooks/useApi";
import type { Staff } from "../../types";

const ROLE_LABELS: Record<string, string> = {
  manager: "Managers",
  trainer: "Trainers",
  receptionist: "Receptionists",
  instructor: "Instructors",
  security: "Security",
  cleaner: "Cleaners",
  maintenance: "Maintenance",
};

const ROLE_SINGULAR: Record<string, string> = {
  manager: "Manager",
  trainer: "Trainer",
  receptionist: "Receptionist",
  instructor: "Instructor",
  security: "Security",
  cleaner: "Cleaner",
  maintenance: "Maintenance",
};

const ROLE_ORDER = ["manager", "trainer", "receptionist", "instructor", "security", "cleaner", "maintenance"];

const staffSchema = z.object({
  role: z.string().min(1),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  branch_id: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  years_of_experience: z.string().optional(),
  hourly_rate: z.string().optional(),
  max_members: z.string().optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

export default function StaffPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const { data: branches } = useBranches();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
  });

  const watchedRole = watch("role");

  const groupedStaff = useMemo(() => {
    if (!data?.results) return {};
    const groups: Record<string, Staff[]> = {};
    for (const s of data.results) {
      const role = s.role;
      if (!groups[role]) groups[role] = [];
      groups[role].push(s);
    }
    for (const role of ROLE_ORDER) {
      if (!groups[role]) groups[role] = [];
    }
    return groups;
  }, [data]);

  const onSubmit = async (formData: StaffForm) => {
    const payload: Record<string, unknown> = { ...formData } as Record<string, unknown>;
    if (payload.branch_id) payload.branch_id = Number(payload.branch_id);
    else delete payload.branch_id;
    if (payload.years_of_experience) payload.years_of_experience = Number(payload.years_of_experience);
    if (payload.hourly_rate) payload.hourly_rate = Number(payload.hourly_rate);
    if (payload.max_members) payload.max_members = Number(payload.max_members);
    await createStaff.mutateAsync(payload);
    reset();
    setOpen(false);
  };

  const handleOpen = (role: string) => {
    reset({ role } as StaffForm);
    setOpen(true);
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      manager: "#FF9800",
      trainer: "#4CAF50",
      receptionist: "#2196F3",
      instructor: "#9C27B0",
      security: "#F44336",
      cleaner: "#00BCD4",
      maintenance: "#607D8B",
    };
    return colors[role] || "#6B6F6C";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Staff
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {ROLE_ORDER.map((role) => (
            <Button
              key={role}
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => handleOpen(role)}
              sx={{
                borderColor: `${roleColor(role)}44`,
                color: roleColor(role),
                "&:hover": { borderColor: roleColor(role), bgcolor: `${roleColor(role)}11` },
                textTransform: "capitalize",
              }}
            >
              {ROLE_SINGULAR[role]}
            </Button>
          ))}
        </Box>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : (
        ROLE_ORDER.map((role) => {
          const staffList = groupedStaff[role] || [];
          return (
            <Accordion
              key={role}
              sx={{
                mb: 1,
                bgcolor: "#1A1D1B",
                border: "1px solid #2A2D2B",
                borderRadius: "8px !important",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: "#6B6F6C" }} />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                    {ROLE_LABELS[role]}
                  </Typography>
                  <Chip
                    label={staffList.length}
                    size="small"
                    sx={{
                      bgcolor: `${roleColor(role)}22`,
                      color: roleColor(role),
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {staffList.length === 0 ? (
                  <Typography sx={{ p: 2, color: "#6B6F6C" }}>
                    No {ROLE_LABELS[role].toLowerCase()} yet.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Branch</TableCell>
                          <TableCell>Branch Details</TableCell>
                          {role === "trainer" && <TableCell>Specialization</TableCell>}
                          {role === "trainer" && <TableCell>Experience</TableCell>}
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {staffList.map((s) => (
                          <TableRow key={`${s.role}-${s.id}`}>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>{s.user?.email || "-"}</TableCell>
                            <TableCell>{s.user?.phone || "-"}</TableCell>
                            <TableCell>{s.branch_name || "-"}</TableCell>
                            <TableCell sx={{ maxWidth: 200, fontSize: "0.8rem", whiteSpace: "normal", wordBreak: "break-word" }}>
                              {s.branch_details ? (
                                <>
                                  {s.branch_details.address_line1 && <>{s.branch_details.address_line1}, </>}
                                  {s.branch_details.city && <>{s.branch_details.city}, </>}
                                  {s.branch_details.state && <>{s.branch_details.state}</>}
                                  {s.branch_details.contact_phone && <><br />{s.branch_details.contact_phone}</>}
                                </>
                              ) : "-"}
                            </TableCell>
                            {role === "trainer" && <TableCell>{s.specialization || "-"}</TableCell>}
                            {role === "trainer" && <TableCell>{s.years_of_experience ? `${s.years_of_experience} yrs` : "-"}</TableCell>}
                            <TableCell>
                              <Chip
                                label={s.is_active ? "Active" : "Inactive"}
                                size="small"
                                color={s.is_active ? "success" : "default"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              select
              fullWidth
              label="Role"
              margin="normal"
              {...register("role")}
              error={!!errors.role}
              helperText={errors.role?.message}
            >
              {ROLE_ORDER.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_SINGULAR[r]}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Account Details
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Username *" margin="normal" {...register("username")} error={!!errors.username} helperText={errors.username?.message} />
              <TextField fullWidth label="Email *" type="email" margin="normal" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="First Name *" margin="normal" {...register("first_name")} error={!!errors.first_name} helperText={errors.first_name?.message} />
              <TextField fullWidth label="Last Name *" margin="normal" {...register("last_name")} error={!!errors.last_name} helperText={errors.last_name?.message} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Password *" type="password" margin="normal" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
              <TextField fullWidth label="Phone" margin="normal" {...register("phone")} error={!!errors.phone} helperText={errors.phone?.message} />
            </Box>

            <TextField select fullWidth label="Branch" margin="normal" defaultValue="" {...register("branch_id")} error={!!errors.branch_id} helperText={errors.branch_id?.message}>
              <MenuItem value="">None</MenuItem>
              {branches?.results?.map((b) => (
                <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
              ))}
            </TextField>

            {watchedRole === "trainer" && (
              <>
                <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 2, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                  Trainer Details
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField fullWidth label="Specialization" margin="normal" {...register("specialization")} error={!!errors.specialization} helperText={errors.specialization?.message} />
                  <TextField fullWidth label="Years of Experience" margin="normal" {...register("years_of_experience")} error={!!errors.years_of_experience} helperText={errors.years_of_experience?.message} />
                </Box>
                <TextField fullWidth label="Bio" margin="normal" multiline rows={2} {...register("bio")} error={!!errors.bio} helperText={errors.bio?.message} />
                <TextField fullWidth label="Qualifications" margin="normal" multiline rows={2} {...register("qualifications")} error={!!errors.qualifications} helperText={errors.qualifications?.message} />
              </>
            )}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create {watchedRole ? ROLE_SINGULAR[watchedRole] || "Staff" : "Staff"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
