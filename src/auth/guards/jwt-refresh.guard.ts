import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends PassportGuard('jwt-refresh') {
  constructor() {
    super({
      property: 'refreshPayload',
    });
  }
}
