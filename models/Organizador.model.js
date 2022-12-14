const Organizador = {};
const Torneos = require("./Torneos.model");
const BitacoraTorneo = require("./Bitacora_torneo.model");
const UsuarioTorneoTFT = require("./Usuario_torneo_TFT.model");
const EquipoTorneo = require("./Equipo_torneo.model");
const PartidaLol = require("./Partida_lol.model");
const Equipos = require("./Equipos.model");
const EnfrentamientoTft = require("./Enfrentamiento_tft.model");

Organizador.getDashboardData = async function (idUsuario) {
  const data = {};
  try {
    data.torneosActivos = await Torneos.getTorneosActivos(idUsuario);
    data.torneosCreados = await Torneos.getTorneosCreados(idUsuario);
    data.latestTorneoCreado = await Torneos.getLatestTorneoCreado(idUsuario);
    data.latestActivity = await BitacoraTorneo.getLatestActivity(idUsuario);
  } catch (err) {
    data.error = err;
  }
  return data;
};

// edit a tournament and notify the teams about the changes via email
Organizador.editTorneo = async function (idTorneo, idUsuario, data) {
  const torneo = await Torneos.getTorneoCreado(idTorneo, idUsuario);
  if (torneo.id_estado > 0) {
    throw new Error("El torneo no se encuentra en estado de edición");
  }
  data = require("../services/checkDate")(data);
  await Torneos.update(idTorneo, data, torneo, idUsuario);
};
module.exports = Organizador;

// Cancel a tournament and notify the teams about the changes via email
Organizador.cancelTorneo = async function (idTorneo, idUsuario) {
  const torneo = await Torneos.getTorneoCreado(idTorneo, idUsuario);
  if (torneo.id_estado > 3) {
    throw new Error("El torneo no se puede cancelar");
  }
  await Torneos.cancel(idTorneo, idUsuario, torneo);
};

// get the list of tournaments created by the user on range
Organizador.getTorneosCreados = async function (idUsuario, start, end) {
  const torneos = await Torneos.getRangeOfTorneos(idUsuario, start, end);
  const total = await Torneos.getTorneosCreados(idUsuario, true);
  const data = {
    torneos: torneos,
    total: total[0],
  };
  if (data.torneos.length <= 0) {
    throw new Error("No se encontraron torneos creados");
  } else return data;
};

Organizador.getTournamentData = async function (idTorneo, idUsuario) {
  const torneo = await Torneos.getTorneoCreado(idTorneo, idUsuario);
  if (torneo.id_juego === 1) {
    // League of Legends
    const partidas = await PartidaLol.getPartidasFromTorneo(idTorneo);
    for (const element of partidas) {
      if (element.id_ganador) {
        const ganador = await Equipos.getNameLogoById(element.id_ganador);
        element.nombre_ganador = ganador.nombre;
        element.logo_ganador = ganador.logo;
      }
    }
    const data = {
      torneo: torneo,
      participantes: await Torneos.getInfoEquipos(idTorneo),
      partidas: partidas,
    };
    return data;
  } else if (torneo.id_juego === 2) {
    // TFT
    const riotApiPlayers = await UsuarioTorneoTFT.getRiotApiPlayerByTournament(
      idTorneo
    );
    const puuids = {};
    for (const element of riotApiPlayers) {
      puuids[element.riot_api.puuidTFT] = {
        id: element.id_usuario,
        nombre: element.nombre,
        image: element.image,
      };
    }
    const data = {
      torneo: torneo,
      participantes: await UsuarioTorneoTFT.getJugadoresTorneo(idTorneo),
      partidas: await EnfrentamientoTft.getEnfrentamientosFromTorneo(idTorneo),
      puuids: puuids,
    };
    return data;
  }
};

Organizador.kickPlayerOrTeam = async function (idTorneo, idUsuario, kickId) {
  const torneo = await Torneos.getTorneoCreado(idTorneo, idUsuario);
  if (torneo.id_estado > 0) {
    throw new Error("El torneo no se encuentra en estado de edición");
  }
  if (torneo.id_juego === 1) {
    // League of Legends
    await EquipoTorneo.kickEquipo(idTorneo, idUsuario, kickId, torneo);
  } else if (torneo.id_juego === 2) {
    // TFT
    await UsuarioTorneoTFT.kickParticipante(
      idTorneo,
      idUsuario,
      kickId,
      torneo
    );
  }
};

Organizador.registrarResultadoLOL = async function (idPartida, idGanador) {
  const partida = await PartidaLol.getPartidaById(idPartida);
  console.log(partida);
  if (partida.id_equipo1 === idGanador || partida.id_equipo2 === idGanador) {
    const loser =
      partida.id_equipo1 === idGanador
        ? partida.id_equipo2
        : partida.id_equipo1;
    await PartidaLol.setWinner(idPartida, idGanador);
    await EquipoTorneo.setLoser(partida.id_torneo, loser);
    const torneo = await Torneos.getById(partida.id_torneo);
    const equipo = await Equipos.getNombre(idGanador);

    // actualizar bitacora
    const newBitacoraTorneo1 = new BitacoraTorneo({
      id_torneo: torneo.id_torneo,
      id_usuario: torneo.id_usuario,
      desc_modificacion: `Se registro el resultado de la partida con id: ${idPartida}. Equipo ganador: ${equipo.nombre}.`,
    });
    BitacoraTorneo.create(newBitacoraTorneo1);
    if (partida.etapa === 1) {
      // finalizar torneo
      await Torneos.updateEstado(partida.id_torneo, 3);
      await EquipoTorneo.setGanadorTorneo(partida.id_torneo, idGanador);
      // actualizar bitacora
      const newBitacoraTorneo2 = new BitacoraTorneo({
        id_torneo: torneo.id_torneo,
        id_usuario: torneo.id_usuario,
        desc_modificacion: `Se finalizó el torneo ${torneo.nombre}. Equipo ganador: ${equipo.nombre}.`,
      });
      BitacoraTorneo.create(newBitacoraTorneo2);
    }
  } else {
    throw new Error("El equipo ganador no pertenece al torneo");
  }
};
module.exports = Organizador;
