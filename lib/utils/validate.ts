import { HttpStatus, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ValidationError,
  ValidatorOptions,
  validate as validateDto,
} from 'class-validator';

import { AppException } from './exception';

export const validate = async <T extends object>(
  Dto: Type<T>,
  data: unknown,
  options: ValidatorOptions = {},
): Promise<[ValidationError[] | null, T]> => {
  const res = plainToInstance(Dto, data, {
    exposeDefaultValues: true,
    enableImplicitConversion: true,
  });

  const errors = await validateDto(res, {
    whitelist: true,
    stopAtFirstError: true,
    skipMissingProperties: false,
    ...options,
  });

  return [errors.length > 0 ? errors : null, res];
};

export const validateOrThrow = async <T extends object>(
  Dto: Type<T>,
  data: unknown,
  options: ValidatorOptions = {},
): Promise<T> => {
  const [errors, res] = await validate(Dto, data, options);

  if (errors)
    throw new AppException(
      'Data validation failed',
      HttpStatus.UNPROCESSABLE_ENTITY,
      null,
      errors,
    );

  return res;
};
