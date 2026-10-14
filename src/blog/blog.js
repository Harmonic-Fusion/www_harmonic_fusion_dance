(function () {
    'use strict';

    const CATALOG_URL = '/blog/posts.json';
    const RESERVED = new Set([
        'index.html',
        'post.html',
        'blog.js',
        'blog.css',
        'posts.json',
        'posts'
    ]);

    const listEl = document.getElementById('blog-list');
    const articleEl = document.getElementById('post-body');

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(iso) {
        const parts = String(iso).split('-').map(Number);
        if (parts.length !== 3 || parts.some((n) => !n)) return iso;
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function sortNewest(posts) {
        return posts.slice().sort((a, b) => {
            if (a.date === b.date) return 0;
            return a.date < b.date ? 1 : -1;
        });
    }

    async function loadCatalog() {
        const res = await fetch(CATALOG_URL);
        if (!res.ok) throw new Error('Could not load posts');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Post catalog is not a list');
        return sortNewest(data);
    }

    function currentTag() {
        return new URLSearchParams(window.location.search).get('tag') || '';
    }

    function setTag(tag) {
        const url = new URL(window.location.href);
        if (tag) url.searchParams.set('tag', tag);
        else url.searchParams.delete('tag');
        history.pushState({}, '', url);
    }

    function uniqueTags(posts) {
        const tags = new Set();
        posts.forEach((post) => {
            (post.tags || []).forEach((tag) => {
                if (tag) tags.add(tag);
            });
        });
        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }

    function getSlug() {
        const path = window.location.pathname.replace(/\/+$/, '') || '/';
        const match = path.match(/^\/blog\/([^/]+)$/);
        if (match) {
            const segment = decodeURIComponent(match[1]);
            if (segment && !segment.includes('.') && !RESERVED.has(segment)) {
                return segment;
            }
        }
        return new URLSearchParams(window.location.search).get('slug');
    }

    function configureMarked() {
        if (typeof marked === 'undefined' || typeof marked.use !== 'function') return;
        marked.use({ gfm: true, breaks: false });
    }

    function renderIndex(posts) {
        const filtersEl = document.getElementById('blog-filters');
        const emptyEl = document.getElementById('blog-empty');
        const tag = currentTag();
        const tags = uniqueTags(posts);
        if (tag && !tags.includes(tag)) tags.push(tag);

        const buttons = ['', ...tags].map((value) => {
            const label = value || 'All';
            const active = value === tag;
            return (
                '<button type="button" class="tag-filter' +
                (active ? ' is-active' : '') +
                '" data-tag="' + escapeHtml(value) +
                '" aria-pressed="' + (active ? 'true' : 'false') +
                '">' + escapeHtml(label) + '</button>'
            );
        }).join('');
        filtersEl.innerHTML = buttons;

        const visible = tag
            ? posts.filter((post) => (post.tags || []).includes(tag))
            : posts;

        if (!visible.length) {
            listEl.innerHTML = '';
            emptyEl.hidden = false;
            emptyEl.textContent = tag
                ? 'No posts tagged “' + tag + '”.'
                : 'No posts yet.';
            return;
        }

        emptyEl.hidden = true;
        listEl.innerHTML = visible.map((post) => {
            const tagLinks = (post.tags || []).map((item) => {
                return (
                    '<li><a href="/blog/?tag=' + encodeURIComponent(item) +
                    '">' + escapeHtml(item) + '</a></li>'
                );
            }).join('');
            return (
                '<li><article class="blog-card">' +
                '<a class="blog-card-link" href="/blog/' + encodeURIComponent(post.slug) + '">' +
                '<p class="blog-card-date"><time datetime="' + escapeHtml(post.date) +
                '">' + escapeHtml(formatDate(post.date)) + '</time></p>' +
                '<h2>' + escapeHtml(post.title) + '</h2>' +
                '<p class="blog-card-excerpt">' + escapeHtml(post.excerpt || '') + '</p>' +
                '</a>' +
                (tagLinks ? '<ul class="blog-card-tags">' + tagLinks + '</ul>' : '') +
                '</article></li>'
            );
        }).join('');
    }

    async function initIndex() {
        const loadingEl = document.getElementById('blog-loading');
        const emptyEl = document.getElementById('blog-empty');
        const filtersEl = document.getElementById('blog-filters');
        let posts = [];

        try {
            posts = await loadCatalog();
        } catch (err) {
            loadingEl.hidden = true;
            emptyEl.hidden = false;
            emptyEl.textContent = 'Could not load posts.';
            return;
        }

        loadingEl.hidden = true;
        renderIndex(posts);

        filtersEl.addEventListener('click', (event) => {
            const button = event.target.closest('.tag-filter');
            if (!button) return;
            setTag(button.getAttribute('data-tag') || '');
            renderIndex(posts);
        });

        window.addEventListener('popstate', () => renderIndex(posts));
    }

    async function initPost() {
        const loadingEl = document.getElementById('post-loading');
        const errorEl = document.getElementById('post-error');
        const contentEl = document.getElementById('post-content');
        const titleEl = document.getElementById('post-title');
        const dateEl = document.getElementById('post-date');
        const tagsEl = document.getElementById('post-tags');
        const slug = getSlug();

        function fail(message) {
            loadingEl.hidden = true;
            contentEl.hidden = true;
            errorEl.hidden = false;
            errorEl.textContent = message;
        }

        if (!slug) {
            fail('Post not found.');
            return;
        }

        let catalog;
        try {
            catalog = await loadCatalog();
        } catch (err) {
            fail('Could not load this post.');
            return;
        }

        const post = catalog.find((item) => item.slug === slug);
        if (!post) {
            fail('Post not found.');
            return;
        }

        let markdown;
        try {
            const res = await fetch('/blog/posts/' + encodeURIComponent(slug) + '.md');
            if (!res.ok) throw new Error('Missing post file');
            markdown = await res.text();
        } catch (err) {
            fail('Post not found.');
            return;
        }

        configureMarked();
        titleEl.textContent = post.title;
        document.title = post.title + ' | Harmonic Fusion';
        dateEl.dateTime = post.date;
        dateEl.textContent = formatDate(post.date);
        tagsEl.innerHTML = (post.tags || []).map((tag) => {
            return (
                '<li><a href="/blog/?tag=' + encodeURIComponent(tag) +
                '">' + escapeHtml(tag) + '</a></li>'
            );
        }).join('');

        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            articleEl.innerHTML = marked.parse(markdown);
        } else {
            articleEl.textContent = markdown;
        }

        const index = catalog.findIndex((item) => item.slug === slug);
        const hasPrev = setPagerLink(
            document.getElementById('post-prev'),
            document.getElementById('post-prev-title'),
            catalog[index + 1]
        );
        const hasNext = setPagerLink(
            document.getElementById('post-next'),
            document.getElementById('post-next-title'),
            catalog[index - 1]
        );
        const pager = document.getElementById('post-pager');
        if (pager) pager.hidden = !hasPrev && !hasNext;

        loadingEl.hidden = true;
        contentEl.hidden = false;

        if (typeof window.initRemark === 'function') {
            var path = window.location.pathname.replace(/\/index\.html$/, '');
            if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
            window.initRemark({
                url: window.location.origin + path,
                page_title: post.title
            });
        }
    }

    function setPagerLink(link, titleNode, neighbor) {
        if (!link || !titleNode) return false;
        if (!neighbor) {
            link.hidden = true;
            return false;
        }
        link.hidden = false;
        link.href = '/blog/' + encodeURIComponent(neighbor.slug);
        titleNode.textContent = neighbor.title;
        return true;
    }

    if (listEl) initIndex();
    else if (articleEl) initPost();
})();
