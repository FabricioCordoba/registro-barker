
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./dashboard.module.css";
import { RegistroContext } from "../context/RegistroConext";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { formatearPrecio, formatearDNI, formatPeriodo } from "../services/transformDataDto";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTokenMonitor } from "../hooks/useTokenMonitor";
import dayjs from "dayjs";
import { getRegistroDeudorBcra } from "../services/registroService";
import { clasificacionesDeudor } from "../services/clasificacionDeudor";
import { ordenarDatosPorRegistroFamiliar } from "../services/ordenarDatosExcel";

const Dashboard = () => {
  const { registros = [], loading, error, getRegistros } =
    useContext(RegistroContext);

  const { logout, token } = useContext(AuthContext);

  const [registroHover, setRegistroHover] = useState(null);
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();

  // Monitorear el token en tiempo real
  useTokenMonitor(logout, navigate);

  const [filtros, setFiltros] = useState({
    dni: "",
    apellido: "",
    localidadVivienda: "",
    localidadLote: "",
    numeroRegistro: "",
    tipoPersona: "Todos",
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
            icon: "warning",
            title: "Sesión expirada",
            text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          });

          handleLogout();
        }
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al verificar la sesión",
      });

      handleLogout();
    }
  };

  useEffect(() => {
    decodeToken();
  }, [token]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      dni: "",
      apellido: "",
      localidadVivienda: "",
      localidadLote: "",
      numeroRegistro: "",
      tipoPersona: "Todos",
    });

    setPaginaActual(1);
  };

  const obtenerNumeroRegistroFamilia = (personas = []) => {
    const titular = personas.find(
      (persona) => persona.titular_cotitular === "Titular"
    );
    const candidatos = titular
      ? [titular, ...personas.filter((persona) => persona !== titular)]
      : personas;

    return candidatos
      .map((persona) => persona.numero_registro)
      .find(
        (numero) =>
          numero !== null &&
          numero !== undefined &&
          !(typeof numero === "string" && numero.trim() === "") &&
          Number.isFinite(Number(numero))
      );
  };

  const prepararPersonasParaExportar = (
    registro,
    personas = registro.personas || []
  ) => {
    const numeroRegistro =
      registro.numeroRegistro ??
      obtenerNumeroRegistroFamilia(registro.personas || []);

    return personas.map((persona) => ({
      persona,
      vivienda: persona.vivienda,
      lote: persona.lote,
      registroId: registro.idRegistro ?? persona.idRegistro,
      numeroRegistro,
    }));
  };

  // Convierte importes numéricos o cadenas con formato argentino a número.
  const aNumero = (valor) => {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }

    if (valor === null || valor === undefined || valor === "") {
      return 0;
    }

    const texto = String(valor).trim();

    // Ejemplos: "1.234,56" -> 1234.56; "1234.56" -> 1234.56
    const normalizado = texto.includes(",")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto;

    const numero = Number(normalizado);

    return Number.isFinite(numero) ? numero : 0;
  };

  // Filtrar registros y personas.
  const registrosFiltrados = (registros || [])
    .map((registro) => {
      const personas = registro.personas || [];

      const personasFiltradas = personas.filter((persona) => {
        return (
          (!filtros.dni ||
            persona.dni
              ?.toString()
              .toLowerCase()
              .includes(filtros.dni.toLowerCase())) &&
          (!filtros.apellido ||
            persona.apellido
              ?.toLowerCase()
              .includes(filtros.apellido.toLowerCase())) &&
          (!filtros.numeroRegistro ||
            persona.numero_registro
              ?.toString()
              .includes(filtros.numeroRegistro)) &&
          (!filtros.localidadVivienda ||
            persona.vivienda?.localidad
              ?.toLowerCase()
              .includes(filtros.localidadVivienda.toLowerCase())) &&
          (!filtros.localidadLote ||
            persona.lote?.localidad
              ?.toLowerCase()
              .includes(filtros.localidadLote.toLowerCase())) &&
          (filtros.tipoPersona === "Todos" ||
            persona.titular_cotitular === filtros.tipoPersona)
        );
      });

      return personasFiltradas.length > 0
        ? {
            ...registro,
            personas: personasFiltradas,
            numeroRegistro: obtenerNumeroRegistroFamilia(personas),
          }
        : null;
    })
    .filter(Boolean);

  // Obtener el número de registro para ordenar.
  const getNumeroRegistro = (registro) => {
    const raw =
      registro.numeroRegistro ??
      registro.personas?.find(
        (persona) =>
          persona.numero_registro !== null &&
          persona.numero_registro !== undefined &&
          !(typeof persona.numero_registro === "string" &&
            persona.numero_registro.trim() === "")
      )?.numero_registro;

    if (
      raw === null ||
      raw === undefined ||
      (typeof raw === "string" && raw.trim() === "")
    ) {
      return null;
    }

    const numero = Number(raw);
    return Number.isFinite(numero) ? numero : null;
  };

  // Ordenar los registros antes de paginar.
  const registrosOrdenados = registrosFiltrados
    .map((registro, indice) => ({
      registro,
      indice,
      numeroRegistro: getNumeroRegistro(registro),
    }))
    .sort((a, b) => {
      if (a.numeroRegistro === null && b.numeroRegistro !== null) return 1;
      if (a.numeroRegistro !== null && b.numeroRegistro === null) return -1;
      if (a.numeroRegistro !== b.numeroRegistro) {
        return a.numeroRegistro - b.numeroRegistro;
      }

      return a.indice - b.indice;
    })
    .map(({ registro }) => registro);

  // Paginación.
  const indexLast = paginaActual * registrosPorPagina;
  const indexFirst = indexLast - registrosPorPagina;

  const registrosActuales = registrosOrdenados.slice(
    indexFirst,
    indexLast
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosOrdenados.length / registrosPorPagina)
  );

  // Personas filtradas, preparadas para exportar.
  const personasExtendidas = registrosFiltrados.flatMap((registro) =>
    prepararPersonasParaExportar(registro)
  );

  // Calcular edad.
  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return "";

    const nacimiento = new Date(fechaNacimiento);

    if (Number.isNaN(nacimiento.getTime())) return "";

    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }

  // Formatear fechas.
  const formatFecha = (fecha) => {
    if (!fecha) return "----";

    const fechaFormateada = dayjs(fecha);

    return fechaFormateada.isValid()
      ? fechaFormateada.format("DD/MM/YYYY")
      : "----";
  };

  // Obtener una descripción legible de la situación BCRA.
  const obtenerSituacion = (situacion) => {
    if (
      situacion === null ||
      situacion === undefined ||
      situacion === ""
    ) {
      return "Sin informar";
    }

    const clasificacion =
      clasificacionesDeudor?.[situacion] ??
      clasificacionesDeudor?.[String(situacion)];

    if (typeof clasificacion === "string") {
      return `${situacion} - ${clasificacion}`;
    }

    if (clasificacion?.descripcion) {
      return `${situacion} - ${clasificacion.descripcion}`;
    }

    return String(situacion);
  };

  // Consultar la morosidad del BCRA para cada persona única.
  const consultarMorosidadBcra = async (datos) => {
    const personasPorClave = new Map();

    datos.forEach(({ persona }) => {
      const cuit = String(persona.CUIL_CUIT ?? "").replace(/\D/g, "");
      const identificador = persona.idPersona ?? persona.dni ?? "";
      const clave = /^\d{11}$/.test(cuit)
        ? cuit
        : `persona:${identificador}`;

      if (!personasPorClave.has(clave)) {
        personasPorClave.set(clave, persona);
      }
    });

    const morosidadPorPersona = new Map();

    for (const [clave, persona] of personasPorClave) {
      const cuit = String(persona.CUIL_CUIT ?? "").replace(/\D/g, "");

      if (!/^\d{11}$/.test(cuit)) {
        morosidadPorPersona.set(clave, {
          estado: cuit ? "CUIL/CUIT inválido" : "Sin CUIT/CUIL",
          items: [],
        });
        continue;
      }

      try {
        const respuesta = await getRegistroDeudorBcra(cuit);
        const periodos = respuesta?.results?.periodos;

        if (!Array.isArray(periodos)) {
          console.error(
            `La respuesta del BCRA no contiene períodos para la persona ${clave}:`,
            respuesta
          );
          morosidadPorPersona.set(clave, {
            estado: "Error de consulta",
            items: [],
          });
          continue;
        }

        const items = periodos.flatMap((periodo) =>
          (periodo.entidades || []).map((entidad) => ({
            periodo: periodo.periodo ?? "",
            entidad: entidad.entidad ?? "",
            deuda: entidad.monto ?? "",
            situacion: entidad.situacion ?? "",
            procesoJud: entidad.procesoJud,
          }))
        );

        morosidadPorPersona.set(clave, {
          estado: items.length > 0 ? "Consultado" : "Sin datos",
          items,
        });
      } catch (err) {
        console.error(
          `Error al consultar BCRA para la persona ${clave}:`,
          err
        );

        morosidadPorPersona.set(clave, {
          estado: "Error de consulta",
          items: [],
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return morosidadPorPersona;
  };

  const claveMorosidadPersona = (persona) => {
    const cuit = String(persona.CUIL_CUIT ?? "").replace(/\D/g, "");
    if (/^\d{11}$/.test(cuit)) return cuit;

    return `persona:${persona.idPersona ?? persona.dni ?? ""}`;
  };

  // Descargar Excel con datos personales, ingresos, vivienda y morosidad.
  const descargarExcel = async (datos, nombre) => {
    if (!datos || datos.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay personas para exportar.",
      });

      return;
    }

    Swal.fire({
      title: "Preparando Excel",
      text: "Consultando la información de morosidad del BCRA. Esto puede tardar unos momentos.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // Ordenar por registro familiar y mantener a sus integrantes juntos.
      const datosOrdenados = ordenarDatosPorRegistroFamiliar(datos);

      // Consultar morosidad BCRA.
      const morosidadPorPersona =
        await consultarMorosidadBcra(datosOrdenados);

      // Máxima cantidad de ingresos entre las personas exportadas.
      const maxIngresos = Math.max(
        0,
        ...datosOrdenados.map(
          ({ persona }) => persona.ingresos?.length || 0
        )
      );

      // Máxima cantidad de registros de morosidad entre las personas.
      const maxMorosidades = Math.max(
        1,
        ...datosOrdenados.map(({ persona }) => {
          const clave = claveMorosidadPersona(persona);

          return morosidadPorPersona.get(clave)?.items?.length || 0;
        })
      );

      // Total de ingresos por registro familiar.
      const totalPorFamilia = {};

      datosOrdenados.forEach(({ persona, registroId }) => {
        const idReg = registroId ?? persona.idRegistro;

        if (idReg === null || idReg === undefined) return;

        const totalPersona = (persona.ingresos || []).reduce(
          (total, ingreso) => total + aNumero(ingreso.salario),
          0
        );

        totalPorFamilia[idReg] =
          (totalPorFamilia[idReg] ?? 0) + totalPersona;
      });

      const encabezados = [
        "ID Registro",
        "ID Persona",
        "N° Registro",
        "Apellido",
        "Nombre",
        "DNI",
        "CUIL/CUIT",
        "Morosidad BCRA (detalle)",
        "Género",
        "Fecha Nacimiento",
        "Edad",
        "Certificado Discapacidad",
        "Estado Civil",
        "Nacionalidad",
        "Teléfono",
        "Email",

        ...Array.from(
          { length: maxIngresos },
          (_, i) => `Situación Laboral ${i + 1}`
        ),

        ...Array.from(
          { length: maxIngresos },
          (_, i) => `Ocupación ${i + 1}`
        ),

        ...Array.from(
          { length: maxIngresos },
          (_, i) => `Ingreso ${i + 1}`
        ),

        "Total Ingresos por Persona",
        "Ingresos Totales por Registro",
        "Localidad Lote",
        "Tipo",
        "Localidad que Reside",
        "Dirección",
        "Número",
        "Piso",
        "Departamento",
        "Alquila",
        "Valor Alquiler",
        "Particular/Inmobiliaria",
        "Estado del Inmueble",
        "Cantidad dormitorios",

        // Datos de morosidad.
        "Estado consulta BCRA",

        ...Array.from(
          { length: maxMorosidades },
          (_, i) => `Período BCRA ${i + 1}`
        ),

        ...Array.from(
          { length: maxMorosidades },
          (_, i) => `Entidad BCRA ${i + 1}`
        ),

        ...Array.from(
          { length: maxMorosidades },
          (_, i) => `Monto deuda BCRA ${i + 1}`
        ),

        ...Array.from(
          { length: maxMorosidades },
          (_, i) => `Situación BCRA ${i + 1}`
        ),

        ...Array.from(
          { length: maxMorosidades },
          (_, i) => `Proceso judicial BCRA ${i + 1}`
        ),
      ];

      const filas = datosOrdenados.map(
        ({ persona, lote, vivienda, registroId }) => {
          const ingresos = persona.ingresos || [];

          const situaciones = ingresos.map(
            (ingreso) => ingreso.situacion_laboral ?? "----"
          );

          const ocupaciones = ingresos.map(
            (ingreso) => ingreso.ocupacion ?? "----"
          );

          const salarios = ingresos.map((ingreso) =>
            ingreso.salario === "" ||
              ingreso.salario === null ||
              ingreso.salario === undefined
              ? null
              : aNumero(ingreso.salario)
          );

          const idReg = registroId ?? persona.idRegistro;

          const totalIngresosPersona = ingresos.reduce(
            (total, ingreso) => total + aNumero(ingreso.salario),
            0
          );

          const clavePersona = claveMorosidadPersona(persona);

          const infoMorosidad = morosidadPorPersona.get(clavePersona) || {
            estado: "No consultado",
            items: [],
          };

          const itemsMorosidad = infoMorosidad.items || [];

          const periodos = itemsMorosidad.map((item) =>
            item.periodo ? formatPeriodo(item.periodo) : "----"
          );

          const entidades = itemsMorosidad.map(
            (item) => item.entidad || "----"
          );

          // Se conserva el monto como número para permitir cálculos en Excel.
          const montosDeuda = itemsMorosidad.map((item) => {
            if (
              item.deuda === "" ||
              item.deuda === null ||
              item.deuda === undefined
            ) {
              return "----";
            }

            return aNumero(item.deuda);
          });

          const situacionesBcra = itemsMorosidad.map((item) =>
            obtenerSituacion(item.situacion)
          );

          const procesosJudiciales = itemsMorosidad.map((item) => {
            if (
              item.procesoJud === null ||
              item.procesoJud === undefined ||
              item.procesoJud === ""
            ) {
              return "Sin informar";
            }

            if (typeof item.procesoJud === "boolean") {
              return item.procesoJud ? "Sí" : "No";
            }

            return String(item.procesoJud);
          });

          const morosidadResumen = itemsMorosidad.length
            ? itemsMorosidad.map((item) => {
              const periodo = item.periodo
                ? formatPeriodo(item.periodo)
                : "Período sin informar";
              const entidad = item.entidad || "Entidad sin informar";
              const deuda =
                item.deuda === "" ||
                  item.deuda === null ||
                  item.deuda === undefined
                  ? "Monto sin informar"
                  : formatearPrecio(aNumero(item.deuda));
              const situacion = obtenerSituacion(item.situacion);

              return `${periodo} | ${entidad} | ${deuda} | ${situacion}`;
            }).join("\n")
            : "Sin datos de morosidad";

          return [
            idReg ?? "----",
            persona.idPersona ?? "----",
            persona.numero_registro ?? "----",
            persona.apellido ?? "----",
            persona.nombre ?? "----",
            persona.dni ?? "----",
            persona.CUIL_CUIT ?? "----",
            morosidadResumen,
            persona.genero ?? "----",
            formatFecha(persona.fecha_nacimiento),
            calcularEdad(persona.fecha_nacimiento),

            persona.certificado_discapacidad === true
              ? "Sí"
              : persona.certificado_discapacidad === false
                ? "No"
                : "No informado",

            persona.estado_civil ?? "----",
            persona.nacionalidad ?? "----",
            persona.telefono ?? "----",
            persona.email ?? "----",

            ...Array.from(
              { length: maxIngresos },
              (_, i) => situaciones[i] || "----"
            ),

            ...Array.from(
              { length: maxIngresos },
              (_, i) => ocupaciones[i] || "----"
            ),

            ...Array.from(
              { length: maxIngresos },
              (_, i) => salarios[i] || "----"
            ),

            totalIngresosPersona,

            persona.titular_cotitular === "Titular"
              ? (totalPorFamilia[idReg] ?? 0)
              : null,

            lote?.localidad ?? "-----------",
            persona.titular_cotitular ?? "----",
            vivienda?.localidad ?? "-----------",
            vivienda?.direccion ?? "-----------",
            vivienda?.numero_direccion ?? "----",
            vivienda?.piso ?? "----",
            vivienda?.numero_departamento ?? "----",

            vivienda?.alquiler === true
              ? "Sí"
              : vivienda?.alquiler === false
                ? "No"
                : "No informado",
            vivienda?.valor_alquiler !== null &&
              vivienda?.valor_alquiler !== undefined &&
              vivienda?.valor_alquiler !== ""
              ? aNumero(vivienda.valor_alquiler)
              : null,

            vivienda?.tipo_alquiler ?? "----",
            vivienda?.estado_vivienda ?? "----",
            vivienda?.cantidad_dormitorios ?? "----",

            // Estado de consulta.
            infoMorosidad.estado,

            ...Array.from(
              { length: maxMorosidades },
              (_, i) => periodos[i] ?? "----"
            ),

            ...Array.from(
              { length: maxMorosidades },
              (_, i) => entidades[i] ?? "----"
            ),

            ...Array.from(
              { length: maxMorosidades },
              (_, i) => montosDeuda[i] ?? "----"
            ),

            ...Array.from(
              { length: maxMorosidades },
              (_, i) => situacionesBcra[i] ?? "----"
            ),

            ...Array.from(
              { length: maxMorosidades },
              (_, i) => procesosJudiciales[i] ?? "----"
            ),
          ];
        }
      );

      // Crear el archivo Excel.
      const hoja = XLSX.utils.aoa_to_sheet([
        encabezados,
        ...filas,
      ]);

      
const columnasMonetarias = [
  ...Array.from(
    { length: maxIngresos },
    (_, i) => encabezados.indexOf(`Ingreso ${i + 1}`)
  ),
  encabezados.indexOf("Total Ingresos por Persona"),
  encabezados.indexOf("Ingresos Totales por Registro"),
  encabezados.indexOf("Valor Alquiler"),
  ...Array.from(
    { length: maxMorosidades },
    (_, i) => encabezados.indexOf(`Monto deuda BCRA ${i + 1}`)
  ),
].filter((indice) => indice >= 0);

for (let fila = 1; fila <= filas.length; fila++) {
  for (const columna of columnasMonetarias) {
    const referencia = XLSX.utils.encode_cell({
      r: fila,
      c: columna,
    });

    const celda = hoja[referencia];

    if (celda && typeof celda.v === "number") {
      celda.t = "n";
      celda.z = '"$" #,##0.00';
    }
  }
}

      // Ajustar el ancho de las columnas.
      hoja["!cols"] = encabezados.map((encabezado, indice) => {
        const anchoEncabezado = String(encabezado).length;

        const anchoContenido = filas.reduce((maximo, fila) => {
          const valor = fila[indice];

          return Math.max(
            maximo,
            String(valor ?? "").length
          );
        }, 0);

        return {
          wch: Math.min(
            Math.max(anchoEncabezado, anchoContenido, 12),
            35
          ),
        };
      });

      // Congelar encabezado.
      hoja["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
      };

      const libro = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Personas"
      );

      XLSX.writeFile(libro, `${nombre}.xlsx`);

      const cantidadErrores = Array.from(
        morosidadPorPersona.values()
      ).filter((info) => info.estado === "Error de consulta").length;

      const cantidadSinCuit = Array.from(
        morosidadPorPersona.values()
      ).filter((info) => info.estado === "Sin CUIT/CUIL").length;

      const cantidadCuitInvalido = Array.from(
        morosidadPorPersona.values()
      ).filter((info) => info.estado === "CUIL/CUIT inválido").length;
      const cantidadPersonasConDatos = Array.from(
        morosidadPorPersona.values()
      ).filter((info) => info.items.length > 0).length;
      const cantidadRegistrosMorosidad = Array.from(
        morosidadPorPersona.values()
      ).reduce((total, info) => total + info.items.length, 0);

      Swal.close();

      if (
        cantidadErrores > 0 ||
        cantidadSinCuit > 0 ||
        cantidadCuitInvalido > 0
      ) {
        Swal.fire({
          icon: "warning",
          title: "Excel generado con observaciones",
          html: `
            <p>El archivo se generó correctamente.</p>
            <p>Personas con error de consulta BCRA: <strong>${cantidadErrores}</strong></p>
            <p>Personas sin CUIT/CUIL: <strong>${cantidadSinCuit}</strong></p>
            <p>Personas con CUIT/CUIL inválido: <strong>${cantidadCuitInvalido}</strong></p>
            <p>Personas con morosidad informada: <strong>${cantidadPersonasConDatos}</strong></p>
            <p>Registros BCRA exportados: <strong>${cantidadRegistrosMorosidad}</strong></p>
            <p>Revisá la columna "Estado consulta BCRA" en el Excel.</p>
          `,
        });
      } else if (cantidadRegistrosMorosidad === 0) {
        Swal.fire({
          icon: "info",
          title: "Excel generado sin datos de morosidad",
          text: 'El BCRA no devolvió registros para los CUIT/CUIL consultados. Revisá la columna "Estado consulta BCRA".',
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Excel generado",
          text: "El archivo se descargó correctamente.",
          timer: 2200,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error al generar el Excel:", err);

      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Error al generar el Excel",
        text:
          "No se pudo generar el archivo. Revisá la consola para obtener más detalles.",
      });
    }
  };

  const handleVerRegistro = (registroId) => {
    navigate(`/ver-registro/${registroId}`);
  };

  // Exportar todas las personas sin aplicar filtros.
  const descargarTodosLosRegistros = () => {
    const todos = (registros || []).flatMap((registro) =>
      prepararPersonasParaExportar(registro)
    );

    descargarExcel(todos, "todas_personas");
  };

  // Exportar solamente las personas que coinciden con los filtros.
  const descargarRegistrosFiltrados = () => {
    descargarExcel(personasExtendidas, "personas_filtradas");
  };

  const descargarTodosLosRegistrosPDF = async () => {
    const registrosConPersonas = (registros || [])
      .filter((registro) => registro.personas?.length)
      .sort((a, b) => getNumeroRegistro(a) - getNumeroRegistro(b));
    if (registrosConPersonas.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para exportar.",
      });
      return;
    }

    Swal.fire({
      title: "Preparando PDF",
      text: "Consultando la información de morosidad. Esto puede tardar unos momentos.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const personasExtendidasPDF = registrosConPersonas.flatMap((registro) =>
        registro.personas.map((persona) => ({ persona }))
      );
      const morosidadPorPersona = await consultarMorosidadBcra(personasExtendidasPDF);
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;
      const colors = {
        primary: "#2c3e50",
        secondary: "#007bff",
        accent: "#34495e",
        text: "#4a4a4a",
        lightBg: "#f8f9fa",
      };
      const hoy = new Date();
      const fecha = `${String(hoy.getDate()).padStart(2, "0")}/${String(
        hoy.getMonth() + 1
      ).padStart(2, "0")}/${hoy.getFullYear()}`;

      let logo;
      try {
        logo = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const context = canvas.getContext("2d");
              context.drawImage(img, 0, 0);
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
      } catch (error) {
        console.warn("No se pudo cargar el logo para el PDF:", error);
      }

      const dibujarEncabezado = (numeroRegistro) => {
        doc.setFillColor(colors.primary);
        doc.rect(0, 0, pageWidth, 28, "F");

        if (logo) {
          const containerX = marginX;
          const containerY = 4;
          const containerW = 20;
          const containerH = 20;
          const innerPadding = 1.5;
          const ratio = Math.min(
            (containerW - innerPadding * 2) / logo.width,
            (containerH - innerPadding * 2) / logo.height
          );
          const drawW = logo.width * ratio;
          const drawH = logo.height * ratio;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(containerX, containerY, containerW, containerH, 2, 2, "F");
          doc.addImage(
            logo.dataUrl,
            "PNG",
            containerX + (containerW - drawW) / 2,
            containerY + (containerH - drawH) / 2,
            drawW,
            drawH
          );
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Comprobante de Registro", marginX + 24, 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text('Programa "Mi hábitat, mi hogar"', marginX + 24, 20);
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
      };

      const drawSectionTitle = (y, title, numeroRegistro) => {
        if (y > pageHeight - 65) {
          doc.addPage();
          dibujarEncabezado(numeroRegistro);
          y = 44;
        }
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

      const opcionesTabla = (headColor, numeroRegistro) => ({
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: colors.text,
          lineColor: colors.lightBg,
          lineWidth: 0.2,
        },
        headStyles: { fillColor: headColor, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: colors.lightBg },
        theme: "striped",
        margin: { top: 44, left: marginX, right: marginX },
        didDrawPage: () => dibujarEncabezado(numeroRegistro),
      });

      const parseSalario = (valor) => {
        if (valor === null || valor === undefined) return 0;
        if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
        let texto = String(valor).trim().replace(/[^\d,.-]/g, "");
        if (texto.includes(".") && texto.includes(",")) {
          texto = texto.replace(/\./g, "").replace(",", ".");
        } else if (texto.includes(",")) {
          texto = texto.replace(",", ".");
        } else if ((texto.match(/\./g) || []).length > 1) {
          texto = texto.replace(/\./g, "");
        }
        const numero = Number.parseFloat(texto);
        return Number.isFinite(numero) ? numero : 0;
      };

      const formatearCUIT = (cuit) => {
        const digitos = String(cuit ?? "").replace(/\D/g, "");
        return digitos.length === 11
          ? `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`
          : cuit || "-";
      };

      const textoDireccionVivienda = (vivienda) => {
        if (!vivienda || typeof vivienda !== "object") return "—";
        const partes = [
          `${vivienda.direccion || "-"} N° ${vivienda.numero_direccion || "-"}`,
        ];
        if (vivienda.piso_departamento && Number(vivienda.piso_departamento) !== 0) {
          partes.push(`Piso ${vivienda.piso_departamento}`);
        }
        if (
          vivienda.numero_departamento &&
          String(vivienda.numero_departamento).trim() !== "0"
        ) {
          partes.push(`Dpto ${vivienda.numero_departamento}`);
        }
        if (vivienda.localidad) partes.push(vivienda.localidad);
        return partes.join(" · ");
      };

      const textoSituacionMorosidad = (situacion) => {
        if (situacion == null || situacion === "") return "—";
        const numero = Number(situacion);
        const clasificacion =
          clasificacionesDeudor[numero] ?? clasificacionesDeudor[situacion];
        const descripcion = clasificacion?.descripcion ?? "Desconocido";
        return `${Number.isFinite(numero) ? numero : situacion} - ${descripcion}`;
      };

      registrosConPersonas.forEach((registro, indiceRegistro) => {
        const personas = registro.personas || [];
        const numeroRegistro =
          personas[0]?.numero_registro ?? registro.idRegistro ?? "-";
        if (indiceRegistro > 0) doc.addPage();
        dibujarEncabezado(numeroRegistro);

        let yTabla = drawSectionTitle(
          44,
          "Datos de las personas integrantes",
          numeroRegistro
        );
        autoTable(doc, {
          startY: yTabla,
          head: [[
            "Rol", "Nombre", "DNI", "CUIT", "Email", "Teléfono",
            "Lote", "Estado civil", "Vínculo con el titular", "Vivienda",
          ]],
          body: personas.map((persona) => [
            persona?.titular_cotitular ?? "-",
            `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim() || "-",
            persona?.dni ? formatearDNI(persona.dni) : "-",
            persona?.CUIL_CUIT ? formatearCUIT(persona.CUIL_CUIT) : "-",
            persona?.email ?? "-",
            persona?.telefono ?? "-",
            persona?.lote ? `Lote: ${persona.lote.localidad || "-"}` : "-",
            persona?.estado_civil ?? "-",
            persona?.titular_cotitular === "Titular"
              ? "Titular"
              : persona?.vinculo ?? "-",
            persona?.vivienda
              ? `Vivienda: ${persona.vivienda.direccion || "-"} N° ${
                  persona.vivienda.numero_direccion || "-"
                }${
                  persona.vivienda.piso_departamento &&
                  Number(persona.vivienda.piso_departamento) !== 0
                    ? ` Piso: ${persona.vivienda.piso_departamento}`
                    : ""
                }`
              : "-",
          ]),
          ...opcionesTabla(colors.primary, numeroRegistro),
        });

        const viviendasRows = personas.map((persona) => {
          const vivienda = persona?.vivienda;
          const nombreCompleto =
            `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim() || "—";
          if (!vivienda || typeof vivienda !== "object") {
            return [nombreCompleto, "—", "—", "—", "—", "—"];
          }
          return [
            nombreCompleto,
            textoDireccionVivienda(vivienda),
            vivienda.cantidad_dormitorios != null &&
            vivienda.cantidad_dormitorios !== ""
              ? String(vivienda.cantidad_dormitorios)
              : "—",
            vivienda.estado_vivienda ?? "—",
            vivienda.alquiler === true
              ? "Sí"
              : vivienda.alquiler === false
                ? "No"
                : "—",
            vivienda.alquiler && vivienda.valor_alquiler != null
              ? formatearPrecio(vivienda.valor_alquiler)
              : "—",
          ];
        });

        const ingresosRows = personas.flatMap((persona) => {
          const ingresos = Array.isArray(persona?.ingresos)
            ? persona.ingresos
            : [];
          if (ingresos.length === 0) {
            return [[
              `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim() || "-",
              persona?.titular_cotitular ?? "-",
              "—",
              "—",
              "—",
            ]];
          }
          return ingresos.map((ingreso) => [
            `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim() || "-",
            persona?.titular_cotitular ?? "-",
            ingreso?.situacion_laboral ?? "-",
            ingreso?.ocupacion ?? "-",
            formatearPrecio(parseSalario(ingreso?.salario)),
          ]);
        });
        const totalIngresos = personas.reduce(
          (total, persona) =>
            total +
            (persona?.ingresos || []).reduce(
              (totalPersona, ingreso) =>
                totalPersona + parseSalario(ingreso?.salario),
              0
            ),
          0
        );
        ingresosRows.push([
          "TOTAL DEL REGISTRO", "", "", "", formatearPrecio(totalIngresos),
        ]);

        yTabla = doc.lastAutoTable.finalY + 10;
        yTabla = drawSectionTitle(
          yTabla,
          "Ingresos y situación laboral",
          numeroRegistro
        );
        autoTable(doc, {
          startY: yTabla,
          head: [["Persona", "Rol", "Situación laboral", "Ocupación", "Salario"]],
          body: ingresosRows,
          ...opcionesTabla(colors.accent, numeroRegistro),
          didParseCell: (data) => {
            if (
              data.section === "body" &&
              data.row.index === ingresosRows.length - 1
            ) {
              data.cell.styles.fillColor = [232, 240, 254];
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [44, 62, 80];
            }
          },
        });

        yTabla = doc.lastAutoTable.finalY + 10;
        yTabla = drawSectionTitle(yTabla, "Datos de vivienda", numeroRegistro);
        autoTable(doc, {
          startY: yTabla,
          head: [[
            "Nombre", "Vivienda", "Dormitorios", "Estado", "Alquiler",
            "Valor alquiler",
          ]],
          body: viviendasRows,
          ...opcionesTabla(colors.primary, numeroRegistro),
        });

        const morosidadRows = personas.flatMap((persona) => {
          const items =
            morosidadPorPersona.get(claveMorosidadPersona(persona))?.items || [];
          const nombreCompleto =
            `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim() || "-";
          if (items.length === 0) {
            return [[
              nombreCompleto,
              persona?.CUIL_CUIT ? formatearCUIT(persona.CUIL_CUIT) : "-",
              "—",
              "—",
              "—",
              "—",
            ]];
          }
          return items.map((item) => [
            nombreCompleto,
            persona?.CUIL_CUIT ? formatearCUIT(persona.CUIL_CUIT) : "-",
            item?.periodo ? formatPeriodo(item.periodo) : "-",
            item?.entidad ?? "-",
            textoSituacionMorosidad(item?.situacion),
            item?.procesoJud ? "Sí" : "No",
          ]);
        });

        yTabla = doc.lastAutoTable.finalY + 10;
        yTabla = drawSectionTitle(yTabla, "Morosidad (BCRA)", numeroRegistro);
        autoTable(doc, {
          startY: yTabla,
          head: [[
            "Persona", "CUIT", "Último período", "Entidad", "Situación",
            "Proc. Jud.",
          ]],
          body: morosidadRows,
          ...opcionesTabla(colors.secondary, numeroRegistro),
        });
      });

      doc.save("todos-los-registros.pdf");

      const erroresConsulta = Array.from(morosidadPorPersona.values()).filter(
        (info) => info.estado === "Error de consulta"
      ).length;
      Swal.close();
      if (erroresConsulta > 0) {
        Swal.fire({
          icon: "warning",
          title: "PDF generado con observaciones",
          text: `El archivo se descargó, pero no se pudo consultar la morosidad de ${erroresConsulta} CUIT/CUIL.`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "PDF generado",
          text: "Se descargó el PDF con todos los registros.",
          timer: 2200,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error al generar el PDF de registros:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error al generar el PDF",
        text: "No se pudo crear el archivo. Revisá la consola para más detalles.",
      });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      {userData && (
        <div className={styles.header}>
          <p>
            Bienvenido <strong>{userData.adminName}</strong>
          </p>

          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <h1 className={styles.title}>Personas Registradas</h1>

      <div className={styles.downloadButtons}>
        <button
          onClick={descargarTodosLosRegistrosPDF}
          className={styles.downloadButton}
        >
          Descargar Todos los registros (PDF)
        </button>

        <button
          onClick={descargarTodosLosRegistros}
          className={styles.downloadButton}
        >
          Descargar Todos los registros (Excel)
        </button>

        <button
          onClick={descargarRegistrosFiltrados}
          className={styles.downloadButton}
        >
          Descargar Registros Filtrados (Excel)
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filtrosContainer}>
        <div className={styles.filtroGroup}>
          <input
            name="numeroRegistro"
            placeholder="N° Registro"
            value={filtros.numeroRegistro}
            onChange={handleFiltroChange}
            className={styles.filtroInput}
          />

          <input
            name="dni"
            placeholder="DNI"
            value={filtros.dni}
            onChange={handleFiltroChange}
            className={styles.filtroInput}
          />

          <input
            name="apellido"
            placeholder="Apellido"
            value={filtros.apellido}
            onChange={handleFiltroChange}
            className={styles.filtroInput}
          />

          <select
            name="localidadVivienda"
            value={filtros.localidadVivienda}
            onChange={handleFiltroChange}
            className={styles.filtroSelect}
          >
            <option value="">Localidad Vivienda</option>
            <option value="Benito Juárez">Benito Juárez</option>
            <option value="Barker">Barker</option>
            <option value="Villa Cacique">Villa Cacique</option>
            <option value="Tedín Uriburu">Tedín Uriburu</option>
            <option value="Estación López">Estación López</option>
            <option value="El Luchador">El Luchador</option>
            <option value="Coronel Rodolfo Bunge">
              Coronel Rodolfo Bunge
            </option>
          </select>

          <select
            name="localidadLote"
            value={filtros.localidadLote}
            onChange={handleFiltroChange}
            className={styles.filtroSelect}
          >
            <option value="">Localidad Lote</option>
            <option value="Benito Juárez">Benito Juárez</option>
            <option value="Barker">Barker</option>
            <option value="Tedín Uriburu">Tedín Uriburu</option>
            <option value="El Luchador">El Luchador</option>
          </select>

          <select
            name="tipoPersona"
            value={filtros.tipoPersona}
            onChange={handleFiltroChange}
            className={styles.filtroSelect}
          >
            <option value="Todos">Todos</option>
            <option value="Titular">Titular</option>
            <option value="Cotitular">Cotitular</option>
            <option value="Conviviente">Conviviente</option>
          </select>

          <button
            onClick={limpiarFiltros}
            className={styles.limpiarFiltros}
          >
            Limpiar Filtros
          </button>
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
            {registrosActuales.length > 0 ? (
              registrosActuales.map((registro, idxRegistro) => {
                const personasRegistro = registro.personas || [];

                const sumaTotalIngresos = personasRegistro.reduce(
                  (total, persona) => {
                    const ingresosPersona = persona.ingresos || [];

                    return (
                      total +
                      ingresosPersona.reduce(
                        (sum, ingreso) =>
                          sum + aNumero(ingreso.salario),
                        0
                      )
                    );
                  },
                  0
                );

                const rowClass =
                  idxRegistro % 2 === 0
                    ? styles.registroPar
                    : styles.registroImpar;

                return personasRegistro.map((persona, idxPersona) => (
                  <tr
                    key={`${registro.idRegistro}-${persona.idPersona}`}
                    className={`${rowClass} ${registro.idRegistro === registroHover
                      ? styles.registroHover
                      : ""
                      }`}
                    onMouseEnter={() =>
                      setRegistroHover(registro.idRegistro)
                    }
                    onMouseLeave={() => setRegistroHover(null)}
                  >
                    <td>{persona.numero_registro ?? "---"}</td>
                    <td>{persona.apellido}</td>
                    <td>{persona.nombre}</td>
                    <td>{formatearDNI(persona.dni)}</td>
                    <td>{persona.telefono}</td>
                    <td>{persona.lote?.localidad ?? "---"}</td>
                    <td>{persona.vivienda?.localidad ?? "---"}</td>
                    <td>{persona.titular_cotitular}</td>

                    <td>
                      {persona.ingresos &&
                        persona.ingresos.length > 0 ? (
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {persona.ingresos.map((ingreso, i) => (
                            <li key={i}>
                              {formatearPrecio(
                                aNumero(ingreso.salario)
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Sin ingresos"
                      )}
                    </td>

                    {idxPersona === 0 && (
                      <td rowSpan={personasRegistro.length}>
                        <strong>
                          {formatearPrecio(sumaTotalIngresos)}
                        </strong>
                      </td>
                    )}

                    {idxPersona === 0 && (
                      <td rowSpan={personasRegistro.length}>
                        <div className={styles.containerButtonAccion}>
                          <button
                            className={styles.viewButton}
                            onClick={() =>
                              handleVerRegistro(registro.idRegistro)
                            }
                          >
                            Ver Registro
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ));
              })
            ) : (
              <tr>
                <td
                  colSpan="11"
                  style={{ textAlign: "center" }}
                >
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className={styles.pagination}>
          <button
            onClick={() =>
              setPaginaActual((pagina) => Math.max(1, pagina - 1))
            }
            disabled={paginaActual === 1}
            className={styles.paginationButton}
          >
            Anterior
          </button>

          <span className={styles.paginationInfo}>
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            onClick={() =>
              setPaginaActual((pagina) =>
                Math.min(totalPaginas, pagina + 1)
              )
            }
            disabled={
              paginaActual === totalPaginas ||
              registrosOrdenados.length === 0
            }
            className={styles.paginationButton}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
