import { Schema } from 'effect';

export class IdParam extends Schema.Class<IdParam>('IdParam')({ id: Schema.String }) {}
