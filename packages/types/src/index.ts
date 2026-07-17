// Re-export all types
export * from './product';
export * from './user';
export * from './theme';

// Common types
export type ProductFlag = "featured" | "trending" | "newArrival";

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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
