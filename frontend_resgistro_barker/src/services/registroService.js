
const API_URL = import.meta.env.VITE_API_REGISTRO;

const API_BASE = import.meta.env.VITE_API_BASE;

import { esMenorDeEdad } from "./transformDataDto";

export const fetchRegistros = async () => {
  const token = localStorage.getItem("token"); // :white_check_mark: siempre lo leo desde acá
  if (!token) {
    throw new Error("No hay token disponible");
  }
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Error al obtener registros: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error en fetchRegistros:", error);
    throw error;
  }
};

export const updateRegistroById = async (id, formData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(formData)
    });

    // Verifica si la respuesta fue exitosa (status 200-299)
    if (!response.ok) {
      // Si la respuesta no es exitosa, lanza un error con el código de estado
      const errorData = await response.json();  // Obtener datos del error
      const errorMessage = errorData.message || 'Error desconocido';
      const status = response.status;
      throw new Error(`${status}: ${errorMessage}`);
    }

    const responseData = await response.json();
    return responseData;  // Devuelve los datos de respuesta
  } catch (error) {
    console.error('Error en la actualización:', error.message);
    // Aquí puedes manejar el error y relanzarlo o pasarlo a otro lugar según lo necesites
    throw error;  // Relanza el error para que lo maneje el código que llama a esta función
  }
};

export const fetchRegistroById = async (registroId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await fetch(`${API_BASE}/registro/${registroId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      method: "GET",
    });

    if (!response.ok) throw new Error("Error al obtener el registro");
    const data = await response.json();
    return data.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const transformarParaBackend = (formData) => {
  if (!formData || !Array.isArray(formData.personas)) {
    throw new TypeError("El campo personas debe ser un array");
  }
  
  return formData.personas.map((persona) => {


    const esMenor = esMenorDeEdad(persona.fecha_nacimiento);

    return {
      persona: {
        idRegistro: persona.idRegistro || null,
        idPersona: persona.idPersona || null,
        idVivienda: persona.idVivienda || null,
        idLote: persona.idLote || null,
        numero_registro: persona.numero_registro || null,
        nombre: persona.nombre || "",
        apellido: persona.apellido || "",
        tipo_dni: persona.tipo_dni || "",
        dni: persona.dni || "",
        CUIL_CUIT: esMenor ? "0" : (persona.CUIL_CUIT || ""),
        genero: persona.genero || "",
        fecha_nacimiento: persona.fecha_nacimiento || "",
        email: esMenor ? "no@aplica.com" : (persona.email || ""),
        telefono: esMenor ? "0000000000" : (persona.telefono || ""),
        estado_civil: esMenor ? "Soltero/a" : (persona.estado_civil || ""),
        nacionalidad: persona.nacionalidad || "",
        certificado_discapacidad: persona.certificado_discapacidad || false,
        vinculo: persona.vinculo || "",
        titular_cotitular: persona.titular_cotitular || ""
      },
      vivienda: persona.vivienda
        ? {
          idVivienda: persona.vivienda.idVivienda || null,
          idRegistro: persona.vivienda.idRegistro || null,
          direccion: persona.vivienda.direccion || "",
          numero_direccion: persona.vivienda.numero_direccion || "",
          departamento: persona.vivienda.departamento || false,
          piso_departamento: persona.vivienda.piso_departamento || null,
          numero_departamento: persona.vivienda.numero_departamento || null,
          alquiler: persona.vivienda.alquiler || false,
          valor_alquiler: persona.vivienda.valor_alquiler || 0,
          localidad: persona.vivienda.localidad || "",
          cantidad_dormitorios: persona.vivienda.cantidad_dormitorios || 0,
          estado_vivienda: persona.vivienda.estado_vivienda || "",
          tipo_alquiler: persona.vivienda.tipo_alquiler || null
        }
        : null,
      lote: persona.lote
        ? {
          idLote: persona.lote.idLote || null,
          localidad: persona.lote.localidad || ""
        }
        : null,
      ingresos: esMenor
        ? []
        : Array.isArray(persona.ingresos)
          ? persona.ingresos.map((ingreso) => ({
            idIngreso: ingreso.idIngreso || null,
            situacion_laboral: ingreso.situacion_laboral || "",
            ocupacion: ingreso.ocupacion || "",
            CUIT_empleador: ingreso.CUIT_empleador || "0",
            salario: ingreso.salario || 0,
            idPersona: persona.idPersona || null
          }))
          : []
    };
  });
};

export async function updateRegistro(registroId, datosTransformados) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await fetch(`${API_BASE}/registro/${registroId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      method: "PATCH",
      body: JSON.stringify(datosTransformados),
    });

    const data = await response.json(); // parseamos el JSON siempre

    if (!response.ok) {
      // Capturamos mensaje del backend
      const errorMessage = data.message || data.error || "Error desconocido";
      throw new Error(errorMessage);
    }

    return data.data; // si todo OK, devolvemos los datos
  } catch (error) {
    console.error("Error backend:", error); // log en consola para debug
    throw new Error(error.message || "Error desconocido");
  }
}

export const fetchViviendaById = async (id) => {

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/vivienda/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Error al obtener  la vivienda. Status ${response.status}`)
    }
    const data = await response.json();

    // Ahora, directamente accedemos a data
    if (!data || !data.data) {
      throw new Error("La respuesta no contiene el campo 'data' esperado.");
    }
    return data; // Retorna el objeto data directamente
  } catch (error) {
    console.error("Error al obtener el registro:", error.message);
    throw new Error(error.message); // Propagar el error para que lo maneje el componente
  }

}

export const updateVivienda = async (id, data) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/vivienda/${id}`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la vivienda');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en updateVivienda:', error);
    throw error;
  }
};

export const getRegistroDeudorBcra = async (cuilCuit) => {
  try {
    const res = await fetch(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${cuilCuit}`);

    /* if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    } */

    return await res.json();
  } catch (error) {
    // Un solo log para cualquier error
    console.error('Error al obtener el registro de deudor en BCRA:', error.message);
    throw error;
  }
};


