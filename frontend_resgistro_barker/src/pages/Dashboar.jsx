import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from 'react-router-dom';
import styles from './dashboard.module.css';
import { RegistroContext } from "../context/RegistroConext";
import Swal from 'sweetalert2';
import { jwtDecode } from "jwt-decode";
import { formatearPrecio } from "../services/transformDataDto";
import * as XLSX from 'xlsx';
import { useTokenMonitor } from '../hooks/useTokenMonitor';
import { formatearDNI } from "../services/transformDataDto";
import dayjs from "dayjs";

const Dashboard = () => {
  const { registros, loading, error, getRegistros } = useContext(RegistroContext);
  const { logout, token } = useContext(AuthContext);
  const [registroHover, setRegistroHover] = useState(null);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  // Monitorear el token en tiempo real
  useTokenMonitor(logout, navigate);

  const [filtros, setFiltros] = useState({
    dni: '',
    apellido: '',
    localidadVivienda: '',
    localidadLote: '',
    numeroRegistro: '',
    tipoPersona: 'Todos'
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    if (token) {
      getRegistros();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const decodeToken = () => {
    try {
      if (token) {
        const decoded = jwtDecode(token);
        setUserData(decoded);

        if (decoded.exp < Date.now() / 1000) {
          Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          });
          handleLogout();
        }
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al verificar la sesión'
      });
      handleLogout();
    }
  };

  useEffect(() => {
    decodeToken();
  }, [token]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      dni: '',
      apellido: '',
      localidadVivienda: '',
      localidadLote: '',
      numeroRegistro: '',
      tipoPersona: 'Todos'
    });
    setPaginaActual(1);
  };

  // 🔹 Filtrar registros y personas según los filtros
  const registrosFiltrados = registros
    .map(registro => {
      const personasFiltradas = registro.personas.filter(persona => (
        (!filtros.dni || persona.dni?.toString().toLowerCase().includes(filtros.dni.toLowerCase())) &&
        (!filtros.apellido || persona.apellido?.toLowerCase().includes(filtros.apellido.toLowerCase())) &&
        (!filtros.numeroRegistro || persona.numero_registro?.toString().includes(filtros.numeroRegistro)) &&
        (!filtros.localidadVivienda || persona.vivienda?.localidad?.toLowerCase().includes(filtros.localidadVivienda.toLowerCase())) &&
        (!filtros.localidadLote || persona.lote?.localidad?.toLowerCase().includes(filtros.localidadLote.toLowerCase())) &&
        (filtros.tipoPersona === 'Todos' || persona.titular_cotitular === filtros.tipoPersona)
      ));
      return personasFiltradas.length > 0
        ? { ...registro, personas: personasFiltradas }
        : null;
    })
    .filter(Boolean);

  // // 🔹 Ordenar registros por numero_registro antes de paginar
  // const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
  //   const numA = parseInt(a.personas?.[0]?.numero_registro ?? 0, 10);
  //   const numB = parseInt(b.personas?.[0]?.numero_registro ?? 0, 10);
  //   return numA - numB;
  // });

  // 🔹 Función auxiliar para obtener el número de registro
const getNumeroRegistro = (registro) => {
  if (!registro.personas || registro.personas.length === 0) return 0;

  // buscar persona con numero_registro válido (priorizar Titular)
  const personaConNumero = registro.personas.find(p => p.numero_registro) 
                        || registro.personas[0];

  const raw = String(personaConNumero?.numero_registro || "0").trim();
  return Number(raw) || 0;
};

// 🔹 Ordenar registros por numero_registro antes de paginar
const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
  const numA = getNumeroRegistro(a);
  const numB = getNumeroRegistro(b);
  return numA - numB;
});


  // 🔹 Paginación sobre registros ordenados
  const indexLast = paginaActual * registrosPorPagina;
  const indexFirst = indexLast - registrosPorPagina;
  const registrosActuales = registrosOrdenados.slice(indexFirst, indexLast);
  const totalPaginas = Math.ceil(registrosOrdenados.length / registrosPorPagina);

  // 🔹 Para descarga Excel
  const personasExtendidas = registrosFiltrados?.flatMap(registro =>
    registro.personas.map(persona => ({
      persona,
      vivienda: persona.vivienda,
      lote: persona.lote,
      registroId: registro.idRegistro
    }))
  ) || [];

