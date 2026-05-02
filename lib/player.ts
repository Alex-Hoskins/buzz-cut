const PLAYER_ID_KEY = "buzzcut.playerId";
const HANDLE_KEY = "buzzcut.handle";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getHandle(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(HANDLE_KEY) ?? "";
}

export function setHandle(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HANDLE_KEY, name);
}

export function hasHandle(): boolean {
  return getHandle().length > 0;
}
