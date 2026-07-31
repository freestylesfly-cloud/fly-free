import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";

@ApiTags("📦 Catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // `category` is the fit (regular, oversized, jersey, polo, hoodie).
  @Get("products")
  listProducts(
    @Query("category") category?: string,
    @Query("theme") theme?: string,
    @Query("q") q?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("rating") rating?: string,
    @Query("tag") tag?: string,
    @Query("sort") sort?: string
  ) {
    return this.catalogService.listProducts({ category, theme, q, minPrice, maxPrice, rating, tag, sort });
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProduct(slug);
  }

  @Get("filters")
  listFilters() {
    return this.catalogService.listFilters();
  }
}
