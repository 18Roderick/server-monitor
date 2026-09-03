import { Schema } from 'effect';

export class UpdateUserInput extends Schema.Class<UpdateUserInput>('UpdateUserInput')({
  name: Schema.optional(Schema.String.pipe(Schema.minLength(4), Schema.maxLength(255))),
}) {}

export class UserSummary extends Schema.Class<UserSummary>('UserSummary')({
  email: Schema.String,
  name: Schema.String,
  lastName: Schema.String,
  updatedAt: Schema.Date,
}) {}

// `findAll` is admin-only and not implemented yet — preserved as a stub message.
export class FindAllUsersResponse extends Schema.Class<FindAllUsersResponse>(
  'FindAllUsersResponse',
)({
  result: Schema.String,
}) {}

export class RemoveUserResponse extends Schema.Class<RemoveUserResponse>('RemoveUserResponse')({
  affected: Schema.Unknown,
}) {}
