import { Base } from "../_includes/components/Base.tsx";
import { BlogTags, formatPostDate, isoDate } from "../_includes/components/BlogTags.tsx";
import { Footer } from "../_includes/components/Footer.tsx";
import type { EleventyData } from "../_includes/types.ts";

export default function Blog({ collections }: EleventyData) {
    const posts = collections.posts;
    const tags = [...new Set(posts.flatMap((post) => post.data.tags ?? []))].sort((a, b) => a.localeCompare(b));

    return (
        <Base
            title="Blog | Harmonic Fusion"
            description="Notes from Harmonic Fusion — community, teaching, and the Thursday dance in Eugene."
            stylesheets={["/site.css", "/blog/blog.css"]}
            nav={{ current: "blog" }}
            scripts={["blog"]}
        >
            <div className="container">
                <header className="page-header">
                    <h1>Blog</h1>
                    <p className="lede">Notes from the floor — community, teaching, and the Thursday dance.</p>
                </header>

                <div className="tag-filters" id="blog-filters" role="group" aria-label="Filter by tag">
                    {["", ...tags].map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={tag ? "tag-filter" : "tag-filter is-active"}
                            data-tag={tag}
                            aria-pressed={tag ? "false" : "true"}
                        >
                            {tag || "All"}
                        </button>
                    ))}
                </div>
                <p className="blog-status" id="blog-empty" hidden={posts.length > 0}>
                    No posts yet.
                </p>
                <ul className="blog-list" id="blog-list">
                    {posts.map((post) => (
                        <li key={post.url} data-tags={JSON.stringify(post.data.tags ?? [])}>
                            <article className="blog-card">
                                <a className="blog-card-link" href={post.url}>
                                    <h2>{post.data.title}</h2>
                                    <p className="blog-card-excerpt">{post.data.excerpt ?? ""}</p>
                                </a>
                                <div className="blog-card-meta">
                                    <p className="blog-card-date">
                                        <time dateTime={isoDate(post.date)}>{formatPostDate(post.date)}</time>
                                    </p>
                                    <BlogTags tags={post.data.tags} />
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>

                <Footer />
            </div>
        </Base>
    );
}
