// Blog landing page: filter the prerendered post list by ?tag=.
import { initNav } from "../lib/nav.ts";

initNav();

const filtersEl = document.getElementById("blog-filters");
const listEl = document.getElementById("blog-list");
const emptyEl = document.getElementById("blog-empty");

function currentTag(): string {
    return new URLSearchParams(window.location.search).get("tag") || "";
}

function setTag(tag: string) {
    const url = new URL(window.location.href);
    if (tag) url.searchParams.set("tag", tag);
    else url.searchParams.delete("tag");
    history.pushState({}, "", url);
}

function filterButton(tag: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-filter";
    button.dataset.tag = tag;
    button.textContent = tag;
    return button;
}

function render() {
    if (!filtersEl || !listEl || !emptyEl) return;
    const tag = currentTag();

    // A linked tag with no posts still gets a button so the active filter is visible.
    const buttons = Array.from(filtersEl.querySelectorAll<HTMLButtonElement>(".tag-filter"));
    if (tag && !buttons.some((button) => button.dataset.tag === tag)) {
        filtersEl.appendChild(filterButton(tag));
    }
    filtersEl.querySelectorAll<HTMLButtonElement>(".tag-filter").forEach((button) => {
        const active = (button.dataset.tag || "") === tag;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const items = Array.from(listEl.querySelectorAll<HTMLLIElement>(":scope > li"));
    let visible = 0;
    items.forEach((item) => {
        const tags: string[] = JSON.parse(item.dataset.tags || "[]");
        const show = !tag || tags.includes(tag);
        item.hidden = !show;
        if (show) visible += 1;
    });

    emptyEl.hidden = visible > 0;
    emptyEl.textContent = tag ? "No posts tagged “" + tag + "”." : "No posts yet.";
}

if (filtersEl) {
    filtersEl.addEventListener("click", (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(".tag-filter");
        if (!button) return;
        setTag(button.dataset.tag || "");
        render();
    });
    window.addEventListener("popstate", render);
    render();
}
