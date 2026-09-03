import { Schema } from 'effect';

const strongPassword = Schema.String.pipe(
  Schema.filter(
    (password) =>
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
    {
      message: () =>
        'Password must be at least 8 characters and include a lowercase letter, uppercase letter, number, and symbol',
    },
  ),
);

export class SignUpInput extends Schema.Class<SignUpInput>('SignUpInput')({
  password: strongPassword,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Schema.maxLength(255)),
  name: Schema.String.pipe(Schema.minLength(4), Schema.maxLength(255)),
}) {}

export class SignInInput extends Schema.Class<SignInInput>('SignInInput')({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(1)),
}) {}

export class TokenResponse extends Schema.Class<TokenResponse>('TokenResponse')({
  token: Schema.String,
}) {}
