import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./features/auth/AuthProvider";
import { routeTree } from "./routeTree";
import gymTheme from "./theme/gymTheme";
import AtmosphereLayer from "./components/AtmosphereLayer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={gymTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ParticlesProvider init={loadSlim}>
            <AtmosphereLayer />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Suspense fallback={<Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>}>
                <RouterProvider router={router} />
              </Suspense>
            </Box>
          </ParticlesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
