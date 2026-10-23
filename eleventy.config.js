import "tsx/esm";
import { renderToStaticMarkup } from "react-dom/server";

// /calendar/{eventId} → calendar/event.html (shareable event pages). Production
// uses nginx (nginx.conf) or the 404.html fallback on GitHub Pages.
const EVENT_PATH_RE = /^\/calendar\/([^/.]+)\/?(\?.*)?$/;

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
