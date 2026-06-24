import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
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
import BusinessIcon from "@mui/icons-material/Business";
import {
  AccountBalance,
  Dashboard,
  EventNote,
  Group,
  Logout,
  Menu as MenuIcon,
  MonetizationOn,
  Notifications,
  People,
  Receipt,
  TrackChanges,
} from "@mui/icons-material";
import { useCallback, useState } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";

const drawerWidth = 270;

const navItems = [
  { label: "Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ["gym_owner", "super_admin", "receptionist", "trainer"] },
  { label: "Branches", icon: <BusinessIcon />, path: "/gyms", roles: ["gym_owner", "super_admin", "receptionist"] },
  { label: "Members", icon: <People />, path: "/members", roles: ["gym_owner", "super_admin", "receptionist"] },
  { label: "Trainers", icon: <Group />, path: "/trainers", roles: ["gym_owner", "super_admin"] },
  { label: "Membership Plans", icon: <AccountBalance />, path: "/memberships", roles: ["gym_owner", "super_admin"] },
  { label: "Attendance", icon: <TrackChanges />, path: "/attendance", roles: ["gym_owner", "super_admin", "receptionist", "member"] },
  { label: "PT Sessions", icon: <FitnessCenterIcon />, path: "/pt-sessions", roles: ["gym_owner", "super_admin", "trainer"] },
  { label: "Payments", icon: <MonetizationOn />, path: "/payments", roles: ["gym_owner", "super_admin", "receptionist"] },
  { label: "Analytics", icon: <EventNote />, path: "/analytics", roles: ["gym_owner", "super_admin"] },
  { label: "Notifications", icon: <Notifications />, path: "/notifications", roles: ["gym_owner", "super_admin"] },
  { label: "Billing", icon: <Receipt />, path: "/billing", roles: ["super_admin"] },
  { label: "Audit Logs", icon: <Receipt />, path: "/audit", roles: ["gym_owner", "super_admin"] },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleDrawerToggle = useCallback(
    () => setMobileOpen((prev) => !prev),
    []
  );

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2 }}>
        <FitnessCenterIcon sx={{ color: "#FF6D00", fontSize: 32 }} />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FitSphere
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Gym Management OS
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#2A2A2A" }} />
      <List sx={{ flex: 1, py: 1 }}>
        {filteredNav.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
              sx={{
                "&.Mui-selected": {
                  borderRight: "3px solid #FF6D00",
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname.startsWith(item.path) ? "#FF6D00" : "#666" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "0.875rem",
                      fontWeight: location.pathname.startsWith(item.path) ? 700 : 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: "#2A2A2A" }} />
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: "#FF6D00", fontWeight: 700, fontSize: 14 }}>
          {user?.first_name?.[0]?.toUpperCase() || "U"}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "capitalize" }}>
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
          backgroundColor: "#0F0F0F",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {user?.role === "super_admin"
              ? "Platform Administration"
              : ""}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: "#FF6D00", fontWeight: 700, fontSize: 13 }}>
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
                  border: "1px solid #2A2A2A",
                  backgroundColor: "#141414",
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
            <Divider sx={{ borderColor: "#2A2A2A" }} />
            <MenuItem onClick={logout} sx={{ color: "#FF1744" }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: "#FF1744" }} />
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
          backgroundColor: "#0A0A0A",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
