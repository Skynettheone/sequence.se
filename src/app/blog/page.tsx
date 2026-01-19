import type { Metadata } from "next";

import { SectionHeader } from "@/components/section-header";
import { PostItem } from "@/features/blog/components/post-item";
import { getAllPosts } from "@/features/blog/data/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "A collection of articles on AI, customer engagement, and business insights.",
};

export default function BlogPage() {
  const allPosts = getAllPosts();

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
              className={`relative p-3 before:absolute before:hidden md:before:block before:left-0 before:top-6 before:bottom-6 before:z-10 before:w-px before:bg-border before:content-[''] after:absolute after:top-0 after:left-6 after:right-6 after:z-10 after:h-px after:bg-border after:content-[''] first:before:hidden first:after:hidden md:[&:nth-child(2)]:after:hidden lg:[&:nth-child(3)]:after:hidden`}
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
