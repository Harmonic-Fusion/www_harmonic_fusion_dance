import { initRemark } from "../lib/config.ts";
import { initNav } from "../lib/nav.ts";

initNav();

// Comment threads are keyed by /blog/{slug} without a trailing slash.
const article = document.getElementById("post-content");
if (article?.dataset.slug) {
    initRemark({
        url: window.location.origin + "/blog/" + article.dataset.slug,
        page_title: article.dataset.title,
    });
}
