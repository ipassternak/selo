import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends PassportGuard('jwt-access') {
  constructor() {
    super({
      property: 'accessPayload',
    });
  }
}
