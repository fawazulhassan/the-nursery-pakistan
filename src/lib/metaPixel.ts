export type MetaContentItem = {
  id: string;
  quantity: number;
  item_price: number;
};

export type MetaEventParams = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  contents?: MetaContentItem[];
  content_type?: string;
  content_name?: string;
  search_string?: string;
  num_items?: number;
  eventID?: string;
};

const META_CURRENCY = "PKR";

export const parseMetaPrice = (price: string | number | null | undefined): number => {
  const parsed =
    typeof price === "number"
      ? price
      : parseInt(String(price ?? "").replace(/[^0-9]/g, ""), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn("[metaPixel] Invalid price; using 0", price);
    return 0;
  }

  return parsed;
};

export const trackMetaEvent = (eventName: string, params?: MetaEventParams) => {
  if (typeof window.fbq !== "function") return;
  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
};

export const buildContentsPayload = (
  items: Array<{ id: string; quantity: number; item_price: number }>,
) => {
  const contents: MetaContentItem[] = items.map((item) => ({
    id: String(item.id),
    quantity: item.quantity,
    item_price: parseMetaPrice(item.item_price),
  }));

  const value = contents.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0,
  );

  return {
    value,
    currency: META_CURRENCY,
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: "product" as const,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
  };
};

export const trackAddToCart = (item: {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
}) => {
  const item_price = parseMetaPrice(item.price);
  trackMetaEvent("AddToCart", {
    ...buildContentsPayload([{ id: item.id, quantity: item.quantity, item_price }]),
    content_name: item.name,
  });
};

export const trackInitiateCheckout = (
  items: Array<{ id: string; quantity: number; price: string | number }>,
) => {
  trackMetaEvent(
    "InitiateCheckout",
    buildContentsPayload(
      items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: parseMetaPrice(item.price),
      })),
    ),
  );
};

export const trackViewContent = (product: {
  id: string;
  name: string;
  price: string | number;
}) => {
  const item_price = parseMetaPrice(product.price);
  trackMetaEvent("ViewContent", {
    ...buildContentsPayload([{ id: product.id, quantity: 1, item_price }]),
    content_name: product.name,
  });
};

export const trackSearch = (searchString: string) => {
  trackMetaEvent("Search", {
    search_string: searchString,
    content_type: "product",
  });
};

export const trackAddToWishlist = (item: {
  id: string;
  name: string;
  price: string | number;
}) => {
  const item_price = parseMetaPrice(item.price);
  trackMetaEvent("AddToWishlist", {
    ...buildContentsPayload([{ id: item.id, quantity: 1, item_price }]),
    content_name: item.name,
  });
};

export const trackPurchase = (params: {
  orderId: string;
  value: number;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
}) => {
  const safeValue = parseMetaPrice(params.value);
  const contents = params.contents.map((item) => ({
    id: String(item.id),
    quantity: item.quantity,
    item_price: parseMetaPrice(item.item_price),
  }));

  trackMetaEvent("Purchase", {
    value: safeValue,
    currency: META_CURRENCY,
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: "product",
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
    eventID: params.orderId,
  });
};
