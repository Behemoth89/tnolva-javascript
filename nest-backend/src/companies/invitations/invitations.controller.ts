import {
  Controller,
  Get,
  Post,
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
import { AdminGuard } from '../../auth/guards/roles/admin.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import type { AuthUserPayload } from '../../types/express.d';
import { InvitationsService } from './invitations.service';

class CreateInvitationBodyDto {
  email!: string;
}

class AcceptInvitationBodyDto {
  email!: string;
}

@ApiTags('invitations')
@Controller('companies/:companyId/invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Send an invitation to join the company' })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can invite users',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User is already a member or invitation exists',
  })
  async createInvitation(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() body: CreateInvitationBodyDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const invitation = await this.invitationsService.createInvitation({
      email: body.email,
      companyId,
      invitedByUserId: user.userId,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    };
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List pending invitations for the company' })
  @ApiResponse({
    status: 200,
    description: 'List of pending invitations',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view invitations',
  })
  async listInvitations(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const invitations = await this.invitationsService.listInvitations(companyId);

    // Return invitations without the token
    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
      createdAt: invitation.createdAt,
    }));
  }

  @Delete(':invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  @ApiResponse({
    status: 204,
    description: 'Invitation cancelled successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can cancel invitations',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async cancelInvitation(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    await this.invitationsService.cancelInvitation(invitationId, companyId);
  }

  @Post(':token/accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation to join a company' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid, expired, or already used invitation',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async acceptInvitation(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('token') token: string,
    @Body() body: AcceptInvitationBodyDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.invitationsService.acceptInvitation({
      token,
      companyId,
      email: body.email,
      userId: user.userId,
    });

    return { message: 'Successfully joined the company' };
  }
}
