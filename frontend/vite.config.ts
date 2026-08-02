import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@mui") || id.includes("@emotion")) return "mui";
          if (id.includes("@tanstack")) return "router";
          if (id.includes("@tsparticles")) return "particles";
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "charts";
          if (id.includes("/motion/") || id.includes("motion-dom")) return "motion";
          if (id.includes("react-dom") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("/react/")) return "react-vendor";
          return "vendor";
        },
      },
    },
  },
})
