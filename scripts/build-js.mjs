// Bundles browser TypeScript: each file in src/scripts/pages/ becomes _site/js/{name}.js.
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
    entryPoints: ["src/scripts/pages/*.ts"],
    outdir: "_site/js",
    bundle: true,
    format: "iife",
    target: "es2020",
    minify: !watch,
    sourcemap: watch,
    logLevel: "info",
};

if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
} else {
    await esbuild.build(options);
}
