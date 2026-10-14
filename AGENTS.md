# Agent instructions

## Adding a blog post

Blog posts are markdown files. Eleventy renders each one with [`src/_includes/layouts/post.11ty.tsx`](src/_includes/layouts/post.11ty.tsx) and lists it on `/blog/`. Do not edit templates for each post.

1. Create `src/blog/posts/{slug}.md`.
   - Use a lowercase, hyphenated slug, such as `thursday-floorcraft`. The filename is the URL.
   - Start the file with frontmatter, then write the post body in markdown:

```markdown
---
title: "Thursday floorcraft"
date: 2026-10-13
tags: ["community"]
excerpt: "One or two sentences shown on the blog landing page."
---

The post body starts here.
```

- Use `YYYY-MM-DD` for `date`. The landing page sorts newest first.
- Reuse an existing tag when it fits. A new tag shows up as a filter button on its own.
- Add `draft: true` to keep a post out of the build.
- Put images under `src/images/` and reference them with root-absolute paths, for example `![Dancers](/images/eugene/web/DSC_7336.jpg)`.

The post is then available at `/blog/{slug}/`. Run `pnpm build` to check it renders.
