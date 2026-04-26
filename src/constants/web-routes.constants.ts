const WEB_ROUTES = {
  HOME: "/",
  INTERNAL: {
    LOGIN: "/internal/login",
    SESSIONS: "/internal/sessions",
    AUTH_CALLBACK: "/internal/auth/callback",
    LOGOUT: "/internal/logout",
  },
} as const;

export default WEB_ROUTES;
