import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { BlogPostClient } from "@/features/blog/components/blog-post-client";
import { getAllPosts, getPostBySlug } from "@/features/blog/data/posts";
import {
  getAllPostsFromDB,
  getPostBySlugFromDB,
} from "@/features/blog/data/supabase-posts";

// Try DB first, fallback to file system
async function getPost(slug: string) {
  // First try DB
  const dbPost = await getPostBySlugFromDB(slug);
  if (dbPost) return dbPost;

  // Fallback to file system (for existing MDX posts)
  const filePost = getPostBySlug(slug);
  return filePost || null;
}

async function getAllPostSlugs() {
  const dbPosts = await getAllPostsFromDB();
  const filePosts = getAllPosts();

  // Combine and dedupe
  const slugs = new Set([
    ...dbPosts.map((p) => p.slug),
    ...filePosts.map((p) => p.slug),
  ]);

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateStaticParams() {
  return getAllPostSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await getPost(slug);

  if (!post) {
    return {};
  }

  const { title, description, image } = post.metadata;

  return {
    title: `${title} | Sequence3 Blog`,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage(props: Props) {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <BlogPostClient post={post}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for rich media
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ""}
              className="rounded-xl w-full"
              loading="lazy"
            />
          ),
          a: ({ href, children }) => {
            // YouTube embed detection
            const youtubeMatch = href?.match(
              /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
            );
            if (youtubeMatch) {
              const videoId = youtubeMatch[1];
              return (
                <div className="relative aspect-video w-full my-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video"
                    className="absolute inset-0 w-full h-full rounded-xl"
                    allowFullScreen
                  />
                </div>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          code: ({ className, children, ...props }) => {
            // Simple code block styling
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code
                className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {post.content}
      </ReactMarkdown>
    </BlogPostClient>
  );
}
