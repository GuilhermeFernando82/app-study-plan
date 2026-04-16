import axios from "axios";
import { Platform } from "react-native";
import { clearSession, getSession, setSession } from "./storage";

function normalizeEnvUrl(value) {
  if (!value) return "";
  return String(value).replace(/^['"]|['"]$/g, "").trim();
}

const rawApiUrl = normalizeEnvUrl(process.env.EXPO_PUBLIC_API_ADDRESS);
const rawStudyUrl = normalizeEnvUrl(process.env.EXPO_PUBLIC_STUDY_API_ADDRESS);

// RN app must use EXPO_PUBLIC vars. Do not fallback to NEXT_PUBLIC to avoid old web config leaks.
const API_BASE_URL = rawApiUrl;
const STUDY_BASE_URL = rawStudyUrl || API_BASE_URL;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log("[api-env]", {
    platform: Platform.OS,
    EXPO_PUBLIC_API_ADDRESS: process.env.EXPO_PUBLIC_API_ADDRESS,
    EXPO_PUBLIC_STUDY_API_ADDRESS: process.env.EXPO_PUBLIC_STUDY_API_ADDRESS,
    apiBaseResolved: API_BASE_URL,
  });

  if (!API_BASE_URL) {
    // eslint-disable-next-line no-console
    console.warn("[api] EXPO_PUBLIC_API_ADDRESS nao definido no .env");
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const studyApi = axios.create({
  baseURL: STUDY_BASE_URL,
  timeout: 15000,
});

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (config) => {
  const { authToken } = await getSession();
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || originalRequest._retry || status !== 401) {
      return Promise.reject(error);
    }

    const { refreshToken } = await getSession();
    if (!refreshToken) {
      // Sem refresh token (ex.: tela de login), retorna o 401 original.
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const resp = await axios.post(`${API_BASE_URL}/Users/refresh-token`, {
        refreshToken,
      });

      await setSession({
        authToken: resp.data.token,
        refreshToken: resp.data.refreshToken,
      });

      originalRequest.headers.Authorization = `Bearer ${resp.data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      await clearSession();
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      return Promise.reject(refreshError);
    }
  },
);

export function getApiBaseUrl() {
  return API_BASE_URL;
}
