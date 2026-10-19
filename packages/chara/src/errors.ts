const messages = {
  INPUT_TOO_LARGE: 'Input exceeds the byte limit.',
  INVALID_UTF8: 'Input is not valid UTF-8.',
  INVALID_JSON: 'Input is not valid JSON.',
  NOT_CHARACTER: 'No supported character fields were found.',
  MAX_DEPTH: 'Input exceeds the depth limit.',
  MAX_NODES: 'Input exceeds the node limit.',
  MAX_KEY_LENGTH: 'A property name exceeds the length limit.',
  MAX_STRING_LENGTH: 'A string exceeds the length limit.',
  DUPLICATE_KEY: 'Duplicate property names are not supported.',
  INVALID_NUMBER: 'A numeric token cannot be represented safely.',
  INVALID_OPTIONS:
    'Reader limits must be positive integers within host ceilings.',
  INVALID_INPUT: 'Input must be a string or Uint8Array.',
  INVALID_MODEL: 'Model slots and lanes must be valid bounded identifiers.',
} as const;

export type CharaErrorCode = keyof typeof messages;

export class CharaInputError extends Error {
  readonly code: CharaErrorCode;
  constructor(code: CharaErrorCode) {
    super(messages[code]);
    this.name = 'CharaInputError';
    this.code = code;
  }
}
