import styles from './nav.module.css'
import { FaFacebookF } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { FaPhoneAlt } from "react-icons/fa";

function Nav() {
    // Obtener la fecha actual
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <div className={styles.container_general_nav}>
                <div className={styles.logo}>
                    <Link to={"/"} >
                        <img src="/Logo_Muni2024.png" alt="logo" />
                    </Link>
                </div>

                <div className={styles.container_h2_nav}>
                    <h2>Programa Mi Hábitat, mi Hogar</h2>

                </div>

                <div className={styles.container_redes}>
                    <a
                        href="https://www.facebook.com/profile.php?id=100064402131639"
                        target="_blank"
                        rel="noopener noreferrer">
                        <FaFacebookF />
                    </a>

                    <a href="https://www.youtube.com/channel/UCbOe3yOFRtd9rZ7gcTgLhOQ" target="_blank"
                        rel="noopener noreferrer">
                        <FaYoutube />
                    </a>

                    <a href="https://www.linkedin.com/company/municipalidad-de-benito-ju%C3%A1rez/" target="_blank" rel="noopener noreferrer">
                        <FaLinkedin />
                    </a>
                </div>


                <a href="https://benitojuarez.gov.ar/telefonos-utiles/" className={styles.numero_texto}>
                    <FaPhoneAlt className={styles.icon_emergencias} />
                </a>

                <div className={styles.container_fecha}>
                    <p>{fechaActual}</p>
                </div>
            </div>
        </>
    );
}

export default Nav;
