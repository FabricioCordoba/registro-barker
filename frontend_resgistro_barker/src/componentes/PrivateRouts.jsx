import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from 'sweetalert2';

const PrivateRoute = ({ children }) => {
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded?.exp && decoded.exp < Date.now() / 1000;
        if (isExpired) {
          Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Serás redirigido al login.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            logout();
            window.location.replace('/login');
          });
          return;
        }
      } catch (e) {
        // token inválido
        Swal.fire({
          icon: 'error',
          title: 'Error de sesión',
          text: 'Tu sesión no es válida. Serás redirigido al login.',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          logout();
          window.location.replace('/login');
        });
        return;
      }
    }
  }, [token, logout]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded?.exp && decoded.exp < Date.now() / 1000;
    if (isExpired) {
      return <Navigate to="/login" />;
    }
  } catch (e) {
    // token inválido
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
