import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

const TOKEN_KEY = "yaya_pos_token";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const state = useMemo(() => {
    const user = meQuery.data ?? null;
    return {
      user,
      loading: meQuery.isLoading,
      error: meQuery.error,
      isAuthenticated: !!user,
    };
  }, [meQuery.data, meQuery.error, meQuery.isLoading]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
  };

  const login = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    meQuery.refetch();
  };

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    login,
  };
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}
