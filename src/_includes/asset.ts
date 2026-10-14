import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Appends a content hash so nginx's long-lived cache headers don't serve stale CSS/JS.
// CSS is hashed from src/, script bundles from _site/js/ (esbuild writes them before 11ty runs).
export function assetUrl(path: string): string {
    const file = path.startsWith("/js/") ? `_site${path}` : `src${path}`;
    try {
        const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
        return `${path}?v=${hash}`;
    } catch {
        return path;
    }
}
