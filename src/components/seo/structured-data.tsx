import { siteConfig, getSocialLinksArray } from "@/lib/site";
import { siteConfig as config } from "@/lib/config";

interface StructuredDataProps {
  type?: "homepage" | "product";
}

export function StructuredData({ type = "homepage" }: StructuredDataProps) {
  const baseUrl = siteConfig.url;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: ["SQ3", "sq3", "SQ3 AI", "sq3 platform", "sq3 software", "SQ3 software", "sq3 chatbot", "SQ3 chatbot"],
    url: baseUrl,
    logo: `${baseUrl}/Q.svg`,
    description: siteConfig.description,
    sameAs: getSocialLinksArray().filter(url => url !== siteConfig.socialLinks.email),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: siteConfig.socialLinks.email,
    },
    knowsAbout: ["SQ3", "sq3", "AI Assistant", "Unified Inbox", "Customer Service"],
    identifier: {
      "@type": "PropertyValue",
      name: "SQ3",
      value: "sq3",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["SQ3", "sq3", "sq3 ai", "SQ3 AI", "sq3 platform"],
    url: baseUrl,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      alternateName: ["SQ3", "sq3"],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    alternateName: ["SQ3", "sq3", "SQ3 AI Assistant", "SQ3 Unified Inbox", "sq3 platform"],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    description: siteConfig.description,
    url: baseUrl,
    featureList: [
      "Real-time AI Collaboration",
      "Unified Inbox",
      "Multi-channel Messaging",
      "Sentiment Analysis",
      "Intent Detection",
      "Human-in-the-Loop",
      "Explainable AI",
      "Knowledge Retrieval",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqSection.faQitems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ],
  };

  // Brand schema for better brand recognition
  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: siteConfig.name,
    alternateName: ["SQ3", "sq3", "SQ3 AI", "sq3 platform"],
    logo: `${baseUrl}/Q.svg`,
    url: baseUrl,
  };

  // Additional organization details
  const additionalOrganizationDetails = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: ["SQ3", "sq3"],
    url: baseUrl,
    knowsAbout: [
      "SQ3",
      "sq3 ai",
      "AI Assistant",
      "Unified Inbox",
      "Customer Service Automation",
    ],
  };

  const schemas: Array<Record<string, unknown>> = [
    organizationSchema,
    websiteSchema,
    breadcrumbSchema,
    faqSchema,
    brandSchema,
    additionalOrganizationDetails,
  ];

  if (type === "product") {
    schemas.push(productSchema);
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

