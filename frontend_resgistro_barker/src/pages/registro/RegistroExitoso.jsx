import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegistroExitoso.module.css';

const RegistroExitoso = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>✓</div>
        <h1 className={styles.title}>¡Registro Recibido!</h1>
        <p className={styles.message}>
          Gracias por completar el formulario. En breve recibirás un correo electrónico 
          con tu número de registro y la información proporcionada.
          Ante cualquier duda, puede contactarse al número de teléfono 2281 57 3109
        </p>
        <button 
          className={styles.button}
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default RegistroExitoso;
