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
  CONTACT: {
    SUBMIT: "/contact",
  },
} as const;

export default API_ROUTES;
