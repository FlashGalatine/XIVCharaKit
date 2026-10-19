import { CharaInputError } from './errors.js';
import { EQUIPMENT_SLOTS, isRecord } from './field-spec.js';
import type { EquipmentModel } from './types.js';

export function isUint(value: unknown, max = 65535): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

export function modelKey(model: EquipmentModel): string {
  if (
    !isRecord(model) ||
    !(EQUIPMENT_SLOTS as readonly unknown[]).includes(model.slot) ||
    !isUint(model.base) ||
    !isUint(model.variant)
  )
    throw new CharaInputError('INVALID_MODEL');
  const weapon = model.slot === 'MainHand' || model.slot === 'OffHand';
  if (weapon ? !isUint(model.set) : model.set !== undefined)
    throw new CharaInputError('INVALID_MODEL');
  if (weapon)
    return String(
      BigInt(model.set as number) +
        (BigInt(model.base) << 16n) +
        (BigInt(model.variant) << 32n),
    );
  return String(model.base + model.variant * 65536);
}
