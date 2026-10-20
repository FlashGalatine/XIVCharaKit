/** Reject common accidental private/build inputs without echoing their contents. */
export function assertPublicArtifact(path: string, text: string): void {
  const normalized = path.replaceAll('\\', '/');
  if (
    normalized.startsWith('/') ||
    /^[a-z]:/i.test(normalized) ||
    normalized
      .split('/')
      .some((part) => part === '..' || part.startsWith('.env')) ||
    /\.(?:map|cmp)$/i.test(normalized) ||
    /[a-z]:[\\/]+(?:Users|dev)[\\/]+/i.test(text) ||
    /\/(?:home|Users|workspaces?|tmp|private\/var|var\/folders)\//.test(text) ||
    /CharaSamples|PRIVATE_[A-Z_]*CANARY|sourceMappingURL\s*=/.test(text) ||
    /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|gh[pousr]_[a-zA-Z0-9]{20,}/.test(
      text,
    )
  )
    throw new Error('Disallowed content in public artifact.');
}
