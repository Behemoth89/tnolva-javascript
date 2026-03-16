import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { OwnerGuard } from '../../auth/guards/roles/owner.guard';
import { AdminGuard } from '../../auth/guards/roles/admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../types/express.d';
import { CompaniesService } from '../services/companies.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';

class TransferOwnershipDto {
  newOwnerEmail!: string;
}

class UpdateUserRoleDto {
  role!: string;
}

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly userCompanyRepository: UserCompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  private getUserCompanyIds(user: AuthUserPayload): string[] {
    return user.companies.map((c: { companyId: string }) => c.companyId);
  }

  private getUserAdminCompanyIds(user: AuthUserPayload): string[] {
    return user.companies
      .filter((c: { role: string }) => c.role === 'admin' || c.role === 'owner')
      .map((c: { companyId: string }) => c.companyId);
  }

  private getUserOwnerCompanyIds(user: AuthUserPayload): string[] {
    return user.companies
      .filter((c: { role: string }) => c.role === 'owner')
      .map((c: { companyId: string }) => c.companyId);
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
  @ApiOperation({ summary: 'Create a new company' })
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
  @ApiOperation({ summary: 'Update a company' })
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
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Soft delete a company (owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Company deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owner can delete company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserOwnerCompanyIds(user);
    if (!companyIds.includes(id)) {
      throw new ForbiddenException('Only owner can delete company');
    }
    await this.companiesService.delete(id, companyIds);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Restore a soft-deleted company (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Company restored successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owner can restore company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const companyIds = this.getUserOwnerCompanyIds(user);
    return this.companiesService.restore(id, companyIds);
  }

  @Post(':id/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Transfer ownership to another user (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Ownership transferred successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owner can transfer ownership',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or user not found',
  })
  async transferOwnership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TransferOwnershipDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    // Verify current user is owner
    const ownerCompanyIds = this.getUserOwnerCompanyIds(user);
    if (!ownerCompanyIds.includes(id)) {
      throw new ForbiddenException('Only owner can transfer ownership');
    }

    // Find the new owner user by email
    const newOwnerUser = await this.userRepository.findByEmail(
      body.newOwnerEmail,
    );
    if (!newOwnerUser) {
      throw new NotFoundException('User not found with this email');
    }

    // Check if new owner is already a member of the company
    const newOwnerMembership =
      await this.userCompanyRepository.findByUserAndCompany(
        newOwnerUser.id,
        id,
      );
    if (!newOwnerMembership) {
      throw new NotFoundException('User is not a member of this company');
    }

    // Use a transaction to swap roles atomically
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(
        'user_companies',
        { userId: user.userId, companyId: id },
        { role: 'admin' },
      );
      await queryRunner.manager.update(
        'user_companies',
        { userId: newOwnerUser.id, companyId: id },
        { role: 'owner' },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return { message: 'Ownership transferred successfully' };
  }

  @Patch(':id/users/:userId/role')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admin can update roles',
  })
  @ApiResponse({
    status: 404,
    description: 'User or company not found',
  })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserRoleDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    // Verify admin has access to this company
    const adminCompanyIds = this.getUserAdminCompanyIds(user);
    if (!adminCompanyIds.includes(id)) {
      throw new ForbiddenException('Only admin can update user roles');
    }

    // Check if target user is owner - cannot modify owner role
    const targetMembership =
      await this.userCompanyRepository.findByUserAndCompany(userId, id);
    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this company');
    }

    if (targetMembership.role === 'owner') {
      throw new ForbiddenException('Cannot modify owner role');
    }

    // Verify the new role is valid
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(body.role)) {
      throw new ForbiddenException('Invalid role');
    }

    await this.userCompanyRepository.updateUserRole(userId, id, body.role);

    return { message: 'User role updated successfully' };
  }

  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remove user from company (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'User removed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admin can remove users',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found in company',
  })
  async removeUserFromCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    // Verify admin has access to this company
    const adminCompanyIds = this.getUserAdminCompanyIds(user);
    if (!adminCompanyIds.includes(id)) {
      throw new ForbiddenException('Only admin can remove users');
    }

    // Check if target user is owner - cannot remove owner
    const targetMembership =
      await this.userCompanyRepository.findByUserAndCompany(userId, id);
    if (!targetMembership) {
      throw new NotFoundException('User is not a member of this company');
    }

    if (targetMembership.role === 'owner') {
      const allOwners = await this.userCompanyRepository.findByCompanyId(id);
      const ownerCount = allOwners.filter((uc) => uc.role === 'owner').length;
      if (ownerCount === 1) {
        throw new ForbiddenException(
          'Cannot remove the last owner from the company',
        );
      }
    }

    // Check if this is the last admin
    if (targetMembership.role === 'admin') {
      const allAdmins = await this.userCompanyRepository.findByCompanyId(id);
      const adminCount = allAdmins.filter((uc) => uc.role === 'admin').length;
      if (adminCount === 1) {
        throw new ForbiddenException('Cannot remove the last admin');
      }
    }

    await this.userCompanyRepository.removeUserFromCompany(userId, id);
  }

  @Get(':id/users')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List users in company (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the company',
  })
  async listCompanyUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    // Verify admin has access to this company
    const adminCompanyIds = this.getUserAdminCompanyIds(user);
    if (!adminCompanyIds.includes(id)) {
      throw new ForbiddenException('Only admin can list company users');
    }

    return this.companiesService.getCompanyUsers(id);
  }
}
