import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

const templateRoot = path.resolve(import.meta.dirname);

const alias = {
  "@": path.resolve(templateRoot, "client", "src"),
  "@shared": path.resolve(templateRoot, "shared"),
  "@assets": path.resolve(templateRoot, "attached_assets"),
};

export default defineConfig({
  root: templateRoot,
  resolve: { alias },
  plugins: [react()],
  test: {
    environment: "node",
    environmentMatchGlobs: [["client/**", "jsdom"]],
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.ts", "client/**/*.test.tsx"],
    setupFiles: ["./client/src/test/setup.ts"],
  },
});
