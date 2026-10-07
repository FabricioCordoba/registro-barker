import React from 'react';
import styles from './clasificacionDeudor.module.css';
import { clasificacionesDeudor } from '../../services/clasificacionDeudor';

const ClasificacionDeudor = ({ situacion }) => {
    const clasificacion = clasificacionesDeudor[situacion] || {
        descripcion: 'Desconocido',
        color: 'gray',
    };

    return (
        <p style={{ color: clasificacion.color }}>
            <strong className={styles.titleDeudor}>Clasificación Deudor:</strong>{' '}
            <span className={styles.numeroClasificacion}>{situacion}</span>{' '}
            <span className={styles.textoClasificacion}>- {clasificacion.descripcion}</span>
        </p>
    );
};

export default ClasificacionDeudor;