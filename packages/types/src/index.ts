export type ProductFlag = "featured" | "trending" | "newArrival";

export type ProductVariant = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  imageUrl?: string;
  flags: ProductFlag[];
};

export type HomeSection =
  | "hero"
  | "featured"
  | "trending"
  | "new-arrival"
  | "anime"
  | "assam"
  | "premium"
  | "sale"
  | "gift"
  | "combo"
  | "recently-viewed"
  | "top-rated"
  | "reviews";

export type OrderStatus = "PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
