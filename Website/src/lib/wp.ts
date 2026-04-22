const WP_BASE =
  "https://public-api.wordpress.com/wp/v2/sites/thelionsalliance.wordpress.com";

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_image_url?: string;
  tags?: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      media_details?: {
        sizes?: {
          medium_large?: { source_url: string };
          large?: { source_url: string };
          full?: { source_url: string };
        };
      };
    }>;
    "wp:term"?: Array<Array<{ name: string }>>;
  };
}

function extractFeaturedImage(post: WPPost): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return post.featured_image_url;
  const sizes = media.media_details?.sizes;
  return sizes?.large?.source_url
    ?? sizes?.medium_large?.source_url
    ?? sizes?.full?.source_url
    ?? media.source_url;
}

function extractTags(post: WPPost): string[] {
  const terms = post._embedded?.["wp:term"];
  if (!terms) return [];
  // wp:term[0] = categories, wp:term[1] = tags
  return (terms[1] ?? []).map((t) => t.name);
}

export interface WPPostEnriched extends WPPost {
  featuredImage?: string;
  tagNames: string[];
  lang: "nl" | "en";
  langLabel: string;
}

const DUTCH_MARKERS = /\b(een|het|van|voor|niet|zijn|maar|ook|deze|wordt|hebben|meer|naar|omdat|zoals|mijn|weer|kunnen|andere|eigenlijk)\b/gi;

function detectLanguage(html: string): "nl" | "en" {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const sample = text.slice(0, 2000);
  const matches = sample.match(DUTCH_MARKERS);
  return (matches && matches.length >= 8) ? "nl" : "en";
}

function enrichPost(post: WPPost): WPPostEnriched {
  const lang = detectLanguage(post.content.rendered);
  return {
    ...post,
    featuredImage: extractFeaturedImage(post),
    tagNames: extractTags(post),
    lang,
    langLabel: lang === "nl" ? "🇳🇱 Nederlands" : "🇬🇧 English",
  };
}

export async function getPosts(limit = 10): Promise<WPPostEnriched[]> {
  const url = `${WP_BASE}/posts?per_page=${limit}&_embed&_fields=slug,title,excerpt,date,content,id,featured_media,tags,_embedded,featured_image_url`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to fetch posts", res.status, await res.text());
    throw new Error("Failed to fetch posts from WordPress");
  }

  const posts: WPPost[] = await res.json();
  return posts.map(enrichPost);
}

export async function getPostBySlug(slug: string): Promise<WPPostEnriched | null> {
  const url = `${WP_BASE}/posts?slug=${slug}&_embed&_fields=slug,title,excerpt,date,content,id,featured_media,tags,_embedded,featured_image_url`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to fetch post", res.status, await res.text());
    throw new Error("Failed to fetch post from WordPress");
  }

  const data: WPPost[] = await res.json();
  if (!data[0]) return null;
  return enrichPost(data[0]);
}
