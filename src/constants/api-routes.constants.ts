const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  USERS: {
    LIST: "/users",
    BY_ID: (id: string) => `/users/${id}`,
  },
  TRACKING: {
    ABANDON: "/api/abandon",
    WRITE: "/api/tracking",
  },
  ELEVENLABS: {
    SIGNED_URL: "/api/elevenlabs/signed-url",
    TOKEN: "/api/elevenlabs/token",
  },
} as const;

export default API_ROUTES;
