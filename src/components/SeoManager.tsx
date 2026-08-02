import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const CANONICAL_ORIGIN = "https://nurserypakistan.pk";
const DEFAULT_TITLE = "The Nursery Pakistan - Premium Plants & Garden Accessories";
const DEFAULT_DESCRIPTION =
  "Shop premium indoor and outdoor plants, pots, fertilizers, and garden accessories at The Nursery Pakistan.";

type SeoConfig = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  image?: string;
  type?: "website" | "article" | "product";
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type SeoOverrideContextValue = {
  setOverride: (config: SeoConfig | null) => void;
};

const SeoOverrideContext = createContext<SeoOverrideContextValue | null>(null);

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${CANONICAL_ORIGIN}/#organization`,
  name: "The Nursery Pakistan",
  url: `${CANONICAL_ORIGIN}/`,
  logo: `${CANONICAL_ORIGIN}/logo-cropped.webp`,
  image: `${CANONICAL_ORIGIN}/portfolio-1.webp`,
  email: "fawazulhassan@gmail.com",
  telephone: "+92-311-7819614",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kasur",
    addressCountry: "PK",
  },
  sameAs: [
    "https://facebook.com/profile.php?id=61579022675427",
    "https://www.instagram.com/nurserypakistan_pk/",
  ],
};

const guideFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How often should indoor plants be watered in Pakistan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Check the soil instead of following a fixed calendar. Water when the top layer feels dry, and reduce watering during cooler months or when the soil stays wet longer.",
      },
    },
    {
      "@type": "Question",
      name: "How can I protect plants during Pakistan's summer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Keep sensitive plants away from harsh afternoon sun, water deeply when the soil needs it, improve airflow, and use mulch for outdoor pots to slow moisture loss.",
      },
    },
    {
      "@type": "Question",
      name: "Why do plant leaves turn yellow?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Common causes include overwatering, poor drainage, low light, root stress, and nutrient problems. Check soil moisture and drainage before adding fertilizer.",
      },
    },
    {
      "@type": "Question",
      name: "Which indoor plants are easiest for beginners?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Snake plant, money plant, aloe vera, and several pothos varieties are popular beginner choices when they receive suitable light and are not overwatered.",
      },
    },
  ],
};

const landscapingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which landscaping services are available in Kasur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Nursery Pakistan provides garden planning, plant selection, planting, and landscaping consultation for suitable residential and commercial projects in Kasur.",
      },
    },
    {
      "@type": "Question",
      name: "How do I request a landscaping consultation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the landscaping consultation form and share your location, space details, and project goals. The team can then review the request and discuss the next step.",
      },
    },
    {
      "@type": "Question",
      name: "Can I view completed landscaping work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The completed projects section shows published landscaping work from The Nursery Pakistan.",
      },
    },
  ],
};

