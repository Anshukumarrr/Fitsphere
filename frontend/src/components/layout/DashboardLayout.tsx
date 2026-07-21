import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Assessment,
  BugReport,
  CalendarMonth,
  Dashboard,
  FileUpload,
  FitnessCenter,
  Group,
  Logout,
  Menu as MenuIcon,
  MonetizationOn,
  Notifications,
  People,
  Receipt,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";

const drawerWidth = 250;

const navItems = [
  { label: "Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ["gym_owner", "super_admin", "receptionist", "trainer", "manager", "instructor"] },
  { label: "Members", icon: <People />, path: "/members", roles: ["gym_owner", "super_admin", "receptionist", "trainer", "manager", "instructor"] },
  { label: "Import Members", icon: <FileUpload />, path: "/members/import", roles: ["gym_owner", "super_admin", "manager"] },
  { label: "Staff", icon: <Group />, path: "/staff", roles: ["gym_owner", "super_admin", "manager"] },
  { label: "Payments", icon: <MonetizationOn />, path: "/payments", roles: ["gym_owner", "super_admin", "receptionist", "manager"] },
  { label: "PT Sessions", icon: <Group />, path: "/pt-sessions", roles: ["gym_owner", "super_admin", "trainer", "manager"] },
  { label: "Attendance", icon: <CalendarMonth />, path: "/attendance", roles: ["gym_owner", "super_admin", "receptionist", "trainer", "manager", "instructor"] },
  { label: "Analytics", icon: <Assessment />, path: "/analytics", roles: ["gym_owner", "super_admin", "manager"] },
  { label: "Exercises", icon: <FitnessCenter />, path: "/exercises", roles: ["trainer", "member"] },
  { label: "Tickets", icon: <BugReport />, path: "/tickets", roles: ["gym_owner", "super_admin", "trainer", "member", "manager", "instructor", "security", "cleaner", "maintenance"] },
  { label: "Notifications", icon: <Notifications />, path: "/notifications", roles: ["gym_owner", "super_admin", "manager"] },
  { label: "Billing", icon: <Receipt />, path: "/billing", roles: ["super_admin"] },
  { label: "Audit Logs", icon: <Receipt />, path: "/audit", roles: ["gym_owner", "super_admin"] },
  { label: "My Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ["member"] },
  { label: "My Attendance", icon: <CalendarMonth />, path: "/my-attendance", roles: ["member", "security", "cleaner", "maintenance"] },
  { label: "My Sessions", icon: <Group />, path: "/my-sessions", roles: ["member"] },
  { label: "My Payments", icon: <MonetizationOn />, path: "/my-payments", roles: ["member"] },
  { label: "My Profile", icon: <People />, path: "/profile", roles: ["member"] },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout, refetchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && localStorage.getItem("access_token")) {
      refetchUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrawerToggle = useCallback(
    () => setMobileOpen((prev) => !prev),
    []
  );

  const filteredNav = useMemo(
    () => navItems.filter((item) => user && item.roles.includes(user.role)),
    [user]
  );

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate({ to: "/dashboard" })}>
          <FitnessCenter sx={{ color: "#E8E3D8", fontSize: 26 }} />
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: "#E8E3D8",
                fontFamily: '"Anton", sans-serif',
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                fontSize: "1.05rem",
              }}
            >
              FitSphere
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: '"Inter", sans-serif',
                color: "#6B6F6C",
              }}
            >
              Gym Management OS
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#2A2D2B" }} />
      <List sx={{ flex: 1, py: 0.5, px: 1 }}>
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.15 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                sx={{
                  borderRadius: 1.5,
                  py: 0.9,
                  px: 1.5,
                  ...(isActive
                    ? {
                        bgcolor: "rgba(255,255,255,0.04)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                      }
                    : {
                        "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                      }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: isActive ? "#E8E3D8" : "#6B6F6C",
                    "& .MuiSvgIcon-root": { fontSize: 18 },
                    transition: "color 120ms ease-out",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontFamily: '"Inter", sans-serif',
                        fontSize: "0.82rem",
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#E8E3D8" : "#6B6F6C",
                        transition: "color 120ms ease-out",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: "#2A2D2B" }} />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: "#2A2D2B", fontSize: 11, fontWeight: 600, border: "1px solid rgba(107,111,108,0.15)" }}>
          {user?.first_name?.[0]?.toUpperCase() || "U"}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.75rem", color: "#E8E3D8", fontFamily: '"Inter", sans-serif', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.62rem", textTransform: "capitalize", fontFamily: '"Inter", sans-serif', color: "#6B6F6C" }}>
            {user?.role?.replace("_", " ")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "#0B0D0C",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" }, color: "#6B6F6C" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {user?.role === "super_admin"
              ? "Platform Administration"
              : ""}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#2A2D2B", fontWeight: 600, fontSize: 11, border: "1px solid rgba(107,111,108,0.15)" }}>
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  border: "1px solid #2A2D2B",
                  backgroundColor: "#1A1D1B",
                },
              },
            }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                  {user?.role?.replace("_", " ")}
                </Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ borderColor: "#2A2D2B" }} />
            <MenuItem onClick={() => { logout(); navigate({ to: "/" }); }} sx={{ color: "#FF4B3E" }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: "#FF4B3E" }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "1px solid #2A2D2B", backgroundColor: "#0B0D0C" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
