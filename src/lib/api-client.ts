import axios, { type AxiosInstance, type AxiosError } from "axios";
import { CONFIG } from "@/lib/app-config";

// ----------------------------------------------------------------------

/**
 * Base URL for the proxy — requests go to our own domain, then the proxy
 * forwards them to the real API. This keeps the real API URL hidden from the
 * client and avoids CORS issues.
 *
 * - Client (browser): uses relative /api/proxy (same-origin)
 * - Server (SSR):     uses full URL from NEXT_PUBLIC_WEB_URL
 */
const getProxyBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }
  return `${CONFIG.webUrl}/api/proxy`;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getProxyBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ----------------------------------------------------------------------
// Interceptors — wired after creation so they can reference the stores
// lazily (avoids circular-import issues with Zustand stores).

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    import("@/store/loader.store").then(({ useLoaderStore }) => {
      useLoaderStore.getState().add("axios");
    });
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      import("@/store/loader.store").then(({ useLoaderStore }) => {
        useLoaderStore.getState().remove("axios");
      });
    }
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (typeof window !== "undefined") {
      import("@/store/loader.store").then(({ useLoaderStore }) => {
        useLoaderStore.getState().remove("axios");
      });

      const status = error.response?.status ?? 0;
      const message =
        error.response?.data?.message ?? error.message ?? "An unexpected error occurred";

      if (status >= 400) {
        import("@/lib/toast").then(({ toastError }) => {
          const title = status >= 500 ? "Server error" : "Request failed";
          toastError(title, message);
        });
      }
    }

    return Promise.reject(error);
  }
);