const staticSeo: Record<string, SeoConfig> = {
  "/": {
    title: "Buy Plants Online in Pakistan | The Nursery Pakistan",
    description:
      "Shop indoor and outdoor plants, pots, fertilizers and garden accessories online from The Nursery Pakistan, with practical plant-care guidance.",
    structuredData: [
      organizationSchema,
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        url: `${CANONICAL_ORIGIN}/`,
        name: "The Nursery Pakistan",
        publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
      },
    ],
  },
  "/about": {
    title: "About The Nursery Pakistan | Plants & Garden Care",
    description:
      "Learn about The Nursery Pakistan, our passion for quality plants, reliable gardening supplies and practical support for plant lovers.",
  },
  "/blogs": {
    title: "Plant Care Blog Pakistan | The Nursery Pakistan",
    description:
      "Read practical plant-care advice, seasonal gardening tips and workshop updates created for plant lovers in Pakistan.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "The Nursery Pakistan Plant Care Blog",
      url: `${CANONICAL_ORIGIN}/blogs`,
    },
  },
  "/flower-workshop": {
    title: "Hands-On Flower Arrangement Workshop | The Nursery Pakistan",
    description:
      "Learn flower arrangement, bouquet styling and bloom-care techniques through The Nursery Pakistan's hands-on workshop experience.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Hands-On Flower Arrangement Workshop",
      description:
        "A practical flower-arrangement experience covering bouquet styling, floral design basics and bloom care.",
      provider: { "@id": `${CANONICAL_ORIGIN}/#organization` },
      url: `${CANONICAL_ORIGIN}/flower-workshop`,
    },
  },
  "/guide": {
    title: "Plant Care Guide for Pakistan | The Nursery Pakistan",
    description:
      "Use our practical Pakistan plant-care guide for watering, feeding, common plant problems and care tips for popular indoor plants.",
    structuredData: guideFaqSchema,
  },
  "/landscaping-services": {
    title: "Landscaping Services in Kasur | The Nursery Pakistan",
    description:
      "Explore residential and commercial landscaping services in Kasur, including garden planning, planting and completed project inspiration.",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Landscaping Services",
        serviceType: "Garden landscaping and planting",
        areaServed: { "@type": "City", name: "Kasur" },
        provider: { "@id": `${CANONICAL_ORIGIN}/#organization` },
        url: `${CANONICAL_ORIGIN}/landscaping-services`,
      },
      landscapingFaqSchema,
    ],
  },
  "/products": {
    title: "Buy Plants, Pots & Garden Supplies Online in Pakistan",
    description:
      "Browse plants, pots, fertilizers, soil and garden accessories available online from The Nursery Pakistan.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Plants and Garden Supplies",
      url: `${CANONICAL_ORIGIN}/products`,
    },
  },
  "/projects": {
    title: "Completed Landscaping Projects | The Nursery Pakistan",
    description:
      "Explore completed garden and landscaping projects by The Nursery Pakistan for ideas, design inspiration and proof of our work.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Completed Landscaping Projects",
      url: `${CANONICAL_ORIGIN}/projects`,
    },
  },
  "/workshops": {
    title: "Current & Upcoming Flower Workshops | The Nursery Pakistan",
    description:
      "View current and upcoming hands-on flower workshops, available dates and booking information from The Nursery Pakistan.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Current and Upcoming Flower Workshops",
      url: `${CANONICAL_ORIGIN}/workshops`,
    },
  },
};

const noIndexStaticPaths = new Set([
  "/account",
  "/auth",
  "/cart",
  "/checkout",
  "/landscaping-services/request-consultation",
  "/my-orders",
  "/search",
  "/track-order",
  "/wishlist",
]);

const categoryPaths = new Set(CATEGORIES.map(({ slug }) => `/category/${slug}`));
const indexableDynamicPattern = /^\/(?:product|blog|workshop|project)\/[^/]+$/;

const normalizePath = (pathname: string) => {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
};

const routeDefaults = (pathname: string): SeoConfig => {
  const path = normalizePath(pathname);
  const indexable =
    Object.prototype.hasOwnProperty.call(staticSeo, path) ||
    categoryPaths.has(path) ||
    indexableDynamicPattern.test(path);
  const explicitlyNoIndex =
    noIndexStaticPaths.has(path) || path === "/admin" || path.startsWith("/admin/");

  if (!indexable || explicitlyNoIndex) {
    return { noIndex: true };
  }

  const category = CATEGORIES.find(({ slug }) => `/category/${slug}` === path);
  const categoryDescription: Record<string, string> = {
    "indoor-plants":
      "Shop indoor plants for Pakistani homes, including easy-care and air-purifying varieties with practical care guidance.",
    "outdoor-plants":
      "Explore outdoor plants suited to Pakistan's climate for gardens, balconies and attractive green spaces.",
    "pots-accessories":
      "Shop plant pots, planters and useful garden accessories for indoor and outdoor planting.",
    "fertilizers-soil":
      "Find fertilizers, soil mixes and plant nutrition products for healthier plant growth in Pakistani conditions.",
    sale: "Browse current offers on visible plants and garden supplies from The Nursery Pakistan.",
  };

  return {
    ...(staticSeo[path] ?? {}),
    ...(category
      ? {
          title: `${category.name} Online in Pakistan | The Nursery Pakistan`,
          description: categoryDescription[category.slug],
          structuredData: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.name,
            url: `${CANONICAL_ORIGIN}${path}`,
          },
        }
      : {}),
    canonicalPath: path,
    noIndex: false,
  };
};

