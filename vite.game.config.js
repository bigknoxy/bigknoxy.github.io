import { defineConfig } from "vite";

export default defineConfig({
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
      },
    },
  },
});
