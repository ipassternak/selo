import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { AuthAccessPayload } from '@lib/types/auth';

export const AccessPayload = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request: { accessPayload: AuthAccessPayload } = ctx
      .switchToHttp()
      .getRequest();
    return request.accessPayload;
  },
);
