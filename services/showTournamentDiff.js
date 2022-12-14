/* eslint-disable */
module.exports = function (torneo, oldTorneo) {
  let descModificacion = "";
  if (torneo.nombre !== oldTorneo.nombre) {
    descModificacion +=
      "Nombre: " + oldTorneo.nombre + " → " + torneo.nombre + ";\n ";
  }
  if (torneo.description !== oldTorneo.description) {
    descModificacion += "Nueva Descripcion: " + torneo.description + ";\n ";
  }
  if (`${torneo.fecha_fin_registro}` !== `${oldTorneo.fecha_fin_registro}`) {
    descModificacion +=
      "Fecha fin registro: " +
      oldTorneo.fecha_fin_registro.toDateString() +
      " → " +
      torneo.fecha_fin_registro.toDateString() +
      ";\n ";
  }
  if (`${torneo.fecha_inicio}` !== `${oldTorneo.fecha_inicio}`) {
    descModificacion +=
      "Fecha inicio: " +
      oldTorneo.fecha_inicio.toDateString() +
      " → " +
      torneo.fecha_inicio.toDateString() +
      ";\n ";
  }
  // eslint-disable-next-line eqeqeq
  if (torneo.premio != oldTorneo.premio) {
    descModificacion +=
      "Premio: " + oldTorneo.premio + " → " + torneo.premio + ";\n ";
  }
  if (torneo.desc_premio !== oldTorneo.desc_premio) {
    descModificacion +=
      "Desc. Premio: " +
      oldTorneo.desc_premio +
      " → " +
      torneo.desc_premio +
      ";\n ";
  }
  // eslint-disable-next-line eqeqeq
  if (torneo.privado != oldTorneo.privado) {
    descModificacion +=
      "Privado: " + oldTorneo.privado + " → " + torneo.privado + ";\n ";
  }

  if (torneo.hora_inicio !== oldTorneo.hora_inicio) {
    descModificacion +=
      "Hora inicio: " +
      oldTorneo.hora_inicio +
      " → " +
      torneo.hora_inicio +
      ";\n ";
  }
  return descModificacion;
};
