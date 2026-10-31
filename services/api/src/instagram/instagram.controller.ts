import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InstagramService } from './instagram.service';
import { liveMediaUrl } from '../storage/media-storage';
import { AdminGuard } from '../auth/admin.guard';
import { PublicCacheReadInterceptor } from '../cache/public-cache-read.interceptor';

@ApiTags('📸 Instagram Feed')
@Controller('instagram-posts')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  // Public: Get all Instagram posts
  @UseInterceptors(PublicCacheReadInterceptor)
  @Get()
  async getAll(@Query('limit') limit?: string, @Query('media') media?: string) {
    const posts = await this.instagramService.getAll();
    // The storefront asks for media=live: drop dead file URLs, and posts left
    // with nothing to show. Admin omits it so it can still see and fix them.
    if (media === 'live') {
      posts.data = posts.data
        .map((post) => ({ ...post, imageUrl: liveMediaUrl(post.imageUrl), videoUrl: liveMediaUrl(post.videoUrl) }))
        .filter((post) => post.imageUrl || post.videoUrl);
      posts.total = posts.data.length;
    }
    if (limit) {
      return {
        data: posts.data.slice(0, parseInt(limit)),
        total: posts.total,
      };
    }
    return posts;
  }

  // Public: Get single Instagram post
  @UseInterceptors(PublicCacheReadInterceptor)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.instagramService.getById(id);
  }

  // Admin: Create Instagram post
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post()
  async create(
    @Body()
    body: {
      imageUrl?: string;
      videoUrl?: string;
      caption: string;
      instagramLink: string;
      displayOrder?: number;
      productIds?: string[];
    }
  ) {
    return await this.instagramService.create(body);
  }

  // Admin: Update Instagram post
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
      instagramLink?: string;
      displayOrder?: number;
      productIds?: string[];
    }
  ) {
    return await this.instagramService.update(id, body);
  }

  // Admin: Delete Instagram post
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.instagramService.delete(id);
  }
}
