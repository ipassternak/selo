import { applyDecorators } from '@nestjs/common';
import { ClassConstructor, Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';

type ValidationStrategy<T> = (obj: T) => ClassConstructor<unknown>;

export const ValidateStrategy = <T>(
  strategy: ValidationStrategy<T>,
): PropertyDecorator =>
  applyDecorators(
    IsObject(),
    ValidateNested(),
    Type((params): ClassConstructor<unknown> => {
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      if (!params) return class {};

      const Dto = strategy(<T>params.object);

      return Dto;
    }),
  );
