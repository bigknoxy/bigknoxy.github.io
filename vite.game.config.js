import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false, // Don't copy public dir assets
  build: {
    lib: {
      entry: "./src/game/index.js",
      name: "GameEngine",
      fileName: "game-engine",
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
      output: {
        dir: "./dist/game",
        entryFileNames: "game-engine.js", // Fixed filename for predictable URL
      },
    },
  },
});
