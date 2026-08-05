import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Inyecta el access token en cada request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo global de errores 401 → intento de refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshed = await tryRefresh();
      if (refreshed) {
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

// --- Token storage en localStorage ---
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let _accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let _refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

export function setTokens(access: string, refresh: string) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getStoredRefreshToken() {
  return _refreshToken;
}

function getAccessToken() {
  return _accessToken;
}

async function tryRefresh(): Promise<boolean> {
  if (!_refreshToken) return false;
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/auth/refresh`,
      { refresh_token: _refreshToken }
    );
    _accessToken = res.data.access_token;
    return true;
  } catch {
    clearTokens();
    return false;
  }
}
