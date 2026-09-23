import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "../services/authService.js";
import { createUserProfile } from "../services/userService.js";
import { toUserMessage } from "../utils/errors.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (supabaseUser, event) => {
      setUser(supabaseUser);
      setError(null);

      if (supabaseUser && event === "SIGNED_IN") {
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("error");
        url.searchParams.delete("error_code");
        url.searchParams.delete("error_description");
        window.history.replaceState(
          {},
          document.title,
          `${url.pathname}${url.search}${url.hash}`,
        );
      }

      try {
        if (supabaseUser) {
          const provider =
            supabaseUser.app_metadata?.providers?.[0] === "google"
              ? "google"
              : "email";
          await createUserProfile(supabaseUser, {
            name: supabaseUser.user_metadata?.name,
            provider,
          });
        }
      } catch (err) {
        console.error("[AuthContext] profile sync error:", err);
        setError(toUserMessage(err, "Não foi possível sincronizar o teu perfil."));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
