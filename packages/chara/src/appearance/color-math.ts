type Triple = readonly [number, number, number];
export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const sin = (degrees: number) => Math.sin(radians(degrees));
const cos = (degrees: number) => Math.cos(radians(degrees));
const hex = (rgb: readonly number[]) =>
  `#${rgb
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
const rgb = (value: string): Triple => [
  Number.parseInt(value.slice(1, 3), 16),
  Number.parseInt(value.slice(3, 5), 16),
  Number.parseInt(value.slice(5, 7), 16),
];
const linear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const encoded = (channel: number) =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;

export function gamma2Hex(components: readonly number[]): string {
  return hex(
    components.slice(0, 3).map((channel) => Math.sqrt(clamp01(channel)) * 255),
  );
}
function lab(value: string): Triple {
  const [r, g, b] = rgb(value).map((channel) => linear(channel / 255)) as [
    number,
    number,
    number,
  ];
  const f = (n: number) =>
    n > 216 / 24389 ? Math.cbrt(n) : ((24389 / 27) * n + 16) / 116;
  const x = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047);
  const y = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175);
  const z = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIEDE2000, unit parametric factors; see the Sharma/Wu/Dalal reference in notices. */
export function deltaE2000Lab(
  first: readonly number[],
  second: readonly number[],
): number {
  const [l1, a1, b1] = first as Triple;
  const [l2, a2, b2] = second as Triple;
  const c1 = Math.hypot(a1, b1),
    c2 = Math.hypot(a2, b2);
  const meanC = (c1 + c2) / 2;
  const ratio = (c: number) => Math.sqrt(c ** 7 / (c ** 7 + 25 ** 7));
  const g = (1 - ratio(meanC)) / 2;
  const ap1 = (1 + g) * a1,
    ap2 = (1 + g) * a2;
  const cp1 = Math.hypot(ap1, b1),
    cp2 = Math.hypot(ap2, b2);
  const hue = (a: number, b: number, c: number) =>
    c === 0 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  const h1 = hue(ap1, b1, cp1),
    h2 = hue(ap2, b2, cp2);
  const deltaL = l2 - l1,
    deltaC = cp2 - cp1;
  let deltaHue = h2 - h1;
  if (cp1 * cp2 === 0) deltaHue = 0;
  else if (deltaHue > 180) deltaHue -= 360;
  else if (deltaHue < -180) deltaHue += 360;
  const deltaH = 2 * Math.sqrt(cp1 * cp2) * sin(deltaHue / 2);
  const meanL = (l1 + l2) / 2,
    meanCp = (cp1 + cp2) / 2;
  let meanHue = h1 + h2;
  if (cp1 * cp2 !== 0) {
    if (Math.abs(h1 - h2) <= 180) meanHue /= 2;
    else meanHue = (meanHue + (meanHue < 360 ? 360 : -360)) / 2;
  }
  const t =
    1 -
    0.17 * cos(meanHue - 30) +
    0.24 * cos(2 * meanHue) +
    0.32 * cos(3 * meanHue + 6) -
    0.2 * cos(4 * meanHue - 63);
  const sl =
    1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2);
  const sc = 1 + 0.045 * meanCp,
    sh = 1 + 0.015 * meanCp * t;
  const rotation =
    -2 * ratio(meanCp) * sin(60 * Math.exp(-(((meanHue - 275) / 25) ** 2)));
  return Math.sqrt(
    (deltaL / sl) ** 2 +
      (deltaC / sc) ** 2 +
      (deltaH / sh) ** 2 +
      rotation * (deltaC / sc) * (deltaH / sh),
  );
}
export const hexDeltaE = (first: string, second: string): number =>
  deltaE2000Lab(lab(first), lab(second));
export function compositeHex(top: string, base: string, alpha: number): string {
  const bottom = rgb(base);
  return hex(
    rgb(top).map(
      (channel, index) =>
        255 *
        encoded(
          linear(channel / 255) * clamp01(alpha) +
            linear((bottom[index] as number) / 255) * (1 - clamp01(alpha)),
        ),
    ),
  );
}
