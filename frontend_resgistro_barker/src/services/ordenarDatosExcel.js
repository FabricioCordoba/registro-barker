const obtenerNumeroRegistro = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    (typeof valor === "string" && valor.trim() === "")
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
};

const esTitular = (dato) =>
  dato?.persona?.titular_cotitular === "Titular";

export const ordenarDatosPorRegistroFamiliar = (datos) => {
  const gruposPorRegistro = new Map();

  datos.forEach((dato, indice) => {
    const registroId = dato?.registroId ?? dato?.persona?.idRegistro;
    const clave = registroId === null || registroId === undefined
      ? Symbol()
      : String(registroId);
    let grupo = gruposPorRegistro.get(clave);

    if (!grupo) {
      grupo = { integrantes: [], primerIndice: indice };
      gruposPorRegistro.set(clave, grupo);
    }

    grupo.integrantes.push({ dato, indice });
  });

  const gruposOrdenados = Array.from(gruposPorRegistro.values())
    .map((grupo) => {
      const numeroRegistroDelGrupo = grupo.integrantes
        .map(({ dato }) => obtenerNumeroRegistro(dato?.numeroRegistro))
        .find((numero) => numero !== null);

      const integrantesConNumeroPropio = [...grupo.integrantes].sort(
        (a, b) =>
          Number(esTitular(b.dato)) -
            Number(esTitular(a.dato)) ||
          a.indice - b.indice
      );
      const numeroRegistro =
        numeroRegistroDelGrupo ??
        integrantesConNumeroPropio.reduce((numeroEncontrado, { dato }) => {
          if (numeroEncontrado !== null) return numeroEncontrado;

          return obtenerNumeroRegistro(dato?.persona?.numero_registro);
        }, null);

      const integrantesOrdenados = [...grupo.integrantes].sort(
        (a, b) =>
          Number(esTitular(b.dato)) -
            Number(esTitular(a.dato)) ||
          a.indice - b.indice
      );

      return {
        numeroRegistro,
        primerIndice: grupo.primerIndice,
        integrantes: integrantesOrdenados,
      };
    })
    .sort((a, b) => {
      if (a.numeroRegistro === null && b.numeroRegistro !== null) return 1;
      if (a.numeroRegistro !== null && b.numeroRegistro === null) return -1;
      if (a.numeroRegistro !== b.numeroRegistro) {
        return a.numeroRegistro - b.numeroRegistro;
      }

      return a.primerIndice - b.primerIndice;
    });

  return gruposOrdenados.flatMap((grupo) =>
    grupo.integrantes.map(({ dato }) => dato)
  );
};
