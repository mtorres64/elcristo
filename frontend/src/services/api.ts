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

// --- Token storage en memoria (no localStorage) ---
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  _accessToken = access;
  _refreshToken = refresh;
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
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
