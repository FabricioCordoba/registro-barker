import Footer from "./componentes/footer/Footer";
import Nav from "./componentes/nav/Nav";
import Home from "./pages/home/Home";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import Login from "./auth/Login";
import PrivateRoute from "./componentes/PrivateRouts";
import Dashboard from "./pages/Dashboar";
import VistaRegistro from "./pages/ver registro/VistaRegistro";
import RegistroExitoso from "./pages/registro/RegistroExitoso";
import RegistroPage from "./pages/registro/RegistroPage";
import BasesYcondiciones from "./pages/Bases y condiciones/BasesYcondiciones";
import UbicacionLotes from "./pages/Ubicacion de lotes/UbicacionLotes";
import NavSecundario from "./componentes/nav/NavSecundario";
import "./App.css";


const NotFound = () => (
  <div className="not-found">
    <h1 className="text-9xl font-extrabold text-red-600 drop-shadow-md">404</h1>
    <h2 className="mt-4 text-2xl md:text-3xl font-bold text-gray-800">
      ¡Ups! Página no encontrada
    </h2>
    <p className="mt-2 text-gray-600 max-w-md">
      La página que estás buscando no existe o fue movida. 
      Por favor, volvé al inicio o navegá usando el menú.
    </p>
    <div className="link-not-found">
      <Link  className="link-not-found"
        to="/"       
      >
        Volver al inicio
      </Link>
     
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const navSecundarioRoutes = [
    "/login",
    "/dashboard",
    "/editar-registro",
    "/ver-registro"
  ];

  const showNavSecundario = navSecundarioRoutes.some(route =>
    location.pathname.startsWith(route)
  );
  const showNavPrincipal = !showNavSecundario;

  return (
    <>
      {showNavPrincipal && <Nav />}
      {showNavSecundario && <NavSecundario />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ubicacion-lotes" element={<UbicacionLotes />} />
        <Route path="/bases-y-condiciones" element={<BasesYcondiciones />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/registro-exitoso" element={<RegistroExitoso />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/ver-registro/:registroId"
          element={
            <PrivateRoute>
              <VistaRegistro />
            </PrivateRoute>
          }
        />

        {/* 🔹 Ruta comodín para manejar páginas no existentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
