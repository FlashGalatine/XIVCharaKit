import type { Issue } from './types.js';

export function boundedPath(
  path: readonly (string | number)[],
): (string | number)[] {
  const result: (string | number)[] = [];
  let remaining = 256;
  for (const part of path) {
    const text = String(part);
    const separator = result.length > 0 ? 1 : 0;
    const room = remaining - separator;
    if (room <= 0) break;
    if (text.length > room) {
      result.push(`${text.slice(0, room - 1)}…`);
      break;
    }
    result.push(part);
    remaining -= text.length + separator;
  }
  return result;
}

export class IssueCollector {
  readonly issues: Issue[] = [];
  constructor(private readonly max = 64) {}
  add(
    code: string,
    path: readonly (string | number)[],
    message: string,
    severity: Issue['severity'] = 'warning',
  ): void {
    if (this.issues.length < this.max) {
      this.issues.push({
        code,
        severity,
        path: boundedPath(path),
        message: message.slice(0, 256),
      });
    } else {
      this.issues[this.max - 1] = {
        code: 'ISSUES_TRUNCATED',
        severity: 'warning',
        path: [],
        message: 'Additional diagnostics were omitted.',
      };
    }
  }
}
