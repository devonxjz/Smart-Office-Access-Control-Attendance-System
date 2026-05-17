const SESSION_KEY = 'userSession';

interface UserSession {
  name?: string;
  email?: string;
  role?: string;
}

export function getSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as UserSession;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const session = getSession();
  return session !== null && typeof session === 'object';
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
