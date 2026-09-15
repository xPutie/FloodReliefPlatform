import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'flood-rescue-super-secret-key-change-in-prod',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
