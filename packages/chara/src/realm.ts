// Checks that do not depend on which JavaScript realm created a value: a typed array from an
// iframe, a vm context or a test environment fails `instanceof` against this realm's constructors.

const typedArrayTag = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype),
  Symbol.toStringTag,
)?.get;

/**
 * A Uint8Array view of this realm over the same memory when `value` is a real Uint8Array of any
 * realm, else null. The %TypedArray% tag getter reads the internal slot, so unlike
 * `instanceof` it works across realms and, unlike `Object.prototype.toString`, cannot be faked.
 */
export function asBytes(value: unknown): Uint8Array | null {
  if (typedArrayTag?.call(value) !== 'Uint8Array') return null;
  const view = value as Uint8Array;
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/** The members of an AbortSignal that this library uses, whichever realm or polyfill made it. */
export function isAbortSignalLike(value: unknown): value is AbortSignal {
  if (typeof value !== 'object' || value === null) return false;
  const signal = value as Partial<AbortSignal>;
  return (
    typeof signal.aborted === 'boolean' &&
    typeof signal.addEventListener === 'function' &&
    typeof signal.removeEventListener === 'function'
  );
}
