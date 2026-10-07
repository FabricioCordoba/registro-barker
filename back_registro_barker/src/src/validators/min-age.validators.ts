import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function MinAgeValidator(minAge: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'MinAgeValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minAge],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false; // Si no hay fecha, la validación falla
          const minAge = args.constraints[0];
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDifference = today.getMonth() - birthDate.getMonth();
          const dayDifference = today.getDate() - birthDate.getDate();
          // Verifica si la edad es menor al mínimo permitido
          return (
            age > minAge ||
            (age === minAge && (monthDifference > 0 || (monthDifference === 0 && dayDifference >= 0)))
          );
        },
        defaultMessage(args: ValidationArguments) {
          const minAge = args.constraints[0];
          return `La edad debe ser de al menos ${minAge} años.`;
        },
      },
    });
  };
}
