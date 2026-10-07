import { useState, useEffect, useRef } from 'react';
import styles from "./formulario.module.css";
import Swal from 'sweetalert2';
import { callesPorLocalidad } from '../../services/listado_calles/listadoCalles';
import { useNavigate } from 'react-router-dom';
import { transformarDatosEnvioBackend, esMenorDeEdad } from '../../services/transformDataDto';
import ReCAPTCHA from "react-google-recaptcha";

const API_URL = import.meta.env.VITE_API_REGISTRO;


const Formulario = () => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  const navigate = useNavigate();
  const agregarPersona = useRef(null);
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [aceptaDeclaracion, setAceptaDeclaracion] = useState(false);
  const [personas, setPersonas] = useState([{
    persona: {
      nombre: '',
      apellido: '',
      tipo_dni: '',
      dni: '',
      CUIL_CUIT: '',
      genero: '',
      fecha_nacimiento: '',
      email: '',
      telefono: '',
      estado_civil: '',
      nacionalidad: '',
      certificado_discapacidad: null,
      rol: 'User',
      vinculo: 'Otro',
      titular_cotitular: 'Titular'
    },
    ingresos: [{
      situacion_laboral: '',
      ocupacion: '',
      CUIT_empleador: '',
      salario: ''
    }],
    lote: {
      localidad: ''
    },
    vivienda: {
      direccion: '',
      numero_direccion: '',
      departamento: null,
      piso_departamento: '',
      numero_departamento: '',
      alquiler: null,
      valor_alquiler: '',
      localidad: '',
      cantidad_dormitorios: '',
      estado_vivienda: '',
      tipo_alquiler: ''
    }
  }]);

  const [showHousingData, setShowHousingData] = useState(Array(personas.length).fill(false));

  const handleInputChange = (index, path, value) => {
    const updatedPersonas = [...personas];
    let current = updatedPersonas[index];

    path.split('.').reduce((acc, key, i, arr) => {
      if (i === arr.length - 1) {
        acc[key] = value;
      } else {
        return acc[key];
      }
    }, current);

    setPersonas(updatedPersonas);
  };

  const addIngreso = (personaIndex) => {
    Swal.fire({
      title: 'Agregar Ingreso',
      text: "¿Desea agregar un nuevo ingreso?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevasPersonas = [...personas];
        nuevasPersonas[personaIndex].ingresos.push({
          situacion_laboral: "",
          ocupacion: "",
          CUIT_empleador: "",
          salario: ""
        });
        setPersonas(nuevasPersonas);
      }
    });
  };

  const addPersona = () => {
    Swal.fire({
      title: 'Agregar Persona',
      text: "¿Desea agregar una nueva persona al formulario?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevaPersona = {
          persona: {
            nombre: "",
            apellido: "",
            tipo_dni: "",
            dni: "",
            CUIL_CUIT: "",
            genero: "",
            fecha_nacimiento: "",
            email: "",
            telefono: "",
            estado_civil: "",
            nacionalidad: "",
            certificado_discapacidad: null,
            rol: 'User',
            vinculo: "",
            titular_cotitular: ""
          },
          vivienda: {
            direccion: "",
            numero_direccion: "",
            departamento: null,
            piso_departamento: "",
            numero_departamento: "",
            localidad: "",
            cantidad_dormitorios: "",
            estado_vivienda: "",
            alquiler: null,
            valor_alquiler: "",
            tipo_alquiler: ""
          },
          ingresos: [{
            situacion_laboral: "",
            ocupacion: "",
            CUIT_empleador: "",
            salario: ""
          }],
          lote: {
            localidad: ""
          }
        };
        setPersonas([...personas, nuevaPersona]);

        // Esperar a que se actualice el estado y luego hacer scroll
        setTimeout(() => {
          agregarPersona.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300); // Pequeño delay para asegurar que el DOM se actualice
      }
    });
  };

  const resetForm = () => {
    setPersonas([{
      persona: {
        nombre: '',
        apellido: '',
        tipo_dni: '',
        dni: '',
        CUIL_CUIT: '',
        email: '',
        telefono: '',
        estado_civil: '',
        genero: '',
        fecha_nacimiento: '',
        nacionalidad: '',
        certificado_discapacidad: null,
        vinculo: '',
        titular_cotitular: 'Titular'
      },
      vivienda: {
        direccion: '',
        numero_direccion: '',
        departamento: null,
        piso_departamento: null,
        numero_departamento: null,
        localidad: '',
        cantidad_dormitorios: '',
        estado_vivienda: '',
        alquiler: null,
        valor_alquiler: null,
        tipo_alquiler: null
      },
      lote: {
        localidad: ''
      },
      ingresos: [{
        situacion_laboral: '',
        ocupacion: '',
        CUIT_empleador: '',
        salario: ''
      }]
    }]);
    setAceptaDeclaracion(false);

    // Agregar un pequeño retraso para asegurar que el scroll ocurra después de que el estado se actualice
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!aceptaDeclaracion) {
      Swal.fire({
        icon: 'warning',
        title: 'Declaración Jurada',
        text: 'Debe aceptar la declaración jurada para continuar.',
      });
      return;
    }

    // Validar que se haya seleccionado una opción de vivienda para cada miembro del grupo familiar
    for (let i = 1; i < personas.length; i++) {
      if (!showHousingData[i]) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos de vivienda incompletos',
          text: `Por favor, seleccione una opción de vivienda para el familiar #${i}`,
        });
        return;
      }
    }

    // Validar ingresos antes de enviar
    for (const persona of personas) {
      if (!esMenorDeEdad(persona.persona.fecha_nacimiento)) {
        for (const ingreso of persona.ingresos) {
          // Validar que el ingreso no sea negativo
          if (ingreso.salario < 0) {
            Swal.fire({
              icon: 'error',
              title: 'Error en ingresos',
              text: 'El monto del ingreso no puede ser negativo',
            });
            return;
          }

          // Validar CUIT del empleador si aplica
          if (ingreso.situacion_laboral === "Relación de dependencia") {
            if (!ingreso.CUIT_empleador) {
              Swal.fire({
                icon: 'error',
                title: 'Error en ingresos',
                text: 'El CUIT del empleador es requerido para trabajos en relación de dependencia',
              });

              return;
            } else if (!/^\d{11}$/.test(ingreso.CUIT_empleador)) {
              Swal.fire({
                icon: 'error',
                title: 'Error en ingresos',
                text: 'El CUIT del empleador debe tener 11 dígitos numéricos.',
              });
              return;
            }
          }
        }
      }
    }

    // Agregar validación de edad para el titular
    if (esMenorDeEdad(personas[0].persona.fecha_nacimiento)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El titular debe ser mayor de edad',
      });
      return;
    }

    // Dentro de handleSubmit, modificar la validación de campos requeridos
    for (const persona of personas) {
      const esPersonaMenor = esMenorDeEdad(persona.persona.fecha_nacimiento);

      // Validar datos personales básicos (requeridos para todos)
      if (!persona.persona.nombre || !persona.persona.apellido ||
        !persona.persona.tipo_dni || !persona.persona.dni ||
        !persona.persona.genero || !persona.persona.fecha_nacimiento ||
        !persona.persona.nacionalidad ||
        persona.persona.certificado_discapacidad === null ||
        !persona.persona.vinculo || !persona.persona.titular_cotitular) {
        Swal.fire({
          icon: 'error',
          title: 'Campos incompletos',
          text: 'Por favor complete todos los datos personales básicos',
        });
        return;
      }

      // Validar campos adicionales solo para mayores de edad
      if (!esPersonaMenor) {
        if (!persona.persona.CUIL_CUIT || !persona.persona.email ||
          !persona.persona.telefono || !persona.persona.estado_civil) {
          Swal.fire({
            icon: 'error',
            title: 'Campos incompletos',
            text: 'Por favor complete todos los datos personales',
          });
          return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(persona.persona.email)) {
          Swal.fire({
            icon: 'error',
            title: 'Email inválido',
            text: 'Por favor ingrese un email válido',
          });
          return;
        }

        // Validar DNI (7 a 8 dígitos)
        if (!/^\d{7,8}$/.test(persona.persona.dni)) {
          Swal.fire({
            icon: 'error',
            title: 'DNI inválido',
            text: 'El DNI debe tener 7 u 8 dígitos',
          });
          return;
        }

        // Validar CUIL/CUIT (11 dígitos)
        if (!/^\d{11}$/.test(persona.persona.CUIL_CUIT)) {
          Swal.fire({
            icon: 'error',
            title: 'CUIL/CUIT inválido',
            text: 'El CUIL/CUIT debe tener 11 dígitos',
          });
          return;
        }

        // Validar teléfono (mínimo 10 dígitos)
        if (!/^\d{10,}$/.test(persona.persona.telefono)) {
          Swal.fire({
            icon: 'error',
            title: 'Teléfono inválido',
            text: 'El teléfono debe tener al menos 10 dígitos',
          });
          return;
        }
      }

      for (const persona of personas) {
  // Validar vivienda y lote
  if (!validarViviendaYLote(persona, callesPorLocalidad)) {
    return; // si falla, corta la ejecución del handleSubmit
  }

  // Validar que un valor numérico no sea negativo
function validarNegativo(valor, titulo, mensaje) {
  const numero = Number(valor);
  if (!isNaN(numero) && numero < 0) {
    Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
    });
    return false;
  }
  return true;
}

