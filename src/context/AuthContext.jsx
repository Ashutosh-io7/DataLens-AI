import { createContext, useContext, useEffect, useState } from "react";
import { endpoints } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("datalens_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("datalens_token") || null;
  });

  const [loading, setLoading] = useState(true);

  // Validate stored token on app load
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("datalens_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(endpoints.me, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem("datalens_user", JSON.stringify(userData));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        // If network issue, preserve state for offline tolerance
        console.warn("Could not verify auth token:", err);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(endpoints.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Unable to sign in.");
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("datalens_token", data.access_token);
    localStorage.setItem("datalens_user", JSON.stringify(data.user));
    return data;
  };

  const signup = async (email, password) => {
    const res = await fetch(endpoints.signup, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Unable to create account.");
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("datalens_token", data.access_token);
    localStorage.setItem("datalens_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("datalens_token");
    localStorage.removeItem("datalens_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
