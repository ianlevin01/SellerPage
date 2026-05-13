import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: true,
    proxy: {
      "/seller":   { target: "http://localhost:3000", changeOrigin: true },
      "/store":    { target: "http://localhost:3000", changeOrigin: true },
      "/consumer": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
