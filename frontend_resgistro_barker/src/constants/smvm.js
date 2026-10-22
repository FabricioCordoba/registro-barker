const ENV = import.meta.env;

// Salario Mínimo, Vital y Móvil (jornada completa) de referencia para la edición.
// Valor por defecto: noviembre 2026 = $398.800 (Resolución 4/2026).
// Configurable por entorno para futuras ediciones: VITE_SMVM.
export const SMVM = Number(ENV.VITE_SMVM) || 398800;

export const INGRESO_FAMILIAR_MINIMO = SMVM * 3;
export const INGRESO_FAMILIAR_MAXIMO = SMVM * 10;

export const formatearMontoSMVM = (valor) =>
  `$ ${Number(valor).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export function totalIngresoFamiliar(personas = []) {
  return personas.reduce((totalPersona, persona) => {
    const ingresos = Array.isArray(persona?.ingresos) ? persona.ingresos : [];
    const totalIngresos = ingresos.reduce(
      (totalIngreso, ingreso) => totalIngreso + (Number(ingreso?.salario) || 0),
      0
    );
    return totalPersona + totalIngresos;
  }, 0);
}