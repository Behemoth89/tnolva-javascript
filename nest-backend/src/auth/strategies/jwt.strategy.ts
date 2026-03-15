import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string | null;
  companies: Array<{ companyId: string; role: string }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private userCompanyRepository: UserCompanyRepository,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findByIdWithDeleted(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Get companies from user_companies table if not in token
    let companies = payload.companies;
    if (!companies || companies.length === 0) {
      // Try to get companies from database
      companies = await this.userCompanyRepository.getCompaniesForUser(
        payload.sub,
      );

      // Fallback to legacy companyId if no companies found
      if (companies.length === 0 && payload.companyId) {
        companies = [{ companyId: payload.companyId, role: 'member' }];
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      companies,
    };
  }
}
