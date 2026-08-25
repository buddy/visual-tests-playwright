import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

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
    outfile: "dist/index.cjs",
    format: "cjs",
  });
  console.log("CJS build complete");
}

function generateTypes() {
  const typesDir = "dist/types";
  execSync(`tsc --emitDeclarationOnly --declaration --outDir ${typesDir}`, {
    stdio: "inherit",
  });

  const variants = [
    { specifierExtension: ".mjs", declarationExtension: ".d.mts" },
    { specifierExtension: ".cjs", declarationExtension: ".d.cts" },
  ];
  const relativeSpecifier = /"(\.\.?\/[^"]+)"/g;

  for (const file of readdirSync(typesDir, { recursive: true })) {
    if (!file.endsWith(".d.ts")) continue;
    const source = readFileSync(path.join(typesDir, file), "utf8");
    const baseName = file.slice(0, -".d.ts".length);
    for (const { specifierExtension, declarationExtension } of variants) {
      const rewritten = source.replace(relativeSpecifier, (match, specifier) =>
        path.extname(specifier) === "" ? `"${specifier}${specifierExtension}"` : match,
      );
      writeFileSync(path.join(typesDir, `${baseName}${declarationExtension}`), rewritten);
    }
    unlinkSync(path.join(typesDir, file));
  }
  console.log("Type definitions generated (dist/types/*.d.mts, *.d.cts)");
}

rmSync("dist", { recursive: true, force: true });

Promise.all([buildESM(), buildCJS()])
  .then(() => generateTypes())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
