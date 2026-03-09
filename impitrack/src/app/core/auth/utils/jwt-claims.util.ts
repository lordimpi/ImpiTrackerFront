interface JwtClaims {
  readonly email?: string;
  readonly unique_name?: string;
  readonly role?: string | readonly string[];
  readonly roles?: readonly string[];
  readonly 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | readonly string[];
}

export function readJwtClaims(token: string): JwtClaims | null {
  const segments = token.split('.');

  if (segments.length < 2) {
    return null;
  }

  try {
    const base64Url = segments[1];
    const padded = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
    const binary = globalThis.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const payload = new TextDecoder().decode(bytes);

    return JSON.parse(payload) as JwtClaims;
  } catch {
    return null;
  }
}

export function readJwtRoles(token: string): readonly string[] {
  const claims = readJwtClaims(token);

  if (!claims) {
    return [];
  }

  const rawRoles =
    claims.role ??
    claims.roles ??
    claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (!rawRoles) {
    return [];
  }

  if (Array.isArray(rawRoles)) {
    return [...rawRoles];
  }

  return [rawRoles as string];
}
