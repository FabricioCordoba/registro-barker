// src/pages/VistaRegistro.jsx
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./vistaRegistro.module.css";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { clasificacionesDeudor } from "../../services/clasificacionDeudor";

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

 const handleDescargarPDF = async () => {
    if (!registro) return;

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const colors = {
      primary: "#2c3e50",
      secondary: "#007bff",
      accent: "#34495e",
      text: "#4a4a4a",
      lightBg: "#f8f9fa",
    };

    const numeroRegistro = registro?.personas?.[0]?.numero_registro ?? registroId ?? "-";
    const hoy = new Date();
    const fecha =
      `${String(hoy.getDate()).padStart(2, "0")}/` +
      `${String(hoy.getMonth() + 1).padStart(2, "0")}/` +
      `${hoy.getFullYear()}`;

    const getLogoData = () =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve({
              dataUrl: canvas.toDataURL("image/png"),
              width: img.width,
              height: img.height,
            });
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = "/Logo_Muni2024.png";
      });

    // Encabezado
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, 28, "F");
    try {
      const logo = await getLogoData();
      // Logo dentro de una "pastilla" clara para mejor contraste
      const containerX = marginX;
      const containerY = 4;
      const containerW = 20;
      const containerH = 20;
      const innerPadding = 1.5;
      const maxW = containerW - innerPadding * 2;
      const maxH = containerH - innerPadding * 2;
      const ratio = Math.min(maxW / logo.width, maxH / logo.height);
      const drawW = logo.width * ratio;
      const drawH = logo.height * ratio;
      const drawX = containerX + (containerW - drawW) / 2;
      const drawY = containerY + (containerH - drawH) / 2;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(containerX, containerY, containerW, containerH, 2, 2, "F");
      doc.addImage(logo.dataUrl, "PNG", drawX, drawY, drawW, drawH);
    } catch (error) {
      console.warn("No se pudo cargar el logo para el PDF:", error);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Comprobante de Registro", marginX + 24, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text('Programa "Mi hábitat, mi hogar"', marginX + 24, 20);
    doc.setTextColor(colors.text);
    doc.setDrawColor(colors.secondary);
    doc.setLineWidth(0.8);
    doc.line(marginX, 30, pageWidth - marginX, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colors.accent);
    doc.text(`Registro N° ${String(numeroRegistro)}`, marginX, 38);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.text);
    doc.text(`Fecha: ${fecha}`, pageWidth - marginX, 38, { align: "right" });

    const personas = registro?.personas ?? [];

    const drawSectionTitle = (y, title) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(colors.accent);
      doc.text(title, marginX, y);
      const titleW = doc.getTextWidth(title);
      doc.setDrawColor(colors.secondary);
      doc.setLineWidth(0.3);
      doc.line(marginX, y + 0.8, marginX + titleW, y + 0.8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text);
      return y + 7;
    };

    let yTabla = drawSectionTitle(44, "Datos de las personas integrantes");

    autoTable(doc, {
      startY: yTabla,
      head: [["Rol", "Nombre", "DNI", "CUIT", "Email", "Teléfono", "Lote", "Estado civil", "Vínculo con el titular","Vivienda"]],
      body: personas.map((p) => [
        p?.titular_cotitular ?? "-",
        `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "-",
        p?.dni ? formatearDNI(p.dni) : "-",
        p?.CUIL_CUIT ? formatearCUIT(p.CUIL_CUIT) : "-",
        p?.email ?? "-",
        p?.telefono ?? "-",
        p?.lote ? `Lote: ${p.lote.localidad || "-"}` : "-",
        p?.estado_civil ?? "-",
        p?.titular_cotitular === "Titular" ? "Titular" : (p?.vinculo ?? "-"),
        p?.vivienda
          ? `Vivienda: ${p.vivienda.direccion || "-"} N° ${p.vivienda.numero_direccion || "-"}${
              p.vivienda.piso_departamento && Number(p.vivienda.piso_departamento) !== 0
                ? ` Piso: ${p.vivienda.piso_departamento}`
                : ""
            }`
          : "-",

      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: colors.text, lineColor: colors.lightBg, lineWidth: 0.2 },
      headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: colors.lightBg },
      theme: "striped",
      margin: { left: marginX, right: marginX },
    });

    const parseSalario = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "number") return Number.isFinite(value) ? value : 0;
      let text = String(value).trim();
      if (!text) return 0;
      text = text.replace(/[^\d,.-]/g, "");
      const tienePunto = text.includes(".");
      const tieneComa = text.includes(",");

      if (tienePunto && tieneComa) {
        text = text.replace(/\./g, "").replace(",", ".");
      } else if (tieneComa) {
        text = text.replace(",", ".");
      } else if ((text.match(/\./g) || []).length > 1) {
        text = text.replace(/\./g, "");
      }

      const n = Number.parseFloat(text);
      return Number.isFinite(n) ? n : 0;
    };

    const textoDireccionVivienda = (v) => {
      if (!v || typeof v !== "object") return "—";
      const partes = [];
      partes.push(`${v.direccion || "-"} N° ${v.numero_direccion || "-"}`);
      if (v.piso_departamento && Number(v.piso_departamento) !== 0) {
        partes.push(`Piso ${v.piso_departamento}`);
      }
      if (v.numero_departamento && String(v.numero_departamento).trim() !== "0") {
        partes.push(`Dpto ${v.numero_departamento}`);
      }
      if (v.localidad) partes.push(v.localidad);
      return partes.join(" · ");
    };

    const viviendasRows = personas.map((p) => {
      const v = p?.vivienda;
      const nombreCompleto = `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "—";
      if (!v || typeof v !== "object") {
        return [nombreCompleto, "—", "—", "—", "—", "—"];
      }
      return [
        nombreCompleto,
        textoDireccionVivienda(v),
        v.cantidad_dormitorios != null && v.cantidad_dormitorios !== "" ? String(v.cantidad_dormitorios) : "—",
        v.estado_vivienda ?? "—",
        v.alquiler === true ? "Sí" : v.alquiler === false ? "No" : "—",
        v.alquiler && v.valor_alquiler != null ? formatearPrecio(v.valor_alquiler) : "—",
      ];
    });

    const ingresosRows = personas.flatMap((p) => {
      const ingresos = Array.isArray(p?.ingresos) ? p.ingresos : [];
      if (ingresos.length === 0) {
        return [
          [
            `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "-",
            p?.titular_cotitular ?? "-",
            "—",
            "—",
            "—",
          ],
        ];
      }
      return ingresos.map((ing) => [
        `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "-",
        p?.titular_cotitular ?? "-",
        ing?.situacion_laboral ?? "-",
        ing?.ocupacion ?? "-",
        formatearPrecio(parseSalario(ing?.salario)),
      ]);
    });

    const totalIngresosRegistro = personas.reduce((accPersonas, persona) => {
      const ingresosPersona = Array.isArray(persona?.ingresos) ? persona.ingresos : [];
      const totalPersona = ingresosPersona.reduce(
        (accIngresos, ingreso) => accIngresos + parseSalario(ingreso?.salario),
        0
      );
      return accPersonas + totalPersona;
    }, 0);

    ingresosRows.push([
      "TOTAL DEL REGISTRO",
      "",
      "",
      "",
      formatearPrecio(totalIngresosRegistro),
    ]);

    yTabla = (doc.lastAutoTable?.finalY ?? 20) + 10;
    yTabla = drawSectionTitle(yTabla, "Ingresos y situación laboral");

    autoTable(doc, {
      startY: yTabla,
      head: [["Persona", "Rol", "Situación laboral", "Ocupación", "Salario"]],
      body: ingresosRows,
      styles: { fontSize: 8, cellPadding: 2, textColor: colors.text, lineColor: colors.lightBg, lineWidth: 0.2 },
      headStyles: { fillColor: colors.accent, textColor: 255, fontStyle: "bold" },
      didParseCell: (data) => {
        const isTotalRow = data.section === "body" && data.row.index === ingresosRows.length - 1;
        if (isTotalRow) {
          data.cell.styles.fillColor = [232, 240, 254];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [44, 62, 80];
        }
      },
      alternateRowStyles: { fillColor: colors.lightBg },
      theme: "striped",
      margin: { left: marginX, right: marginX },
    });

    yTabla = (doc.lastAutoTable?.finalY ?? 20) + 10;
    yTabla = drawSectionTitle(yTabla, "Datos de vivienda");

    autoTable(doc, {
      startY: yTabla,
      head: [["Nombre", "Vivienda", "Dormitorios", "Estado", "Alquiler", "Valor alquiler"]],
      body: viviendasRows,
      styles: { fontSize: 8, cellPadding: 2, textColor: colors.text, lineColor: colors.lightBg, lineWidth: 0.2 },
      headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: colors.lightBg },
      theme: "striped",
      margin: { left: marginX, right: marginX },
    });

    const textoSituacionMorosidad = (situacion) => {
      if (situacion == null || situacion === "") return "—";
      const n = Number(situacion);
      const c =
        clasificacionesDeudor[n] ??
        clasificacionesDeudor[situacion];
      const desc = c?.descripcion ?? "Desconocido";
      return `${Number.isFinite(n) ? n : situacion} - ${desc}`;
    };

    const morosidadRows = personas.flatMap((p) => {
      const items = morosidadData?.[p?.idPersona] ?? [];
      const arr = Array.isArray(items) ? items : [];
      if (!p?.idPersona || arr.length === 0) {
        return [
          [
            `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "-",
            p?.CUIL_CUIT ? formatearCUIT(p.CUIL_CUIT) : "-",
            "—",
            "—",
            "—",
            "—",
          ],
        ];
      }
      return arr.map((info) => [
        `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || "-",
        p?.CUIL_CUIT ? formatearCUIT(p.CUIL_CUIT) : "-",
        info?.periodo ? formatPeriodo(info.periodo) : "-",
        info?.entidad ?? "-",
        textoSituacionMorosidad(info?.situacion),
        info?.procesoJud ? "Sí" : "No",
      ]);
    });

    yTabla = (doc.lastAutoTable?.finalY ?? 20) + 10;
    yTabla = drawSectionTitle(yTabla, "Morosidad (BCRA)");

    autoTable(doc, {
      startY: yTabla,
      head: [["Persona", "CUIT", "Último período", "Entidad", "Situación", "Proc. Jud."]],
      body: morosidadRows,
      styles: { fontSize: 8, cellPadding: 2, textColor: colors.text, lineColor: colors.lightBg, lineWidth: 0.2 },
      headStyles: { fillColor: colors.secondary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: colors.lightBg },
      theme: "striped",
      margin: { left: marginX, right: marginX },
    });

    const safeFile = String(numeroRegistro).replace(/[^\w.-]+/g, "_");
    doc.save(`registro-${safeFile}.pdf`);
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!registro) return null;


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
              onClick={handleDescargarPDF}
              className={styles.editButton}
              type="button"
            >
              Descargar PDF
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
