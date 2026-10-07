// src/pages/VistaRegistro.jsx
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./vistaRegistro.module.css";
import Swal from "sweetalert2";
import {
  fetchRegistroById,
  updateRegistro,
  transformarParaBackend,
  getRegistroDeudorBcra,
} from "../../services/registroService";
import ClasificacionDeudor from "../../componentes/clasificacionDeudor/ClasificacionDeudor";
import FormularioEdicion from "../../componentes/formularioEdicion/FormularioEdicion";
import {
  formatPeriodo,
  formatearPrecio,
  esMenorDeEdad,
} from "../../services/transformDataDto";
import { useTokenMonitor } from '../../hooks/useTokenMonitor';
import { AuthContext } from "../../auth/AuthContext";
import { formatearDNI } from "../../services/transformDataDto";

const VistaRegistro = () => {
  const { registroId } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [morosidadData, setMorosidadData] = useState({});

  // Monitorear el token en tiempo real
  useTokenMonitor(logout, navigate);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const registroData = await fetchRegistroById(registroId);

      setRegistro(registroData);
      setFormData(registroData);

      const morosidadPromises =
        registroData.personas?.map(async (persona) => {
          const cuit = persona?.CUIL_CUIT;
          const idPersona = persona?.idPersona;

          if (!cuit || !idPersona) return { idPersona, morosidad: null };

          try {
            const deudorBcra = await getRegistroDeudorBcra(cuit);
            const morosidadInfo =
              deudorBcra?.results?.periodos?.flatMap((periodo) =>
                (periodo.entidades || []).map((entidad) => ({
                  deuda: entidad?.monto,
                  entidad: entidad?.entidad,
                  periodo: periodo?.periodo,
                  situacion: entidad?.situacion,
                  procesoJud: entidad?.procesoJud,
                }))
              ) || [];

            return { idPersona, morosidad: morosidadInfo };
          } catch (error) {
            console.error("Error al obtener morosidad", error);
            return { idPersona, morosidad: null };
          }
        }) || [];

      const morosidadResults = await Promise.all(morosidadPromises);
      const morosidadMap = morosidadResults.reduce((acc, curr) => {
        acc[curr.idPersona] = curr.morosidad;
        return acc;
      }, {});

      setMorosidadData(morosidadMap);
    } catch (error) {
      console.error("Error al cargar los datos:", error);

      // Verificar si es un error de sesión expirada (401)
      if (error.message?.includes('401') || error.status === 401 || error.response?.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Serás redirigido al login.',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          navigate("/login");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del registro",
        });
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [registroId]);

  const handleChange = (path, value) => {
    setFormData((prev) => {
      const draft = structuredClone(prev);
      const keys = path.split(".");
      let cur = draft;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return draft;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const datosTransformados = transformarParaBackend(formData);
      await updateRegistro(registro.idRegistro, datosTransformados);

      Swal.fire("Éxito", "Registro actualizado", "success");
      setEditMode(false);
      cargarDatos();
    } catch (err) {
      console.error("Error al actualizar registro:", err);

      // Verificar si es un error de sesión expirada (401)
      if (err.message?.includes('401') || err.status === 401 || err.response?.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Serás redirigido al login.',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          navigate("/login");
        });
      } else {
        // Error normal, mostrar SweetAlert de error
        Swal.fire("Error", err.message || "No se pudo guardar", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(registro);
    setEditMode(false);
  };

  const volverDashboard = () => {

    navigate("/dashboard");
  }
  function toUpperCase(str) {
    return str ? String(str).toUpperCase() : "";
  }
  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!registro) return null;


  const sumaTotalIngresos = registro.personas
    .reduce((total, persona) => {
      if (persona.titular_cotitular === "Titular" || persona.titular_cotitular === "Cotitular") {
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


  function formatearCUIT(cuit) {
    const str = String(cuit).replace(/\D/g, ""); // solo números
    if (str.length !== 11) return cuit; // si no tiene 11 dígitos, lo devuelvo igual
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
  }



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Registro N°{registro.personas[0].numero_registro}</h2>

        {!editMode && (
          <>
            <button
              onClick={() => setEditMode(true)}
              className={styles.editButton}
            >
              Editar Registro
            </button>
            <button
              onClick={() => volverDashboard()}
              className={styles.editButton}
            >
              Volver inicio
            </button>
          </>

        )}

      </div>


      {editMode ? (
        <>
          <button
            onClick={() => setEditMode(false)}
            className={styles.editButton}
          >
            Cancelar Edición
          </button>
          <FormularioEdicion
            formData={formData}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </>
      ) : (
        <>
          {registro.personas && registro.personas.some((p) => p.lote) && (
            <div className={styles.loteSection}>
              <h4>Lote</h4>
              {(() => {
                const personaConLote = registro.personas.find((p) => p.lote);
                if (!personaConLote) return null;
                return (
                  <>
                    <p>
                      <strong>Ubicación del lote a sortear</strong>
                    </p>
                    <p>
                      <strong>Localidad:</strong>{" "}
                      {personaConLote.lote.localidad}
                    </p>


                  </>
                );
              })()}
            </div>
          )}

          <div className={styles.section}>

            <div>
              <h4>Viviendas y Habitantes</h4>
            </div>

            <div>
              <p className={styles.sumaTotalIngresos}>
                <strong>Suma total de ingresos del registro:</strong>{" "}
                {formatearPrecio(sumaTotalIngresos)}
              </p>
            </div>

            <div className={styles.viviendasContainer}>
              {(() => {
                const viviendasMap = new Map();

                registro.personas.forEach((persona) => {
                  const vivienda = persona.vivienda || {};
                  const key = JSON.stringify({
                    direccion: vivienda.direccion || "",
                    numero_direccion: vivienda.numero_direccion || "",
                    piso_departamento: vivienda.piso_departamento || "",
                    numero_departamento: vivienda.numero_departamento || "",
                    localidad: vivienda.localidad || "",
                  });

                  if (!viviendasMap.has(key)) {
                    viviendasMap.set(key, {
                      vivienda,
                      personas: [],
                    });
                  }
                  viviendasMap.get(key).personas.push(persona);
                });

                const agrupadas = Array.from(viviendasMap.values());

                return agrupadas.map(({ vivienda, personas }, index) => {
                  const totalIngresosVivienda = personas.reduce((total, persona) => {
                    if (persona.titular_cotitular === "Titular" || persona.titular_cotitular === "Cotitular") {
                      const ingresosPersona = persona.ingresos || [];
                      return (
                        total +
                        ingresosPersona.reduce(
                          (sum, ing) => sum + (parseFloat(ing.salario) || 0),
                          0
                        )
                      );
                    }
                    return total;
                  }, 0);




                  return (
                    <div key={index} className={styles.viviendaAgrupada}>
                      <div className={styles.viviendaInfo}>
                        <h4>
                          🏠 Dirección: {vivienda.direccion || "-"} N° {vivienda.numero_direccion || "-"}
                          {vivienda.piso_departamento && Number(vivienda.piso_departamento) !== 0
                            ? ` - Piso N°: ${vivienda.piso_departamento}`
                            : ""}
                          {vivienda.numero_departamento && String(vivienda.numero_departamento).trim() !== "0"
                            ? ` - Departamento: ${toUpperCase(vivienda.numero_departamento)}`
                            : ""}
                          {vivienda.localidad ? ` - Localidad: ${vivienda.localidad}` : ""}
                        </h4>

                        <p>
                          <strong>Dormitorios:</strong>{" "}
                          {vivienda.cantidad_dormitorios || "-"}
                        </p>
                        <p>
                          <strong>Estado:</strong>{" "}
                          {vivienda.estado_vivienda || "-"}
                        </p>
                        <p>
                          <strong>Alquiler:</strong>{" "}
                          {vivienda.alquiler ? "Sí" : "No"}
                        </p>
                        {vivienda.alquiler && vivienda.valor_alquiler && (
                          <p>
                            <strong>Valor alquiler: </strong>
                            {formatearPrecio(vivienda.valor_alquiler)}
                          </p>
                        )}
                        <p className={styles.totalIngresos}>
                          <strong>Total ingresos del hogar:</strong>{" "}
                          {formatearPrecio(totalIngresosVivienda)}
                        </p>
                      </div>

                      <div className={styles.habitantesList}>
                        {personas.map((p) => (
                          <div key={p.idPersona} className={styles.habitanteCard}>
                            <h4>
                              <u>{p.titular_cotitular}: {p.nombre} {p.apellido}</u>
                            </h4>
                            <div className={styles.habitanteInfo}>
                              <p>
                                <strong>DNI:</strong> {formatearDNI(p.dni)}
                              </p>
                              <p>
                                <strong>Certificado de discapacidad:</strong>{" "}
                                {p.certificado_discapacidad === true
                                  ? "Sí"
                                  : p.certificado_discapacidad === false
                                    ? "No"
                                    : "No informado"}
                              </p>
                              {p.titular_cotitular !== "Titular" && (
                                <p>
                                  <strong>Vínculo con el titular:</strong>{" "}
                                  {p.vinculo || "-"}
                                </p>
                              )}
                              {!esMenorDeEdad(p.fecha_nacimiento) && (
                                <>
                                  <p>
                                    <strong>CUIT:</strong> {formatearCUIT(p.CUIL_CUIT)}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {p.email}
                                  </p>
                                  <p>
                                    <strong>Teléfono:</strong> {p.telefono}
                                  </p>

                                </>
                              )}
                            </div>

                            {!esMenorDeEdad(p.fecha_nacimiento) && (
                              <>
                                <div className={styles.ingresosSection}>
                                  <u><h4>Ingresos</h4></u>
                                  {p.ingresos.length > 0 ? (
                                    p.ingresos.map((ing) => (
                                      <div
                                        key={ing.idIngreso}
                                        className={styles.ingresoItem}
                                      >
                                        <p>
                                          <strong>Situación laboral:</strong>{" "}
                                          {ing.situacion_laboral}
                                        </p>
                                        <p>
                                          <strong>Ocupación:</strong>{" "}
                                          {ing.ocupacion}
                                        </p>
                                        <p>
                                          <strong>Cuit Empleador:</strong>{" "}
                                          {formatearCUIT(ing.CUIT_empleador)}
                                        </p>
                                        <p>
                                          <strong>Salario:</strong>{" "}
                                          {formatearPrecio(ing.salario)}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p>No registra ingresos</p>
                                  )}
                                </div>

                                <div className={styles.morosidadSection}>
                                  <u><h4>Morosidad</h4></u>
                                  {morosidadData[p.idPersona] &&
                                    morosidadData[p.idPersona].length > 0 ? (
                                    morosidadData[p.idPersona].map(
                                      (info, index) => (
                                        <div key={index}>
                                          <p>
                                            <strong>
                                              Ultimo Período Informado:
                                            </strong>{" "}
                                            {formatPeriodo(info.periodo)}
                                          </p>
                                          <p>
                                            <strong>Entidad:</strong>{" "}
                                            {info.entidad}
                                          </p>
                                          <ClasificacionDeudor
                                            situacion={info.situacion}
                                          />
                                          <p>
                                            <strong>En Proceso Judicial:</strong>{" "}
                                            {info.procesoJud ? "Sí" : "No"}
                                          </p>
                                          <hr />
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <p>
                                      No se pudo obtener la información de
                                      morosidad.
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default VistaRegistro;
