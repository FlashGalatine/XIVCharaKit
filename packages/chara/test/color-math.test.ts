import { describe, expect, it } from 'vitest';
import {
  compositeHex,
  deltaE2000Lab,
  gamma2Hex,
  hexDeltaE,
} from '../src/appearance/color-math.js';

describe('color math against independent examples', () => {
  it.each([
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
    [[50, 0, 0], [50, -1, 2], 2.3669],
  ])('matches the Sharma/Wu/Dalal reference pair %j %j', (a, b, expected) => {
    expect(deltaE2000Lab(a, b)).toBeCloseTo(expected, 4);
    expect(deltaE2000Lab(b, a)).toBeCloseTo(expected, 4);
  });
  it('uses gamma-2 square-root decoding and preserves black', () => {
    expect(gamma2Hex([0, 0.25, 1])).toBe('#0080FF');
    expect(gamma2Hex([(240 / 255) ** 2, 0, 0])).toBe('#F00000');
    expect(gamma2Hex([0, 0, 0])).toBe('#000000');
    expect(gamma2Hex([-1, 2, 0])).toBe('#00FF00');
  });
  it('computes symmetric perceptual distance and linear-light compositing', () => {
    expect(hexDeltaE('#FF0000', '#FF0000')).toBeCloseTo(0, 8);
    expect(hexDeltaE('#FFFFFF', '#000000')).toBeCloseTo(100, 3);
    expect(compositeHex('#FFFFFF', '#000000', 0.5)).toBe('#BCBCBC');
    expect(compositeHex('#FFFFFF', '#000000', 0)).toBe('#000000');
    expect(compositeHex('#FFFFFF', '#000000', 1)).toBe('#FFFFFF');
  });
});
