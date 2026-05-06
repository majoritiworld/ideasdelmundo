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
  CHAT: "/api/chat",
  ARCHETYPE: "/api/archetype",
  NOTIFY: "/api/notify",
  PAUSE: "/api/pause",
  RESUME: {
    BY_SESSION_ID: (sessionId: string) => `/api/resume/${sessionId}`,
  },
} as const;

export default API_ROUTES;
