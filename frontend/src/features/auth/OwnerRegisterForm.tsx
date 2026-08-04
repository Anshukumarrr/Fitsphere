import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { setApiErrors } from "../../hooks/setApiErrors";

const ownerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    gym_name: z.string().min(1, "Gym name is required"),
    gym_city: z.string().optional(),
    gym_state: z.string().optional(),
    gym_address: z.string().optional(),
    branch_name: z.string().min(1, "Branch name is required"),
    branch_city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type OwnerForm = z.infer<typeof ownerSchema>;

export default function OwnerRegisterForm({
  onError,
  onSuccess,
}: {
  onError: (message: string) => void;
  onSuccess: (email: string) => void;
}) {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<OwnerForm>({
    resolver: zodResolver(ownerSchema),
  });

  const onSubmit = async (data: OwnerForm) => {
    try {
      onError("");
      const result = await registerUser({
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        gym_name: data.gym_name,
        gym_city: data.gym_city || "",
        gym_state: data.gym_state || "",
        gym_address: data.gym_address || "",
        branch_name: data.branch_name,
        branch_city: data.branch_city || "",
      });
      onSuccess(result?.email || data.email);
    } catch (err) {
      const apiError = setApiErrors(err, setFieldError);
      if (apiError) onError(apiError);
    }
  };

  return (
    <>
      <Typography
        variant="subtitle2"
        sx={{ color: "#E8E3D8", mb: 2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}
      >
        Gym Owner — Create Your Gym
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          fullWidth
          label="Username"
          margin="normal"
          {...register("username")}
          error={!!errors.username}
          helperText={errors.username?.message}
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            label="First Name"
            margin="normal"
            {...register("first_name")}
            error={!!errors.first_name}
            helperText={errors.first_name?.message}
          />
          <TextField
            fullWidth
            label="Last Name"
            margin="normal"
            {...register("last_name")}
            error={!!errors.last_name}
            helperText={errors.last_name?.message}
          />
        </Box>
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          margin="normal"
          {...register("confirm_password")}
          error={!!errors.confirm_password}
          helperText={errors.confirm_password?.message}
        />

        <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

        <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mb: 1, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
          Gym Details
        </Typography>
        <TextField
          fullWidth
          label="Gym Name *"
          margin="normal"
          {...register("gym_name")}
          error={!!errors.gym_name}
          helperText={errors.gym_name?.message}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            label="City"
            margin="normal"
            {...register("gym_city")}
            error={!!errors.gym_city}
            helperText={errors.gym_city?.message}
          />
          <TextField
            fullWidth
            label="State"
            margin="normal"
            {...register("gym_state")}
            error={!!errors.gym_state}
            helperText={errors.gym_state?.message}
          />
        </Box>
        <TextField
          fullWidth
          label="Address"
          margin="normal"
          {...register("gym_address")}
          error={!!errors.gym_address}
          helperText={errors.gym_address?.message}
        />

        <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

        <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mb: 1, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
          First Branch
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            label="Branch Name *"
            margin="normal"
            {...register("branch_name")}
            error={!!errors.branch_name}
            helperText={errors.branch_name?.message}
          />
          <TextField
            fullWidth
            label="City"
            margin="normal"
            {...register("branch_city")}
            error={!!errors.branch_city}
            helperText={errors.branch_city?.message}
          />
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {isSubmitting ? "CREATING ACCOUNT..." : "JOIN NOW"}
        </Button>
      </form>
    </>
  );
}
