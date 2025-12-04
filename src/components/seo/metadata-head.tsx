import { siteConfig } from "@/lib/site";

export function MetadataHead() {
  const siteUrl = siteConfig.url;
  
  return (
    <>
      {/* Additional meta tags for enhanced SEO */}
      <meta name="application-name" content="Sequence3" />
      <meta name="apple-mobile-web-app-title" content="Sequence3" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Geo tags - remove if not applicable */}
      <meta name="geo.region" content="SE" />
      <meta name="geo.placename" content="Sweden" />
      
      {/* Verification tags - add your actual verification codes */}
      <meta name="google-site-verification" content="" />
      <meta name="yandex-verification" content="" />
      <meta name="msvalidate.01" content="" />
      
      {/* Language and region */}
      <meta httpEquiv="content-language" content="en" />
      <meta name="language" content="English" />
      
      {/* Content type */}
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Revisit and indexing */}
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      
      {/* Author information */}
      <meta name="author" content="Sequence3 Team" />
      <meta name="copyright" content={`© ${new Date().getFullYear()} Sequence3. All rights reserved.`} />
      
      {/* Rich snippets hints */}
      <meta name="twitter:label1" content="Price" />
      <meta name="twitter:data1" content="Free to Start" />
      <meta name="twitter:label2" content="Category" />
      <meta name="twitter:data2" content="Business Software" />
    </>
  );
}

