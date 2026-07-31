import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    try {
      const posts = await this.prisma.instagramPost.findMany({
        orderBy: { displayOrder: 'asc' },
      });
      return { data: posts, total: posts.length };
    } catch (error) {
      this.logger.error('Failed to fetch Instagram posts:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const post = await this.prisma.instagramPost.findUnique({
        where: { id },
      });
      if (!post) {
        throw new BadRequestException('Instagram post not found');
      }
      return { data: post };
    } catch (error) {
      this.logger.error(`Failed to fetch Instagram post ${id}:`, error);
      throw error;
    }
  }

  async create(data: {
    imageUrl?: string;
    videoUrl?: string;
    caption: string;
    instagramLink: string;
    displayOrder?: number;
  }) {
    try {
      // Validation
      if (!data.caption?.trim()) {
        throw new BadRequestException('Caption is required');
      }
      if (!data.instagramLink?.trim()) {
        throw new BadRequestException('Instagram link is required');
      }

      // Validate Instagram URL format
      if (!this.isValidInstagramUrl(data.instagramLink)) {
        throw new BadRequestException('Invalid Instagram URL format');
      }

      // Validate image/video URLs if provided
      if (data.imageUrl && !this.isValidUrl(data.imageUrl)) {
        throw new BadRequestException('Invalid image URL');
      }
      if (data.videoUrl && !this.isValidUrl(data.videoUrl)) {
        throw new BadRequestException('Invalid video URL');
      }

      const post = await this.prisma.instagramPost.create({
        data: {
          imageUrl: data.imageUrl || null,
          videoUrl: data.videoUrl || null,
          caption: data.caption.trim(),
          instagramLink: data.instagramLink.trim(),
          displayOrder: data.displayOrder || 0,
        },
      });

      this.logger.log(`Created Instagram post: ${post.id}`);
      return { data: post, message: 'Post created successfully' };
    } catch (error) {
      this.logger.error('Failed to create Instagram post:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
      instagramLink?: string;
      displayOrder?: number;
    }
  ) {
    try {
      // Check if post exists
      await this.getById(id);

      // Validation
      if (data.caption && !data.caption.trim()) {
        throw new BadRequestException('Caption cannot be empty');
      }
      if (data.instagramLink && !this.isValidInstagramUrl(data.instagramLink)) {
        throw new BadRequestException('Invalid Instagram URL format');
      }
      if (data.imageUrl && !this.isValidUrl(data.imageUrl)) {
        throw new BadRequestException('Invalid image URL');
      }
      if (data.videoUrl && !this.isValidUrl(data.videoUrl)) {
        throw new BadRequestException('Invalid video URL');
      }

      const post = await this.prisma.instagramPost.update({
        where: { id },
        data: {
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
          ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl || null }),
          ...(data.caption && { caption: data.caption.trim() }),
          ...(data.instagramLink && { instagramLink: data.instagramLink.trim() }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        },
      });

      this.logger.log(`Updated Instagram post: ${post.id}`);
      return { data: post, message: 'Post updated successfully' };
    } catch (error) {
      this.logger.error(`Failed to update Instagram post ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      // Check if post exists
      await this.getById(id);

      await this.prisma.instagramPost.delete({
        where: { id },
      });

      this.logger.log(`Deleted Instagram post: ${id}`);
      return { message: 'Post deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete Instagram post ${id}:`, error);
      throw error;
    }
  }

  // Helper functions
  private isValidInstagramUrl(url: string): boolean {
    try {
      return new URL(url).hostname.includes('instagram.com');
    } catch {
      return false;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
