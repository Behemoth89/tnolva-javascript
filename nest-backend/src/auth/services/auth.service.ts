import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { CompaniesService } from '../../companies/services/companies.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../../users/entities/user.entity';

export interface CompanyInfo {
  companyId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private userCompanyRepository: UserCompanyRepository,
    private jwtService: JwtService,
    private companiesService: CompaniesService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: { id: string; email: string; companies: CompanyInfo[] };
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password, firstName, lastName, companyId, companyName } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with explicit rounds (12 is a good balance between security and performance)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      companyId: companyId || null,
    });

    // Handle company creation or association
    let companies: CompanyInfo[] = [];

    if (companyName) {
      // Create new company and associate user as admin
      const company = await this.companiesService.createWithUser(
        companyName,
        user.id,
      );
      companies = [{ companyId: company.id, role: 'admin' }];
    } else if (companyId) {
      // Add user to existing company
      await this.userCompanyRepository.addUserToCompany(
        user.id,
        companyId,
        'admin',
      );
      companies = [{ companyId, role: 'admin' }];
    } else {
      // Get companies from user_companies table
      companies = await this.userCompanyRepository.getCompaniesForUser(user.id);
    }

    // If no companies, use legacy companyId
    if (companies.length === 0 && user.companyId) {
      companies = [{ companyId: user.companyId, role: 'member' }];
    }

    // Generate JWT with companies array
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: companies.length > 0 ? companies[0].companyId : null,
      companies,
    };
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const { token: refreshToken } =
      await this.refreshTokenService.createRefreshToken(user.id);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        companies,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: { id: string; email: string; companies: CompanyInfo[] };
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password, companyId } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Get companies for the user
    let companies = await this.userCompanyRepository.getCompaniesForUser(
      user.id,
    );

    // If no companies, use legacy companyId
    if (companies.length === 0 && user.companyId) {
      companies = [{ companyId: user.companyId, role: 'member' }];
    }

    // If companyId is provided in login, validate access and use it
    if (companyId) {
      const hasAccess = companies.some((c) => c.companyId === companyId);
      if (!hasAccess) {
        throw new UnauthorizedException(
          'User does not have access to this company',
        );
      }
    }

    // Use the requested company or first company as the active one
    const activeCompany =
      companyId || (companies.length > 0 ? companies[0].companyId : null);

    // Generate JWT with companies array
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: activeCompany,
      companies,
    };
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const { token: refreshToken } =
      await this.refreshTokenService.createRefreshToken(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        companies,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    userId: string,
    currentCompanyId?: string,
  ): Promise<{
    accessToken: string;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    // Get companies from user_companies table
    let companies =
      await this.userCompanyRepository.getCompaniesForUser(userId);

    // If no companies, use legacy companyId
    if (companies.length === 0 && user.companyId) {
      companies = [{ companyId: user.companyId, role: 'member' }];
    }

    // Handle company removal: validate current company is still in the list
    let activeCompany: string | null = null;
    if (currentCompanyId) {
      // Check if the current company is still accessible
      const hasAccess = companies.some((c) => c.companyId === currentCompanyId);
      if (hasAccess) {
        activeCompany = currentCompanyId;
      } else {
        // Company was removed - log and default to first available
        this.logger.warn(
          `Company ${currentCompanyId} no longer accessible for user ${userId}, defaulting to first available`,
        );
        activeCompany = companies.length > 0 ? companies[0].companyId : null;
      }
    } else {
      activeCompany = companies.length > 0 ? companies[0].companyId : null;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: activeCompany,
      companies,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * Refresh access token using refresh token (no JWT required)
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenEntity =
      await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(refreshTokenEntity.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    // Get companies for the user
    let companies = await this.userCompanyRepository.getCompaniesForUser(
      user.id,
    );

    // If no companies, use legacy companyId
    if (companies.length === 0 && user.companyId) {
      companies = [{ companyId: user.companyId, role: 'member' }];
    }

    // Rotate the refresh token
    const rotated =
      await this.refreshTokenService.rotateRefreshToken(refreshToken);
    if (!rotated) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new access token
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: companies.length > 0 ? companies[0].companyId : null,
      companies,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Refresh token rotated for user: ${user.email}`);

    return {
      accessToken,
      refreshToken: rotated.newToken,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Switch active company for the user
   * Returns a new token with the new company as active
   */
  async switchCompany(
    userId: string,
    newCompanyId: string,
  ): Promise<{ accessToken: string }> {
    // Get companies from database
    let companies =
      await this.userCompanyRepository.getCompaniesForUser(userId);

    // If no companies, use legacy companyId
    const user = await this.userRepository.findById(userId);
    if (companies.length === 0 && user?.companyId) {
      companies = [{ companyId: user.companyId, role: 'member' }];
    }

    // Validate user has access to the new company
    const hasAccess = companies.some((c) => c.companyId === newCompanyId);
    if (!hasAccess) {
      throw new UnauthorizedException(
        'User does not have access to this company',
      );
    }

    // Generate new token with the new company as active
    const payload = {
      sub: userId,
      email: user?.email,
      companyId: newCompanyId,
      companies,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User ${userId} switched to company ${newCompanyId}`);

    return { accessToken };
  }

  /**
   * Logout - revoke a single refresh token
   */
  async logout(refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices - revoke all refresh tokens for a user
   */
  async logoutAll(userId: string): Promise<{ message: string; count: number }> {
    const count = await this.refreshTokenService.revokeAllUserTokens(userId);
    return { message: 'Logged out from all devices', count };
  }
}
