const ACCESS_KEY = "hd_access";
const REFRESH_KEY = "hd_refresh";

export const getAccessToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);

export function setTokens(access: string, refresh?: string | null) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
