import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const login = async (email, password) => {
    const data = await loginUser(email, password);

    setUser(data.user);
    setToken(data.access_token);  // Asegúrate de que `data.access_token` es el valor correcto
    localStorage.setItem("token", data.access_token);
  };

  const register = async (adminName, email, password) => {
    const data = await registerUser(adminName, email, password);
    setUser(data.user);
    setToken(data.access_token);
    localStorage.setItem("token", data.access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
