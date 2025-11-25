// src/context/AuthContext.jsx

import { createContext, useState, useContext, useEffect } from "react";
import axios from "../api/axiosInstance";
import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.id,
          role: decoded.role,
          shop_id: decoded.shop_id || null,
          branch_id: decoded.branch_id || null,
        });
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, callback) => {
    try {
      const response = await axios.post("/auth/login", { username, password });
      const token = response.data.token;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        role: decoded.role,
        shop_id: decoded.shop_id || null,
        branch_id: decoded.branch_id || null,
      });
      if (callback) callback();
    } catch (err) {
      console.error("Login error:", err);
      throw new Error("Invalid credentials");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    // localStorage.removeItem("language"); // Optional: clear language preference

    setUser(null);
    // Redirect to login page
    // navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
export const useAuth = () => useContext(AuthContext);
