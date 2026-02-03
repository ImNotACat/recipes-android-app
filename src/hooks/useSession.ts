import { useAuth } from "../providers/AuthProvider";

/**
 * Hook to access the current session and user information.
 * This is a convenience hook that wraps useAuth for common use cases.
 */
export function useSession() {
  const { session, user, isLoading } = useAuth();

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
  };
}
