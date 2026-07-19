import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";

@ApiTags("📦 Catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(@Query("category") category?: string, @Query("theme") theme?: string) {
    return this.catalogService.listProducts(category, theme);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProduct(slug);
  }

  @Get("collections")
  listCollections() {
    return this.catalogService.listCollections();
  }

  @Get("filters")
  listFilters() {
    return this.catalogService.listFilters();
  }
}
