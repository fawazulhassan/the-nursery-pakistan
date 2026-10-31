import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseSitewideSale, type SitewideSale } from "@/lib/productSale";

const REFRESH_MS = 60_000;

type SitewideSaleContextValue = {
  sale: SitewideSale | null;
  ready: boolean;
};

const SitewideSaleContext = createContext<SitewideSaleContextValue>({
  sale: null,
  ready: false,
});

export const SitewideSaleProvider = ({ children }: { children: ReactNode }) => {
  const [sale, setSale] = useState<SitewideSale | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value_json")
        .eq("key", "sitewide_sale")
        .maybeSingle();

      if (error || !data) {
        setSale(null);
        return;
      }

      const next = parseSitewideSale(data.value_json);
      setSale((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    } catch {
      setSale(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, REFRESH_MS);
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return (
    <SitewideSaleContext.Provider value={{ sale, ready }}>
      {children}
    </SitewideSaleContext.Provider>
  );
};

export const useSitewideSale = () => useContext(SitewideSaleContext);
