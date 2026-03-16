import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { CompaniesModule } from './companies/companies.module';
import { User } from './users/entities/user.entity';
import { UserCompany } from './users/entities/user-company.entity';
import { Company } from './companies/entities/company.entity';
import { CompanyInvitation } from './companies/entities/company-invitation.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SoftDeleteSubscriber } from './common/subscribers/soft-delete.subscriber';

@Module({
  imports: [
    // Throttler rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_DATABASE') || 'nest_backend',
        entities: [User, UserCompany, Company, CompanyInvitation],
        // Disable synchronize in all environments - use migrations instead
        // This prevents issues with tables already existing
        synchronize: false,
        // Run migrations on startup in both development and production
        migrationsRun: true,
        migrationsTableName: 'migrations',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        logging: configService.get<string>('NODE_ENV') !== 'production',
        subscribers: [SoftDeleteSubscriber],
      }),
      inject: [ConfigService],
    }),

    // Application modules
    CommonModule,
    AuthModule,
    UsersModule,
    HealthModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
