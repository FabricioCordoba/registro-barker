import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Info, Lock, CalendarX } from "lucide-react";
import styles from "./modalBloqueante.module.css";

const CONTENIDO = {
  antes: {
    title: "Inscripción aún no disponible",
    text: "El período de inscripción al Registro Barker (2ª Edición del programa 'Mi hábitat, mi hogar') comienza el 1 de noviembre de 2026. Volvé a ingresar a partir de esa fecha.",
    icon: Info,
  },
  cerrada: {
    title: "Inscripción finalizada",
    text: "El período de inscripción al Registro Barker (2ª Edición del programa 'Mi hábitat, mi hogar') finalizó el 30 de noviembre de 2026. Ya no se permiten nuevos registros.",
    icon: CalendarX,
  },
};

function ModalBloqueante({ estado }) {
  const contenido = CONTENIDO[estado] || CONTENIDO.antes;
  const Icon = contenido.icon || Lock;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.content}>
        <div className={styles.icon_wrapper}>
          <Icon className={styles.icon} />
        </div>
        <h3 className={styles.title}>{contenido.title}</h3>
        <p className={styles.text}>{contenido.text}</p>
        <Link to="/" className={styles.button}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

ModalBloqueante.propTypes = {
  estado: PropTypes.oneOf(["antes", "abierta", "cerrada"]).isRequired,
};

export default ModalBloqueante;