import React from "react";
import { useNavigate } from "react-router-dom";
import  { useEffect } from 'react';
import styles from "./UbicacionLotes.module.css";
import { MapPin } from "lucide-react";

function UbicacionLotes() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const lotes = [
        { nombre: "Barrio Pachán", src: "https://www.google.com/maps/d/u/0/embed?mid=1YMPXso8_DD9gAQfBM7oDHQ-dVucwUIo&ehbc=2E312F&noprof=1" },
        { nombre: "Barrio Parque Muñoz", src: "https://www.google.com/maps/d/u/0/embed?mid=1Oms8XDEUvlpb8SyixjQs0jIMRRi9Rb4&ehbc=2E312F&noprof=1" },
        { nombre: "Barrio Flores", src: "https://www.google.com/maps/d/u/0/embed?mid=1glBt1wYurh5kfOGuWCwRop1cmOzXFI4&ehbc=2E312F&noprof=1" },
        { nombre: "Barrio Quinta 9", src: "https://www.google.com/maps/d/u/0/embed?mid=1aCTUBVXkIR1CuAdSlpnUECl3ky9WOmA&ehbc=2E312F&noprof=1" },
        { nombre: "Estación López", src: "https://www.google.com/maps/d/u/0/embed?mid=1OBXiZH3-J-273NAD2UyFy3R1pPgdhEU&ehbc=2E312F&noprof=1" },
        { nombre: "Tedín Uriburu", src: "https://www.google.com/maps/d/u/0/embed?mid=1EUYU3rzREaZVuM4LfCGCx3pOZOkKkSc&ehbc=2E312F&noprof=1" },
        { nombre: "Barker", src: "https://www.google.com/maps/d/u/0/embed?mid=11aLf92RXy8UUF2Da69_RBlrVwRObiF8&ehbc=2E312F&noprof=1" },
        { nombre: "El Luchador", src: "https://www.google.com/maps/d/u/0/embed?mid=1omtQMbybu9GWOf0Y_4t5mNK7JSJ7CLs&ehbc=2E312F&noprof=1" },
    ];

    return (
        <div className={styles.container_Ulotes}>
            <div className={styles.header_Ulotes}>
                <MapPin className={styles.icon_Ulotes} />
                <h2>Ubicación de Lotes</h2>
            </div>

            <div className={styles.grid_Ulotes}>
                {lotes.map((lote, index) => (
                    <div key={index} className={styles.mapCard}>
                        <h3>{lote.nombre}</h3>
                        <div className={styles.mapWrapper}>
                            <iframe
                                src={lote.src}
                                title={lote.nombre}
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                ))}
            </div>

            <button className={styles.button_Ulotes} onClick={() => navigate('/')}>
                Volver al Inicio
            </button>
        </div>
    )
}

export default UbicacionLotes;
