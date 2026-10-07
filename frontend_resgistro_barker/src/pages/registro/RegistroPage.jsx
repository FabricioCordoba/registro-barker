import Formulario from "../../componentes/formulario/Formulario";
import styles from "./registroPage.module.css";

const fechaCorte = new Date(2026, 11, 28, 23, 59, 0);

function RegistroPage() {
  const ahora = new Date();
  const inscripcionCerrada = ahora.getTime() > fechaCorte.getTime();

  if (inscripcionCerrada) {
    return (
      <div className={styles.page_wrapper}>
        <div className={styles.card}>
          <h1 className={styles.title}>Inscripción finalizada</h1>
          <p className={styles.text}>
            La inscripción al registro finalizó el 28 de febrero de 2026 a las 23:59 hs.
            Ya no se permiten nuevos registros.
          </p>
          <p className={styles.text}>Muchas gracias por su participación. Ante cualquier duda, puede contactarse al número de teléfono <br/> 2281 57 3109</p>
        </div>
      </div>
    );
  }

  return <Formulario />;
}

export default RegistroPage;
