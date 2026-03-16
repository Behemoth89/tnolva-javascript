import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  InvitationsService,
  CreateInvitationDto,
  AcceptInvitationDto,
} from '../../companies/invitations/invitations.service';
import { InvitationStatus } from '../../companies/entities/company-invitation.entity';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { UserRepository } from '../../users/repositories/user.repository';

describe('InvitationsService', () => {
  let service: InvitationsService;

  const mockInvitationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockUserCompanyRepository = {
    findByUserAndCompany: jest.fn(),
    addUserToCompany: jest.fn(),
  };

  const mockUserRepository = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue(mockInvitationRepository),
          },
        },
        { provide: UserCompanyRepository, useValue: mockUserCompanyRepository },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);

    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    const dto: CreateInvitationDto = {
      email: 'test@example.com',
      companyId: 'company-123',
      invitedByUserId: 'user-123',
    };

    it('should throw ConflictException if user is already a member', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any);
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        id: 'uc-1',
      } as any);

      await expect(service.createInvitation(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if pending invitation already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue(null);
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        email: dto.email,
        companyId: dto.companyId,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      await expect(service.createInvitation(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create invitation successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue(null);
      mockInvitationRepository.findOne.mockResolvedValue(null);
      mockInvitationRepository.create.mockReturnValue({
        email: dto.email,
        companyId: dto.companyId,
        invitedByUserId: dto.invitedByUserId,
        token: 'test-token',
        expiresAt: new Date(),
        status: InvitationStatus.PENDING,
      } as any);
      mockInvitationRepository.save.mockResolvedValue({
        id: 'inv-new',
        ...dto,
        token: 'test-token',
      } as any);

      const result = await service.createInvitation(dto);

      expect(result).toBeDefined();
      expect(mockInvitationRepository.create).toHaveBeenCalled();
      expect(mockInvitationRepository.save).toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    const dto: AcceptInvitationDto = {
      token: 'valid-token',
      companyId: 'company-123',
      email: 'test@example.com',
      userId: 'user-123',
    };

    it('should throw NotFoundException for invalid token', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for wrong company', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        token: dto.token,
        companyId: 'different-company',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for already accepted invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        token: dto.token,
        companyId: dto.companyId,
        status: InvitationStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for cancelled invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        token: dto.token,
        companyId: dto.companyId,
        status: InvitationStatus.CANCELLED,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        token: dto.token,
        companyId: dto.companyId,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
      } as any);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        token: dto.token,
        companyId: dto.companyId,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept invitation successfully', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        token: dto.token,
        companyId: dto.companyId,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any);
      mockUserCompanyRepository.addUserToCompany.mockResolvedValue({} as any);
      mockInvitationRepository.update.mockResolvedValue({} as any);

      await service.acceptInvitation(dto);

      expect(mockUserCompanyRepository.addUserToCompany).toHaveBeenCalledWith(
        'user-1',
        dto.companyId,
        'member',
      );
      expect(mockInvitationRepository.update).toHaveBeenCalledWith('inv-1', {
        status: InvitationStatus.ACCEPTED,
      });
    });
  });

  describe('listInvitations', () => {
    it('should return pending invitations for company', async () => {
      const invitations = [
        { id: 'inv-1', status: InvitationStatus.PENDING },
        { id: 'inv-2', status: InvitationStatus.PENDING },
      ];
      mockInvitationRepository.find.mockResolvedValue(invitations as any);

      const result = await service.listInvitations('company-123');

      expect(result).toEqual(invitations);
      expect(mockInvitationRepository.find).toHaveBeenCalledWith({
        where: { companyId: 'company-123', status: InvitationStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('cancelInvitation', () => {
    it('should throw NotFoundException if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelInvitation('inv-1', 'company-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if invitation belongs to different company', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        companyId: 'different-company',
        status: InvitationStatus.PENDING,
      } as any);

      await expect(
        service.cancelInvitation('inv-1', 'company-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        companyId: 'company-123',
        status: InvitationStatus.ACCEPTED,
      } as any);

      await expect(
        service.cancelInvitation('inv-1', 'company-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cancel invitation successfully', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        id: 'inv-1',
        companyId: 'company-123',
        status: InvitationStatus.PENDING,
      } as any);
      mockInvitationRepository.update.mockResolvedValue({} as any);

      await service.cancelInvitation('inv-1', 'company-123');

      expect(mockInvitationRepository.update).toHaveBeenCalledWith('inv-1', {
        status: InvitationStatus.CANCELLED,
      });
    });
  });

  describe('validateToken', () => {
    it('should return false if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      const result = await service.validateToken(
        'invalid-token',
        'company-123',
      );

      expect(result).toBe(false);
    });

    it('should return false if invitation is not pending', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        status: InvitationStatus.ACCEPTED,
      } as any);

      const result = await service.validateToken('valid-token', 'company-123');

      expect(result).toBe(false);
    });

    it('should return false if invitation is expired', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
      } as any);

      const result = await service.validateToken('valid-token', 'company-123');

      expect(result).toBe(false);
    });

    it('should return true for valid token', async () => {
      mockInvitationRepository.findOne.mockResolvedValue({
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      const result = await service.validateToken('valid-token', 'company-123');

      expect(result).toBe(true);
    });
  });
});
