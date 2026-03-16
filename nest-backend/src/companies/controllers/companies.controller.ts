import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../types/express.d';
import { CompaniesService } from '../services/companies.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  private getUserCompanyIds(user: AuthUserPayload): string[] {
    return user.companies.map((c) => c.companyId);
  }

  private getUserAdminCompanyIds(user: AuthUserPayload): string[] {
    return user.companies
      .filter((c) => c.role === 'admin')
      .map((c) => c.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies the user has access to' })
  @ApiResponse({
    status: 200,
    description: 'List of companies',
  })
  async findAll(@CurrentUser() user: AuthUserPayload) {
    const companyIds = this.getUserCompanyIds(user);
    return this.companiesService.findAll(companyIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({
    status: 200,
    description: 'Company details',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserCompanyIds(user);
    return this.companiesService.findOne(id, companyIds);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Company slug already exists',
  })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    // Any authenticated user can create a company
    return this.companiesService.create(createCompanyDto, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a company (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Company slug already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserCompanyIds(user);
    return this.companiesService.update(id, updateCompanyDto, companyIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a company (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Company deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserCompanyIds(user);
    await this.companiesService.delete(id, companyIds);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted company (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Company restored successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserCompanyIds(user);
    return this.companiesService.restore(id, companyIds);
  }
}
