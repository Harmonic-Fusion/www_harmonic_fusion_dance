import "tsx/esm";
import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

// /calendar/{eventId} → calendar/event.html (shareable event pages). Production
// uses nginx (nginx.conf) or the 404.html fallback on GitHub Pages.
const EVENT_PATH_RE = /^\/calendar\/([^/.]+)\/?(\?.*)?$/;

/** True when the output dir can hold both Foo/ and foo/ (Linux / GitHub Pages). */
function isCaseSensitiveDir(dir) {
    const probe = join(dir, `.case-probe-${process.pid}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${probe}-A`, "");
    try {
        return !existsSync(`${probe}-a`);
    } finally {
        rmSync(`${probe}-A`, { force: true });
        rmSync(`${probe}-a`, { force: true });
    }
}

function findAliasFiles(root) {
    const found = [];
    const walk = (dir) => {
        for (const ent of readdirSync(dir, { withFileTypes: true })) {
            if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
            const path = join(dir, ent.name);
            if (ent.isDirectory()) walk(path);
        }
        const aliases = join(dir, ".aliases");
        if (existsSync(aliases)) found.push(aliases);
    };
    walk(root);
    return found;
}

function readAliases(file) {
    return readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
}

/** Safe site-relative alias path (no absolute / traversal). */
function aliasOutputPath(outputRoot, alias) {
    const cleaned = alias.replace(/^\/+/, "").replaceAll("\\", "/");
    if (!cleaned || cleaned.split("/").some((part) => part === "" || part === "." || part === "..")) {
        return null;
    }
    const dest = resolve(outputRoot, cleaned);
    if (dest !== outputRoot && !dest.startsWith(outputRoot + sep)) return null;
    return dest;
}

function mirrorDirectoryAliases(inputRoot, outputRoot) {
    const caseSensitive = isCaseSensitiveDir(outputRoot);
    for (const aliasesFile of findAliasFiles(inputRoot)) {
        const relDir = relative(inputRoot, dirname(aliasesFile));
        const src = join(outputRoot, relDir);
        if (!existsSync(src)) continue;

        for (const alias of readAliases(aliasesFile)) {
            if (!caseSensitive && alias.toLowerCase() === relDir.toLowerCase()) continue;
            const dest = aliasOutputPath(outputRoot, alias);
            if (!dest || dest === resolve(src)) continue;
            rmSync(dest, { recursive: true, force: true });
            cpSync(src, dest, { recursive: true });
        }
    }
}

export default function (eleventyConfig) {
    // TSX templates are rendered to static HTML at build time. No React ships to the browser.
    eleventyConfig.addExtension(["11ty.tsx"], {
        key: "11ty.js",
        compile() {
            return async function (data) {
                const content = await this.defaultRenderer(data);
                const html = typeof content === "string" ? content : renderToStaticMarkup(content);
                return html.startsWith("<html") ? `<!DOCTYPE html>${html}` : html;
            };
        },
    });
    eleventyConfig.addTemplateFormats("11ty.tsx");

    eleventyConfig.addPassthroughCopy({
        "src/images": "images",
        "src/icons": "icons",
        "src/favicon.ico": "favicon.ico",
        "src/logo.png": "logo.png",
        "src/manifest.json": "manifest.json",
        "src/CNAME": "CNAME",
        "src/robots.txt": "robots.txt",
    });
    eleventyConfig.addPassthroughCopy("src/**/*.css");

    // Browser TypeScript is bundled by esbuild (scripts/build-js.mjs) into _site/js.
    eleventyConfig.watchIgnores.add("src/scripts/**");

    eleventyConfig.addCollection("posts", (collectionApi) =>
        collectionApi
            .getFilteredByGlob("src/blog/posts/*.md")
            .filter((post) => !post.data.draft)
            .sort((a, b) => b.date - a.date || a.fileSlug.localeCompare(b.fileSlug))
    );

    // Directories with a `.aliases` file are mirrored to each listed path (GitHub Pages
    // is case-sensitive). Case-only aliases are skipped on case-insensitive volumes.
    eleventyConfig.on("eleventy.after", ({ dir }) => {
        mirrorDirectoryAliases(dir.input, dir.output);
    });

    eleventyConfig.setServerOptions({
        port: 8747,
        watch: ["_site/js/**/*.js"],
        middleware: [
            (req, _res, next) => {
                const match = req.url.match(EVENT_PATH_RE);
                if (match && match[1] !== "index") req.url = "/calendar/event.html";
                const path = req.url.split("?")[0];
                if (path === "/success" || path === "/success/") req.url = "/success.html";
                next();
            },
        ],
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data",
        },
        markdownTemplateEngine: false,
        htmlTemplateEngine: false,
    };
}
