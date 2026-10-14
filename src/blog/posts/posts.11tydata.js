import path from "node:path";

const slugOf = (data) => path.basename(data.page.inputPath, ".md");

// Each post is published at /blog/{filename}/. Don't use page.fileSlug: Eleventy
// strips date prefixes, so 2026-10-13-history.md would become /blog/history/.
export default {
    layout: "layouts/post.11ty.tsx",
    eleventyComputed: {
        slug: slugOf,
        permalink: (data) => (data.draft ? false : `/blog/${slugOf(data)}/`),
    },
};
