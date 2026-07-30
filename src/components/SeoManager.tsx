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
};

type SeoOverrideContextValue = {
  setOverride: (config: SeoConfig | null) => void;
};

const SeoOverrideContext = createContext<SeoOverrideContextValue | null>(null);

const indexableStaticPaths = new Set([
  "/",
  "/about",
  "/blogs",
  "/flower-workshop",
  "/guide",
  "/landscaping-services",
  "/products",
  "/projects",
  "/workshops",
]);

const noIndexStaticPaths = new Set([
  "/account",
  "/auth",
  "/cart",
  "/checkout",
  "/landscaping-services/request-consultation",
  "/my-orders",
  "/search",
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
    indexableStaticPaths.has(path) ||
    categoryPaths.has(path) ||
    indexableDynamicPattern.test(path);
  const explicitlyNoIndex =
    noIndexStaticPaths.has(path) || path === "/admin" || path.startsWith("/admin/");

  if (!indexable || explicitlyNoIndex) {
    return { noIndex: true };
  }

  return {
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
  document.title = config.title || DEFAULT_TITLE;
  ensureMeta("description").content = config.description || DEFAULT_DESCRIPTION;
  ensureMeta("robots").content = noIndex ? "noindex, follow" : "index, follow";

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

  useEffect(() => {
    if (!context) {
      throw new Error("usePageSeo must be used inside SeoProvider.");
    }

    if (!hasConfig) return;
    context.setOverride({ title, description, canonicalPath, noIndex });
    return () => context.setOverride(null);
  }, [context, title, description, canonicalPath, noIndex, hasConfig]);
};
