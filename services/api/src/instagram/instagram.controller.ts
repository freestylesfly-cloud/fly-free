import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstagramService } from './instagram.service';

@ApiTags('📸 Instagram Feed')
@Controller('instagram-posts')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  // Public: Get all Instagram posts
  @Get()
  async getAll(@Query('limit') limit?: string) {
    const posts = await this.instagramService.getAll();
    if (limit) {
      return {
        data: posts.data.slice(0, parseInt(limit)),
        total: posts.total,
      };
    }
    return posts;
  }

  // Public: Get single Instagram post
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.instagramService.getById(id);
  }

  // Admin: Create Instagram post
  @Post()
  async create(
    @Body()
    body: {
      imageUrl?: string;
      videoUrl?: string;
      caption: string;
      instagramLink: string;
      displayOrder?: number;
    }
  ) {
    return await this.instagramService.create(body);
  }

  // Admin: Update Instagram post
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
    }
  ) {
    return await this.instagramService.update(id, body);
  }

  // Admin: Delete Instagram post
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.instagramService.delete(id);
  }
}
