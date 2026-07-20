import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { CustomDesignService } from './custom-design.service';
import { CreateCustomDesignDto } from './dto/create-custom-design.dto';

@Controller('ecommerce/custom-designs')
export class CustomDesignController {
  constructor(private readonly service: CustomDesignService) {}

  @Post()
  create(@Headers('authorization') token: string, @Body() dto: CreateCustomDesignDto) {
    return this.service.createCustomDesign(token, dto);
  }

  @Get()
  getUserDesigns(@Headers('authorization') token: string) {
    return this.service.getUserCustomDesigns(token);
  }

  @Get('admin/all')
  getAllDesigns() {
    return this.service.getAllCustomDesigns();
  }

  @Get('admin/stats')
  getStats() {
    return this.service.getCustomDesignStats();
  }

  @Put('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateCustomDesignStatus(id, body.status);
  }

  @Put('admin/:id/pricing')
  setPrice(@Param('id') id: string, @Body() body: { price: number }) {
    return this.service.setCustomDesignPrice(id, body.price);
  }

  @Get(':id')
  getDesign(@Param('id') id: string, @Headers('authorization') token: string) {
    return this.service.getCustomDesignById(id, token);
  }

  @Delete(':id')
  deleteDesign(@Param('id') id: string, @Headers('authorization') token: string) {
    return this.service.deleteCustomDesign(id, token);
  }
}
