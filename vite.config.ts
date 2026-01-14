import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "RiichiMahjong",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: false,
  },
});
