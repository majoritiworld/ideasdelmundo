type ApiErrorShape = {
  response: {
    data: { message?: string; error?: string };
    status: number;
  };
};

/** Type guard — checks if an unknown error has an Axios-style response shape. */
export const isApiError = (error: unknown): error is ApiErrorShape =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  typeof (error as ApiErrorShape).response?.data === "object";

/** Extracts a human-readable message from any thrown value. */
export const parseApiError = (
  error: unknown,
  fallback = "An unexpected error occurred"
): string => {
  if (isApiError(error)) {
    return error.response.data.message || error.response.data.error || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error || fallback;
  return fallback;
};
