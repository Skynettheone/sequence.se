"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, FileText, ImageIcon, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CoverUpload } from "@/components/cover-upload";
import { supabase } from "@/lib/supabase";

const AUTO_SAVE_DELAY = 3000;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params?.slug as string;

  const [postId, setPostId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [content, setContent] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [coverImage, setCoverImage] = React.useState("");
  const [isPublished, setIsPublished] = React.useState(false);
  
  const [loading, setLoading] = React.useState(true); // Start loading
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  // Fetch Post Data on Mount
  React.useEffect(() => {
    async function fetchPost() {
      if (!slugParam) return;

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slugParam)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
        setError("Post not found");
        setLoading(false);
      } else if (data) {
        setPostId(data.id);
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content || "");
        setExcerpt(data.excerpt || "");
        setCoverImage(data.cover_image || "");
        setIsPublished(data.is_published);
        setLoading(false);
      }
    }

    fetchPost();
  }, [slugParam]);

  // Database Save Logic (Update Only)
  const saveToDb = React.useCallback(async (silent = true) => {
    if (!postId || !title) return;

    try {
      if (!silent) setIsSaving(true);
      
      const postData = {
        title,
        slug,
        content,
        excerpt,
        cover_image: coverImage,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", postId);
        
      if (error) throw error;

      setLastSaved(new Date());
    } catch (err: any) {
      console.error("Auto-save failed:", err);
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [postId, title, slug, content, excerpt, coverImage, isPublished]);

  // Auto-Save Effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-save if we have leaded the post and have a valid ID
      if (postId && !loading) { 
        saveToDb(true);
      }
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [title, slug, content, excerpt, coverImage, isPublished, saveToDb, postId, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveToDb(false);
    router.refresh();
    router.push("/dashboard");
  };

    const handleSaveAndExit = async () => {
    await saveToDb(false);
    router.refresh();
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex pl-6 pt-6 flex-col gap-4">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error}</p>
        <Button variant="outline" asChild className="w-fit">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard"
          className="mt-1 p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Edit Post</h1>
              <p className="text-muted-foreground">Make changes to your blog post</p>
            </div>
            <div className="flex items-center gap-4">
              {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
              {lastSaved && !isSaving && (
                <p className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        {/* Post Details Section */}
        <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">Post Details</span>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <ImageIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">Cover Image</span>
          </div>
          <div className="p-6">
            <CoverUpload
              value={coverImage}
              onChange={(url) => setCoverImage(url || "")}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium">Content</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
          <div className="p-6">
            {showPreview ? (
              <div className="min-h-[400px] p-6 rounded-lg border border-border bg-background/50 prose prose-neutral dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-4 prose-p:my-4 prose-img:rounded-lg prose-img:my-6 prose-blockquote:my-4 prose-ul:my-4 prose-ol:my-4 prose-hr:my-8 prose-a:text-primary prose-strong:text-foreground">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children, node }) => {
                      if (node?.children?.length === 1) {
                        const child = node.children[0] as any;
                        if (child?.tagName === 'a' && child?.properties?.href) {
                          const href = child.properties.href;
                          const isYoutube = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.test(href);
                          if (isYoutube) {
                            return <div className="my-6">{children}</div>;
                          }
                        }
                      }
                      return <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>;
                    },
                    a: ({ href, children }) => {
                      const youtubeMatch = href?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                      if (youtubeMatch) {
                        const videoId = youtubeMatch[1];
                        return (
                          <div className="not-prose w-full my-8">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-border bg-black">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={String(children) || "YouTube video player"}
                                className="absolute top-0 left-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        );
                      }
                      return <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">{children}</a>;
                    },
                    img: ({ src, alt }) => (
                      <img src={src} alt={alt || ''} className="rounded-xl border border-border shadow-sm w-full my-8" loading="lazy" />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                id="content"
                className="w-full min-h-[400px] p-4 rounded-lg border border-border bg-background/50 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <div>
                <Label htmlFor="published" className="font-medium cursor-pointer">
                  Publish Post
                </Label>
                <p className="text-xs text-muted-foreground">
                  Make visible on your site
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
               <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
              >
                Save & Exit
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
