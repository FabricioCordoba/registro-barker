import { useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

export const useTokenMonitor = (logout, navigate) => {
  const intervalRef = useRef(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = decoded.exp - currentTime;
        
        // Si el token ya expiró
        if (timeUntilExpiry <= 0) {
          if (!warningShownRef.current) {
            warningShownRef.current = true;
            Swal.fire({
              icon: 'warning',
              title: 'Sesión expirada',
              text: 'Tu sesión ha expirado. Serás redirigido al login.',
              confirmButtonText: 'Entendido',
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              if (typeof logout === 'function') logout();
              if (navigate) {
                navigate('/login');
              } else {
                window.location.replace('/login');
              }
            });
          }
          return;
        }

        // Si el token expira en menos de 5 minutos, mostrar advertencia
        if (timeUntilExpiry <= 300 && !warningShownRef.current) {
          warningShownRef.current = true;
          Swal.fire({
            icon: 'warning',
            title: 'Sesión próxima a expirar',
            text: `Tu sesión expirará en ${Math.floor(timeUntilExpiry / 60)} minutos. ¿Deseas continuar trabajando?`,
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cerrar sesión',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
              if (typeof logout === 'function') logout();
              if (navigate) {
                navigate('/login');
              } else {
                window.location.replace('/login');
              }
            } else {
              // Si el usuario decide continuar, resetear la bandera para mostrar otra advertencia más tarde
              setTimeout(() => {
                warningShownRef.current = false;
              }, 60000); // Resetear después de 1 minuto
            }
          });
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          Swal.fire({
            icon: 'error',
            title: 'Error de sesión',
            text: 'Tu sesión no es válida. Serás redirigido al login.',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            if (typeof logout === 'function') logout();
            if (navigate) {
              navigate('/login');
            } else {
              window.location.replace('/login');
            }
          });
        }
      }
    };

    // Verificar inmediatamente al montar el componente
    checkTokenExpiration();

    // Verificar cada 30 segundos
    intervalRef.current = setInterval(checkTokenExpiration, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [logout, navigate]);

  return null;
};
