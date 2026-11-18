import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { localImageUploadPlugin } from "./scripts/localImageUploadPlugin";

export default defineConfig({
  plugins: [react(), localImageUploadPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
