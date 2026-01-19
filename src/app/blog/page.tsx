import type { Metadata } from "next";

import { SectionHeader } from "@/components/section-header";
import { PostItem } from "@/features/blog/components/post-item";
import { getAllPosts } from "@/features/blog/data/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "A collection of articles on AI, customer engagement, and business insights.",
};

import { getAllPostsFromDB } from "@/features/blog/data/supabase-posts";

export default async function BlogPage() {
  const filePosts = getAllPosts();
  const dbPosts = await getAllPostsFromDB();

  // Combine posts, prioritizing DB posts if slug conflicts
  const allPostsMap = new Map();
  
  [...filePosts, ...dbPosts].forEach(post => {
    allPostsMap.set(post.slug, post);
  });

  const allPosts = Array.from(allPostsMap.values()).sort((a, b) => {
    return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
  });

  return (
    <section className="flex flex-col items-center w-full z-0 relative">
      {/* Header Container */}
      <div className="mx-5 md:mx-10 px-5 md:px-10 relative w-full">
        <SectionHeader className="border-b-0 relative z-10">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            Blog
          </h1>
          <p className="text-muted-foreground text-center text-balance font-medium">
            {metadata.description as string}
          </p>
        </SectionHeader>
      </div>

      {/* Full-width divider line like footer */}
      <div className="w-full h-px bg-border" />

      {/* Blog Grid Container */}
      <div className="mx-5 md:mx-10 px-5 md:px-10 relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post, index) => (
            <div
              key={post.slug}
              className="relative p-3"
            >
              <PostItem
                post={post}
                shouldPreloadImage={index <= 4}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
