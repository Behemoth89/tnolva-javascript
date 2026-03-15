import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieve all users for the current company. Admin can include soft-deleted users.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Include soft-deleted users (admin only)',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: [
        {
          id: 'uuid',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          companyId: 'company-uuid',
          isActive: true,
        },
      ],
    },
  })
  async findAll(
    @CurrentCompany() companyId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const include = includeDeleted === 'true';
    return this.usersService.findAll(companyId, include);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'Get soft-deleted users',
    description: 'Retrieve only soft-deleted users (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of soft-deleted users',
  })
  async findDeleted() {
    return this.usersService.findOnlyDeleted();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Include soft-deleted user (admin only)',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const include = includeDeleted === 'true';
    return this.usersService.findOne(id, include);
  }

  @Post(':id/soft-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a user',
    description:
      'Mark a user as deleted (soft delete). User can be restored later.',
  })
  @ApiResponse({
    status: 204,
    description: 'User soft deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async softDelete(@Param('id') id: string) {
    await this.usersService.softDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Restore a soft-deleted user',
    description: 'Restore a previously soft-deleted user',
  })
  @ApiResponse({
    status: 204,
    description: 'User restored successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restore(@Param('id') id: string) {
    await this.usersService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Hard delete a user',
    description:
      'Permanently delete a user. This action cannot be undone. Use soft-delete instead when possible.',
  })
  @ApiResponse({
    status: 204,
    description: 'User permanently deleted',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async hardDelete(@Param('id') id: string) {
    await this.usersService.hardDelete(id);
  }
}
