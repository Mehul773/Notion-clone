import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    // Required by @excalidraw/excalidraw when bundling with Vite.
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
