import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    // Seed demo accounts if ENABLE_DEMO_ACCOUNTS=true (default true in dev)
    const enableDemo = process.env.ENABLE_DEMO_ACCOUNTS !== 'false';
    if (enableDemo) {
      await this.seedDemoAccounts();
    }
  }

  private async seedDemoAccounts() {
    const demoUsers = [
      {
        email: 'coordinator@demo.local',
        name: 'Nguyễn Văn Điều Phối',
        phone: '0901234567',
        role: 'COORDINATOR' as const,
        password: 'Password123!',
      },
      {
        email: 'team@demo.local',
        name: 'Đội Cứu Hộ Số 1',
        phone: '0907654321',
        role: 'TEAM_MEMBER' as const,
        password: 'Password123!',
      },
      {
        email: 'relief@demo.local',
        name: 'Cán Bộ Cứu Trợ',
        phone: '0908889999',
        role: 'RELIEF_STAFF' as const,
        password: 'Password123!',
      },
      {
        email: 'admin@demo.local',
        name: 'Quản Trị Viên Hệ Thống',
        phone: '0909999999',
        role: 'ADMIN' as const,
        password: 'Password123!',
      },
    ];

    for (const u of demoUsers) {
      let user = await this.prisma.user.findUnique({
        where: { email: u.email },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        user = await this.prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            phone: u.phone,
            role: u.role,
            password: hashedPassword,
          },
        });
        this.logger.log(`Created demo user: ${u.email} (${u.role})`);
      }

      if (u.role === 'TEAM_MEMBER') {
        const existingTeam = await this.prisma.rescueTeam.findFirst({
          where: { name: u.name },
        });
        if (!existingTeam) {
          await this.prisma.rescueTeam.create({
            data: {
              id: user.id,
              name: u.name,
              status: 'AVAILABLE',
              capacity: 5,
              capability: 'Xuồng máy, Y tế, Phao cứu sinh',
            },
          });
          this.logger.log(`Created matching demo rescue team for user: ${user.id}`);
        }
      }
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      await this.auditService.log(
        null,
        'LOGIN_FAILED',
        'User',
        null,
        { email: email.toLowerCase().trim(), reason: 'User not found' },
      );
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.auditService.log(
        user.id,
        'LOGIN_FAILED',
        'User',
        user.id,
        { email: user.email, reason: 'Invalid password' },
      );
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log(
      user.id,
      'LOGIN_SUCCESS',
      'User',
      user.id,
      { role: user.role },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }

    return user;
  }
}
