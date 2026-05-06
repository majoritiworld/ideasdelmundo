const WEB_ROUTES = {
  HOME: "/",
  BLUEPRINT: {
    BY_SLUG: (slug: string) => `/blueprint/${slug}`,
    AUTH_CALLBACK: "/auth/callback",
  },
  RESUME: {
    BY_SESSION_ID: (sessionId: string) => `/resume/${sessionId}`,
  },
  INTERNAL: {
    LOGIN: "/internal/login",
    SESSIONS: "/internal/sessions",
    SESSION_TRANSCRIPT: (id: string) => `/internal/sessions/${id}/transcript`,
    BLUEPRINTS: "/internal/blueprints",
    BLUEPRINT_BY_ID: (id: string) => `/internal/blueprints/${id}`,
    AUTH_CALLBACK: "/internal/auth/callback",
    LOGOUT: "/internal/logout",
  },
} as const;

export default WEB_ROUTES;
