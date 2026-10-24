import { execFileSync } from 'node:child_process';

/**
 * Run a tool synchronously. With piped output execFileSync reports only "Command failed" plus
 * stderr, but TypeScript writes its diagnostics to stdout, so a failing compile of an installed
 * consumer showed none of its errors. The error thrown here carries both streams.
 */
export function runTool(
  file: string,
  args: readonly string[],
  options: { cwd?: string; timeout?: number } = {},
): string {
  try {
    return execFileSync(file, args, {
      ...options,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    const failure = error as Error & { stdout?: unknown; stderr?: unknown };
    const output = `${String(failure.stdout ?? '')}${String(failure.stderr ?? '')}`;
    throw new Error(`${failure.message}\n${output}`.trim(), { cause: error });
  }
}
