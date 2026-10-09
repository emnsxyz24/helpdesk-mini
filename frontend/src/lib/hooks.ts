import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api";
import type { Me } from "./types";

export function useMe() {
  return useQuery<Me, Error>({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me>("/auth/me"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
