import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(@Query("category") category?: string) {
    return this.catalogService.listProducts(category);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProduct(slug);
  }

  @Get("collections")
  listCollections() {
    return this.catalogService.listCollections();
  }
}
