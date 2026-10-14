export function formatPostDate(date: Date): string {
    // Front matter dates are parsed as UTC midnight.
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function BlogTags({ tags, id }: { tags?: string[]; id?: string }) {
    if (!tags?.length) return null;
    return (
        <ul className="blog-card-tags" id={id}>
            {tags.map((tag) => (
                <li key={tag}>
                    <a href={`/blog/?tag=${encodeURIComponent(tag)}`}>{tag}</a>
                </li>
            ))}
        </ul>
    );
}
