import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../users/repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: { id: string; email: string };
    accessToken: string;
  }> {
    const { email, password, firstName, lastName } = registerDto;

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
      companyId: registerDto.companyId || null,
    });

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: { id: string; email: string };
    accessToken: string;
  }> {
    const { email, password } = loginDto;

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

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
