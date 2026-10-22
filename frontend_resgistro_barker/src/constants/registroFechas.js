const ENV = import.meta.env;

// Parsea fechas en formato ISO (2026-11-01T00:00:00) o argentino DD/MM/YYYY[ HH:mm],
// evitando la ambigüedad de new Date("1/11/2026") que se interpreta como mes/día.
function parseFecha(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const [, dia, mes, anio, hora = "0", minuto = "0", segundo = "0"] = match;
    return new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      Number(segundo)
    );
  }

  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

export const FECHA_INICIO_INSCRIPCION =
  parseFecha(ENV.VITE_FECHA_INICIO_INSCRIPCION) || new Date(2026, 10, 1, 0, 0, 0);
export const FECHA_FIN_INSCRIPCION =
  parseFecha(ENV.VITE_FECHA_FIN_INSCRIPCION) || new Date(2026, 11, 1, 0, 0, 0);

// Fecha "actual" simulada (solo para pruebas). Si está definida, se usa en lugar de la real.
export const FECHA_ACTUAL = parseFecha(ENV.VITE_FECHA_ACTUAL);

export const ESTADOS_INSCRIPCION = {
  ANTES: "antes",
  ABIERTA: "abierta",
  CERRADA: "cerrada",
};

export function getEstadoInscripcion(ahora) {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const override = new URLSearchParams(window.location.search).get("estado");
    if (override && Object.values(ESTADOS_INSCRIPCION).includes(override)) {
      return override;
    }
  }

  const base = ahora ?? FECHA_ACTUAL ?? new Date();
  const time = base.getTime();

  if (time < FECHA_INICIO_INSCRIPCION.getTime()) return ESTADOS_INSCRIPCION.ANTES;
  if (time >= FECHA_FIN_INSCRIPCION.getTime()) return ESTADOS_INSCRIPCION.CERRADA;
  return ESTADOS_INSCRIPCION.ABIERTA;
}