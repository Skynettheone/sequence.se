/**
 * Centralized Social Links Configuration
 * Update all your social media links in one place here!
 */
export const socialLinks = {
  // Primary Social Platforms
  twitter: "https://x.com/Sequence_3",
  x: "https://x.com/Sequence_3", // Alternative for Twitter/X
  
  // Developer Platforms
  github: "https://github.com/sequence3",
  
  // Social Media
  instagram: "https://www.instagram.com/sequence3.se/",
  facebook: "https://www.facebook.com/sq3.io",
  linkedin: "https://www.linkedin.com/company/sequence3/",
  
  // Video Platforms
  youtube: "https://www.youtube.com/@sequencethree",
  
  // Messaging Platforms (if public profiles)
  telegram: "https://t.me/sequence3",
  discord: "https://discord.gg/sequence3",
  
  // Additional Platforms
  tiktok: "", // Add if you have TikTok
  threads: "", // Add if you have Threads
  mastodon: "", // Add if you have Mastodon
  
  // Contact
  email: "support@sq3.io",
};

/**
 * Get all active social links (non-empty URLs)
 * Useful for generating lists dynamically
 */
export const getActiveSocialLinks = () => {
  return Object.entries(socialLinks)
    .filter(([_, url]) => url && typeof url === "string" && url.trim() !== "")
    .reduce((acc, [key, url]) => {
      acc[key as keyof typeof socialLinks] = url;
      return acc;
    }, {} as Record<string, string>);
};

/**
 * Get social links array for structured data (sameAs)
 * Returns all active social links as an array (excluding email)
 */
export const getSocialLinksArray = () => {
  return Object.entries(socialLinks)
    .filter(([key, url]) => 
      key !== "email" && 
      typeof url === "string" && 
      url.trim() !== ""
    )
    .map(([_, url]) => url as string);
};

export const siteConfig = {
  name: "Sequence3 - AI-powered Conversation Workspaces for SMEs",
  url: "https://sequence3.se",
  description: "Unified inbox and explainable AI assistant for SMEs. Connect Facebook, Instagram, and website chat. AI-powered reply drafts, sentiment analysis, and automation.",
  shortDescription: "AI-driven Conversation Workspace",
  links: {
    // Maintain backward compatibility
    twitter: socialLinks.twitter,
    github: socialLinks.github,
    instagram: socialLinks.instagram,
    facebook: socialLinks.facebook,
    linkedin: socialLinks.linkedin,
    youtube: socialLinks.youtube,
    email: socialLinks.email,
  },
  // Export social links directly for easy access
  socialLinks,
};

export type SiteConfig = typeof siteConfig;
