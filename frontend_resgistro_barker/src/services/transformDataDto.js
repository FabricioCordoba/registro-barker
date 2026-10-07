export function transformarVivienda(data) {
    const esDepartamento = data.departamento === "true" || data.departamento === true;

    return {
        idVivienda: Number(data.idVivienda) || 0, // Asigna 0 si no hay ID

        direccion: String(data.direccion),
        numero_direccion:
            data.numero_direccion === "S/N" || data.numero_direccion === ""
                ? 0 // Transformar a 0 si está vacío o es "S/N"
                : Number(data.numero_direccion), // Convertir a número

        departamento: esDepartamento, // Convertir a booleano
        piso_departamento: esDepartamento
            ? (data.piso_departamento ? Number(data.piso_departamento) : null)
            : 0, // 👈 si no es depto, va 0
        numero_departamento: esDepartamento
            ? (data.numero_departamento
                ? String(data.numero_departamento).toUpperCase()
                : null)
            : "0", // 👈 si no es depto, va "0"

        alquiler: data.alquiler === "true" || data.alquiler === true, // Convertir a booleano
        valor_alquiler: data.valor_alquiler ? Number(data.valor_alquiler) : null,

        localidad: data.localidad, // Mantener el valor sin casting de TypeScript
        cantidad_dormitorios: Number(data.cantidad_dormitorios),

        estado_vivienda: data.estado_vivienda, // Mantener el valor sin casting de TypeScript
        tipo_alquiler: data.tipo_alquiler ? data.tipo_alquiler : null, // Dejar como null si no hay valor
    };
}


export function transformarPersona(data) {
    return {
        nombre: String(data.nombre), // Asegurarse de que sea una cadena
        apellido: String(data.apellido),
        tipo_dni: String(data.tipo_dni),
        dni: Number(data.dni), // Si lo necesitas como número, conviértelo
        CUIL_CUIT: Number(data.CUIL_CUIT),
        genero: String(data.genero),
        fecha_nacimiento: String(data.fecha_nacimiento), // Si es una fecha, conviértela correctamente
        email: String(data.email),
        telefono: String(data.telefono),
        estado_civil: String(data.estado_civil),
        nacionalidad: String(data.nacionalidad),
        certificado_discapacidad: data.certificado_discapacidad === "true" || data.certificado_discapacidad === true, // Convertir a booleano
        rol: String(data.rol),
        vinculo: String(data.vinculo),
        titular_cotitular: String(data.titular_cotitular),
    };
}

export function transformarIngresos(data) {
    return data.map(ingreso => ({
        situacion_laboral: String(ingreso.situacion_laboral),
        ocupacion: String(ingreso.ocupacion),
        CUIT_empleador: Number(ingreso.CUIT_empleador),
        salario: Number(ingreso.salario) || 0, // Convertir a número
    }));
}

// Función para verificar si una persona es menor de edad
export const esMenorDeEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        return edad - 1 < 18; // Ajustar la edad si no ha cumplido años aún
    }
    return edad < 18;
};

// Función para procesar los datos antes de transformarlos
const transformarDatos = (persona) => {
    const esPersonaMenor = esMenorDeEdad(persona.persona.fecha_nacimiento);

    // Procesar ingresos para manejar CUIT_empleador vacío
    const ingresosProcessed = persona.ingresos.map(ingreso => ({
        ...ingreso,
        CUIT_empleador: ingreso.CUIT_empleador || "0" // Si está vacío, usar "0"
    }));

    return {
        persona: {
            ...persona.persona,
            CUIL_CUIT: esPersonaMenor ? "0" : persona.persona.CUIL_CUIT,
            email: esPersonaMenor ? "no@aplica.com" : persona.persona.email,
            telefono: esPersonaMenor ? "0000000000" : persona.persona.telefono,
            estado_civil: esPersonaMenor ? "Soltero/a" : persona.persona.estado_civil,
        },
        vivienda: persona.vivienda,
        lote: persona.lote,
        ingresos: esPersonaMenor ? [] : ingresosProcessed
    };
};

// Función principal para transformar los datos antes de enviarlos al backend
export function transformarDatosEnvioBackend(data) {
    // Primero aplicamos transformarDatos para procesar los datos iniciales
    const datosProcesados = transformarDatos(data);

    // Luego aplicamos las transformaciones específicas
    return {
        persona: transformarPersona(datosProcesados.persona),
        ingresos: transformarIngresos(datosProcesados.ingresos),
        lote: datosProcesados.lote, // Mantener tal cual
        vivienda: transformarVivienda(datosProcesados.vivienda),
    };
}

export const formatPeriodo = (periodo) => {
    const year = periodo.substring(0, 4);
    const month = periodo.substring(4, 6);
    return `${month}/${year}`;
}
export const formatearPrecio = (precio) => {
    return precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0
    });
}

export function formatearDNI(dni) {
  const str = String(dni).replace(/\D/g, ""); // me quedo solo con números
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
}