import Formulario from "../../componentes/formulario/Formulario";
import ModalBloqueante from "../../componentes/modalBloqueante/modalBloqueante";
import { ESTADOS_INSCRIPCION, getEstadoInscripcion } from "../../constants/registroFechas";
import styles from "./registroPage.module.css";

function RegistroPage() {
  const estado = getEstadoInscripcion();

  if (estado !== ESTADOS_INSCRIPCION.ABIERTA) {
    return (
      <div className={styles.page_wrapper}>
        <ModalBloqueante estado={estado} />
      </div>
    );
  }

  return <Formulario />;
}

export default RegistroPage;