function calcularEdad(fechaNacimiento){
  if (!fechaNacimiento) return 0;

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  // Si aún no cumplió años este año, restamos uno
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

const formatFecha = (fecha) => {
  if (!fecha) return "----";
  return dayjs(fecha).format("DD/MM/YYYY");
};
  const descargarExcel = (datos, nombre) => {
    const datosOrdenados = [...datos].sort((a, b) => {
      const numA = a.persona.idRegistro ?? 0;
      const numB = b.persona.idRegistro ?? 0;
      return numA - numB;
    });
    
//ingresos en dos columnas
   const maxIngresos = Math.max(
  ...datosOrdenados.map(({ persona }) => persona.ingresos?.length || 0)
);

// Total por familia (mismo idRegistro): suma de ingresos de todas las personas del registro
const totalPorFamilia = {};
datosOrdenados.forEach(({ persona }) => {
  const idReg = persona.idRegistro;
  const totalPersona = (persona.ingresos || []).reduce(
    (total, ingreso) => total + (ingreso.salario || 0),
    0
  ) || 0;
  totalPorFamilia[idReg] = (totalPorFamilia[idReg] ?? 0) + totalPersona;
});

const encabezados = [
  "ID Registro", "ID Persona", "N° Registro", "Apellido", "Nombre", "DNI", 
  "CUIL/CUIT", "Genero", "Fecha Nacimiento", "Edad", 
  "Certificado Discapacidad", "Estado Civil", "Nacionalidad", 
  "Teléfono", "Email",
  // Generamos encabezados dinámicos
  ...Array.from({ length: maxIngresos }, (_, i) => `Situación Laboral ${i + 1}`),
  ...Array.from({ length: maxIngresos }, (_, i) => `Ocupación ${i + 1}`),
  ...Array.from({ length: maxIngresos }, (_, i) => `Ingreso ${i + 1}`),
  "Total Ingresos x Persona",
  "Ingresos Totales X Registro",
  "Localidad Lote", "Tipo", "Localidad que Reside", 
  "Dirección", "Numero", "Piso", "Departamento", 
  "Alquila", "Valor Alquiler", "Particular/Inmobiliaria", 
  "Estado del Inmueble", "Cantidad dormitorios"
];

const filas = datosOrdenados.map(({ persona, lote, vivienda }) => {
  const ingresos = persona.ingresos || [];
  const situaciones = ingresos.map(ing => ing.situacion_laboral);
  const ocupaciones = ingresos.map(ing => ing.ocupacion);
  const salarios = ingresos.map(ing => formatearPrecio(ing.salario));

  return [
    persona.idRegistro,
    persona.idPersona,
    persona.numero_registro,
    persona.apellido,
    persona.nombre,
    persona.dni,
    persona.CUIL_CUIT,
    persona.genero,
    formatFecha(persona.fecha_nacimiento),
    calcularEdad(persona.fecha_nacimiento),
    persona.certificado_discapacidad ? "Sí" : "No",
    persona.estado_civil,
    persona.nacionalidad,
    persona.telefono,
    persona.email,
    // Rellenamos hasta maxIngresos
    ...Array.from({ length: maxIngresos }, (_, i) => situaciones[i] || "----"),
    ...Array.from({ length: maxIngresos }, (_, i) => ocupaciones[i] || "----"),
    ...Array.from({ length: maxIngresos }, (_, i) => salarios[i] || "----"),
    formatearPrecio(
      ingresos.reduce((total, ingreso) => total + (ingreso.salario || 0), 0) || 0
    ),
    persona.titular_cotitular === "Titular"
      ? formatearPrecio(totalPorFamilia[persona.idRegistro] ?? 0)
      : "----",
    lote?.localidad ?? "-----------",
    persona.titular_cotitular,
    vivienda?.localidad ?? "-----------",
    vivienda?.direccion ?? "-----------",
    vivienda?.numero_direccion ?? "-----------",
    vivienda?.piso ?? "----",
    vivienda?.numero_departamento ?? "----",
    vivienda?.alquiler ? "Sí" : "No",
    vivienda?.valor_alquiler ? formatearPrecio(vivienda.valor_alquiler) : "----",
    vivienda?.tipo_alquiler,
    vivienda?.estado_vivienda,
    vivienda?.cantidad_dormitorios ?? "----"
  ];
});



    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Personas");
    XLSX.writeFile(libro, `${nombre}.xlsx`);
  };

  const handleVerRegistro = (registroId) => {
    navigate(`/ver-registro/${registroId}`);
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      {userData && (
        <div className={styles.header}>
          <p>Bienvenido <strong>{userData.adminName}</strong></p>
          <button onClick={handleLogout} className={styles.logoutButton}>Cerrar Sesión</button>
        </div>
      )}

      <h1 className={styles.title}>Personas Registradas</h1>

      <div className={styles.downloadButtons}>
        <button onClick={() => descargarExcel(personasExtendidas, "todas_personas")} className={styles.downloadButton}>
          Descargar Todos los registros (Excel)
        </button>
        <button onClick={() => descargarExcel(personasExtendidas, "personas_filtradas")} className={styles.downloadButton}>
          Descargar Registros Filtrados (Excel)
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filtrosContainer}>
        <div className={styles.filtroGroup}>
          <input name="numeroRegistro" placeholder="N° Registro" value={filtros.numeroRegistro} onChange={handleFiltroChange} className={styles.filtroInput} />
          <input name="dni" placeholder="DNI" value={filtros.dni} onChange={handleFiltroChange} className={styles.filtroInput} />
          <input name="apellido" placeholder="Apellido" value={filtros.apellido} onChange={handleFiltroChange} className={styles.filtroInput} />
          <select name="localidadVivienda" value={filtros.localidadVivienda} onChange={handleFiltroChange} className={styles.filtroSelect}>
            <option value="">Localidad Vivienda</option>
            <option value="Benito Juárez">Benito Juárez</option>
            <option value="Barker">Barker</option>
            <option value="Villa Cacique">Villa Cacique</option>
            <option value="Tedín Uriburu">Tedín Uriburu</option>
            <option value="Estación López">Estación López</option>
            <option value="El Luchador">El Luchador</option>
            <option value="Coronel Rodolfo Bunge">Coronel Rodolfo Bunge</option>
          </select>
          <select name="localidadLote" value={filtros.localidadLote} onChange={handleFiltroChange} className={styles.filtroSelect}>
            <option value="">Localidad Lote</option>
            <option value="Benito Juárez">Benito Juárez</option>
            <option value="Barker">Barker</option>
            <option value="Tedín Uriburu">Tedín Uriburu</option>
            <option value="El Luchador">El Luchador</option>
          </select>
          <select name="tipoPersona" value={filtros.tipoPersona} onChange={handleFiltroChange} className={styles.filtroSelect}>
            <option value="Todos">Todos</option>
            <option value="Titular">Titular</option>
            <option value="Cotitular">Cotitular</option>
            <option value="Conviviente">Conviviente</option>
          </select>
          <button onClick={limpiarFiltros} className={styles.limpiarFiltros}>Limpiar Filtros</button>
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Registro</th>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Localidad Lote</th>
              <th>Localidad Vivienda</th>
              <th>Tipo</th>
              <th>Ingresos</th>
              <th>Total Ingresos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registrosActuales.length > 0 ? registrosActuales
              .map((registro, idxRegistro) => {
                  const sumaTotalIngresos = registro.personas
    .reduce((total, persona) => {
      if (persona.titular_cotitular === "Titular" || persona.titular_cotitular === "Cotitular" || persona.titular_cotitular === "Conviviente") {
        const ingresosPersona = persona.ingresos || [];
        return (
          total +
          ingresosPersona.reduce(
            (sum, ing) => sum + (parseFloat(ing.salario) || 0),
            0
          )
        );
      }
      return total; // si es Conviviente, no suma
    }, 0);
                const rowClass = idxRegistro % 2 === 0 ? styles.registroPar : styles.registroImpar;

                return registro.personas?.map((persona, idxPersona) => (
                  <tr
                    key={`${registro.idRegistro}-${persona.idPersona}`}
                    className={`${rowClass} ${registro.idRegistro === registroHover ? styles.registroHover : ''}`}
                    onMouseEnter={() => setRegistroHover(registro.idRegistro)}
                    onMouseLeave={() => setRegistroHover(null)}
                  >
                    <td>{persona.numero_registro ?? '---'}</td>
                    <td>{persona.apellido}</td>
                    <td>{persona.nombre}</td>
                    <td>{formatearDNI(persona.dni)}</td>
                    <td>{persona.telefono}</td>
                    <td>{persona.lote?.localidad ?? '---'}</td>
                    <td>{persona.vivienda?.localidad ?? '---'}</td>
                    <td>{persona.titular_cotitular}</td>
                    <td>
                      {persona.ingresos && persona.ingresos.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {persona.ingresos.map((ing, i) => (
                            <li key={i}>{formatearPrecio(ing.salario)}</li>
                          ))}
                        </ul>
                      ) : "Sin ingresos"}
                    </td>
                    {idxPersona === 0 ? (
                      <td rowSpan={registro.personas.length}>
                        <strong>{formatearPrecio(sumaTotalIngresos)}</strong>
                      </td>
                    ) : null}
                    {idxPersona === 0 ? (
                      <td rowSpan={registro.personas.length}>
                        <div className={styles.containerButtonAccion}>
                          <button
                            className={styles.viewButton}
                            onClick={() => handleVerRegistro(registro.idRegistro)}
                          >
                            Ver Registro
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ));
              }) : (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center' }}>
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className={styles.pagination}>
          <button onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1} className={styles.paginationButton}>Anterior</button>
          <span className={styles.paginationInfo}>Página {paginaActual} de {totalPaginas}</span>
          <button onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas} className={styles.paginationButton}>Siguiente</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
