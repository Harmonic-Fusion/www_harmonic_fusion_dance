import { Base } from "../components/Base.tsx";
import { BlogTags, formatPostDate, isoDate } from "../components/BlogTags.tsx";
import { Comments } from "../components/Comments.tsx";
import { Footer } from "../components/Footer.tsx";
import type { CollectionItem, EleventyData, PostData } from "../types.ts";

function PagerLink({ post, rel, label }: { post?: CollectionItem; rel: "prev" | "next"; label: string }) {
    if (!post) return null;
    return (
        <a className={`post-pager-link post-pager-${rel}`} rel={rel} href={post.url}>
            <span className="post-pager-label">{label}</span>
            <span className="post-pager-title">{post.data.title}</span>
        </a>
    );
}

export default function Post(data: EleventyData & PostData) {
    const posts = data.collections.posts;
    const index = posts.findIndex((post) => post.url === data.page.url);
    // Posts are sorted newest first, so the previous (older) post comes after this one.
    const older = posts[index + 1];
    const newer = index > 0 ? posts[index - 1] : undefined;

    return (
        <Base
            title={`${data.title} | Harmonic Fusion`}
            description={data.excerpt || "A post from the Harmonic Fusion blog."}
            stylesheets={["/site.css", "/blog/blog.css"]}
            nav={{ current: "blog" }}
            scripts={["blog-post"]}
        >
            <div className="container">
                <p className="blog-back">
                    <a href="/blog/">← Back to blog</a>
                </p>

                <article id="post-content" data-slug={data.slug} data-title={data.title}>
                    <header className="blog-post-header">
                        <h1>{data.title}</h1>
                        <div className="blog-post-meta">
                            <span className="blog-post-author">Harmonic Fusion</span>
                            <time dateTime={isoDate(data.page.date)}>{formatPostDate(data.page.date)}</time>
                            <BlogTags tags={data.tags} />
                        </div>
                    </header>
                    <div className="blog-article" dangerouslySetInnerHTML={{ __html: data.content ?? "" }} />
                    {(older || newer) && (
                        <nav className="post-pager" aria-label="More posts">
                            <PagerLink post={older} rel="prev" label="Previous" />
                            <PagerLink post={newer} rel="next" label="Next" />
                        </nav>
                    )}

                    <Comments />
                </article>

                <Footer />
            </div>
        </Base>
    );
}
