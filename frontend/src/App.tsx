import { Navigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#FF6D00",
          fontFamily: "Inter, sans-serif",
          fontSize: "1.2rem",
          fontWeight: 700,
        }}
      >
        Loading...
      </div>
    );
  }

  if (isAuthenticated && router.state.location.pathname === "/") {
    return <Navigate to="/dashboard" />;
  }

  return null;
}
