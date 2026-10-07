import React, { useState, useRef } from 'react';
import styles from './formularioEdicion.module.css';
import { callesPorLocalidad } from '../../services/listado_calles/listadoCalles';
import { esMenorDeEdad } from '../../services/transformDataDto';
import Swal from 'sweetalert2';

const FormularioRegistro = ({ formData, onChange, onSave, onCancel }) => {
    const agregarPersonaRef = useRef(null);

    // Plantillas para nuevos registros
    const nuevaVivienda = {
        idRegistro: formData.idRegistro,
        localidad: "",
        direccion: "",
        otra_calle: false,
        numero_direccion: "",
        departamento: null,
        piso_departamento: "",
        numero_departamento: "",
        cantidad_dormitorios: "",
        estado_vivienda: "",
        alquiler: null,
        valor_alquiler: "",
        tipo_alquiler: ""
    };

    const nuevaPersona = {
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
        rol: "User",
        vinculo: "",
        titular_cotitular: "",
        idVivienda: null,
        vivienda: null,
        idLote: null,
        idRegistro: formData.idRegistro,
        ingresos: [],
        comparteVivienda: null
    };

    const nuevoIngreso = {
        situacion_laboral: "",
        ocupacion: "",
        CUIT_empleador: "",
        salario: "",
        idPersona: null,
        idRegistro: formData.idRegistro
    };

    // Formatear fecha para input type="date"
    const formatearFechaInput = (fecha) => {
        if (!fecha) return '';
        try {
            return new Date(fecha).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Agregar nueva persona con selección de vivienda
    const agregarPersona = () => {
        Swal.fire({
            title: '¿Vive con el titular?',
            text: "Seleccione si la persona vive en la misma vivienda que el titular",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, misma vivienda',
            cancelButtonText: 'No, diferente vivienda',
            reverseButtons: true,
            showCloseButton: true,
        }).then((result) => {
            const comparteVivienda = result.isConfirmed;

            const viviendaTitular = formData.personas.find(p => p.vivienda)?.vivienda;

            const persona = {
                ...nuevaPersona,
                comparteVivienda,
                vivienda: comparteVivienda ? viviendaTitular : { ...nuevaVivienda },
            };

            onChange('personas', [...formData.personas, persona]);
            // Scroll al nuevo elemento
            setTimeout(() => {
                agregarPersonaRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 300);
        });
    };


    // Compartir vivienda con titular
    const compartirVivienda = (index) => {
        const updatedPersonas = [...formData.personas];

        // Obtener la vivienda del titular
        const viviendaTitular = formData.personas.find(p => p.comparteVivienda || p.titular_cotitular === "Titular")?.vivienda;

        if (!viviendaTitular) {
            Swal.fire('Error', 'No se encontró la vivienda del titular para compartir.', 'error');
            return;
        }

        updatedPersonas[index] = {
            ...updatedPersonas[index],
            comparteVivienda: true,
            vivienda: { ...viviendaTitular }, // Copiar la vivienda del titular
            idVivienda: viviendaTitular.idVivienda || null
        };

        onChange('personas', updatedPersonas);
    };
    // Eliminar persona con confirmación
    const eliminarPersona = (index) => {
        Swal.fire({
            title: '¿Eliminar Persona?',
            text: "¿Está seguro que desea eliminar esta persona del registro?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedPersonas = formData.personas.filter((_, i) => i !== index);
                onChange('personas', updatedPersonas);
                Swal.fire(
                    'Eliminada',
                    'La persona ha sido eliminada del registro',
                    'success'
                );
            }
        });
    };

    // Agregar ingreso a una persona específica
    const agregarIngreso = (personaIndex) => {
        const updatedPersonas = [...formData.personas];
        updatedPersonas[personaIndex].ingresos.push({ ...nuevoIngreso });
        onChange('personas', updatedPersonas);
    };

    // Eliminar ingreso
    const eliminarIngreso = (personaIndex, ingresoIndex) => {
        const updatedPersonas = [...formData.personas];

        updatedPersonas[personaIndex].ingresos = updatedPersonas[personaIndex].ingresos.filter((_, i) => i !== ingresoIndex);
        onChange('personas', updatedPersonas);
    };
    // Renderizar select de calles según localidad
    const renderSelectCalles = (localidad, direccion, otraCalle, onChangeFn) => {
        const calles = callesPorLocalidad[localidad] || [];
        const direccionNoListada = direccion && !calles.includes(direccion);
        const isOtra = Boolean(otraCalle) || Boolean(direccionNoListada);

        // Localidades que no tienen calles definidas y no deben mostrar la opción "Otra"
        const localidadesSinCalles = ["El Luchador", "Coronel Rodolfo Bunge"];

        if (!calles.length || localidadesSinCalles.includes(localidad)) {
            // Sin listado de calles o localidades específicas: mostrar solo input editable
            return (
                <input
                    type="text"
                    placeholder="Ingrese referencia de ubicación"
                    value={direccion || ""}
                    onChange={(e) => onChangeFn('direccion', e.target.value)}
                    className={styles.input}
                />
            );
        }

        return (
            <>
                <select
                    value={isOtra ? "Otra" : (direccion || "")}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Otra') {
                            onChangeFn('otra_calle', true);
                            // Mantener la dirección existente si viene del backend
                        } else {
                            onChangeFn('otra_calle', false);
                            onChangeFn('direccion', val);
                        }
                    }}
                    className={styles.select}
                >
                    <option value="" disabled>Seleccione una dirección</option>
                    {calles.map((calle, i) => (
                        <option key={i} value={calle}>{calle}</option>
                    ))}
                    <option value="Otra">Otra</option>
                </select>
                {isOtra && (
                    <input
                        type="text"
                        placeholder="Ingrese su calle"
                        value={direccion || ""}
                        onChange={(e) => onChangeFn('direccion', e.target.value)}
                        className={styles.input}
                    />
                )}
            </>
        );
    };
    // Renderizar sección de vivienda según corresponda
    const renderVivienda = (persona, index) => {

        if (persona.comparteVivienda) {
            return (
                <div className={styles.viviendaCompartida}>
                    <h3>Vivienda (compartida con titular)</h3>
                    <div className={styles.datosVivienda}>

                        <p><strong>Localidad:</strong> {persona.vivienda?.localidad}</p>
                        <p>
                            <strong>Dirección:</strong> {persona.vivienda?.direccion}
                        </p>
                        <p><strong>Número:</strong> {persona.vivienda?.numero_direccion}</p>
                        {persona.vivienda?.departamento && (
                            <p>
                                <strong>Piso Departamento:</strong> {persona.vivienda.piso_departamento} {persona.vivienda.numero_departamento}
                            </p>,
                            <p>
                                <strong>Número Departamento:</strong> {persona.vivienda.numero_departamento}
                            </p>
                        )}

                    </div>
                </div>
            );
        } else {
            return (
                <div className={styles.viviendaSection}>
                    <h3>Datos de Vivienda</h3>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <span className={styles.labelText}>Localidad *</span>
                            <select
                                name="localidad"
                                value={persona.vivienda?.localidad || ""}
                                onChange={(e) => onChange(`personas.${index}.vivienda.localidad`, e.target.value)}
                                className={styles.select}
                                required
                            >
                                <option value="" disabled>Seleccione localidad</option>
                                {Object.keys(callesPorLocalidad).map(localidad => (
                                    <option key={localidad} value={localidad}>{localidad}</option>
                                ))}
                                <option value="El Luchador">El Luchador</option>
                                <option value="Coronel Rodolfo Bunge">Coronel Rodolfo Bunge</option>
                            </select>
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>Dirección *</span>
                            {renderSelectCalles(
                                persona.vivienda?.localidad,
                                persona.vivienda?.direccion,
                                persona.vivienda?.otra_calle,
                                (field, value) => onChange(`personas.${index}.vivienda.${field}`, value)
                            )}
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>Número</span>
                            <input
                                type="number"
                                placeholder={callesPorLocalidad[persona.vivienda?.localidad]?.length ? "Número" : "S/N"}
                                value={persona.vivienda?.numero_direccion || ""}
                                onChange={(e) => onChange(`personas.${index}.vivienda.numero_direccion`, e.target.value)}
                                className={styles.input}
                            />
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>¿Es departamento? *</span>
                            <select
                                name="departamento"
                                value={persona.vivienda?.departamento === null ? "" : persona.vivienda?.departamento ? "Si" : "No"}
                                onChange={(e) => onChange(`personas.${index}.vivienda.departamento`, e.target.value === 'Si')}
                                className={styles.select}
                                required
                            >
                                <option value="" disabled>¿Es departamento?</option>
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                            </select>
                        </label>

                        {persona.vivienda?.departamento && (
                            <>
                                <label className={styles.label}>
                                    <span className={styles.labelText}>Piso *</span>
                                    <input
                                        type="text"
                                        placeholder="Piso"
                                        value={persona.vivienda?.piso_departamento || ""}
                                        onChange={(e) => onChange(`personas.${index}.vivienda.piso_departamento`, e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </label>

                                <label className={styles.label}>
                                    <span className={styles.labelText}>Departamento *</span>
                                    <input
                                        type="text"
                                        placeholder="Departamento"
                                        value={persona.vivienda?.numero_departamento || ""}
                                        onChange={(e) => onChange(`personas.${index}.vivienda.numero_departamento`, e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </label>
                            </>
                        )}

                        <label className={styles.label}>
                            <span className={styles.labelText}>Cantidad de dormitorios *</span>
                            <input
                                type="number"
                                min="1"
                                placeholder="Cantidad de dormitorios"
                                value={persona.vivienda?.cantidad_dormitorios || ""}
                                onChange={(e) => onChange(`personas.${index}.vivienda.cantidad_dormitorios`, e.target.value)}
                                className={styles.input}
                                required
                            />
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>Estado de la vivienda *</span>
                            <select
                                name="estado_vivienda"
                                value={persona.vivienda?.estado_vivienda || ""}
                                onChange={(e) => onChange(`personas.${index}.vivienda.estado_vivienda`, e.target.value)}
                                className={styles.select}
                                required
                            >
                                <option value="" disabled>¿Estado de la Vivienda?</option>
                                <option value="Muy bueno">Muy bueno</option>
                                <option value="Bueno">Bueno</option>
                                <option value="Regular">Regular</option>
                                <option value="Malo">Malo</option>
                                <option value="Muy malo">Muy malo</option>
                            </select>
                        </label>

                        <label className={styles.label}>
                            <span className={styles.labelText}>¿Alquila? *</span>
                            <select
                                name="alquiler"
                                value={persona.vivienda?.alquiler === true ? "Si" : persona.vivienda?.alquiler === false ? "No" : ""}
                                onChange={(e) => onChange(`personas.${index}.vivienda.alquiler`, e.target.value === 'Si')}
                                className={styles.select}
                                required
                            >
                                <option value="" disabled>¿Alquila la vivienda?</option>
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                            </select>
                        </label>

                        {persona.vivienda?.alquiler && (
                            <div className={styles.alquilerGroup}>
                                <label className={styles.label}>
                                    <span className={styles.labelText}>Monto del alquiler *</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Monto del alquiler"
                                        value={persona.vivienda?.valor_alquiler || ""}
                                        onChange={(e) => onChange(`personas.${index}.vivienda.valor_alquiler`, e.target.value)}
                                        className={styles.input}
                                        required
                                    />
                                </label>

                                <label className={styles.label}>
                                    <span className={styles.labelText}>Tipo de alquiler *</span>
                                    <select
                                        name="tipo_alquiler"
                                        value={persona.vivienda?.tipo_alquiler || ""}
                                        onChange={(e) => onChange(`personas.${index}.vivienda.tipo_alquiler`, e.target.value)}
                                        className={styles.select}
                                        required
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
            );
        }
    };

    return (
        <div className={styles.editForm}>
            <h2>Formulario de Registro</h2>
            {/* SECCIÓN HABITANTES */}
            <div className={styles.section}>
                <h3>Habitantes</h3>

                {formData.personas.map((habitante, index) => (
                    <div
                        key={index}
                        className={styles.habitanteCard}
                        ref={index === formData.personas.length - 1 ? agregarPersonaRef : null}
                    >
                        <div className={styles.habitanteHeader}>
                            <h4>
                                {`${habitante.nombre} ${habitante.apellido} - ${habitante.titular_cotitular}`}

                                {index > 0 && ` (${habitante.vinculo})`}
                            </h4>
                        </div>

                        <div className={styles.formGroup}>

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
                                        value={habitante.titular_cotitular || ""}
                                        onChange={(e) => onChange(`personas.${index}.titular_cotitular`, e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="" disabled>Seleccione rol</option>
                                        <option value="Cotitular">Cotitular</option>
                                        <option value="Conviviente">Conviviente</option>
                                    </select>
                                )}
                            </label>


                            <label className={styles.label}>
                                <span className={styles.labelText}>Nombre *</span>
                                <input
                                    type="text"
                                    value={habitante.nombre}
                                    placeholder='Nombres'
                                    onChange={(e) => onChange(`personas.${index}.nombre`, e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </label>

                            <label className={styles.label}>
                                <span className={styles.labelText}>Apellido *</span>
                                <input
                                    type="text"
                                    value={habitante.apellido}
                                    placeholder='Apellido'
                                    onChange={(e) => onChange(`personas.${index}.apellido`, e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </label>

                            <label className={styles.label}>
                                <span className={styles.labelText}>Fecha de Nacimiento *</span>
                                <input
                                    type="date"
                                    value={formatearFechaInput(habitante.fecha_nacimiento)}
                                    placeholder='Fecha de Nacimiento'
                                    onChange={(e) => onChange(`personas.${index}.fecha_nacimiento`, e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </label>

                            <label className={styles.label}>
                                <span className={styles.labelText}>Tipo de Documento *</span>
                                <select
                                    required
                                    name="tipo_dni"
                                    value={habitante.tipo_dni || ""}
                                    placeholder="Tipo de Documento"
                                    onChange={(e) => onChange(`personas.${index}.tipo_dni`, e.target.value)}
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
                                    value={habitante.dni}
                                    onChange={(e) => onChange(`personas.${index}.dni`, e.target.value)}
                                    className={styles.input}
                                    maxLength="8"
                                />
                            </label>

                            {!esMenorDeEdad(habitante.fecha_nacimiento) && (
                                <>
                                    <label className={styles.label}>
                                        <span className={styles.labelText}>CUIL/CUIT *</span>
                                        <input
                                            type="text"
                                            value={habitante.CUIL_CUIT || ""}
                                            placeholder='CUIL/CUIT (sin guiones y sin espacios)'
                                            onChange={(e) => onChange(`personas.${index}.CUIL_CUIT`, e.target.value)}
                                            className={styles.input}
                                            maxLength="11"
                                            required
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        <span className={styles.labelText}>Email *</span>
                                        <input
                                            type="email"
                                            value={habitante.email || ""}
                                            placeholder='Email'
                                            onChange={(e) => onChange(`personas.${index}.email`, e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        <span className={styles.labelText}>Teléfono *</span>
                                        <input
                                            type="tel"
                                            value={habitante.telefono || ""}
                                            placeholder='Teléfono (sin 0 ni 15)'
                                            onChange={(e) => onChange(`personas.${index}.telefono`, e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        <span className={styles.labelText}>Estado Civil *</span>
                                        <select
                                            value={habitante.estado_civil || ""}
                                            placeholder="Estado Civil"
                                            onChange={(e) => onChange(`personas.${index}.estado_civil`, e.target.value)}
                                            className={styles.select}
                                            required
                                        >
                                            <option value="" disabled>Seleccione estado civil</option>
                                            <option value="Soltero/a">Soltero/a</option>
                                            <option value="Casado/a">Casado/a</option>
                                            <option value="Divorciado/a">Divorciado/a</option>
                                            <option value="Viudo/a">Viudo/a</option>
                                            <option value="Concubinato">Concubinato</option>
                                        </select>
                                    </label>
                                </>
                            )}

                            <label className={styles.label}>
                                <span className={styles.labelText}>Nacionalidad *</span>
                                <select
                                    value={habitante.nacionalidad || ""}
                                    placeholder="Nacionalidad"
                                    onChange={(e) => onChange(`personas.${index}.nacionalidad`, e.target.value)}
                                    className={styles.select}
                                    required
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
                                <span className={styles.labelText}>Género *</span>
                                <select
                                    value={habitante.genero || ""}
                                    placeholder="Género"
                                    onChange={(e) => onChange(`personas.${index}.genero`, e.target.value)}
                                    className={styles.select}
                                    required
                                >
                                    <option value="" disabled>Seleccione género</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>

                                </select>
                            </label>

                            <label className={styles.label}>
                                <span className={styles.labelText}>Certificado de discapacidad *</span>
                                <select
                                    required
                                    name="certificado_discapacidad"
                                    value={habitante.certificado_discapacidad === true ? "Si" : habitante.certificado_discapacidad === false ?"No": ""}
                                    
                                    placeholder="Certificado de discapacidad"
                                    onChange={(e) => onChange(`personas.${index}.certificado_discapacidad`, e.target.value === "Si")}
                                    className={styles.select}
                                >
                                    <option value="" disabled>¿Posee certificado de discapacidad?</option>
                                    <option value="Si">Sí</option>
                                    <option value="No">No</option>
                                </select>
                            </label>

                            {index > 0 && (
                                <label className={styles.label}>
                                    <span className={styles.labelText}>Vínculo con el titular *</span>
                                    <select
                                        value={habitante.vinculo || ""}
                                        placeholder="Vínculo con el titular"

                                        onChange={(e) => onChange(`personas.${index}.vinculo`, e.target.value)}
                                        className={styles.select}
                                        required
                                    >
                                        <option value="" disabled>Seleccione vínculo</option>
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
                            )}
                        </div>

                        {renderVivienda(habitante, index)}

                        {!esMenorDeEdad(habitante.fecha_nacimiento) && (
                            <div className={styles.ingresosSection}>
                                <h3>Ingresos</h3>

                                {habitante.ingresos.map((ingreso, ingresoIndex) => (
                                    <div key={ingresoIndex} className={styles.ingresoCard}>
                                        <div className={styles.ingresoHeader}>
                                            <h6>Ingreso N° {ingresoIndex + 1}</h6>
                                        </div>

                                        <div className={styles.ingreso}>
                                            <div className={styles.ingresoDetalle}>
                                                <label className={styles.label}>
                                                    <span className={styles.labelText}>Situación laboral *</span>
                                                    <select
                                                        value={ingreso.situacion_laboral || ""}
                                                        onChange={(e) => onChange(`personas.${index}.ingresos.${ingresoIndex}.situacion_laboral`, e.target.value)}
                                                        className={styles.select}
                                                        required
                                                    >
                                                        <option value="" disabled>Seleccione situación</option>
                                                        <option value="Relación de dependencia">Relación de dependencia</option>
                                                        <option value="Autónomo">Autónomo</option>
                                                        <option value="Jubilado">Jubilado/a</option>
                                                        <option value="Pensionado">Pensionado/a</option>
                                                        <option value="Informal">Informal</option>
                                                        <option value="Desempleado">Desempleado/a</option>
                                                    </select>
                                                </label>

                                                <label className={styles.label}>
                                                    <span className={styles.labelText}>Ocupación *</span>
                                                    <input
                                                        type="text"
                                                        value={ingreso.ocupacion || ""}
                                                        placeholder='Ocupación'
                                                        onChange={(e) => onChange(`personas.${index}.ingresos.${ingresoIndex}.ocupacion`, e.target.value)}
                                                        className={styles.input}
                                                        required
                                                    />
                                                </label>

                                                {ingreso.situacion_laboral === "Relación de dependencia" && (
                                                    <label className={styles.label}>
                                                        <span className={styles.labelText}>CUIT Empleador *</span>
                                                        <input
                                                            type="text"
                                                            value={ingreso.CUIT_empleador || ""}
                                                            placeholder='CUIT Empleador sin guionesy sin espacios'
                                                            onChange={(e) => onChange(`personas.${index}.ingresos.${ingresoIndex}.CUIT_empleador`, e.target.value)}
                                                            className={styles.input}
                                                            maxLength="11"
                                                            required
                                                        />
                                                    </label>
                                                )}

                                                <label className={styles.label}>
                                                    <span className={styles.labelText}>Salario/Monto *</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={ingreso.salario || ""}
                                                        placeholder='Salario/Monto sin puntos ni comas'
                                                        onChange={(e) => onChange(`personas.${index}.ingresos.${ingresoIndex}.salario`, e.target.value)}
                                                        className={styles.input}
                                                        required
                                                    />
                                                </label>
                                            </div>

                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarIngreso(index, ingresoIndex)}
                                                    className={styles.deleteSmallButton}
                                                >
                                                    Eliminar Ingreso
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => agregarIngreso(index)}
                                    className={styles.addSmallButton}
                                >
                                    + Agregar Ingreso
                                </button>
                            </div>
                        )}

                        {index > 0 && (
                            <button
                                type="button"
                                onClick={() => eliminarPersona(index)}
                                className={styles.deleteSmallButton}
                            >
                                Eliminar Persona
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={agregarPersona}
                    className={styles.addSmallButton}
                >
                    + Agregar Persona
                </button>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className={styles.formActions}>
                <button
                    type="button"
                    onClick={onSave}
                    className={styles.primaryButton}
                >
                    Guardar Registro
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className={styles.secondaryButton}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default FormularioRegistro;