# Agent instructions

## Adding a blog post

The blog is static. Do not edit HTML for each post. The landing page at `/blog/` reads [`src/blog/posts.json`](src/blog/posts.json) and each post body lives in [`src/blog/posts/`](src/blog/posts/).

1. Create `src/blog/posts/{slug}.md`.
   - Use a lowercase, hyphenated slug, such as `thursday-floorcraft`.
   - Write the post body in markdown. Do not add frontmatter. Title, date, tags, and excerpt belong in the catalog.
2. Append one object to `src/blog/posts.json`:

```json
{
  "slug": "thursday-floorcraft",
  "title": "Thursday floorcraft",
  "date": "2026-10-13",
  "tags": ["community"],
  "excerpt": "One or two sentences shown on the blog landing page."
}
```

- Keep `slug` identical to the filename without `.md`.
- Use `YYYY-MM-DD` for `date`. The landing page sorts newest first.
- Reuse an existing tag when it fits. A new tag shows up as a filter button on its own.
- Put images under `src/images/` and reference them with root-absolute paths, for example `![Dancers](/images/eugene/web/DSC_7336.jpg)`.

The post is then available at `/blog/{slug}`.