const ensureMeta = (name: string) => {
  let element = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  return element;
};

const ensurePropertyMeta = (property: string) => {
  let element = document.head.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  return element;
};

const applySeo = (config: SeoConfig) => {
  const noIndex = config.noIndex ?? false;
  const title = config.title || DEFAULT_TITLE;
  const description = config.description || DEFAULT_DESCRIPTION;
  const image = config.image || `${CANONICAL_ORIGIN}/portfolio-1.webp`;
  document.title = title;
  ensureMeta("description").content = description;
  ensureMeta("robots").content = noIndex ? "noindex, follow" : "index, follow";
  ensurePropertyMeta("og:title").content = title;
  ensurePropertyMeta("og:description").content = description;
  ensurePropertyMeta("og:type").content = config.type || "website";
  ensurePropertyMeta("og:image").content = image;
  ensureMeta("twitter:card").content = "summary_large_image";
  ensureMeta("twitter:title").content = title;
  ensureMeta("twitter:description").content = description;
  ensureMeta("twitter:image").content = image;

  document
    .querySelectorAll(
      'script[type="application/ld+json"][data-seo-json-ld], script[type="application/ld+json"][data-prerender-json-ld]',
    )
    .forEach((script) => script.remove());

  const existingCanonical = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (noIndex || !config.canonicalPath) {
    existingCanonical?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }

  const canonicalUrl = new URL(normalizePath(config.canonicalPath), CANONICAL_ORIGIN).href;
  const canonical = existingCanonical || document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = canonicalUrl;
  if (!existingCanonical) document.head.appendChild(canonical);
  ensurePropertyMeta("og:url").content = canonicalUrl;

  const structuredItems = Array.isArray(config.structuredData)
    ? config.structuredData
    : config.structuredData
      ? [config.structuredData]
      : [];
  structuredItems.forEach((item) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoJsonLd = "true";
    script.text = JSON.stringify(item);
    document.head.appendChild(script);
  });
};

export const SeoProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [override, setOverride] = useState<SeoConfig | null>(null);

  const defaults = useMemo(() => routeDefaults(location.pathname), [location.pathname]);
  const resolved = useMemo(
    () => ({
      ...defaults,
      ...override,
      canonicalPath:
        override?.canonicalPath ??
        (override?.noIndex ? undefined : defaults.canonicalPath),
    }),
    [defaults, override],
  );

  useEffect(() => {
    applySeo(resolved);
  }, [resolved]);

  const contextValue = useMemo(() => ({ setOverride }), []);

  return (
    <SeoOverrideContext.Provider value={contextValue}>
      {children}
    </SeoOverrideContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePageSeo = (config: SeoConfig | null) => {
  const context = useContext(SeoOverrideContext);
  const hasConfig = config !== null;
  const title = config?.title;
  const description = config?.description;
  const canonicalPath = config?.canonicalPath;
  const noIndex = config?.noIndex;
  const image = config?.image;
  const type = config?.type;
  const structuredDataJson = JSON.stringify(config?.structuredData ?? null);

  useEffect(() => {
    if (!context) {
      throw new Error("usePageSeo must be used inside SeoProvider.");
    }

    if (!hasConfig) return;
    context.setOverride({
      title,
      description,
      canonicalPath,
      noIndex,
      image,
      type,
      structuredData: structuredDataJson ? JSON.parse(structuredDataJson) : undefined,
    });
    return () => context.setOverride(null);
  }, [
    context,
    title,
    description,
    canonicalPath,
    noIndex,
    image,
    type,
    structuredDataJson,
    hasConfig,
  ]);
};
