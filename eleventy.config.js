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
    const root = resolve(outputRoot);
    const cleaned = alias.replace(/^\/+/, "").replaceAll("\\", "/");
    if (!cleaned || cleaned.split("/").some((part) => part === "" || part === "." || part === "..")) {
        return null;
    }
    const dest = resolve(root, cleaned);
    if (dest !== root && !dest.startsWith(root + sep)) return null;
    return dest;
}

/** alias path → canonical output dir (e.g. bff26 → BFF26). */
function loadAliasMap(inputRoot) {
    /** @type {Map<string, string>} */
    const map = new Map();
    for (const aliasesFile of findAliasFiles(inputRoot)) {
        const canonical = relative(inputRoot, dirname(aliasesFile)).replaceAll("\\", "/");
        for (const alias of readAliases(aliasesFile)) {
            if (!aliasOutputPath("_site", alias)) continue;
            map.set(alias.replaceAll("\\", "/"), canonical);
        }
    }
    return map;
}

function mirrorDirectoryAliases(inputRoot, outputRoot) {
    const caseSensitive = isCaseSensitiveDir(outputRoot);
    for (const [alias, canonical] of loadAliasMap(inputRoot)) {
        const src = resolve(outputRoot, canonical);
        if (!existsSync(src)) continue;

        // Case-insensitive volumes (typical macOS) cannot store BFF26/ and bff26/ as
        // two directories; the local Eleventy server rewrites those aliases instead.
        if (!caseSensitive && alias.toLowerCase() === canonical.toLowerCase()) {
            console.log(`[11ty] Alias /${alias}/ → /${canonical}/ (dev server rewrite)`);
            continue;
        }

        const dest = aliasOutputPath(outputRoot, alias);
        if (!dest || dest === src) continue;
        rmSync(dest, { recursive: true, force: true });
        cpSync(src, dest, { recursive: true });
        console.log(`[11ty] Aliased /${canonical}/ → /${alias}/`);
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Rewrite /.aliases paths to their canonical output dirs for local --serve. */
function aliasRewriteMiddleware(aliasMap) {
    const rules = [...aliasMap.entries()].map(([alias, canonical]) => ({
        re: new RegExp(`^/${escapeRegExp(alias)}(/.*)?$`, "i"),
        canonical,
    }));
    return (req, _res, next) => {
        const q = req.url.indexOf("?");
        const path = q === -1 ? req.url : req.url.slice(0, q);
        const query = q === -1 ? "" : req.url.slice(q);
        for (const { re, canonical } of rules) {
            const match = path.match(re);
            if (!match) continue;
            req.url = `/${canonical}${match[1] || "/"}${query}`;
            break;
        }
        next();
    };
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

    // Directories with a `.aliases` file are mirrored into _site when the filesystem
    // can hold both paths (Linux / GitHub Pages). Local macOS uses server rewrites.
    const aliasMap = loadAliasMap("src");
    eleventyConfig.on("eleventy.after", ({ dir }) => {
        mirrorDirectoryAliases(dir.input, dir.output);
    });

    eleventyConfig.setServerOptions({
        port: 8747,
        watch: ["_site/js/**/*.js"],
        middleware: [
            aliasRewriteMiddleware(aliasMap),
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
