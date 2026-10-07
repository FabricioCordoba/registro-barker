import { createContext, useContext, useState } from "react";
import { AuthContext } from "../auth/AuthContext";
import { fetchRegistros, fetchRegistroById, updateRegistroById } from "../services/registroService";

export const RegistroContext = createContext();

export const RegistroProvider = ({ children }) => {
  const [registros, setRegistros] = useState([]);
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useContext(AuthContext);
  const logout = auth?.logout;

  const getRegistros = async () => {
    const token = localStorage.getItem("token"); // ✅ leemos token
    if (!token) {
      setError("No hay token, no se pueden cargar registros");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegistros(); // fetchRegistros ya lee el token internamente
      setRegistros(data);
    } catch (err) {
      // Si justo hubo 401 (posible token viejo en una carrera), reintentamos una vez
      if (err.message?.includes('401')) {
        try {
          const retryData = await fetchRegistros();
          setRegistros(retryData);
        } catch (retryErr) {
          setError(retryErr.message);
          if (retryErr.message?.includes('401')) {
            if (typeof logout === 'function') logout();
            window.location.replace('/login');
            return;
          }
        }
      } else {
        setError(err.message);
        if (err.message?.includes('401')) {
          if (typeof logout === 'function') logout();
          window.location.replace('/login');
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getRegistroById = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No hay token, no se puede cargar el registro");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchRegistroById(id); // fetchRegistroById también debe leer token
      setRegistro(data);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err.message);
      if (err.message?.includes('401')) {
        if (typeof logout === 'function') logout();
        window.location.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const editRegistro = async (id, data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No hay token, no se puede editar el registro");
      return;
    }

    setLoading(true);
    try {
      const updatedData = await updateRegistroById(id, data);
      setRegistro(updatedData);
      await getRegistros(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      if (err.message?.includes('401')) {
        if (typeof logout === 'function') logout();
        window.location.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegistroContext.Provider
      value={{
        registros,
        registro,
        loading,
        error,
        getRegistros,
        getRegistroById,
        editRegistro
      }}
    >
      {children}
    </RegistroContext.Provider>
  );
};