export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  mrp: number;
  discountPercent: number;
  gstPercent: number;
  gender: 'MEN' | 'WOMEN' | 'UNISEX';
  brand: string;
  material?: string;
  washCare?: string;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  theme?: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: Review[];
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isVisible: boolean;
  videoUrl?: string;
  view360Url?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  color?: string;
  alt?: string;
  priority: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
  price?: number;
  stock: number;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  body: string;
  author: {
    name: string;
    avatar?: string;
  };
  mediaUrls: string[];
  helpfulVotes: number;
  createdAt: string;
}
