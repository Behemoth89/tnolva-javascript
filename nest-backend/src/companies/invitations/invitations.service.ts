import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  CompanyInvitation,
  InvitationStatus,
} from '../entities/company-invitation.entity';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { UserRepository } from '../../users/repositories/user.repository';

export interface CreateInvitationDto {
  email: string;
  companyId: string;
  invitedByUserId: string;
}

export interface AcceptInvitationDto {
  token: string;
  companyId: string;
  email: string;
  userId: string;
}

// Invitation validity duration in milliseconds (24 hours)
const INVITATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class InvitationsService {
  private invitationRepository: Repository<CompanyInvitation>;

  constructor(
    private dataSource: DataSource,
    private userCompanyRepository: UserCompanyRepository,
    private userRepository: UserRepository,
  ) {
    this.invitationRepository =
      this.dataSource.getRepository(CompanyInvitation);
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation
   */
  async createInvitation(dto: CreateInvitationDto): Promise<CompanyInvitation> {
    // Check if email is already a member of the company
    // Note: We need to find the user by email first
    const user = await this.userRepository.findByEmail(dto.email);
    if (user) {
      const existingMember =
        await this.userCompanyRepository.findByUserAndCompany(
          user.id,
          dto.companyId,
        );
      if (existingMember) {
        throw new ConflictException('User is already a member of this company');
      }
    }

    // Check if there's already a pending invitation for this email and company
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        email: dto.email,
        companyId: dto.companyId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      // Check if the existing invitation is still valid
      if (new Date(existingInvitation.expiresAt) > new Date()) {
        throw new ConflictException(
          'An invitation is already pending for this email',
        );
      }
      // Delete the expired invitation
      await this.invitationRepository.delete(existingInvitation.id);
    }

    // Create the invitation
    const invitation = this.invitationRepository.create({
      email: dto.email,
      companyId: dto.companyId,
      invitedByUserId: dto.invitedByUserId,
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + INVITATION_EXPIRY_MS),
      status: InvitationStatus.PENDING,
    });

    return this.invitationRepository.save(invitation);
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if invitation is for the correct company
    if (invitation.companyId !== dto.companyId) {
      throw new BadRequestException('Invitation is for a different company');
    }

    // Check if invitation has been used
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Invitation has already been used');
    }

    // Check if invitation has been cancelled
    if (invitation.status === InvitationStatus.CANCELLED) {
      throw new BadRequestException('Invitation has been cancelled');
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found. Please register first.');
    }

    // Verify the email matches the accepting user's account
    if (user.email !== dto.email) {
      throw new BadRequestException('Email does not match your account');
    }

    // Add user to company as a member
    await this.userCompanyRepository.addUserToCompany(
      user.id,
      invitation.companyId,
      'member',
    );

    // Mark invitation as used
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });
  }

  /**
   * List pending invitations for a company
   */
  async listInvitations(companyId: string): Promise<CompanyInvitation[]> {
    return this.invitationRepository.find({
      where: {
        companyId,
        status: InvitationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(
    invitationId: string,
    companyId: string,
  ): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.companyId !== companyId) {
      throw new ForbiddenException(
        'Invitation does not belong to this company',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending invitations can be cancelled',
      );
    }

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.CANCELLED,
    });
  }

  /**
   * Find invitation by token (for public acceptance endpoint)
   */
  async findByToken(token: string): Promise<CompanyInvitation | null> {
    return this.invitationRepository.findOne({
      where: { token },
    });
  }

  /**
   * Validate invitation token
   */
  async validateToken(token: string, companyId: string): Promise<boolean> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, companyId },
    });

    if (!invitation) {
      return false;
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return false;
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return false;
    }

    return true;
  }
}
