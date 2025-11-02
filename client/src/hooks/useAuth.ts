import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    window.location.href = "/api/auth/logout";
  };

  const isAuthLoading = isLoading;

  return {
    user,
    isLoading: isAuthLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
