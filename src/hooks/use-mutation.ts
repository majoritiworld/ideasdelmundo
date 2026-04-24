"use client";

import useSWRMutation from "swr/mutation";
import { mutator } from "@/lib/swr-client";

// ----------------------------------------------------------------------

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export type MutationArg<TData = unknown> = {
  method?: MutationMethod;
  data?: TData;
};

export type UseMutationReturn<TResult, TData = unknown> = {
  trigger: (arg: MutationArg<TData>) => Promise<TResult | undefined>;
  isMutating: boolean;
  data: TResult | undefined;
  error: Error | undefined;
  reset: () => void;
};

/**
 * Mutation hook powered by SWR for POST / PUT / PATCH / DELETE requests.
 * Automatically uses the shared apiClient (with interceptors + credentials).
 *
 * @example
 * const { trigger, isMutating } = useMutation<User>("/users");
 * await trigger({ method: "POST", data: { name: "Alice" } });
 *
 * const { trigger } = useMutation<void>(`/users/${id}`);
 * await trigger({ method: "DELETE" });
 */
export function useMutation<TResult, TData = unknown>(
  url: string
): UseMutationReturn<TResult, TData> {
  const { trigger, isMutating, data, error, reset } = useSWRMutation<
    TResult,
    Error,
    string,
    MutationArg<TData>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  >(url, mutator as any);

  return {
    trigger,
    isMutating,
    data,
    error,
    reset,
  };
}
