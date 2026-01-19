"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, Loader2, ImageIcon, Calendar, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  cover_image: string | null;
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, is_published, created_at, cover_image")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No posts yet</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/posts/new">Create your first post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/posts/${post.slug || 'edit'}`} // Go to edit page
              className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              {/* Cover Image Area */}
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                    <ImageIcon className="h-10 w-10 opacity-20" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                   <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm backdrop-blur-md ${
                        post.is_published
                          ? "bg-green-500/90 text-white"
                          : "bg-yellow-500/90 text-white"
                      }`}
                    >
                      {post.is_published ? "Published" : "Draft"}
                    </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-col flex-1 p-5">
                 <h3 className="font-semibold text-lg leading-tight tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title || "Untitled Post"}
                </h3>
                
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
