import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { execSync } from "node:child_process";

// Shared settings
/** @type {import('esbuild').BuildOptions} */
const baseConfig = {
  entryPoints: ["plugin/index.ts"],
  bundle: true,
  minify: false,
  sourcemap: false,
  platform: "node",
  plugins: [nodeExternalsPlugin()],
  tsconfig: "./tsconfig.json",
};

// Build ESM version
async function buildESM() {
  await esbuild.build({
    ...baseConfig,
    outfile: "dist/index.mjs",
    format: "esm",
  });
  console.log("ESM build complete");
}

// Build CJS version
async function buildCJS() {
  await esbuild.build({
    ...baseConfig,
    outfile: "dist/index.js",
    format: "cjs",
  });
  console.log("CJS build complete");
}

// Generate type definitions
async function generateTypes() {
  execSync("tsc --emitDeclarationOnly --declaration --outDir dist/types");
  console.log("Type definitions generated");
}

// Run all builds
Promise.all([buildESM(), buildCJS()])
  .then(() => generateTypes())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
