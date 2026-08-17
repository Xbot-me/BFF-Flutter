import { ProductSummary } from "./product";

// Category with product count — used by /api/products/categories
export interface ProductCategory {
  name:        string;
  slug:        string;   // lowercase, URL-safe e.g. "k-pop-albums"
  count:       number;   // number of products in this category
  description: string;
}

// Paginated product list response — every list endpoint returns this shape
export interface PaginatedProducts {
  products:    ProductSummary[];
  total:       number;   // total matching products (not just this page)
  page:        number;
  perPage:     number;
  totalPages:  number;
  hasNextPage: boolean;
}

// Search result — same as ProductSummary but with a relevance score
export interface ProductSearchResult extends ProductSummary {
  score: number;   // 0–1 relevance score (mock: keyword match count / total fields)
}

export interface SearchResponse {
  query:    string;
  results:  ProductSearchResult[];
  total:    number;
  tookMs:   number;   // response time — Flutter can display "X results in Yms"
}

// Sort options — shared across list and search endpoints
export type SortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "name_asc";