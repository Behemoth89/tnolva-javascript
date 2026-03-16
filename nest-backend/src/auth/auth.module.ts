import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';
import { RoleGuard } from './guards/roles/role.guard';
import { OwnerGuard } from './guards/roles/owner.guard';
import { AdminGuard } from './guards/roles/admin.guard';
import { MemberGuard } from './guards/roles/member.guard';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiration = configService.get<string>('JWT_EXPIRATION') || '1d';

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return {
          secret,
          signOptions: { expiresIn: expiration } as JwtSignOptions,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
    CompaniesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RoleGuard,
    OwnerGuard,
    AdminGuard,
    MemberGuard,
    RefreshTokenRepository,
    RefreshTokenService,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    RoleGuard,
    OwnerGuard,
    AdminGuard,
    MemberGuard,
    RefreshTokenService,
  ],
})
export class AuthModule {}
