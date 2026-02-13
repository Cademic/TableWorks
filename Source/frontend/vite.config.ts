import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          tiptap: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-character-count",
            "@tiptap/extension-color",
            "@tiptap/extension-font-family",
            "@tiptap/extension-text-style",
            "@tiptap/extension-underline",
          ],
          vendor: ["axios", "lucide-react", "react-draggable"],
        },
      },
    },
  },
}));
