const PLAYER_ID_KEY = "buzzcut.playerId";
const HANDLE_KEY = "buzzcut.handle";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getHandle(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(HANDLE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setHandle(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HANDLE_KEY, name);
  } catch {
    // silent fail — player can still play, handle just won't persist
  }
}

export function hasHandle(): boolean {
  return getHandle().length > 0;
}
