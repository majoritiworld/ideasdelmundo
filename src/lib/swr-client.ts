import { apiClient } from "@/lib/api-client";

// ----------------------------------------------------------------------

/**
 * Typed SWR fetcher using the shared apiClient (Axios).
 * Inherits base URL, credentials, and all interceptors automatically.
 *
 * @example
 * const { data } = useSWR<User[]>("/users", fetcher);
 */
export const fetcher = <T>(url: string): Promise<T> =>
  apiClient.get<T>(url).then((res) => res.data);

/**
 * Mutation executor for useSWRMutation.
 * Supports POST / PUT / PATCH / DELETE via the `method` key in the extra arg.
 *
 * @example
 * const { trigger } = useSWRMutation("/users", mutator);
 * trigger({ method: "POST", data: newUser });
 */
export const mutator = <TData, TArg extends { method?: string; data?: TData }>(
  url: string,
  { arg }: { arg: TArg }
): Promise<TData> => {
  const { method = "POST", data } = arg;
  return apiClient.request<TData>({ url, method, data }).then((res) => res.data);
};