// Validar datos de vivienda y lote
function validarViviendaYLote(persona, callesPorLocalidad) {
  // Dormitorios
  if (!validarNegativo(persona.vivienda.cantidad_dormitorios,
      'Error en cantidad de dormitorios',
      'La cantidad de dormitorios no puede ser un valor negativo')) return false;

  // Número de dirección
  if (!validarNegativo(persona.vivienda.numero_direccion,
      'Error en número de dirección',
      'El número de la dirección no puede ser un valor negativo')) return false;

  // Piso de departamento
  if (!validarNegativo(persona.vivienda.piso_departamento,
      'Error en piso de departamento',
      'El piso del departamento no puede ser un valor negativo')) return false;

  // Número de departamento
  if (!validarNegativo(persona.vivienda.numero_departamento,
      'Error en número de departamento',
      'El número del departamento no puede ser un valor negativo')) return false;

  // Alquiler
  if (persona.vivienda.alquiler &&
      !validarNegativo(persona.vivienda.valor_alquiler,
      'Error en valor del alquiler',
      'El monto del alquiler no puede ser un valor negativo')) return false;

  // Validar datos requeridos de vivienda
  if (
    !persona.vivienda.direccion ||
    (callesPorLocalidad[persona.vivienda.localidad]?.length > 0 && !persona.vivienda.numero_direccion) ||
    persona.vivienda.departamento === null ||
    !persona.vivienda.localidad ||
    !persona.vivienda.cantidad_dormitorios ||
    !persona.vivienda.estado_vivienda ||
    persona.vivienda.alquiler === null ||
    (persona.vivienda.alquiler && (!persona.vivienda.valor_alquiler || !persona.vivienda.tipo_alquiler))
  ) {
    Swal.fire({
      icon: 'error',
      title: 'Campos incompletos',
      text: 'Por favor complete todos los datos de la vivienda',
    });
    return false;
  }

  // Validar lote si es titular
  if (!persona.lote.localidad && persona.persona.titular_cotitular === "Titular") {
    Swal.fire({
      icon: 'error',
      title: 'Campos incompletos',
      text: 'Por favor seleccione la localidad del lote',
    });
    return false;
  }

  return true;
}

      }
  
    }

    setLoading(true);

    try {
      const datosTransformados = personas.map(persona => transformarDatosEnvioBackend(persona));
   

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-recaptcha-token": recaptchaToken
        },
        body: JSON.stringify(datosTransformados),
      });

      const responseData = await response.json();
      if (!response.ok) {
        let errorMessage = responseData.message || "Error desconocido";

        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(" ");
        }

        if (typeof errorMessage === "string" && errorMessage.includes("Las inscripciones han finalizado")) {
          await Swal.fire({
            icon: 'info',
            title: 'Inscripciones finalizadas',
            text: errorMessage,
          });

          navigate('/');

          recaptchaRef.current?.reset();
          setRecaptchaToken(""); // Limpia el token en el estado

          return;
        }

        if (responseData.code === "DNI_DUPLICADO") {
          errorMessage = "El DNI ingresado ya está registrado en la base de datos.";
        } else if (responseData.code === "VIVIENDA_DUPLICADA") {
          errorMessage = "La vivienda ingresada ya está registrada.";
        } else if (responseData.code === "DEPARTAMENTO_DUPLICADO") {
          errorMessage = "El departamento que intentas registrar ya existe.";
        }

        Swal.fire({
          icon: 'warning',
          title: 'Error en el registro',
          text: errorMessage,
        });

        recaptchaRef.current?.reset();
        setRecaptchaToken(""); // Limpia el token en el estado

        return;
      }

      // Si el registro fue exitoso
      await Swal.fire({
        icon: responseData.emailEnviado === false ? 'warning' : 'success',
        title: responseData.emailEnviado === false ? 'Registro guardado' : 'Registro exitoso',
        text: responseData.emailEnviado === false
          ? 'El registro se guardó correctamente, pero no se pudo enviar el comprobante por correo.'
          : 'Los datos se han registrado correctamente.',
      }).then(() => {
        navigate('/registro-exitoso');
      });

      // Limpiar el formulario
      resetForm();

      // Scroll al inicio después de todo el proceso
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 200);

    } catch (error) {

      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarUltimaPersona = () => {
    Swal.fire({
      title: '¿Cancelar registro?',
      text: "¿Desea cancelar el registro de esta persona?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener'
    }).then((result) => {
      if (result.isConfirmed) {
        setPersonas(personas.slice(0, -1)); // Elimina la última persona
        Swal.fire(
          'Cancelado',
          'El registro ha sido cancelado',
          'success'
        );
      }
    });
  };

  const cancelarUltimoIngreso = (personaIndex) => {
    Swal.fire({
      title: '¿Cancelar ingreso?',
      text: "¿Desea cancelar este ingreso?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevasPersonas = [...personas];
        nuevasPersonas[personaIndex].ingresos.pop(); // Elimina el último ingreso
        setPersonas(nuevasPersonas);
        Swal.fire(
          'Cancelado',
          'El ingreso ha sido cancelado',
          'success'
        );
      }
    });
  };

  const handleMismaVivienda = (index) => {
    const updatedPersonas = [...personas];
    updatedPersonas[index].vivienda = { ...personas[0].vivienda };
    setPersonas(updatedPersonas);
    const updatedShowHousingData = [...showHousingData];
    updatedShowHousingData[index] = true;
    setShowHousingData(updatedShowHousingData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      {personas.map((personaData, index) => (
        <div key={index}>
          {/* Sección de Datos Personales */}
          <div
            ref={index === personas.length - 1 ? agregarPersona : null} // Referencia al último agregado
            className={styles.sectionContainer}
          >
            {
              index === 0 ? (
                <h2 className={styles.title}>Datos del Titular</h2>
              ) : (
                <h2 className={styles.title}>Grupo Familiar</h2>
              )
            }
          </div>
          <div
            className={`${styles.section} ${styles.personalData}`}>
            <h3 className={styles.sectionTitle}>
              {
                index === 0 ? (
                  'Datos del Titular'
                ) : (
                  'Datos de los Co-titulares / Convivientes'
                )
              }
            </h3>
            <div className={styles.inputGroup}>


              <label className={styles.label}>
                <span className={styles.labelText}>Titular - Cotitular - Conviviente *</span>
                {index === 0 ? (
                  <input
                    type="text"
                    value="Titular"
                    disabled
                    className={`${styles.input} ${styles.inputDisabled}`}
                  />
                ) : (
                  <select
                    required
                    name="titular_cotitular"
                    value={personaData.persona.titular_cotitular || ""}
                    onChange={(e) => handleInputChange(index, 'persona.titular_cotitular', e.target.value)}
                    className={styles.select}
                  >
                    <option value="" disabled>Seleccione rol</option>
                    <option value="Cotitular">Cotitular</option>
                    <option value="Conviviente">Conviviente</option>
                  </select>
                )}
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Nombres *</span>
                <input
                  required
                  type="text"
                  placeholder="Nombres"
                  value={personaData.persona.nombre}
                  onChange={(e) => handleInputChange(index, 'persona.nombre', e.target.value)}
                  className={styles.input}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Apellido *</span>
                <input
                  required
                  type="text"
                  placeholder="Apellido"
                  value={personaData.persona.apellido}
                  onChange={(e) => handleInputChange(index, 'persona.apellido', e.target.value)}
                  className={styles.input}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Fecha de nacimiento *</span>
                <input
                  required
                  type="date"
                  value={personaData.persona.fecha_nacimiento}
                  onChange={(e) => handleInputChange(index, 'persona.fecha_nacimiento', e.target.value)}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Tipo de Documento *</span>
                <select
                  required
                  name="tipo_dni"
                  value={personaData.persona.tipo_dni || ""}
                  onChange={(e) => handleInputChange(index, 'persona.tipo_dni', e.target.value)}
                  className={styles.select}
                >
                  <option value="" disabled>Seleccione Tipo de Documento</option>
                  <option value="Documento unico">DNI</option>
                  <option value="Libreta enrolamiento">Libreta de enrolamiento</option>
                  <option value="Libreta civica">Libreta cívica</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <label className={styles.label}>
                <span className={styles.labelText}>DNI *</span>
                <input
                  required
                  type="text"
                  placeholder="DNI (sin puntos ni comas)"
                  value={personaData.persona.dni}
                  onChange={(e) => handleInputChange(index, 'persona.dni', e.target.value)}
                  className={styles.input}
                  maxLength="8"
                />
              </label>

              {!esMenorDeEdad(personaData.persona.fecha_nacimiento) && (
                <>
                  <label className={styles.label}>
                    <span className={styles.labelText}>CUIL/CUIT *</span>
                    <input
                      required
                      type="text"
                      placeholder="CUIL/CUIT (sin guiones ni espacios)"
                      value={personaData.persona.CUIL_CUIT}
                      onChange={(e) => handleInputChange(index, 'persona.CUIL_CUIT', e.target.value)}
                      className={styles.input}
                      maxLength="11"
                    />
                  </label>

                  <label className={styles.label}>
                    <span className={styles.labelText}>Email *</span>
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={personaData.persona.email}
                      onChange={(e) => handleInputChange(index, 'persona.email', e.target.value)}
                      className={styles.input}
                    />
                  </label>

                  <label className={styles.label}>
                    <span className={styles.labelText}>Teléfono *</span>
                    <input
                      required
                      type="text"
                      placeholder="Teléfono sin 0 y sin 15"
                      value={personaData.persona.telefono}
                      onChange={(e) => handleInputChange(index, 'persona.telefono', e.target.value)}
                      className={styles.input}
                    />
                  </label>

                  <label className={styles.label}>
                    <span className={styles.labelText}>Estado Civil *</span>
                    <select
                      required
                      name="estado_civil"
                      value={personaData.persona.estado_civil || ""}
                      onChange={(e) => handleInputChange(index, 'persona.estado_civil', e.target.value)}
                      className={styles.select}
                    >
                      <option value="" disabled>Seleccione estado civil</option>
                      <option value="Soltero/a">Soltero/a</option>
                      <option value="Casado/a">Casado/a</option>
                      <option value="Divorciado/a">Divorciado/a</option>
                      <option value="Viudo/a">Viudo/a</option>
                      <option value="Concubinato/a">Concubinato/a</option>
                    </select>
                  </label>
                </>
              )}

              <label className={styles.label}>
                <span className={styles.labelText}>Género *</span>
                <select
                  required
                  name="genero"
                  value={personaData.persona.genero || ""}
                  onChange={(e) => handleInputChange(index, 'persona.genero', e.target.value)}
                  className={styles.select}
                >
                  <option value="" disabled>Seleccione género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Nacionalidad *</span>
                <select
                  required
                  name="nacionalidad"
                  value={personaData.persona.nacionalidad || ""}
                  onChange={(e) => handleInputChange(index, 'persona.nacionalidad', e.target.value)}
                  className={styles.select}
                >
                  <option value="" disabled>Seleccione nacionalidad</option>
                  <option value="Argentina">Argentino/a</option>
                  <option value="Bolivia">Boliviano/a</option>
                  <option value="Chilena">Chileno/a</option>
                  <option value="Paraguaya">Paraguayo/a</option>
                  <option value="Uruguaya">Uruguayo/a</option>
                  <option value="Peruana">Peruano/a</option>
                  <option value="Brasileña">Brasileño/a</option>
                  <option value="Venezolana">Venezolano/a</option>
                  <option value="Colombiana">Colombiano/a</option>
                  <option value="Española">Español/a</option>
                  <option value="Italiana">Italiano/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Certificado de discapacidad *</span>
                <select
                  required
                  name="certificado_discapacidad"
                  value={personaData.persona.certificado_discapacidad === true ? "Si" :
                    personaData.persona.certificado_discapacidad === false ? "No" : ""}
                  onChange={(e) => handleInputChange(index, 'persona.certificado_discapacidad', e.target.value === 'Si')}
                  className={styles.select}
                >
                  <option value="" disabled>¿Posee certificado de discapacidad?</option>
                  <option value="Si">Sí</option>
                  <option value="No">No</option>
                </select>
              </label>

              {
                index === 0 ? (
                  <input
                    type="text"
                    value='Otro'
                    disabled
                    className={`${styles.input} ${styles.inputDisabled} ${styles.inputHidden}`}
                  />
                ) : (
                  <label className={styles.label}>
                    <span className={styles.labelText}>Vínculo con el titular *</span>
                    <select
                      required
                      name="vinculo"
                      value={personaData.persona.vinculo || ""}
                      onChange={(e) => handleInputChange(index, 'persona.vinculo', e.target.value)}
                      className={styles.select}
                    >
                      <option value="" disabled>Seleccione Vínculo</option>
                      <option value="Esposo/a">Esposo/a</option>
                      <option value="Concubino/a">Concubino/a</option>
                      <option value="Conyuge">Cónyuge</option>
                      <option value="Novio/a">Novio/a</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Primo/a">Primo/a</option>
                      <option value="Nieto/a">Nieto/a</option>
                      <option value="Tio/a">Tío/a</option>
                      <option value="Sobrino/a">Sobrino/a</option>
                      <option value="Suegro/a">Suegro/a</option>
                      <option value="Abuelo/a">Abuelo/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>
                )
              }


            </div>
          </div>

          <div className={`${styles.section} ${styles.housingData}`}>
            <h3 className={styles.sectionTitle}>Datos del domicilio</h3>

            {index > 0 && !showHousingData[index] && (
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => handleMismaVivienda(index)}
                  className={`${styles.button} ${styles.copyButton}`}
                >
                  Usar misma vivienda que el titular
                </button>
                <button
                  type="button"
                  onClick={() => setShowHousingData(prev => {
                    const updated = [...prev];
                    updated[index] = true;
                    return updated;
                  })}
                  className={`${styles.button} ${styles.newAddressButton}`}
                >
                  Ingresar nuevo domicilio
                </button>
              </div>
            )}

            <div className={`${styles.inputGroup} ${index === 0 || showHousingData[index] ? styles.visible : styles.hidden}`}>
              {/* Localidad - Nuevo orden */}
              <label className={styles.label}>
                <span className={styles.labelText}>Localidad donde residís *</span>
                <select
                  required={index === 0 || showHousingData[index]}
                  name="localidad"
                  value={personaData.vivienda.localidad || ""}
                  onChange={(e) => handleInputChange(index, 'vivienda.localidad', e.target.value)}
                  className={styles.select}
                >
                  <option value="" disabled>Seleccione localidad</option>
                  <option value="Benito Juárez">Benito Juárez</option>
                  <option value="Barker">Barker</option>
                  <option value="Villa Cacique">Villa Cacique</option>
                  <option value="Estación López">Estación López</option>
                  <option value="El Luchador">El Luchador</option>
                  <option value="Tedín Uriburu">Tedín Uriburu</option>

                  <option value="Coronel Rodolfo Bunge">Coronel Rodolfo Bunge</option>
                </select>
              </label>

              {/* Selección de calle */}
              <label className={styles.label}>
                <span className={styles.labelText}>Dirección *</span>
                {callesPorLocalidad[personaData.vivienda.localidad]?.length > 0 ? (
                  <>
                    <select
                      required={index === 0 || showHousingData[index]}
                      value={
                        personaData.vivienda.otra_calle
                          ? "Otra"
                          : personaData.vivienda.direccion
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange(index, 'vivienda.direccion', value === "Otra" ? "" : value);
                        handleInputChange(index, 'vivienda.otra_calle', value === "Otra");
                      }}
                      className={styles.select}
                    >
                      <option value="" disabled>Seleccione una dirección</option>
                      {callesPorLocalidad[personaData.vivienda.localidad]?.map((calle, i) => (
                        <option key={i} value={calle}>{calle}</option>
                      ))}
                      <option value="Otra">Otra</option>
                    </select>

                    {personaData.vivienda.otra_calle && (
                      <input
                        type="text"
                        placeholder="Ingrese su calle"
                        value={personaData.vivienda.direccion}
                        onChange={(e) => handleInputChange(index, 'vivienda.direccion', e.target.value)}
                        className={styles.input}
                      />
                    )}
                  </>
                ) : (
                  <input
                    required={index === 0 || showHousingData[index]}
                    type="text"
                    placeholder="Ingrese referencia de ubicación"
                    value={personaData.vivienda.direccion || ""}
                    onChange={(e) => handleInputChange(index, 'vivienda.direccion', e.target.value)}
                    className={styles.input}
                  />
                )}
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Número</span>
                {callesPorLocalidad[personaData.vivienda.localidad]?.length > 0 ? (
                  <input
                    required={index === 0 || showHousingData[index]}
                    type="number"
                    placeholder="Número"
                    value={personaData.vivienda.numero_direccion}
                    onChange={(e) => handleInputChange(index, 'vivienda.numero_direccion', e.target.value)}
                    className={styles.input}
                  />
                ) : (
                  <input
                    type="number"
                    placeholder="S/N"
                    value={personaData.vivienda.numero_direccion || ""}
                    onChange={(e) => handleInputChange(index, 'vivienda.numero_direccion', e.target.value)}
                    className={styles.input}
                  />
                )}
              </label>


              {/* Campos restantes del original */}
              <label className={styles.label}>
                <span className={styles.labelText}>¿Es departamento? *</span>
                <select
                  required={index === 0 || showHousingData[index]}
                  name="departamento"
                  value={personaData.vivienda.departamento === null ? "" :
                    personaData.vivienda.departamento ? "Si" : "No"}
                  onChange={(e) => handleInputChange(index, 'vivienda.departamento', e.target.value === 'Si')}
                  className={styles.select}
                >
                  <option value="" disabled>¿Es departamento?</option>
                  <option value="Si">Sí</option>
                  <option value="No">No</option>
                </select>
              </label>

              {personaData.vivienda.departamento && (
                <>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Piso *</span>
                    <input
                      required={index === 0 || showHousingData[index]}
                      type="text"
                      placeholder="Piso"
                      value={personaData.vivienda.piso_departamento}
                      onChange={(e) => handleInputChange(index, 'vivienda.piso_departamento', e.target.value)}
                      className={styles.input}
                    />
                  </label>

                  <label className={styles.label}>
                    <span className={styles.labelText}>Departamento *</span>
                    <input
                      required={index === 0 || showHousingData[index]}
                      type="text"
                      placeholder="Departamento"
                      value={personaData.vivienda.numero_departamento}
                      onChange={(e) => handleInputChange(index, 'vivienda.numero_departamento', e.target.value)}
                      className={styles.input}
                    />
                  </label>
                </>
              )}

              <label className={styles.label}>
                <span className={styles.labelText}>Cantidad de dormitorios *</span>
                <input
                  required={index === 0 || showHousingData[index]}
                  type="number"
                  placeholder="Cantidad de dormitorios"
                  value={personaData.vivienda.cantidad_dormitorios}
                  onChange={(e) => handleInputChange(index, 'vivienda.cantidad_dormitorios', e.target.value)}
                  className={styles.input}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Estado de la vivienda *</span>
                <select
                  required={index === 0 || showHousingData[index]}
                  name="estado_vivienda"
                  value={personaData.vivienda.estado_vivienda || ""}
                  onChange={(e) => handleInputChange(index, 'vivienda.estado_vivienda', e.target.value)}
                  className={styles.select}
                >
                  <option value="" disabled>¿Estado de la Vivienda?</option>
                  <option value="Muy bueno">Muy bueno</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                  <option value="Muy malo">Muy malo</option>
                </select>
              </label>

              <label className={`${styles.label} ${styles.alquilerLabel}`}>
                <span className={styles.labelText}>¿Alquila? *</span>
                <select
                  required={index === 0 || showHousingData[index]}
                  name="alquiler"
                  value={personaData.vivienda.alquiler === true ? "Si" :
                    personaData.vivienda.alquiler === false ? "No" : ""}
                  onChange={(e) => handleInputChange(index, 'vivienda.alquiler', e.target.value === 'Si')}
                  className={styles.select}
                >
                  <option value="" disabled>¿Alquila la vivienda?</option>
                  <option value="Si">Sí</option>
                  <option value="No">No</option>
                </select>
              </label>

              {personaData.vivienda.alquiler && (
                <div className={styles.alquilerGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Monto del alquiler *</span>
                    <input
                      required={index === 0 || showHousingData[index]}
                      type="number"
                      placeholder="Monto del alquiler (sin puntos ni comas)"
                      value={personaData.vivienda.valor_alquiler}
                      onChange={(e) => handleInputChange(index, 'vivienda.valor_alquiler', e.target.value)}
                      className={styles.input}
                    />
                  </label>

                  <label className={styles.label}>
                    <span className={styles.labelText}>Tipo de alquiler *</span>
                    <select
                      required={index === 0 || showHousingData[index]}
                      name="tipo_alquiler"
                      value={personaData.vivienda.tipo_alquiler || ""}
                      onChange={(e) => handleInputChange(index, 'vivienda.tipo_alquiler', e.target.value)}
                      className={styles.select}
                    >
                      <option value="" disabled>Seleccione tipo de alquiler</option>
                      <option value="Particular">Particular</option>
                      <option value="Inmobiliaria">Inmobiliaria</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sectionDivider} />

          {/* Sección de Ingresos */}
          {
            !esMenorDeEdad(personaData.persona.fecha_nacimiento) &&(
              <div className={`${styles.section} ${styles.incomeData}`}>
                <h3 className={styles.sectionTitle}>Ingresos</h3>
                {personaData.ingresos.map((ingreso, ingresoIndex) => (
                  <div key={ingresoIndex} className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelText}>Situación laboral *</span>
                      <select
                        required={index === 0 || showHousingData[index]}
                        name="situacion_laboral"
                        value={ingreso.situacion_laboral || ""}
                        onChange={(e) => handleInputChange(index, `ingresos.${ingresoIndex}.situacion_laboral`, e.target.value)}
                        className={styles.select}
                      >
                        <option value="" disabled>Situación laboral</option>
                        <option value="Relación de dependencia">Relación de dependencia</option>
                        <option value="Autónomo">Autónomo</option>
                        <option value="Jubilado">Jubilado/a</option>
                        <option value="Pensionado">Pensionado/a</option>
                        <option value="Informal">Informal</option>
                        {/* Mostrar "Desempleado" solo si no es titular */}
                        {personaData.persona.titular_cotitular === "Conviviente" && (
                          <option value="Desempleado">Desempleado/a</option>
                        )}
                      </select>
                    </label>

                    {/* Resto de los campos de ingresos */}
                    <label className={styles.label}>
                      <span className={styles.labelText}>Ocupación</span>
                      <input
                        type="text"
                        placeholder="Ocupación"
                        value={ingreso.ocupacion || ""}
                        onChange={(e) => handleInputChange(index, `ingresos.${ingresoIndex}.ocupacion`, e.target.value)}
                        className={styles.input}
                        required={ingreso.situacion_laboral === "Relación de dependencia" || ingreso.situacion_laboral === "Autónomo" || ingreso.situacion_laboral === "Informal"}
                      />
                    </label>

                    {/* CUIT del empleador condicionado */}
                    {ingreso.situacion_laboral === "Relación de dependencia" && (
                      <label className={styles.label}>
                        <span className={styles.labelText}>CUIT del empleador *</span>
                        <input
                          type="text"
                          placeholder="CUIT del empleador (sin guiones ni espacios)"
                          value={ingreso.CUIT_empleador || ""}
                          onChange={(e) => handleInputChange(index, `ingresos.${ingresoIndex}.CUIT_empleador`, e.target.value)}
                          className={styles.input}
                          required
                          maxLength="11"
                        />
                      </label>
                    )}

                    <label className={styles.label}>
                      <span className={styles.labelText}>Ingreso mensual</span>
                      <input
                        type="number"
                        placeholder="Ingreso mensual (sin puntos ni comas)"
                        value={ingreso.salario}
                        onChange={(e) => handleInputChange(index, `ingresos.${ingresoIndex}.salario`, e.target.value)}
                        className={styles.input}
                        required={ingreso.situacion_laboral !== "Desempleado"}
                      />
                    </label>
                  </div>
                ))}
                <div className={styles.ingresoButtonGroup}>
                  <button
                    type="button"
                    onClick={() => addIngreso(index)}
                    className={`${styles.button} ${styles.addButton}`}
                  >
                    Añadir otro ingreso Propio
                  </button>
                  {personaData.ingresos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => cancelarUltimoIngreso(index)}
                      className={`${styles.button} ${styles.cancelButton}`}
                    >
                      Cancelar Último Ingreso
                    </button>
                  )}
                </div>
              </div>
            )
          }
          <div className={styles.sectionDivider} />

          {/* Sección de Lote */}
          {
            index === 0 &&
            personaData.persona.titular_cotitular !== "Cotitular" &&
            personaData.persona.titular_cotitular !== "Conviviente" && (
              <div className={`${styles.section} ${styles.locationData}`}>
                <h3 className={styles.sectionTitle}>Ubicación del Lote a Sortear</h3>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Localidad *</span>
                    <select
                      required
                      name="localidad"
                      value={personaData.lote.localidad || ""}
                      onChange={(e) => handleInputChange(index, 'lote.localidad', e.target.value)}
                      className={styles.select}
                    >
                      <option value="" disabled>Seleccione localidad</option>
                      <option value="Benito Juárez">Benito Juárez</option>
                      <option value="Barker">Barker</option>
                      <option value="Estación López">Estación López</option>
                      <option value="El Luchador">El Luchador</option>
                      <option value="Tedín Uriburu">Tedín Uriburu</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

        </div>
      ))}

      {/* Botón de Añadir Persona antes de la declaración jurada */}
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={addPersona}
          disabled={loading}
          className={`${styles.button} ${styles.addButton}`}
        >
          Añadir Persona
        </button>
        {personas.length > 1 && (
          <button
            type="button"
            onClick={cancelarUltimaPersona}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            Cancelar Última Persona
          </button>
        )}
      </div>

      {/* Nota importante sobre agregar personas */}
      <div className={styles.importantNote}>
        <p className={styles.noteText}>
          <strong>¡IMPORTANTE!</strong> No olvide agregar a todas las personas:
        </p>
        <ul className={styles.noteList}>
          <li>Cotitulares</li>
          <li>Convivientes</li>
        </ul>
      </div>

      {/* Declaración jurada */}
      <div className={styles.declaracionJurada}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={aceptaDeclaracion}
            onChange={(e) => setAceptaDeclaracion(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>
            Declaro bajo juramento que los datos ingresados son verídicos y acepto que cualquier falsedad u omisión puede dar lugar a la desestimación de mi inscripción.
          </span>
        </label>
      </div>

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={(token) => setRecaptchaToken(token)}
      />

      {/* Botón de Registrar */}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          disabled={loading || !aceptaDeclaracion || !recaptchaToken}
          className={`${styles.button_registrar} ${(!aceptaDeclaracion || !recaptchaToken) ? styles.buttonDisabled : ''}`}
        >
          {loading ? "Enviando datos..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
export default Formulario;