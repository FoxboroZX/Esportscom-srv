const dbConn = require("../config/database");
const Usuario = require("../models/Usuario.model.js");
const BitacoraTorneo = require("./Bitacora_torneo.model");
const Torneos = require("./Torneos.model");
const UsuarioTorneoTFT = function (usuario) {
  this.id_usuario = usuario.id_usuario;
  this.id_torneo = usuario.id_torneo;
  this.posicion = usuario.posicion;
};

// Crud
UsuarioTorneoTFT.create = (newUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query("INSERT INTO usuario_torneo_TFT SET ?", newUsuario)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getJugadoresTorneo = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT j.id_usuario,
        j.email,
        j.nombre,
        j.image,
        u.puntaje_jugador,
        u.no_enfrentamientos_jugados,
        u.total_damage,
        u.posicion,
        j.nombre_invocador,
        u.eliminado
 FROM   usuarios AS j,
        usuario_torneo_TFT AS u
 WHERE  j.id_usuario = u.id_usuario
        AND u.id_torneo = ? order by u.puntaje_jugador desc, u.total_damage desc`,
        idTorneo
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getJugadoresNoEliminados = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT j.id_usuario,
        j.email,
        j.nombre,
        j.image,
        u.puntaje_jugador,
        u.no_enfrentamientos_jugados,
        u.total_damage,
        u.posicion,
        j.nombre_invocador,
        j.riot_api
 FROM   usuarios AS j,
        usuario_torneo_TFT AS u
 WHERE  j.id_usuario = u.id_usuario
        AND u.eliminado = FALSE
        AND u.id_torneo = ?`,
        idTorneo
      )
      .then(([fields, rows]) => {
        // parse riot_api
        fields.forEach((element) => {
          element.riot_api = JSON.parse(element.riot_api);
        });
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getCountJugadoresTorneo = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT COUNT(*) AS count
          FROM   
            usuario_torneo_TFT
          WHERE 
            id_torneo = ?`,
        idTorneo
      )
      .then(([fields, rows]) => {
        resolve(fields[0].count);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getJugadorTorneo = (idTorneo, idUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT j.id_usuario,
        j.nombre,
        j.image,
        u.puntaje_jugador,
        u.no_enfrentamientos_jugados,
        u.total_damage,
        u.posicion,
        u.eliminado
 FROM   usuarios AS j,
        usuario_torneo_TFT AS u
 WHERE  j.id_usuario = u.id_usuario
        AND u.id_torneo = ?
        AND u.id_usuario = ?`,
        [idTorneo, idUsuario]
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getEmailJugadoresTorneo = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        "select u.email from usuarios as u, usuario_torneo_TFT as ut, torneos as t where t.id_torneo=? and t.id_torneo=ut.id_torneo and ut.id_usuario=u.id_usuario;",
        idTorneo
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// kick participante
UsuarioTorneoTFT.kickParticipante = (
  idTorneo,
  idOrganizador,
  idUsuario,
  torneo
) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        "DELETE FROM usuario_torneo_TFT WHERE id_torneo = ? AND id_usuario = ? ",
        [idTorneo, idUsuario]
      )
      .then(async (res) => {
        if (res[0].affectedRows === 0) {
          reject(new Error("No se realizaron cambios").toString());
          return;
        }
        const usuario = await Usuario.findById(idUsuario);
        const newBitacoraTorneo = new BitacoraTorneo({
          id_torneo: idTorneo,
          id_usuario: idOrganizador,
          desc_modificacion: "Se expuls?? al jugador: " + usuario[0].nombre,
        });
        await BitacoraTorneo.create(newBitacoraTorneo);
        // send mail to participants
        try {
          await require("../services/sendUpdateTournamentMail")(
            torneo,
            torneo.nombre,
            `<b> Has sido expulsado del torneo ${torneo.nombre} </b>`,
            usuario[0]
          );
        } catch (err) {
          reject(new Error("Error al enviar correos").toString());
        }
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getAllfromUsuario = (idUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        "select t.* from torneos as t where t.id_estado <=3 and t.id_torneo in (select ut.id_torneo from usuario_torneo_TFT as ut, usuarios as u where u.id_usuario = ? and u.id_usuario=ut.id_usuario);",
        idUsuario
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getTorneosGanados = (idUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `select count(*) as total from usuarios as u, usuario_torneo_TFT as ut, torneos as t
    where u.id_usuario=? and u.id_usuario=ut.id_usuario and ut.id_torneo=t.id_torneo and t.id_estado=3 and ut.posicion=1`,
        [idUsuario]
      )
      .then(([fields, rows]) => {
        resolve(fields[0].total);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getTorneosParticipados = (idUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `select count(*) as total from usuarios as u, usuario_torneo_TFT as ut, torneos as t
      where u.id_usuario=? and u.id_usuario=ut.id_usuario and ut.id_torneo=t.id_torneo`,
        [idUsuario]
      )
      .then(([fields, rows]) => {
        resolve(fields[0].total);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getEnfrentamientosTFT = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `select * from enfrentamiento_tft where id_riot_match is NULL and id_torneo=?`,
        [idTorneo]
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.update = async (idTorneo, idUsuario, riotApi) => {
  const jugador = await UsuarioTorneoTFT.getJugadorTorneo(idTorneo, idUsuario);
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `UPDATE usuario_torneo_TFT SET puntaje_jugador=?, no_enfrentamientos_jugados=?, total_damage=? WHERE id_torneo = ? AND id_usuario = ?`,
        [
          jugador[0].puntaje_jugador + (9 - riotApi.placement),
          jugador[0].no_enfrentamientos_jugados++,
          jugador[0].total_damage + riotApi.total_damage_to_players,
          idTorneo,
          idUsuario,
        ]
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.eliminarJugadores = async (torneo) => {
  const jugadores = await UsuarioTorneoTFT.getPosicionJugadoresNoEliminados(
    torneo.id_torneo
  );
  if (jugadores.length <= 8) {
    // finalizar torneo
    await Torneos.updateEstado(torneo.id_torneo, 3);
    // actualizar bitacora
    const newBitacoraTorneo = new BitacoraTorneo({
      id_torneo: torneo.id_torneo,
      id_usuario: torneo.id_usuario,
      desc_modificacion: `Se finaliz?? el torneo ${torneo.nombre}.`,
    });
    BitacoraTorneo.create(newBitacoraTorneo);
  } else {
    // eliminar jugadores
    const jugadoresEliminados = [];
    for (let i = jugadores.length / 2; i < jugadores.length; i++) {
      await UsuarioTorneoTFT.eliminarJugador(
        torneo.id_torneo,
        jugadores[i].id_usuario
      );
      jugadoresEliminados.push(jugadores[i]);
    }
    const newBitacoraTorneo = new BitacoraTorneo({
      id_torneo: torneo.id_torneo,
      id_usuario: torneo.id_usuario,
      desc_modificacion: `Se eliminaron los jugadores: ${jugadoresEliminados
        .map((jugador) => {
          return jugador.nombre;
        })
        .join(", ")} del torneo ${torneo.nombre}.`,
    });
    BitacoraTorneo.create(newBitacoraTorneo);
  }
};

UsuarioTorneoTFT.getPosicionJugadores = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT * FROM usuario_torneo_TFT where id_torneo=? order by puntaje_jugador asc, total_damage desc;`,
        [idTorneo]
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getPosicionJugadoresNoEliminados = (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `SELECT ut.*, u.nombre FROM usuario_torneo_TFT as ut, usuarios as u where ut.id_torneo=? and ut.eliminado=0 and ut.id_usuario=u.id_usuario order by ut.puntaje_jugador desc, ut.total_damage desc;`,
        [idTorneo]
      )
      .then(([fields, rows]) => {
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.eliminarJugador = async (idTorneo, idUsuario) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `UPDATE usuario_torneo_TFT SET eliminado=1 WHERE id_torneo = ? AND id_usuario = ?`,
        [idTorneo, idUsuario]
      )
      .then(([fields, rows]) => {
        // TODO: mandar correos
        resolve(fields);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

UsuarioTorneoTFT.getRiotApiPlayerByTournament = async (idTorneo) => {
  return new Promise((resolve, reject) => {
    dbConn
      .promise()
      .query(
        `select id_usuario, nombre, image, riot_api from usuarios where id_usuario in (SELECT id_usuario FROM usuario_torneo_TFT where id_torneo=?);`,
        [idTorneo]
      )
      .then(([fields, rows]) => {
        // parsear a json
        resolve(
          fields.map((field) => {
            field.riot_api = JSON.parse(field.riot_api || "{}");
            return field;
          })
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = UsuarioTorneoTFT;
