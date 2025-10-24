import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { githubPagesSpa } from "@sctg/vite-plugin-github-pages-spa";

export default defineConfig({
  base: "/org-everywhere/",
  plugins: [
    react({ jsxRuntime: "classic" }),
    nodePolyfills(),
    githubPagesSpa({verbose: true})
  ],
  build: {
    rollupOptions: {
      external: ["**/*.{unit, browser, integration}.test.ts[x]"],
    },
  },
});
