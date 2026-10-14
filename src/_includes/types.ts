// The subset of Eleventy's template data these templates use.
export interface PostData {
    title: string;
    tags?: string[];
    excerpt?: string;
    slug: string;
}

export interface CollectionItem<T = PostData> {
    url: string;
    date: Date;
    data: T;
}

export interface EleventyData {
    page: { url: string; date: Date; inputPath: string };
    collections: { posts: CollectionItem[] };
    content?: string;
}
